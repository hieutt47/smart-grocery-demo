# Stakeholder walkthrough and feedback

Audience: anh Hải and collaborators. Target: 3–5 minutes, followed by hands-on use. Open the demo in a fresh browser session; use only the sample contact button. Warm up a free hosted service before presenting, if one has been deployed.

| Time | Show | Explain / observe |
|---|---|---|
| 0:00–0:25 | Home, two entry points | No login or apartment selection first. State clearly: rules assistant, sample data, no charge, simulated robot. |
| 0:25–1:20 | Search `thit bo`, add, adjust cart, reload | Product-first shopping, integer sample prices, preserved quantity and total. No supplier selection. |
| 1:20–1:55 | Sample address, immediate checkout, robot completion | Review before simulated order, delivery to apartment, no actual payment or hardware. |
| 1:55–2:50 | Assistant: “Tối nay 2 người, 100k”, then “Hôm nay không thích cá” | Context persists and catalog costs inform suggestions. Language parsing is limited, not a live model. |
| 2:50–3:30 | Choose dish, change servings, select only missing ingredients | Nothing is preselected; pack rounding and totals update. Recipes are authored demo content, unreviewed. |
| 3:30–4:10 | Scheduled order, jump simulation to delivery, reorder preview | Explicit schedule, persistent order, reorder requires confirmation and can be edited. |
| 4:10–4:30 | About / erase session | Demo boundaries and current-session data deletion. Ask for observations, not approval. |

Reproduce visual evidence with `node scripts/capture-demo.mjs` while the E2E server runs on port 8001. It writes screenshots plus a silent narrated-by-caption walkthrough video under `artifacts/`. It uses only sample data, and does not submit anything externally. See VALIDATION.md for actual captured artifacts and limitations.

## Moderated test prompts

1. “You know you want beef and eggs. Order them to a sample apartment.” Do not coach the route; record hesitation or mistaken clicks.
2. “You have 100k for two people and do not want fish. Find a dish, buy only two ingredients you lack, and schedule delivery.” Record whether cost and selection are understood.
3. “Find the earlier order and buy it again, adjusting quantity before confirmation.” Observe whether preview and ordering are distinguishable.
4. Ask what the participant believes AI, payment and robot functions actually do. Any mistaken belief is a disclosure/UX defect.

## Feedback record — not yet collected

- Participant / role (with permission):
- Date, device/browser and build/URL:
- Task completion without help: A ___ / B ___ / reorder ___
- Time and hesitation points:
- Exact quote (only with consent):
- Confusion about AI, money, price, schedule or robot:
- Most useful feature / unnecessary step:
- Severity, proposed change and linked Txx task:
- Follow-up owner / date:

No stakeholder session has been conducted by this implementation agent. Leave these fields empty until real observations are available.
