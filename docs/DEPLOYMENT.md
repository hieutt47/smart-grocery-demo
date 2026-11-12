# Deployment and operations

Status reviewed 2026-10-25: the local repository has GitHub remote `hieutt47/smart-grocery-demo`, and the backlog records the source push. Hosted CI success, a remote project board and a public demo URL have not been verified. Render provisioning is still pending in the recorded backlog; account access and explicit deployment authorization are required. Source stays private. Do not substitute a paid plan if free capacity is unavailable.

## Reviewable deployment

1. Verify access to the existing GitHub repository and connect the owner's Render account through supported integrations; do not create a duplicate repository. Keep source private. Push reviewed source and lockfiles only when authorized, excluding `.env`, databases, caches and artifacts containing sessions.
2. Inspect `Demo CI` for the exact candidate commit. It checks Python lint/format/tests, frontend lint/typecheck/build, both browser projects, then builds and smoke-tests the container. The backlog records CI as triggered; a successful hosted run still needs verification.
3. Import `render.yaml` as a Blueprint. Review that it contains exactly one web service with `plan: free`, no disk, no managed database and no paid resource. The Dockerfile builds the frontend, installs the frozen Python lock and runs as a non-root user.
4. Use the service's generated HTTPS URL. Render injects `RENDER_EXTERNAL_URL`, which is added to allowed write origins. `COOKIE_SECURE=true` is required. If a custom domain is later used, explicitly add its full HTTPS origin to `ALLOWED_ORIGINS`.
5. The Blueprint uses `autoDeployTrigger: checksPass`; after initial provisioning, linked-branch deploys wait for CI checks. Alternatively disable automatic deploys in Render and deploy manually after a green CI run. Initial Blueprint provisioning itself must only happen after review and CI.
6. Verify `/api/v1/health`, open both journeys on a phone, create a simulated order, reload, and test explicit session reset. Record the actual public URL, commit and deploy timestamp in VALIDATION.md only after success.

## Free-tier constraints

Render's [free service documentation](https://render.com/docs/free) says inactive free web services sleep after 15 minutes and local storage is ephemeral. A restart/redeploy can erase the SQLite demo data. Opening the URL may require waiting for a cold start; use a new session if prompted. No keep-alive service, paid disk or external database is configured. The [Blueprint reference](https://render.com/docs/blueprint-spec) documents `checksPass`. Reviewed 2026-10-17; recheck account quotas and pricing at deployment time.

## Local container (requires Docker)

```sh
docker build -t grocery-demo .
docker run --rm -p 8000:8000 -e COOKIE_SECURE=false -e ALLOWED_ORIGINS=http://localhost:8000 grocery-demo
```

Then open http://localhost:8000. Local HTTP needs Secure=false; hosted HTTPS needs true. Container startup automatically migrates and seeds the database. The container's database is disposable; no volume is mounted by default.

## Recovery

- Health failures: inspect startup/migration logs; never print cookie or contact values. Request IDs correlate application logs without body content.
- Broken release: use Render's previous successful deploy or revert the commit, rerun CI and redeploy. Current schema is only the initial migration; future incompatible migrations need an explicit rollback strategy.
- Lost demo data: expected after ephemeral-disk replacement; reseeding is automatic. Tell testers to start a new session. Do not claim data recovery or durable order history.
- Local reset: stop the server first, back up only if necessary, then remove the explicitly named local demo database and its `-wal`/`-shm` files. Never remove a production database by pattern.
- Privacy: use sample contacts. The in-app erase action deletes current-session data; natural expiry is cleaned on API activity. The demo is unsuitable for real purchases or personal records.
