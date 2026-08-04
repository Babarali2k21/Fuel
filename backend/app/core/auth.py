from datetime import datetime, timedelta

from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import Subscription, SubscriptionStatus, User


class AuthError(Exception):
    pass


def decode_clerk_token(token: str) -> dict:
    if not settings.clerk_jwt_issuer:
        raise AuthError("Clerk is not configured")

    try:
        return jwt.decode(
            token,
            key="",
            options={
                "verify_signature": False,
                "verify_aud": False,
                "verify_iss": True,
            },
            issuer=settings.clerk_jwt_issuer,
        )
    except JWTError as exc:
        raise AuthError("Invalid token") from exc


DEMO_CLERK_ID = "dev-guest"
DEMO_EMAIL = "guest@dev.local"


def get_demo_user(db: Session) -> User:
    return get_or_create_user(db, DEMO_CLERK_ID, DEMO_EMAIL)


def get_or_create_user(db: Session, clerk_id: str, email: str) -> User:
    user = db.query(User).filter(User.clerk_id == clerk_id).first()
    if user:
        if user.email != email:
            user.email = email
            db.commit()
            db.refresh(user)
        return user

    user = User(clerk_id=clerk_id, email=email)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def is_premium_user(db: Session, user: User | None = None) -> bool:
    if settings.bypass_premium:
        return True
    if not user:
        return False

    subscription = db.query(Subscription).filter(Subscription.user_id == user.id).first()
    if not subscription:
        return False
    return subscription.status in {
        SubscriptionStatus.ACTIVE.value,
        SubscriptionStatus.TRIALING.value,
    }


def get_user_from_token(db: Session, authorization: str | None) -> User | None:
    if not authorization or not authorization.startswith("Bearer "):
        return None

    token = authorization.split(" ", 1)[1]
    payload = decode_clerk_token(token)
    clerk_id = payload.get("sub")
    email = payload.get("email") or payload.get("primary_email_address") or f"{clerk_id}@users.local"

    if not clerk_id:
        raise AuthError("Missing subject in token")

    return get_or_create_user(db, clerk_id, email)
