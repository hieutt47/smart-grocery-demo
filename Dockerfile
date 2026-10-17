FROM node:24-bookworm-slim AS web
WORKDIR /build/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM ghcr.io/astral-sh/uv:0.11.15 AS uv
FROM python:3.12-slim-bookworm
COPY --from=uv /uv /usr/local/bin/uv
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 UV_LINK_MODE=copy
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project
COPY backend/ ./backend/
COPY alembic.ini ./
COPY --from=web /build/frontend/dist ./frontend/dist/
RUN useradd --create-home app && mkdir /app/data && chown -R app:app /app
USER app
ENV PATH="/app/.venv/bin:$PATH" DATABASE_URL="sqlite:////app/data/grocery.db" COOKIE_SECURE=true
EXPOSE 8000
CMD ["sh", "-c", "exec python -m uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8000} --no-access-log"]
