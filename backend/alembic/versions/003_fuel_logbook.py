"""Add car registration and fuel logs."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = "003_fuel_logbook"
down_revision = "002_subscription_trial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    car_columns = {column["name"] for column in inspector.get_columns("car_profiles")}

    if "registration" not in car_columns:
        op.add_column("car_profiles", sa.Column("registration", sa.String(length=20), nullable=True))

    if "fuel_logs" not in inspector.get_table_names():
        op.create_table(
            "fuel_logs",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column(
                "car_id",
                sa.Integer(),
                sa.ForeignKey("car_profiles.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column("refueled_at", sa.Date(), nullable=False),
            sa.Column("odometer_km", sa.Float(), nullable=False),
            sa.Column("liters", sa.Float(), nullable=False),
            sa.Column("fuel_type", sa.String(length=10), nullable=False),
            sa.Column("total_cost_eur", sa.Float(), nullable=False),
            sa.Column("price_per_liter", sa.Float(), nullable=True),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=True),
        )
        op.create_index("ix_fuel_logs_user_id", "fuel_logs", ["user_id"])
        op.create_index("ix_fuel_logs_car_id", "fuel_logs", ["car_id"])
        op.create_index("ix_fuel_logs_refueled_at", "fuel_logs", ["refueled_at"])


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)

    if "fuel_logs" in inspector.get_table_names():
        op.drop_index("ix_fuel_logs_refueled_at", table_name="fuel_logs")
        op.drop_index("ix_fuel_logs_car_id", table_name="fuel_logs")
        op.drop_index("ix_fuel_logs_user_id", table_name="fuel_logs")
        op.drop_table("fuel_logs")

    car_columns = {column["name"] for column in inspector.get_columns("car_profiles")}
    if "registration" in car_columns:
        op.drop_column("car_profiles", "registration")
