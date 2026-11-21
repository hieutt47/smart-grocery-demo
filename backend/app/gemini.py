"""Google Gemini Fast Flash recommendation provider.

Integrates Gemini for natural language understanding and warm conversational tone
while preserving all deterministic backend pricing, SKU mapping, pack rounding,
and safety invariants. Optimized for ultra-low latency (<1.5s) using fast-path model pinning.
"""

import json
import logging
import urllib.error
import urllib.request
from typing import Any

from sqlalchemy import select

from .domain import normalize, product_data, recipe_data, recipe_quote
from .models import Ingredient, Product, Recipe, RecipeIngredient
from .schemas import RecipeSelection
from .seed import MEALS

logger = logging.getLogger("grocery.gemini")

# Ultra-fast models priority (tested and verified on live API key)
FAST_MODELS = [
    ("gemini-flash-lite-latest", "v1beta"),
    ("gemini-flash-latest", "v1beta"),
    ("gemini-2.5-flash-lite", "v1beta"),
    ("gemini-3.8-flash", "v1beta"),
    ("gemini-3-flash-preview", "v1beta"),
]

# Pin the active working model in memory for instant subsequent responses
ACTIVE_WORKING_MODEL: tuple[str, str] = ("gemini-flash-lite-latest", "v1beta")
LAST_STATUS: dict[str, Any] = {
    "status": "ready",
    "model": ACTIVE_WORKING_MODEL[0],
    "version": ACTIVE_WORKING_MODEL[1],
    "error": None,
}

SYSTEM_INSTRUCTION = """Bạn là trợ lý tư vấn ăn uống thông minh của Bữa Nhà — chuyên đồng hành cùng dân văn phòng trẻ và người bận rộn.
Nhiệm vụ của bạn là lắng nghe nhu cầu bữa trưa, bữa tối, ăn vặt hoặc nấu nhanh bằng tiếng Việt tự nhiên và gợi ý món ăn phù hợp nhất từ danh sách ứng viên được cung cấp.

Quy tắc phản hồi:
1. Trả về định dạng JSON thuần túy (JSON object) theo đúng schema được yêu cầu.
2. Giọng điệu thân thiện, trẻ trung, hiểu tâm lý dân văn phòng bận rộn.
3. BẮT BUỘC dùng chính xác mã ID trong danh sách ứng viên (hoặc danh sách mâm cơm) được cung cấp ở prompt cho `selected_ids`, không tự dịch hay bịa món ngoài danh sách.
4. ĐA DẠNG GỢI Ý: Kiểm tra danh sách `shown` trong ngữ cảnh hội thoại; TUYỆT ĐỐI ưu tiên chọn các món KHÁC với những món đã nằm trong `shown` (trừ khi người dùng hỏi đích danh món đó).
5. Trích xuất chính xác:
   - servings: số người ăn (số nguyên >= 1; giữ ngữ cảnh nếu là câu hỏi tiếp nối, mặc định 1–2 nếu không nhắc)
   - budget: ngân sách VND nếu câu hiện tại có nhắc (ví dụ: "100k" -> 100000, "50k" -> 50000; trả về null nếu người dùng chuyển sang chủ đề không giới hạn ngân sách)
   - minutes: thời gian nấu tối đa nếu có nhắc (ví dụ: 15 phút -> 15; "nhanh"/"mệt" -> 25; trả về null nếu không giới hạn)
   - excluded: danh sách mã nguyên liệu/sản phẩm khách không muốn ăn hoặc muốn đổi (ví dụ: "không thích cá" -> ["fish"], "tránh tôm" -> ["shrimp"])
   - intent: "dish" (gợi ý món lẻ), "meal" (gợi ý mâm cơm), "products" (chỉ tìm mua nguyên liệu thô), "general" (hỏi đáp chung)
   - selected_ids: danh sách 2-3 mã món ăn (recipe ID) hoặc mã mâm cơm (meal ID) phù hợp nhất và CHƯA có trong `shown`
   - selected_product_ids: danh sách mã sản phẩm nếu khách muốn mua lẻ (ví dụ ["beef", "tomato"])
   - lighter: boolean (true nếu khách yêu cầu nêm nhạt, ít mặn, thanh đạm, eat clean hơn)
   - message: lời nhắn tiếng Việt tự nhiên, ngắn gọn gửi đến người dùng, giải thích tại sao món này hợp với yêu cầu.
6. Nếu trong ngữ cảnh có `pantry` (gia vị sẵn có ở nhà), chi phí ứng viên đã trừ phần gia vị này.
"""


def build_dynamic_candidates(db, content: str, ctx: dict[str, Any], limit: int = 25) -> str:
    """SQL Pre-filter: filter 60+ recipes down to top candidate matches for Gemini."""
    text = normalize(content)
    exclusions = set(str(x) for x in ctx.get("excluded", []))
    pantry_set = set(str(x) for x in ctx.get("pantry", []))
    shown_set = set(str(x) for x in ctx.get("shown", []))
    servings = max(1, min(6, int(ctx.get("servings") or 2)))

    recipes = list(db.scalars(select(Recipe).order_by(Recipe.minutes, Recipe.id)))
    scored: list[tuple[int, int, str]] = []

    for r in recipes:
        ing_ids = list(
            db.scalars(select(RecipeIngredient.ingredient_id).where(RecipeIngredient.recipe_id == r.id))
        )
        if exclusions.intersection(ing_ids):
            continue
        if "fish" in exclusions and any(
            (ing := db.get(Ingredient, iid)) is not None and "fish" in ing.allergens for iid in ing_ids
        ):
            continue

        buy_ids = [i for i in ing_ids if i not in pantry_set] or ing_ids
        quote = recipe_quote(
            db,
            [RecipeSelection(recipe_id=r.id, servings=servings, ingredient_ids=buy_ids, variant_id=None)],
        )
        if quote["missing"]:
            continue

        est_total = quote["total"]
        score = 0
        if r.id not in shown_set:
            score += 50
        if normalize(r.name) in text or any(normalize(t) in text for t in r.tags):
            score += 30
        if (
            "eat clean" in text or "giam can" in text or "it dau" in text or "thanh dam" in text
        ) and "eat-clean" in r.tags:
            score += 35
        if ("nhanh" in text or "met" in text or "15" in text) and r.minutes <= 15:
            score += 25
        if ("com hop" in text or "mang di lam" in text) and "món mặn" in r.tags:
            score += 15
        if est_total <= 60000:
            score += 10

        tag_str = ", ".join(r.tags)
        line = f"- {r.id}: {r.name} ({r.minutes} phút, ~{est_total}đ, tags: {tag_str})"
        scored.append((-score, r.minutes, line))

    scored.sort(key=lambda x: (x[0], x[1]))
    top_recipes = "\n".join(item[2] for item in scored[:limit])
    meal_lines = "\n".join(f"- {m['id']}: {m['name']} ({' + '.join(m['recipe_ids'])})" for m in MEALS)
    return f"Danh sách món ứng viên đã lọc ({min(limit, len(scored))} món):\n{top_recipes}\n\nDanh mục mâm cơm:\n{meal_lines}"


def extract_json(raw: str) -> dict[str, Any]:
    text = raw.strip()
    if text.startswith("```"):
        first_newline = text.find("\n")
        if first_newline != -1:
            text = text[first_newline + 1 :]
        if text.endswith("```"):
            text = text[:-3].strip()
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        return json.loads(text[start : end + 1])
    return json.loads(text)


def call_gemini(
    api_key: str,
    model: str,
    prompt: str,
    context: dict[str, Any],
    candidates_text: str = "",
    timeout: int = 6,
) -> dict[str, Any] | None:
    global ACTIVE_WORKING_MODEL
    clean_key = api_key.strip().strip('"').strip("'")
    if not clean_key:
        return None

    payload = {
        "systemInstruction": {"parts": [{"text": SYSTEM_INSTRUCTION}]},
        "contents": [
            {
                "role": "user",
                "parts": [
                    {
                        "text": (
                            f"{candidates_text}\n\n"
                            f"Ngữ cảnh hội thoại trước đó: {json.dumps(context, ensure_ascii=False)}\n\n"
                            f"Tin nhắn người dùng: {prompt}"
                        )
                    }
                ],
            }
        ],
        "generationConfig": {"temperature": 0.55, "responseMimeType": "application/json"},
    }
    data = json.dumps(payload).encode("utf-8")
    headers = {"Content-Type": "application/json", "User-Agent": "BuaNha-Demo/1.0"}

    # Try pinned active working model first (instant 1-hop), followed by alternate fast flash models
    candidate_list = [ACTIVE_WORKING_MODEL]
    for m_cand in FAST_MODELS:
        if m_cand not in candidate_list:
            candidate_list.append(m_cand)

    for m, ver in candidate_list:
        url = f"https://generativelanguage.googleapis.com/{ver}/models/{m}:generateContent?key={clean_key}"
        req = urllib.request.Request(url, data=data, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                res_data = json.loads(resp.read().decode("utf-8"))
                text = res_data["candidates"][0]["content"]["parts"][0]["text"]
                parsed = extract_json(text)
                # Success: Pin this model for all future calls!
                ACTIVE_WORKING_MODEL = (m, ver)
                LAST_STATUS.update(
                    {
                        "status": "ok",
                        "model": m,
                        "version": ver,
                        "error": None,
                        "last_response_preview": parsed.get("message", "")[:100],
                    }
                )
                return parsed
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8", errors="ignore")
            logger.warning("Gemini API (%s/%s) HTTPError %d: %s", ver, m, e.code, err_body[:100])
            LAST_STATUS.update(
                {"status": "error", "model": m, "version": ver, "code": e.code, "error": err_body[:200]}
            )
            continue
        except Exception as e:
            logger.warning("Gemini API (%s/%s) failed (%s)", ver, m, e)
            LAST_STATUS.update({"status": "error", "model": m, "version": ver, "error": str(e)[:200]})
            continue

    return None


def resolve_recipe(db, raw_key: str) -> Recipe | None:
    key = str(raw_key).strip()
    r = db.get(Recipe, key)
    if r:
        return r
    norm = normalize(key)
    all_recipes = list(db.scalars(select(Recipe)))
    for candidate in all_recipes:
        if candidate.id == norm or normalize(candidate.name) == norm:
            return candidate
    for candidate in all_recipes:
        cand_norm = normalize(candidate.name)
        if norm in cand_norm or cand_norm in norm:
            return candidate
    return None


def resolve_meal(raw_key: str) -> dict[str, Any] | None:
    key = str(raw_key).strip()
    norm = normalize(key)
    for m in MEALS:
        if m["id"] == key or m["id"] == norm or normalize(m["name"]) == norm:
            return m
        if norm in normalize(m["name"]):
            return m
    return None


class GeminiProvider:
    """Combines Google Gemini Flash NLU with deterministic pricing and allergy safety."""

    def __init__(self, api_key: str, model: str = "gemini-flash-lite-latest"):
        self.api_key = api_key
        self.model = model
        from .assistant import RuleBasedProvider

        self.fallback = RuleBasedProvider()

    def recommend(self, db, content: str, context: dict) -> dict:
        text = normalize(content)
        ctx = {"servings": 2, "budget": None, "minutes": None, "excluded": [], "shown": [], **context}

        # Medical & Allergy invariant check: keep deterministic refusal
        if "di ung" in text or ctx.get("allergy_uncertain"):
            ctx["allergy_uncertain"] = True
            return {
                "mode": "gemini",
                "message": (
                    "Dữ liệu demo chưa đủ để xác nhận món phù hợp với dị ứng bạn nêu. "
                    "Mình không thể bảo đảm an toàn; bạn có thể xem thành phần sản phẩm. "
                    "Bắt đầu cuộc trò chuyện mới để thử nhu cầu khác."
                ),
                "suggestions": [],
                "products": [],
                "context": ctx,
            }

        # Build SQL Pre-filtered candidate list before calling Gemini
        candidates_text = build_dynamic_candidates(db, content, ctx, limit=25)
        llm_data = call_gemini(self.api_key, self.model, content, ctx, candidates_text=candidates_text)
        if not llm_data:
            res = self.fallback.recommend(db, content, context)
            if LAST_STATUS.get("error"):
                res["gemini_error"] = LAST_STATUS["error"]
            return res

        # Parse extracted constraints
        changing = "doi" in text or "khong thich" in text or "mon khac" in text
        if isinstance(llm_data.get("servings"), (int, float)) and llm_data["servings"] >= 1:
            ctx["servings"] = min(6, max(1, int(llm_data["servings"])))
        if "budget" in llm_data:
            if llm_data["budget"] is not None and isinstance(llm_data["budget"], (int, float)):
                ctx["budget"] = round(float(llm_data["budget"]))
            elif not changing:
                ctx["budget"] = None
        if "minutes" in llm_data:
            if llm_data["minutes"] is not None and isinstance(llm_data["minutes"], (int, float)):
                ctx["minutes"] = int(llm_data["minutes"])
            elif not changing:
                ctx["minutes"] = None
        if llm_data.get("lighter"):
            ctx["lighter"] = True

        new_excluded = llm_data.get("excluded", [])
        if isinstance(new_excluded, list):
            ctx["excluded"] = sorted(set(ctx.get("excluded", []) + [str(x) for x in new_excluded]))

        exclusions = set(ctx["excluded"])
        pantry_set = set(str(x) for x in ctx.get("pantry", []))
        intent = llm_data.get("intent", "dish")
        ai_message = llm_data.get("message", "").strip()

        result = {
            "mode": "gemini",
            "message": ai_message or "Dưới đây là gợi ý bữa cơm nhà vừa vặn nhất cho bạn:",
            "suggestions": [],
            "products": [],
            "context": ctx,
        }

        # Intent: direct raw products
        if intent == "products" and llm_data.get("selected_product_ids"):
            products = []
            for raw_pid in llm_data["selected_product_ids"]:
                p = db.get(Product, str(raw_pid).strip())
                if p and p.available and p.id not in exclusions:
                    products.append(product_data(p))
            if products:
                result["products"] = products
                return result

        # Intent: dish / meal suggestions
        selected_ids = llm_data.get("selected_ids", [])

        for raw_id in selected_ids:
            meal = resolve_meal(raw_id)
            if meal:
                key, title = meal["id"], meal["name"]
                if changing and key in ctx.get("shown", []):
                    continue
                dishes = [db.get(Recipe, rid) for rid in meal["recipe_ids"] if db.get(Recipe, rid)]
            else:
                recipe = resolve_recipe(db, raw_id)
                if not recipe:
                    continue
                key, title = recipe.id, recipe.name
                if changing and key in ctx.get("shown", []):
                    continue
                dishes = [recipe]

            duration = sum(d.minutes for d in dishes)
            if ctx["minutes"] is not None and duration > ctx["minutes"]:
                continue

            selections = []
            excluded = False
            for r in dishes:
                ids = list(
                    db.scalars(
                        select(RecipeIngredient.ingredient_id).where(RecipeIngredient.recipe_id == r.id)
                    )
                )
                if exclusions.intersection(ids):
                    excluded = True
                    break
                if "fish" in exclusions and any("fish" in db.get(Ingredient, i).allergens for i in ids):
                    excluded = True
                    break
                buy_ids = [i for i in ids if i not in pantry_set] or ids
                variant = f"{r.id}-nhat" if ctx.get("lighter") else None
                selections.append(
                    RecipeSelection(
                        recipe_id=r.id, servings=ctx["servings"], ingredient_ids=buy_ids, variant_id=variant
                    )
                )

            if excluded:
                continue

            quote = recipe_quote(db, selections)
            if quote["missing"] or (ctx["budget"] is not None and quote["total"] > ctx["budget"]):
                continue

            result["suggestions"].append(
                {
                    "id": key,
                    "name": title,
                    "recipes": [recipe_data(db, r) for r in dishes],
                    "selections": [s.model_dump() for s in selections],
                    "total": quote["total"],
                    "minutes": duration,
                    "servings": ctx["servings"],
                    "reason": "Nguyên liệu tươi sạch theo gói; bạn có thể bỏ bớt những gia vị đã có sẵn ở nhà.",
                }
            )

        if result["suggestions"]:
            ctx["shown"] = list(
                dict.fromkeys(ctx.get("shown", []) + [s["id"] for s in result["suggestions"]])
            )[-30:]
        else:
            # If candidate items could not satisfy constraints, get rule suggestions while keeping Gemini message
            fallback_res = self.fallback.recommend(db, content, context)
            result["suggestions"] = fallback_res["suggestions"]
            result["products"] = fallback_res["products"]
            if not result["message"]:
                result["message"] = fallback_res["message"]

        return result
