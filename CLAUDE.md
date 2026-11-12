# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Product scope and reference documents

“Bữa Nhà” is a Vietnamese, mobile-first grocery demo. `readme.md` is the original Vietnamese concept brief, not the current setup guide; `START_HERE.md` documents local operation. `docs/ARCHITECTURE.md` and `docs/adr/` explain technical decisions; `docs/BACKLOG.md` tracks acceptance criteria and pending work; `docs/VALIDATION.md` records validation evidence.

Preserve two independent but connected journeys: direct grocery shopping and optional meal/recipe assistance leading to selectively purchased ingredients. Browsing does not require login or apartment selection; delivery/contact details are collected at checkout. Do not force AI use, meal bundles, supplier selection, or household-inventory entry. Users explicitly select ingredients to buy.

The assistant is rules-based, with no external model calls. Prices, inventory, payment and robot delivery are demo data/simulations; do not represent them as real capabilities. The single virtual warehouse is a demo simplification, not a settled long-term sourcing model. Real payments, robots/elevators, multi-supplier logistics, and verified nutrition/content licensing remain outside the implemented demo.

## Commands

Run from the repository root. Requirements: Python 3.12+, uv, Node.js 24 and npm. Examples use PowerShell and `npm.cmd`; use `npm` on macOS/Linux.

```powershell
# Install locked dependencies
uv sync --frozen
npm.cmd ci --prefix frontend

# Build the SPA, then serve frontend + API at http://127.0.0.1:8000
npm.cmd run build --prefix frontend
uv run python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --no-access-log

# For frontend development, keep the API above running and use a second terminal
npm.cmd run dev --prefix frontend
```

Vite runs at http://127.0.0.1:5173 and proxies `/api` to port 8000. The backend serves the built `frontend/dist` in the single-server workflow; rebuild it before testing frontend changes through port 8000 or E2E. Interactive API documentation is at `/docs`.

```powershell
# Backend lint, formatting check and tests
uv run ruff check backend
uv run ruff format --check backend
uv run pytest -q

# A single backend test (or replace with another pytest node ID)
uv run pytest -q backend/tests/test_api.py::test_cart_math_version_and_refresh

# Frontend checks; build also performs TypeScript checking
npm.cmd run lint --prefix frontend
npm.cmd run typecheck --prefix frontend
npm.cmd run build --prefix frontend

# Browser installation and the full E2E suite
node frontend/node_modules/@playwright/test/cli.js install chromium firefox
node frontend/node_modules/@playwright/test/cli.js test --config frontend/playwright.config.ts

# One journey in one browser project
node frontend/node_modules/@playwright/test/cli.js test --config frontend/playwright.config.ts --project chromium-mobile -g "A: direct purchase"
```

Playwright has `chromium-mobile` (Pixel 7) and `firefox-desktop` projects, running with one worker. Its web-server helper, `scripts/e2e-server.mjs`, uses the root `.venv` interpreter and starts port 8001 with `.cache/e2e.db`, separate from the demo database. It may reuse an existing healthy server locally; do not point that server at the main demo database. Backend fixtures instead create temporary SQLite databases and inject a mutable clock into `create_app`, allowing expiry/scheduling tests without sleeps.

The handed-off Windows workspace can run Python directly as `& ".\.venv\Scripts\python.exe" -m pytest -q` (or `-m uvicorn ...`). If sandbox permissions prevent uv/browser access to user-level locations, use the repository-local locations documented in `START_HERE.md`:

```powershell
$env:UV_CACHE_DIR = Join-Path (Get-Location) '.cache/uv'
$env:UV_PYTHON_INSTALL_DIR = Join-Path (Get-Location) '.tools/python'
$env:PLAYWRIGHT_BROWSERS_PATH = Join-Path (Get-Location) '.cache/browsers'
```

CI (`.github/workflows/ci.yml`) runs backend lint/format/tests, frontend lint/build, both browser projects, then a Docker build and container smoke test.

## Architecture and invariants

### Backend and persistence

`backend/app/main.py:create_app(database_url=None, clock=None)` composes FastAPI routes, middleware, session/database dependencies, startup migrations/seeding and built-SPA serving. API routes live under `/api/v1`; non-API routes fall back to the SPA, while unknown API routes remain JSON 404s. `schemas.py` defines strict request payloads, `models.py` the SQLAlchemy entities, and `domain.py` the shared pricing, cart, quote and delivery calculations/serialization.

The database implementation is SQLite-specific: WAL mode, foreign keys and a busy timeout are configured in `db.py`. Startup applies Alembic migrations and idempotent seed data automatically. Seed entities use stable IDs and skip existing rows: editing seed constants does not update an existing database. Default local storage is `grocery.db`; changing schema requires an Alembic migration under `backend/migrations/versions/`, not just a model edit.

Write transactions acquire `BEGIN IMMEDIATE` before reading. Function-scoped database dependencies commit before response headers and cookies are sent. Preserve those boundaries: concurrency, idempotency and immediate visibility of newly created sessions depend on them.

An opaque HttpOnly/SameSite=Lax `grocery_session` cookie owns server-side carts, conversations, quotes and orders. Sessions last 24 hours, with expired records cleaned on API activity; resetting a session erases only its associated data. There are no accounts. Missing/expired sessions require explicit creation/renewal rather than silently replacing an existing identity.

### Shopping, recipes and checkout

The backend owns integer-VND prices and totals. Recipe demand scales with exact fractions, sums demand across selected recipes and shared SKU mappings, and only then rounds up to sale packs. Canonical units must agree; there is no implicit mass/volume conversion. Assistant recommendations and the cooking flow use the same backend recipe-quote calculation.

Cart writes carry `expected_version`; stale writes return `CART_CHANGED`. Checkout quotes expire after 10 minutes and bind the cart version, product fingerprint and delivery schedule. Order creation revalidates these constraints, uses session-scoped idempotency keys, snapshots item details/prices, and clears/increments the cart. `Order.quote_id` is unique but deliberately not a foreign key: expired quotes can be removed without deleting order history. Reordering previews current prices/availability before an explicit cart merge; it never directly places another order.

Delivery is computed from server time plus a persisted per-order simulation offset, not a background worker or robot connection. Refreshing must not restart delivery. Timestamps are UTC, displayed in Vietnam time.

### Assistant and frontend

`backend/app/assistant.py` implements `RecommendationProvider` with `RuleBasedProvider`. It parses normalized Vietnamese requests and preserves budget, servings, time, preferences and shown suggestions across turns. It does not mutate the cart or silently relax constraints. Allergy uncertainty suppresses recommendations until conversation reset; only the latest 20 message entries persist.

`frontend/src/main.tsx` mounts React Router pages. `context.tsx` owns session bootstrap, server-backed cart state, mutation/error/toast handling and cancellable `useResource` reads. `api.ts` centralizes same-origin cookie-backed requests and session-expiry events; `types.ts` manually mirrors API payloads. Keep those types aligned when backend schemas/responses change; `docs/openapi.json` is a checked-in API snapshot.

Recipe ingredient selection is page-local, but quantity/price quotes come from the backend. Checkout retries retain the identical pending request body and idempotency key. Order detail polls every three seconds while visible and stops on completion.

## Runtime and deployment constraints

Environment settings are listed in `.env.example`: `DATABASE_URL`, `COOKIE_SECURE`, and `ALLOWED_ORIGINS`. Local HTTP uses `COOKIE_SECURE=false`; HTTPS deployment uses `true`. Allowed origins protect write requests; the Render-provided external URL is included by the app. Configure environment variables in the launching process/container.

The deployment is one API process serving the built SPA with SQLite, not a multi-worker/distributed service. `Dockerfile` builds the frontend and installs frozen Python dependencies; `render.yaml` targets a free service with ephemeral storage. Restarts/redeploys can erase demo data. See `docs/DEPLOYMENT.md` for operational steps and verify live deployment status rather than assuming older status text is current.

```powershell
docker build -t grocery-demo .
docker run --rm -p 8000:8000 -e COOKIE_SECURE=false -e ALLOWED_ORIGINS=http://localhost:8000 grocery-demo
```
