"""Initial schema migration."""

from alembic import op
import sqlalchemy as sa

revision = "001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("clerk_id", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("stripe_customer_id", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_users_clerk_id", "users", ["clerk_id"], unique=True)
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "subscriptions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False, unique=True),
        sa.Column("stripe_subscription_id", sa.String(length=255), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=True),
        sa.Column("plan", sa.String(length=50), nullable=True),
        sa.Column("current_period_end", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )

    op.create_table(
        "car_profiles",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("fuel_type", sa.String(length=10), nullable=False),
        sa.Column("consumption_l_per_100km", sa.Float(), nullable=False),
        sa.Column("tank_capacity_l", sa.Float(), nullable=True),
        sa.Column("is_default", sa.Boolean(), nullable=True),
    )

    op.create_table(
        "price_snapshots",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("station_id", sa.Integer(), nullable=False),
        sa.Column("station_name", sa.String(length=255), nullable=False),
        sa.Column("fuel_type", sa.String(length=10), nullable=False),
        sa.Column("price", sa.Float(), nullable=False),
        sa.Column("latitude", sa.Float(), nullable=False),
        sa.Column("longitude", sa.Float(), nullable=False),
        sa.Column("recorded_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_price_snapshots_station_id", "price_snapshots", ["station_id"])
    op.create_index("ix_price_snapshots_fuel_type", "price_snapshots", ["fuel_type"])
    op.create_index("ix_price_snapshots_recorded_at", "price_snapshots", ["recorded_at"])

    op.create_table(
        "savings_logs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("recommended_station_id", sa.Integer(), nullable=False),
        sa.Column("recommended_station_name", sa.String(length=255), nullable=False),
        sa.Column("estimated_savings_eur", sa.Float(), nullable=False),
        sa.Column("actual_choice", sa.String(length=50), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )

    op.create_table(
        "price_alerts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("fuel_type", sa.String(length=10), nullable=False),
        sa.Column("threshold_eur", sa.Float(), nullable=False),
        sa.Column("radius_km", sa.Float(), nullable=True),
        sa.Column("latitude", sa.Float(), nullable=False),
        sa.Column("longitude", sa.Float(), nullable=False),
        sa.Column("active", sa.Boolean(), nullable=True),
        sa.Column("last_triggered_at", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("price_alerts")
    op.drop_table("savings_logs")
    op.drop_index("ix_price_snapshots_recorded_at", table_name="price_snapshots")
    op.drop_index("ix_price_snapshots_fuel_type", table_name="price_snapshots")
    op.drop_index("ix_price_snapshots_station_id", table_name="price_snapshots")
    op.drop_table("price_snapshots")
    op.drop_table("car_profiles")
    op.drop_table("subscriptions")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_index("ix_users_clerk_id", table_name="users")
    op.drop_table("users")
