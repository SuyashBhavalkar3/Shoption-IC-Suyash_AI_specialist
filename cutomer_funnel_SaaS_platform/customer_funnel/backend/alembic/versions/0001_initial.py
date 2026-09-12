"""initial schema

Revision ID: 0001_initial
Revises: 
Create Date: 2026-06-05 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("external_user_id", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
    )
    op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)
    op.create_index(op.f("ix_users_external_user_id"), "users", ["external_user_id"], unique=True)

    op.create_table(
        "events",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("user_id", sa.String(length=255), nullable=True),
        sa.Column("anonymous_id", sa.String(length=255), nullable=True),
        sa.Column("event_name", sa.String(length=120), nullable=False),
        sa.Column("properties", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
    )
    op.create_index(op.f("ix_events_id"), "events", ["id"], unique=False)
    op.create_index(op.f("ix_events_user_id"), "events", ["user_id"], unique=False)
    op.create_index(op.f("ix_events_anonymous_id"), "events", ["anonymous_id"], unique=False)
    op.create_index(op.f("ix_events_event_name"), "events", ["event_name"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_events_event_name"), table_name="events")
    op.drop_index(op.f("ix_events_anonymous_id"), table_name="events")
    op.drop_index(op.f("ix_events_user_id"), table_name="events")
    op.drop_index(op.f("ix_events_id"), table_name="events")
    op.drop_table("events")

    op.drop_index(op.f("ix_users_external_user_id"), table_name="users")
    op.drop_index(op.f("ix_users_id"), table_name="users")
    op.drop_table("users")
