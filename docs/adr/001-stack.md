# ADR 001 — Single-origin React + FastAPI demo

Status: accepted for demo, 2026-10-17.

Context: The brief needs a polished mobile web journey and inspectable Python business logic, with zero paid services. A separate frontend host would add CORS/cookie configuration and deployment coordination.

Decision: Build React/TypeScript with Vite, serve its output from FastAPI, use SQLAlchemy and Alembic with SQLite. Bundle everything into one multi-stage container. Keep the repository private until the owner chooses otherwise. Deploy only one free Render service; do not provision paid disks or databases.

Consequences: One origin simplifies cookies and operational setup. Static UI and API deploy together. SQLite and a single instance limit scale, intentionally. Server-side domain calculations remain independently testable. Docker build requires CI verification because Docker is unavailable on the handoff machine.

Alternatives: Separate hosting adds operational surface; a frontend-only mock cannot demonstrate server-side ownership, quote validation or concurrency. Native mobile would slow review without helping this first demo.
