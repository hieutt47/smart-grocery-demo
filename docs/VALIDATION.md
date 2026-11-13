# Validation and release status

Implementation evidence date: 2026-10-17. UI Redesign V2 & Live Deployment completed: 2026-11-13.
- GitHub Repository: `hieutt47/smart-grocery-demo` (branch `main`).
- Live Hosted Demo: `https://bua-nha-demo-vx8c.onrender.com/` (Render Free Plan Docker service `bua-nha-demo`).

## Observed checks

- Hosted GitHub Actions CI: `Demo CI` run 43285085522 passed on `main` (job `validate` in 2m1s, job `container` in 1m23s).
- Live Online Verification (`https://bua-nha-demo-vx8c.onrender.com`):
  - `/api/v1/health`: 200 OK (`{"status":"ok","version":"0.1.0","demo":true,"assistant_mode":"rules"}`).
  - SPA bundle and assets: Served properly with HTTPS, CSP, and security headers.
  - Session lifecycle: `HttpOnly; Path=/; SameSite=lax; Secure` cookie issuance and explicit reset verified.
  - Core flows: 30 products catalog, recipe listing, cart mutations, checkout quote generation, order creation (`#D7907D60`), and simulation status verified live.
- Backend: 53 pytest tests passed, including session commit-before-response regression, ownership, pricing, pack rounding, stale quotes, idempotency, scheduling and clock-based delivery. Ruff linter and formatter checks passed.
- Frontend: ESLint clean (0 errors, 0 warnings), TypeScript (`tsc --noEmit`) clean, and production build (`npm run build`) succeeded without warnings.
- Browser & E2E: 14 Playwright tests passed (7 scenarios each on Chromium Mobile Pixel 7 and Firefox Desktop 1280x800 across Journeys A, B, Reorder, Refresh, and Session Reset); runtime ~35 seconds.
- Responsive & Accessibility Metrics:
  - 0px horizontal overflow across all core pages (`/`, `/products`, `/recipes`, `/cook`, `/assistant`, `/cart`, `/checkout`, `/orders`, `/orders/:id`) at 360px and 390px viewports.
  - 100% WCAG 2.5.5 / 2.5.8 touch target compliance ($\ge 44\text{px}$ minimum clickable area on all buttons, quantity steppers, delete buttons, filter chips, and navigation links).
  - De-boxed visual architecture per `docs/DESIGN.md`: warm canvas `var(--bg-warm)`, removal of 1px grey container boxes, bespoke SVG product & recipe artwork, sticky bottom action bars for mobile checkout and recipe ingredient ordering.
- Evidence Gallery: `docs/redesign-shots/` captures complete mobile (360px, 390px) and desktop screenshots for all modernized views. Legacy baseline artifacts remain in `artifacts/`.
- OpenAPI export in docs/openapi.json.

Evidence was produced during implementation by the delegated agent and inspected by the coordinator. Commands are in START_HERE.md. Browser installation uses the local .cache/browsers directory.

## Release gates status

1. **GitHub CI & Repository** [COMPLETED]: CI workflow `Demo CI` run passed for merge into `main` (PR #1).
2. **Render Public Deployment** [COMPLETED]: Live at `https://bua-nha-demo-vx8c.onrender.com/` with HTTPS, cold start handling, and verified session / cart / checkout / order operations.
3. **Docker Multi-Stage Container** [COMPLETED]: Container build and smoke test passed in hosted CI.
4. **User & Stakeholder Trials (UAT)** [IN PROGRESS]: Initial positive visual feedback recorded in DEMO.md (FB-001). Formal trials with two users on live link pending.
5. **Requirements & Documentation** [COMPLETED]: Traceability matrix in `docs/REQUIREMENTS_TRACEABILITY.md` and design system in `docs/DESIGN.md`.
6. **Food & Logistics Boundaries** [PRESERVED]: Sample data, simulated pricing and robot routing. No real payment, robot connection, or real inventory claimed. SQLite hosting data is temporary.
