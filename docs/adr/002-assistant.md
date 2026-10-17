# ADR 002 — Transparent deterministic assistant

Status: accepted for demo, 2026-10-17.

Context: The demo must show natural-language meal selection, keep context when preferences change, and calculate ingredient costs from catalog data. No paid API credentials or licensed recipe source are available.

Decision: Use RuleBasedProvider with seeded authored recipes, bounded Vietnamese intent parsing, persisted conversation context and deterministic suggestions. Label it as a scripted/rules demo in the UI. Only catalog-derived pack costs are displayed; do not invent nutrition values. Ingredient selection is explicit and no chat message silently modifies the cart.

Consequences: Runs offline without model spending and has reproducible edge tests. Language understanding is limited; unsupported requests may fall back or yield no suitable result. Allergy filtering is a demo safeguard, not a certified food-safety system. Recipe content is unreviewed. A future model provider must preserve catalog IDs, schema validation, price calculations and safe fallbacks; adding an LLM alone is insufficient.

Alternatives: A live model would require credentials, spend limits, evaluation and source licensing. Presenting scripted output as real AI would misrepresent this implementation.
