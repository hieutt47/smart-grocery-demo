import os

from alembic import context
from sqlalchemy import engine_from_config, pool

from backend.app import models  # noqa: F401
from backend.app.db import Base

config = context.config
if "connection" not in config.attributes:
    config.set_main_option("sqlalchemy.url", os.getenv("DATABASE_URL", "sqlite:///./grocery.db"))

if context.is_offline_mode():
    context.configure(
        url=config.get_main_option("sqlalchemy.url"), target_metadata=Base.metadata, literal_binds=True
    )
    with context.begin_transaction():
        context.run_migrations()
else:
    engine = config.attributes.get("connection") or engine_from_config(
        config.get_section(config.config_ini_section), prefix="sqlalchemy.", poolclass=pool.NullPool
    )
    with engine.connect() as connection:
        context.configure(connection=connection, target_metadata=Base.metadata, render_as_batch=True)
        with context.begin_transaction():
            context.run_migrations()
