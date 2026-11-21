"""add_custom_recipes

Revision ID: b7c3e9a14d20
Revises: 8a2d4e1f9b03
"""

import sqlalchemy as sa
from alembic import op

revision = "b7c3e9a14d20"
down_revision = "8a2d4e1f9b03"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "custom_recipes",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.String(), nullable=False),
        sa.Column("minutes", sa.Integer(), nullable=False),
        sa.Column("servings", sa.Integer(), nullable=False),
        sa.Column("emoji", sa.String(), nullable=False),
        sa.Column("color", sa.String(), nullable=False),
        sa.Column("tags", sa.JSON(), nullable=False),
        sa.Column("ingredients", sa.JSON(), nullable=False),
        sa.Column("steps", sa.JSON(), nullable=False),
        sa.Column("estimated_kcal", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("custom_recipes", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_custom_recipes_created_at"), ["created_at"], unique=False)


def downgrade():
    op.drop_table("custom_recipes")
