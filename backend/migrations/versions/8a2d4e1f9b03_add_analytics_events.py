"""add_analytics_events

Revision ID: 8a2d4e1f9b03
Revises: 4c0911e5430f
"""

import sqlalchemy as sa
from alembic import op

revision = "8a2d4e1f9b03"
down_revision = "4c0911e5430f"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "analytics_events",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("event_name", sa.String(), nullable=False),
        sa.Column("target_id", sa.String(), nullable=True),
        sa.Column("created_at", sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("analytics_events", schema=None) as batch_op:
        batch_op.create_index(
            batch_op.f("ix_analytics_events_event_name"), ["event_name"], unique=False
        )
        batch_op.create_index(
            batch_op.f("ix_analytics_events_created_at"), ["created_at"], unique=False
        )


def downgrade():
    op.drop_table("analytics_events")
