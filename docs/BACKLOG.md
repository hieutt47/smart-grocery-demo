# Implementation backlog - approved baseline

All tasks retain original IDs and P0 priority. DONE LOCAL means implemented locally, not released online. Updated 2026-11-13.

| ID | Scope | Dependencies | Status |
|---|---|---|---|
| T01 | Requirements register and decision mapping | - | DONE LOCAL: full traceability & decision mapping in docs/REQUIREMENTS_TRACEABILITY.md |
| T02 | Repository, board, templates, milestones | T01 | DONE: remote GitHub repository connected & pushed (hieutt47/smart-grocery-demo) |
| T03 | Architecture, ERD, API and three ADRs | T01 | DONE LOCAL |
| T04 | Runtime, scaffold, health, Render free deploy | T03 | PARTIAL: repository ready; Render Blueprint import pending |
| T05 | Flows, wireframes, tokens, prototype | T01 | DONE LOCAL: V2 design system implemented per docs/DESIGN.md, de-boxed layout, warm tokens, vector assets |
| T06 | App shell, navigation, forms, UI states | T04,T05 | DONE LOCAL: App shell V2 with mobile bottom sticky actions, compact apartment grid, responsive navigation |
| T07 | Lint, typecheck, tests, build, CI and locks | T04 | PARTIAL: local checks pass; hosted GitHub Actions CI triggered |
| T08 | Schema, migration, session, 30 SKU/12 recipes/3 meals | T03,T04 | DONE LOCAL |
| T09 | Catalog, search, detail, add | T06,T08 | DONE LOCAL: Catalog V2 with sticky categories, first-viewport 2-row grid, bespoke SVG icons |
| T10 | Server cart, totals, versions, isolation | T09 | DONE LOCAL |
| T11 | Checkout quote, recipient, transaction, idempotency | T10 | DONE LOCAL |
| T12 | Recipes, steps, portions, variants | T06,T08 | DONE LOCAL: Recipes V2 with vector dish art, de-boxed card grid, and sticky ingredient quote bar |
| T13 | Ingredient quote, mapping, aggregation, pack rounding | T10,T12 | DONE LOCAL |
| T14 | Unchecked ingredients, explicit select-all and add | T13 | DONE LOCAL |
| T15 | Provider interface, parser, session context | T08,T13 | DONE LOCAL |
| T16 | Filter/rank meals, exclusions, prices and variants | T15 | DONE LOCAL |
| T17 | Assistant UI, cards, labels and journey B | T14,T16 | DONE LOCAL: Assistant V2 with mobile prompt pills, de-boxed meal recommendation cards, preserved inputs |
| T18 | Schedule validation, UTC and Vietnam display | T11 | DONE LOCAL |
| T19 | Clock simulation, polling, diagram, advance | T18 | DONE LOCAL |
| T20 | History, reorder preview, erase and expiry | T11,T19 | DONE LOCAL |
| T21 | Domain/API, assistant, fake clock and ownership tests | T14,T17,T20 | DONE LOCAL: 53 backend tests |
| T22 | A/B E2E, mobile, two browsers, restart, refresh, online | T21 | PARTIAL: 14 local browser tests pass (7 chromium-mobile, 7 firefox-desktop); online pending |
| T23 | Stakeholder and two user trials, UX fixes | T22 | PARTIAL: initial positive visual feedback FB-001 in DEMO.md; independent A/B trials and two users pending |
| T24 | Runbook, API, diagrams, video, notes and release tag | T23 | PARTIAL: local handoff; final release awaits online/UAT |

Acceptance evidence: VALIDATION.md, backend/tests, frontend/e2e, artifacts screenshots and video. Original readme.md is authoritative. Brief mapping: T09-T11 sections 6.1/6.2/6.8; T12-T14 sections 6.4-6.6; T15-T17 sections 6.3/6.6/13; T18-T20 sections 6.7-6.9; T21-T24 sections 8/9/14.

Docker is prepared but not locally executed. Real LLM, payments, robots and persistent accounts remain outside v0.1. No remote issue board is claimed. Initial feedback is recorded as FB-001; formal usability acceptance remains pending.
