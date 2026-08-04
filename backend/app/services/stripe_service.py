from datetime import datetime

import stripe
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import Subscription, SubscriptionPlan, SubscriptionStatus, User

stripe.api_key = settings.stripe_secret_key


class StripeService:
    def create_checkout_session(self, db: Session, user: User, plan: str) -> str:
        price_id = (
            settings.stripe_price_monthly
            if plan == SubscriptionPlan.MONTHLY.value
            else settings.stripe_price_yearly
        )

        if not price_id:
            raise ValueError("Stripe price IDs are not configured")

        subscription = db.query(Subscription).filter(Subscription.user_id == user.id).first()
        if subscription and subscription.status in {
            SubscriptionStatus.ACTIVE.value,
            SubscriptionStatus.TRIALING.value,
        }:
            raise ValueError("You already have an active Premium subscription")

        if not user.stripe_customer_id:
            customer = stripe.Customer.create(email=user.email, metadata={"user_id": str(user.id)})
            user.stripe_customer_id = customer.id
            db.commit()

        session_params: dict = {
            "customer": user.stripe_customer_id,
            "mode": "subscription",
            "line_items": [{"price": price_id, "quantity": 1}],
            "success_url": f"{settings.frontend_url}/upgrade?success=true",
            "cancel_url": f"{settings.frontend_url}/upgrade?canceled=true",
            "metadata": {"user_id": str(user.id), "plan": plan},
            "payment_method_collection": "always",
        }

        if not user.has_used_trial and settings.stripe_trial_days > 0:
            session_params["subscription_data"] = {
                "trial_period_days": settings.stripe_trial_days,
                "metadata": {"user_id": str(user.id), "plan": plan},
            }

        session = stripe.checkout.Session.create(**session_params)
        return session.url

    def create_portal_session(self, user: User) -> str:
        if not user.stripe_customer_id:
            raise ValueError("No Stripe customer found")
        session = stripe.billing_portal.Session.create(
            customer=user.stripe_customer_id,
            return_url=f"{settings.frontend_url}/settings",
        )
        return session.url

    def handle_webhook(self, db: Session, payload: bytes, signature: str) -> None:
        event = stripe.Webhook.construct_event(
            payload,
            signature,
            settings.stripe_webhook_secret,
        )

        if event["type"] == "checkout.session.completed":
            session = event["data"]["object"]
            self._upsert_subscription_from_session(db, session)
        elif event["type"] in {"customer.subscription.updated", "customer.subscription.deleted"}:
            subscription = event["data"]["object"]
            self._upsert_subscription_from_stripe(db, subscription)

    def _upsert_subscription_from_session(self, db: Session, session: dict) -> None:
        stripe_subscription_id = session.get("subscription")
        if not stripe_subscription_id:
            return

        stripe_subscription = stripe.Subscription.retrieve(stripe_subscription_id)
        plan = session["metadata"].get("plan")
        self._upsert_subscription_from_stripe(db, stripe_subscription, plan=plan)

    def _upsert_subscription_from_stripe(
        self,
        db: Session,
        stripe_subscription: dict,
        plan: str | None = None,
    ) -> None:
        customer_id = stripe_subscription.get("customer")
        user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
        if not user:
            return

        subscription = db.query(Subscription).filter(Subscription.user_id == user.id).first()
        if not subscription:
            subscription = Subscription(user_id=user.id)
            db.add(subscription)

        subscription.stripe_subscription_id = stripe_subscription["id"]
        subscription.status = stripe_subscription["status"]
        subscription.current_period_end = datetime.fromtimestamp(
            stripe_subscription.get("current_period_end", datetime.utcnow().timestamp())
        )
        subscription.cancel_at_period_end = bool(stripe_subscription.get("cancel_at_period_end"))

        trial_end = stripe_subscription.get("trial_end")
        subscription.trial_end = datetime.fromtimestamp(trial_end) if trial_end else None

        resolved_plan = plan or self._resolve_plan(stripe_subscription)
        if resolved_plan:
            subscription.plan = resolved_plan

        if stripe_subscription["status"] == SubscriptionStatus.TRIALING.value:
            user.has_used_trial = True

        db.commit()

    def _resolve_plan(self, stripe_subscription: dict) -> str | None:
        items = stripe_subscription.get("items", {}).get("data", [])
        if not items:
            return None

        price_id = items[0].get("price", {}).get("id")
        if price_id == settings.stripe_price_monthly:
            return SubscriptionPlan.MONTHLY.value
        if price_id == settings.stripe_price_yearly:
            return SubscriptionPlan.YEARLY.value
        return None
