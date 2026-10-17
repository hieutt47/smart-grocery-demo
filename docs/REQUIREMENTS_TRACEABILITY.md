# Requirements Register & Decision Mapping (T01)

Authoritative Baseline: [readme.md](../readme.md) (Concept Brief v1.0, dated 2026-10-17).  
Status: Local baseline mapped and verified. Real third-party integrations (payments, robots, LLMs, supplier inventory) remain explicitly out-of-scope for v0.1 demo.

---

## 1. Decision Boundaries & Assumption Register

| Category | Brief Agreement (Đã thống nhất) | Demo v0.1 Assumption (Giả định demo) | Open Item / Risk (Điểm còn mở / Rủi ro) |
|---|---|---|---|
| **Audience & Location** | Condominiums in general, not restricted to luxury estates (§3). | Single virtual condominium sandbox; manual apartment/floor input (§6.8). | Building access permits, elevator dispatching, management approvals (§12). |
| **Catalog & Suppliers** | Product-first browsing; customer selects items, not individual stores (§5, §6.2). | 30 curated SKUs in single virtual staging point / virtual warehouse (§5, §8). | Multi-supplier fulfillment, split deliveries, margin/commission models (§5, §12). |
| **Assistant & AI** | Natural language assistance for recipes/meals; proactive but non-intrusive (§6.3, §13). | Deterministic, labeled rule-based engine (`RuleBasedProvider`) with transparent badge (§9, ADR-002). | Real LLM integration, recipe copyright, allergy liability (§6.3, §9, §12). |
| **Recipes & Nutrition** | Step-by-step visual cooking guide; selective ingredient purchase (§6.4, §6.5). | 12 Vietnamese recipes, 3 curated meals; unverified demo nutritional estimates (§6.4, §8). | Certified dietitian review, licensed recipe database, allergen validation (§6.4, §12). |
| **Checkout & Payment** | Simulated checkout only; immediate and scheduled delivery (§6.8). | Mock checkout without actual monetary transaction or external PSP (§6.8, §9). | Real payment gateway, refund/dispute workflow, invoicing (§12). |
| **Robot Delivery** | Last-mile delivery to apartment door as key differentiator (§6.9). | Discrete state simulation with virtual clock and fast-forward controls (§6.9, §19). | Real hardware fleet, elevator control, security doors, obstruction recovery (§12). |
| **Session & Account** | No mandatory login or apartment entry prior to checkout (§6.1, §11). | Cookie-based ephemeral session (24h TTL) in SQLite WAL database (ADR-003). | Customer authentication, persistent profiles, privacy consent (§12). |

---

## 2. Explicit Anti-Requirements (Section 11 Boundaries)

The demo strictly complies with the negative constraints outlined in `readme.md` §11:
1. **No Supplier Selection Wall:** User browses and adds products directly; platform abstracts sourcing (§11.2).
2. **No Mandatory AI Gate:** Browsing catalog, adding to cart, and checking out does not require talking to AI (§11.3).
3. **No Rigid Weekly Meal Locks:** AI suggestions are flexible, serving "today's meal" without enforcing meal calendars (§11.4).
4. **No Forced Combos:** Customers can select an individual dish or meal without bundle lock-in (§11.5).
5. **No Automatic Bulk Ingredient Dumps:** Missing ingredients are unchecked by default; users selectively check items they lack (§11.6).
6. **No Fridge Inventory Tracking:** No home refrigerator inventory management or pre-registration barrier (§11.7).
7. **No Pre-Login Wall:** Application opens directly to catalog and AI exploration without sign-in prompts (§11.8).
8. **No Pre-Delivery Photo Gate:** Photo-before-delivery workflow is omitted from demo runtime (§11.9).
9. **No Fake Claims:** The system explicitly labels mock data, simulated clock, and rule-based assistant mode (§11.10).

---

## 3. Requirements Traceability Matrix

| Req ID | Brief Section | Specification Summary | Implementation Component | Verification / Test |
|---|---|---|---|---|
| **REQ-01** | §6.1, §6.2, §8 | **Journey A — Direct Grocery:** Search, browse categories, view product details, adjust quantities, add to cart without login. | Frontend: `Catalog.tsx`, `components.tsx`<br>Backend: `GET /api/v1/products`, `POST /api/v1/cart`<br>Data: `Product` model (30 SKUs) | `backend/tests/test_api.py::test_search`<br>`frontend/e2e/journeys.spec.ts` (Scenario A) |
| **REQ-02** | §6.2, §6.5 | **Cart & Packaging Math:** Accurate integer VND arithmetic, pack rounding up to retail pack sizes, versioned optimistic concurrency. | Frontend: `CartCheckout.tsx`<br>Backend: `PATCH /api/v1/cart`, `POST /api/v1/recipe-quotes`<br>Domain: `domain.py::recipe_quote` | `backend/tests/test_api.py::test_cart_math_version_and_refresh`<br>`test_api.py::test_recipe_rounding_and_selection` |
| **REQ-03** | §6.3, §6.6, §13 | **Journey B — Assistant & Recipe Discovery:** Parse budget, servings, cooking time, exclusions, dish vs meal intent, and lighter variants from natural language. | Frontend: `Assistant.tsx`<br>Backend: `POST /api/v1/assistant/messages`<br>Logic: `assistant.py::RuleBasedProvider` | `backend/tests/test_assistant.py` (30 test cases AI-01–AI-30)<br>`frontend/e2e/journeys.spec.ts` (Scenario B) |
| **REQ-04** | §6.4, §6.5 | **Step-by-step Recipe & Selective Purchase:** Visual steps, scaling by servings, checkboxes for missing ingredients only, batch add to cart. | Frontend: `Cook.tsx`<br>Backend: `GET /api/v1/recipes/{id}`, `POST /api/v1/recipe-quotes`, `POST /api/v1/cart/recipes` | `backend/tests/test_api.py::test_recipe_rounding_and_selection`<br>`frontend/e2e/journeys.spec.ts` (Scenario B) |
| **REQ-05** | §6.8 | **Checkout & Time-Slot Scheduling:** Validate delivery slot (immediate vs scheduled), apartment details, 10-minute quote expiry, idempotency. | Frontend: `CartCheckout.tsx`<br>Backend: `POST /api/v1/checkout-quote`, `POST /api/v1/orders`<br>Domain: `domain.py::validate_schedule` | `backend/tests/test_api.py::test_idempotent_order_and_quote_expiry`<br>`test_api.py::test_schedule_validation` |
| **REQ-06** | §6.9 | **Simulated Robot Last-Mile Delivery:** Track stages (confirmed → preparing → ready → robot pickup → door delivery → completed) with time simulation. | Frontend: `Orders.tsx`<br>Backend: `GET /api/v1/orders/{id}/delivery`, `POST /api/v1/orders/{id}/delivery/advance`<br>Model: `DeliverySimulation` | `backend/tests/test_api.py::test_delivery_clock_advance`<br>`frontend/e2e/journeys.spec.ts` |
| **REQ-07** | §6.7 | **Order History & Reorder Preview:** View past orders, preview reorder with current catalog prices/availability, edit before checkout. | Frontend: `Orders.tsx`<br>Backend: `GET /api/v1/orders`, `POST /api/v1/orders/{id}/reorder-preview` | `backend/tests/test_api.py::test_reorder_preview_and_price_changes`<br>`frontend/e2e/journeys.spec.ts` |
| **REQ-08** | §6.1, §9 | **Session Isolation & Privacy:** Anonymous HttpOnly cookie session, 24-hour expiration, explicit session wipe button in "About" page. | Frontend: `About.tsx`<br>Backend: `DELETE /api/v1/session`, middleware session injection in `main.py` | `backend/tests/test_api.py::test_session_isolation`<br>`test_api.py::test_session_expiry_and_cleanup`<br>`frontend/e2e/journeys.spec.ts` |

---

## 4. Section 13 Benchmark Test Mapping

All 6 verbatim example queries from `readme.md` §13 are tested as automated test fixtures in `backend/tests/test_assistant.py`:
1. *"Hôm nay đi làm về mệt quá, có món nào nấu trong 20 phút không?"* → Maps to `AI-01`: filters recipes $\le 20$ minutes.
2. *"Tối nay 2 người, khoảng 100k, không biết ăn gì."* → Maps to `AI-02`: sets 2 servings, budget $\le 100{,}000$ VND, returns budget-compliant dishes.
3. *"T muốn nấu gà rang gừng."* → Maps to `AI-03`: resolves exact recipe ID `ga-rang-gung`.
4. *"Đổi món khác đi, hôm nay không thích cá."* → Maps to `AI-04` & `test_context_change_and_history`: preserves session context, excludes fish ingredients, offers alternate dishes.
5. *"Lên cho nhà 3 người bữa cơm khoảng 150k."* → Maps to `AI-05`: resolves meal bundle intent, scales servings to 3, budget $\le 150{,}000$ VND.
6. *"T chỉ cần mua thịt bò với cà chua thôi."* → Maps to `AI-06`: detects direct product intent, returns product cards for beef and tomato without cooking recipe overhead.

