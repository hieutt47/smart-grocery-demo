"""Google Gemini 2.0 Flash recommendation provider.

Integrates Gemini for natural language understanding and warm conversational tone
while preserving all deterministic backend pricing, SKU mapping, pack rounding,
and safety invariants. Seamlessly falls back to RuleBasedProvider if the key
is not set, network fails, or constraints cannot be met.
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

LAST_STATUS: dict[str, Any] = {"status": "init", "error": None}

SYSTEM_INSTRUCTION = """Bạn là trợ lý tư vấn món ăn thông minh của Bữa Nhà (AI Smart Grocery & Robot Delivery).
Nhiệm vụ của bạn là lắng nghe nhu cầu bữa ăn của cư dân chung cư bằng tiếng Việt tự nhiên và gợi ý món ăn phù hợp nhất từ danh mục món ăn và sản phẩm có sẵn trong cửa hàng.

Danh mục 12 món ăn có sẵn:
- ga-rang-gung: Gà rang gừng (30 phút, món mặn, nguyên liệu: thịt gà, gừng, hành lá, nước mắm, dầu ăn)
- bo-xao-ca-chua: Bò xào cà chua (20 phút, món mặn nhanh, nguyên liệu: thịt bò, cà chua, tỏi, nước tương, dầu ăn)
- trung-chien-hanh: Trứng chiên hành (10 phút, nhanh tiết kiệm, nguyên liệu: trứng gà, hành lá, dầu ăn, muối)
- canh-cai-dau-hu: Canh cải đậu hũ (15 phút, canh thanh mát nhanh, nguyên liệu: rau cải, đậu hũ, gừng, muối)
- dau-hu-sot-ca: Đậu hũ sốt cà chua (20 phút, món mặn thanh đạm, nguyên liệu: đậu hũ, cà chua, hành lá, dầu ăn, muối)
- ca-thu-kho: Cá thu kho gừng (35 phút, món mặn đậm đà, nguyên liệu: cá thu, gừng, nước mắm, đường, dầu ăn)
- canh-bi-tom: Canh bí đỏ nấu tôm (25 phút, canh ngọt bùi, nguyên liệu: bí đỏ, tôm, hành lá, muối)
- rau-muong-xao: Rau muống xào tỏi (15 phút, món rau nhanh giòn, nguyên liệu: rau muống, tỏi, dầu ăn, muối)
- thit-rang: Thịt heo rang gừng (25 phút, món mặn cơm nhà, nguyên liệu: thịt heo, gừng, nước mắm, đường, dầu ăn)
- canh-ca-trung: Canh cà chua trứng (15 phút, canh thanh nhẹ nhanh, nguyên liệu: cà chua, trứng gà, hành lá, dầu ăn, muối)
- salad-dua-leo: Salad dưa leo cà chua (10 phút, món thanh mát ăn sống, nguyên liệu: dưa leo, cà chua, xà lách, chanh, dầu ăn, muối)
- mi-xao-rau: Mì xào rau củ (20 phút, món ăn nhanh tiện lợi, nguyên liệu: mì sợi, cà rốt, rau cải, nấm, dầu ăn, nước tương)

Danh mục 3 mâm cơm gia đình:
- bua-nhanh: Bữa cơm nhẹ nhàng (gồm trung-chien-hanh + canh-cai-dau-hu, khoảng 25 phút)
- bua-gia-dinh: Bữa nhà ấm áp (gồm thit-rang + rau-muong-xao + canh-ca-trung, khoảng 55 phút)
- bua-rau: Bữa nhiều rau thanh đạm (gồm dau-hu-sot-ca + canh-cai-dau-hu, khoảng 35 phút)

Danh mục 30 sản phẩm thô (chỉ khi khách muốn mua đồ lẻ, không nấu theo công thức):
chicken (Thịt gà), beef (Thịt bò), pork (Thịt heo), fish (Cá thu), shrimp (Tôm), eggs (Trứng gà), tofu (Đậu hũ), tomato (Cà chua), greens (Rau cải), spinach (Rau muống), ginger (Gừng), garlic (Tỏi), onion (Hành lá), carrot (Cà rốt), potato (Khoai tây), pumpkin (Bí đỏ), cucumber (Dưa leo), lettuce (Xà lách), mushroom (Nấm), lime (Chanh), rice (Gạo thơm), noodles (Mì sợi), oil (Dầu ăn), fish-sauce (Nước mắm), soy-sauce (Nước tương), salt (Muối), sugar (Đường), pepper (Tiêu), banana (Chuối), orange (Cam).

Quy tắc phản hồi:
1. Trả về định dạng JSON thuần túy (JSON object) theo đúng schema được yêu cầu.
2. Giọng điệu thân thiện, chu đáo, hiểu tâm lý người nội trợ/người đi làm về bận rộn.
3. BẮT BUỘC dùng chính xác mã ID trong danh sách trên cho selected_ids (ví dụ: 'ga-rang-gung', 'bo-xao-ca-chua', 'bua-nhanh'), không tự dịch hay bịa món ngoài danh mục.
4. Trích xuất chính xác:
   - servings: số người ăn (1 đến 6, giữ nguyên ngữ cảnh trước đó hoặc mặc định 2)
   - budget: ngân sách VND nếu có (ví dụ: "100k" -> 100000, "150 nghìn" -> 150000; null nếu không nhắc)
   - minutes: thời gian nấu tối đa nếu khách yêu cầu nhanh (ví dụ: 20 phút -> 20; "nhanh"/"mệt" -> 30; null nếu không giới hạn)
   - excluded: danh sách mã nguyên liệu/sản phẩm khách không muốn ăn hoặc muốn đổi (ví dụ: "không thích cá" -> ["fish"], "tránh tôm" -> ["shrimp"])
   - intent: "dish" (gợi ý món lẻ), "meal" (gợi ý mâm cơm), "products" (chỉ tìm mua nguyên liệu thô), "general" (hỏi đáp chung)
   - selected_ids: danh sách 1-3 mã món ăn (recipe ID) hoặc mã mâm cơm (meal ID) phù hợp nhất với yêu cầu
   - selected_product_ids: danh sách mã sản phẩm nếu khách muốn mua lẻ (ví dụ ["beef", "tomato"])
   - lighter: boolean (true nếu khách yêu cầu nêm nhạt, ít mặn, thanh đạm hơn)
   - message: lời nhắn tiếng Việt tự nhiên, ấm áp gửi đến người dùng, giải thích ngắn gọn tại sao món này lại hợp với mong muốn của họ.
5. Nếu trong ngữ cảnh có `pantry` (danh sách gia vị/nguyên liệu khách đã có sẵn ở nhà như dầu ăn, nước mắm, muối, đường...), hãy lưu ý điều này và nhắn nhủ rằng khách chỉ cần mua các nguyên liệu chính còn thiếu, giúp tiết kiệm chi phí!
"""


DISCOVERED_CONFIG: dict[str, Any] = {"model": None, "version": None, "models": []}


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


def discover_model_and_version(
    api_key: str, preferred: str = "gemini-2.0-flash", timeout: int = 8
) -> tuple[str, str] | None:
    clean_key = api_key.strip().strip('"').strip("'")
    if not clean_key:
        return None
    for ver in ["v1beta", "v1"]:
        url = f"https://generativelanguage.googleapis.com/{ver}/models?key={clean_key}"
        req = urllib.request.Request(url, headers={"User-Agent": "BuaNha-Demo/1.0"})
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                models = [
                    m["name"].removeprefix("models/")
                    for m in data.get("models", [])
                    if "generateContent" in m.get("supportedGenerationMethods", [])
                ]
                if models:
                    logger.info("Discovered Gemini models via %s: %s", ver, models)
                    chosen = None
                    if "gemini-3.8-flash" in models:
                        chosen = "gemini-3.8-flash"
                    elif "gemini-flash-lite-latest" in models:
                        chosen = "gemini-flash-lite-latest"
                    elif "gemini-flash-latest" in models:
                        chosen = "gemini-flash-latest"
                    elif preferred in models:
                        chosen = preferred
                    elif any("flash-lite" in m for m in models):
                        chosen = next(m for m in models if "flash-lite" in m)
                    elif any("flash" in m for m in models):
                        chosen = next(m for m in models if "flash" in m)
                    elif any("gemini" in m for m in models):
                        chosen = next(m for m in models if "gemini" in m)
                    else:
                        chosen = models[0]

                    DISCOVERED_CONFIG.update({"model": chosen, "version": ver, "models": models})
                    LAST_STATUS.update(
                        {
                            "status": "ready",
                            "model": chosen,
                            "version": ver,
                            "available_models": models[:12],
                            "error": None,
                        }
                    )
                    return chosen, ver
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8", errors="ignore")
            logger.warning("Discover models (%s) HTTPError %d: %s", ver, e.code, err_body)
            LAST_STATUS.update({"status": "error", "code": e.code, "error": err_body[:300]})
        except Exception as e:
            logger.warning("Discover models (%s) failed: %s", ver, e)
            LAST_STATUS.update({"status": "error", "error": str(e)[:300]})
    return None


def ensure_discovery(api_key: str, preferred: str = "gemini-2.0-flash") -> tuple[str, str] | None:
    if DISCOVERED_CONFIG.get("model") and DISCOVERED_CONFIG.get("version"):
        return DISCOVERED_CONFIG["model"], DISCOVERED_CONFIG["version"]
    return discover_model_and_version(api_key, preferred)


def call_gemini(
    api_key: str, model: str, prompt: str, context: dict[str, Any], timeout: int = 15
) -> dict[str, Any] | None:
    clean_key = api_key.strip().strip('"').strip("'")
    if not clean_key:
        return None

    discovered = ensure_discovery(clean_key, model)
    target_model = discovered[0] if discovered else model
    target_version = discovered[1] if discovered else "v1beta"

    known_models = DISCOVERED_CONFIG.get("models", [])
    candidates = [(target_model, target_version)]
    for km in known_models:
        if (km, target_version) not in candidates:
            candidates.append((km, target_version))

    for alt_model in [
        "gemini-flash-lite-latest",
        "gemini-flash-latest",
        "gemini-3.8-flash",
        "gemini-2.5-flash-lite",
        "gemini-2.5-flash",
    ]:
        for alt_ver in ["v1beta", "v1"]:
            if (alt_model, alt_ver) not in candidates:
                candidates.append((alt_model, alt_ver))

    headers = {"Content-Type": "application/json", "User-Agent": "BuaNha-Demo/1.0"}
    LAST_STATUS["attempt_errors"] = []

    for m, ver in candidates:
        payloads = [
            {
                "systemInstruction": {"parts": [{"text": SYSTEM_INSTRUCTION}]},
                "contents": [
                    {
                        "role": "user",
                        "parts": [
                            {
                                "text": f"Ngữ cảnh hội thoại trước đó: {json.dumps(context, ensure_ascii=False)}\n\nTin nhắn người dùng: {prompt}"
                            }
                        ],
                    }
                ],
                "generationConfig": {"temperature": 0.2, "responseMimeType": "application/json"},
            },
            {
                "contents": [
                    {
                        "role": "user",
                        "parts": [
                            {
                                "text": f"{SYSTEM_INSTRUCTION}\n\nNgữ cảnh trước: {json.dumps(context, ensure_ascii=False)}\n\nTin nhắn: {prompt}\n\nTrả lời bằng JSON:"
                            }
                        ],
                    }
                ],
                "generationConfig": {"temperature": 0.2},
            },
        ]

        for p in payloads:
            url = (
                f"https://generativelanguage.googleapis.com/{ver}/models/{m}:generateContent?key={clean_key}"
            )
            req = urllib.request.Request(
                url, data=json.dumps(p).encode("utf-8"), headers=headers, method="POST"
            )
            try:
                with urllib.request.urlopen(req, timeout=timeout) as resp:
                    res_data = json.loads(resp.read().decode("utf-8"))
                    text = res_data["candidates"][0]["content"]["parts"][0]["text"]
                    parsed = extract_json(text)
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
                logger.warning("Gemini API (%s/%s) HTTPError %d: %s", ver, m, e.code, err_body)
                LAST_STATUS["attempt_errors"].append(
                    {"model": m, "version": ver, "code": e.code, "error": err_body[:200]}
                )
                LAST_STATUS.update(
                    {"status": "error", "model": m, "version": ver, "code": e.code, "error": err_body[:300]}
                )
                continue
            except Exception as e:
                logger.warning("Gemini API (%s/%s) failed (%s)", ver, m, e)
                LAST_STATUS["attempt_errors"].append({"model": m, "version": ver, "error": str(e)[:200]})
                LAST_STATUS.update({"status": "error", "model": m, "version": ver, "error": str(e)[:300]})
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
    """Combines Google Gemini 2.0 Flash NLU with deterministic pricing and allergy safety."""

    def __init__(self, api_key: str, model: str = "gemini-2.0-flash"):
        self.api_key = api_key
        self.model = model
        # Import lazily to avoid circular import
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

        # Call Gemini model
        llm_data = call_gemini(self.api_key, self.model, content, ctx)
        if not llm_data:
            res = self.fallback.recommend(db, content, context)
            if LAST_STATUS.get("error"):
                res["gemini_error"] = LAST_STATUS["error"]
            return res

        # Parse extracted constraints
        if isinstance(llm_data.get("servings"), int) and 1 <= llm_data["servings"] <= 6:
            ctx["servings"] = llm_data["servings"]
        if llm_data.get("budget") is not None and isinstance(llm_data["budget"], (int, float)):
            ctx["budget"] = round(float(llm_data["budget"]))
        if llm_data.get("minutes") is not None and isinstance(llm_data["minutes"], (int, float)):
            ctx["minutes"] = int(llm_data["minutes"])
        if llm_data.get("lighter"):
            ctx["lighter"] = True

        new_excluded = llm_data.get("excluded", [])
        if isinstance(new_excluded, list):
            ctx["excluded"] = sorted(set(ctx.get("excluded", []) + [str(x) for x in new_excluded]))

        exclusions = set(ctx["excluded"])
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
        changing = "doi" in text or "khong thich" in text or "mon khac" in text

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
                variant = f"{r.id}-nhat" if ctx.get("lighter") else None
                selections.append(
                    RecipeSelection(
                        recipe_id=r.id, servings=ctx["servings"], ingredient_ids=ids, variant_id=variant
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
