# ADR 003 — Expiring anonymous sessions and transactional snapshots

Status: accepted for demo, 2026-10-17.

Context: Visitors should browse immediately, reload without losing their cart, and see only their own orders. Free hosting has ephemeral storage; checkout must remain a simulation.

Decision: Use 24-hour opaque HttpOnly cookie sessions. Store cart/conversation/order state on the server. Guard cart updates with version checks; reserve a short-lived quote and validate again at order creation. Snapshot order values and require an idempotency key. Commit database dependencies before sending any response. Derive robot progress from timestamps and explicit simulation offsets.

Consequences: Reload and retry behavior is deterministic, and concurrent stale edits fail explicitly. Cookies become invalid after hosting disk loss, with a visible new-session action. Expiry deletion occurs on subsequent API traffic, not a scheduled task. One session can be erased without affecting another. No real identity, durable purchase history, money capture or logistics guarantee is provided.

Alternatives: Browser-only state is easily altered and cannot demonstrate ownership. Durable hosted databases and persistent disks violate the zero-cost scope. Token expiration without server cleanup would retain personal fields unnecessarily.
