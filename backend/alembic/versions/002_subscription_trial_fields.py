"""Add subscription trial fields."""

from alembic import op
import sqlalchemy as sa

revision = "002_subscription_trial"
down_revision = "001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("has_used_trial", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("subscriptions", sa.Column("trial_end", sa.DateTime(), nullable=True))
    op.add_column(
        "subscriptions",
        sa.Column("cancel_at_period_end", sa.Boolean(), nullable=False, server_default=sa.false()),
    )


def downgrade() -> None:
    op.drop_column("subscriptions", "cancel_at_period_end")
    op.drop_column("subscriptions", "trial_end")
    op.drop_column("users", "has_used_trial")
