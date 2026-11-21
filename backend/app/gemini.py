"""Google Gemini Agentic Provider with Function Calling & Dynamic Recipe Adaptation.

Combines Gemini Function Calling (search_catalog_recipes, get_available_ingredients,
build_custom_recipe) with deterministic backend pricing, pack rounding, pantry
subtraction, and allergy/health guardrails. Falls back cleanly to RuleBasedProvider
on network error or API quota limits (HTTP 429).
"""

import hashlib
import json
import logging
import urllib.error
import urllib.request
from typing import Any

from sqlalchemy import select

from .domain import custom_recipe_quote, normalize, product_data, recipe_data, recipe_quote
from .models import Ingredient, Product, Recipe, RecipeIngredient
from .schemas import RecipeSelection
from .seed import MEALS

logger = logging.getLogger("grocery.gemini")

FAST_MODELS = [
    ("gemini-flash-lite-latest", "v1beta"),
    ("gemini-flash-latest", "v1beta"),
    ("gemini-2.5-flash-lite", "v1beta"),
    ("gemini-3.8-flash", "v1beta"),
    ("gemini-3-flash-preview", "v1beta"),
]

ACTIVE_WORKING_MODEL: tuple[str, str] = ("gemini-flash-lite-latest", "v1beta")
LAST_STATUS: dict[str, Any] = {
    "status": "ready",
    "model": ACTIVE_WORKING_MODEL[0],
    "version": ACTIVE_WORKING_MODEL[1],
    "error": None,
}

SYSTEM_INSTRUCTION = """Bạn là trợ lý tư vấn ăn uống thông minh và linh hoạt của Bữa Nhà — chuyên đồng hành cùng dân văn phòng trẻ và gia đình Việt.

Bạn có 3 công cụ (tools) kết nối trực tiếp với kho dữ liệu thật:
- `search_catalog_recipes`: Tìm kiếm sâu trong toàn bộ 60 công thức nấu ăn có sẵn (theo từ khóa, tag, thời gian, nguyên liệu tránh ăn).
- `get_available_ingredients`: Xem danh sách 48 nguyên liệu/sản phẩm thật đang có trong kho (kèm mã ID, đơn vị, giá, dị ứng).
- `build_custom_recipe`: Tự thiết kế một món ăn mới hoàn chỉnh CHỈ dùng các `ingredient_id` thật từ `get_available_ingredients` khi kho 60 món có sẵn không đáp ứng tốt yêu cầu (ví dụ: tủ lạnh chỉ còn vài nguyên liệu lẻ, bệnh lý tim mạch/dạ dày/tiểu đường, phụ nữ mang thai, hoặc chế độ ăn đặc biệt).

Nguyên tắc vận hành:
1. Nếu các món trong danh sách ứng viên sẵn có đã đáp ứng tốt nhu cầu phổ thông (ăn trưa, nấu nhanh, mâm cơm gia đình), hãy chọn trực tiếp mã ID có sẵn để phản hồi nhanh nhất.
2. Khi người dùng nêu tình huống đặc biệt (bệnh lý như tim mạch/huyết áp/dạ dày/tiểu đường, bà bầu, hoặc liệt kê nguyên liệu có sẵn trong tủ lạnh), hãy chủ động gọi `search_catalog_recipes` / `get_available_ingredients` và dùng `build_custom_recipe` nếu cần thiết kế món phù hợp (ví dụ: món hấp/luộc ít muối cho người tim mạch, món chín kỹ giàu sắt/folate cho bà bầu).
3. Nếu `intent` là `"meal"` (người dùng đòi combo/mâm cơm), `selected_ids` BẮT BUỘC chỉ chọn mã mâm cơm bắt đầu bằng `bua-`.
4. ĐA DẠNG GỢI Ý: Kiểm tra `shown` trong ngữ cảnh và ưu tiên chọn món CHƯA xuất hiện trong `shown`.
5. Kết quả cuối cùng PHẢI là một JSON object thuần túy (không bọc text thừa ngoài JSON) có cấu trúc:
{
  "servings": <int 1..6>,
  "budget": <int VND hoặc null>,
  "minutes": <int hoặc null>,
  "excluded": [<ingredient_id>],
  "intent": "dish" | "meal" | "products" | "general",
  "selected_ids": [<recipe_id hoặc meal_id hoặc custom_recipe_id từ build_custom_recipe>],
  "selected_product_ids": [<product_id nếu mua lẻ>],
  "lighter": <boolean>,
  "health_advisory": <string ngắn gọn lưu ý dinh dưỡng/chế biến nếu có yếu tố bệnh lý/thai kỳ, hoặc null>,
  "message": <lời nhắn tiếng Việt tự nhiên, giải thích lý do gợi ý>
}"""

GEMINI_TOOLS = [
    {
        "name": "search_catalog_recipes",
        "description": "Tìm kiếm công thức nấu ăn trong toàn bộ kho 60 món của Bữa Nhà theo từ khóa, thời gian, tag hoặc loại trừ nguyên liệu.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "query": {
                    "type": "STRING",
                    "description": "Từ khóa tên món hoặc nguyên liệu (vd: hap, luoc, uc ga, ca)",
                },
                "max_minutes": {"type": "INTEGER", "description": "Thời gian nấu tối đa (phút)"},
                "exclude_ingredients": {
                    "type": "ARRAY",
                    "items": {"type": "STRING"},
                    "description": "Danh sách mã nguyên liệu cần tránh (vd: ['fish', 'pork'])",
                },
                "required_tags": {
                    "type": "ARRAY",
                    "items": {"type": "STRING"},
                    "description": "Các tag cần có (vd: ['eat-clean', 'canh'])",
                },
            },
        },
    },
    {
        "name": "get_available_ingredients",
        "description": "Liệt kê các nguyên liệu/sản phẩm thật đang có trong kho để dùng khi thiết kế công thức mới.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "category": {
                    "type": "STRING",
                    "description": "Lọc theo nhóm (Rau củ, Thịt & cá, Trứng & đậu, Gạo & gia vị, Trái cây) hoặc để trống để lấy tất cả",
                }
            },
        },
    },
    {
        "name": "build_custom_recipe",
        "description": "Tự thiết kế và tính giá một món ăn mới cho 2 người từ các ingredient_id có thật trong kho.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "name": {"type": "STRING", "description": "Tên món ăn bằng tiếng Việt"},
                "minutes": {"type": "INTEGER", "description": "Thời gian nấu ước tính (phút)"},
                "emoji": {"type": "STRING", "description": "1 emoji đại diện món ăn"},
                "tags": {
                    "type": "ARRAY",
                    "items": {"type": "STRING"},
                    "description": "1-3 tag ngắn (vd: ['eat-clean', 'nhanh'])",
                },
                "ingredients": {
                    "type": "ARRAY",
                    "description": "Danh sách nguyên liệu cho khẩu phần 2 người",
                    "items": {
                        "type": "OBJECT",
                        "properties": {
                            "ingredient_id": {
                                "type": "STRING",
                                "description": "Mã ID thật từ get_available_ingredients",
                            },
                            "quantity": {
                                "type": "NUMBER",
                                "description": "Định lượng cho 2 người theo đúng đơn vị của nguyên liệu",
                            },
                        },
                        "required": ["ingredient_id", "quantity"],
                    },
                },
                "steps": {
                    "type": "ARRAY",
                    "items": {"type": "STRING"},
                    "description": "3-4 bước nấu ngắn gọn, rõ ràng",
                },
                "health_note": {
                    "type": "STRING",
                    "description": "Ghi chú chế biến phù hợp sức khỏe (nếu có)",
                },
            },
            "required": ["name", "minutes", "ingredients", "steps"],
        },
    },
]


def tool_search_catalog_recipes(
    db,
    query: str = "",
    max_minutes: int | None = None,
    exclude_ingredients: list[str] | None = None,
    required_tags: list[str] | None = None,
    pantry: list[str] | None = None,
    servings: int = 2,
    shown: list[str] | None = None,
) -> dict[str, Any]:
    """Deterministic SQLite search over all 60+ catalog recipes."""
    norm_q = normalize(query or "").strip()
    exclusions = set(str(x) for x in (exclude_ingredients or []))
    req_tags = [normalize(str(t)) for t in (required_tags or []) if str(t).strip()]
    pantry_set = set(str(x) for x in (pantry or []))
    shown_set = set(str(x) for x in (shown or []))
    safe_servings = max(1, min(6, int(servings or 2)))

    matches = []
    for r in db.scalars(select(Recipe).order_by(Recipe.minutes, Recipe.id)):
        if max_minutes is not None and r.minutes > int(max_minutes):
            continue
        norm_tags = [normalize(t) for t in r.tags]
        if req_tags and not all(any(rt in nt for nt in norm_tags) for rt in req_tags):
            continue
        ing_ids = list(
            db.scalars(select(RecipeIngredient.ingredient_id).where(RecipeIngredient.recipe_id == r.id))
        )
        if exclusions.intersection(ing_ids):
            continue
        if "fish" in exclusions and any(
            (ing := db.get(Ingredient, iid)) is not None and "fish" in ing.allergens for iid in ing_ids
        ):
            continue
        if norm_q:
            haystack = normalize(r.name + " " + r.description + " " + " ".join(r.tags))
            if not all(word in haystack for word in norm_q.split()):
                continue

        buy_ids = [i for i in ing_ids if i not in pantry_set] or ing_ids
        quote = recipe_quote(
            db,
            [
                RecipeSelection(
                    recipe_id=r.id, servings=safe_servings, ingredient_ids=buy_ids, variant_id=None
                )
            ],
        )
        if quote["missing"]:
            continue
        matches.append(
            {
                "id": r.id,
                "name": r.name,
                "minutes": r.minutes,
                "tags": r.tags,
                "ingredients": ing_ids,
                "estimated_total_vnd": quote["total"],
                "already_shown": r.id in shown_set,
            }
        )

    matches.sort(key=lambda item: (item["already_shown"], item["minutes"], item["estimated_total_vnd"]))
    return {"count": len(matches), "recipes": matches[:12]}


def tool_get_available_ingredients(db, category: str = "") -> dict[str, Any]:
    """Return authoritative inventory ingredients/products for AI custom recipe composition."""
    norm_cat = normalize(category or "").strip()
    items = []
    for p in db.scalars(select(Product).order_by(Product.category, Product.id)):
        if not p.available:
            continue
        if norm_cat and norm_cat not in normalize(p.category):
            continue
        ing = db.get(Ingredient, p.id)
        items.append(
            {
                "id": p.id,
                "name": p.name,
                "category": p.category,
                "unit": p.unit,
                "pack_size": p.pack_size,
                "price_vnd": p.price,
                "allergens": ing.allergens if ing else [],
            }
        )
    return {"count": len(items), "ingredients": items}


def tool_build_custom_recipe(
    db,
    name: str,
    minutes: int,
    ingredients: list[dict[str, Any]],
    steps: list[str],
    emoji: str = "🍽️",
    tags: list[str] | None = None,
    health_note: str = "",
    servings: int = 2,
    pantry: list[str] | None = None,
) -> dict[str, Any]:
    """Validate AI-proposed ingredients against SQLite and compute authoritative cost."""
    clean_name = str(name or "").strip()[:80]
    if not clean_name or not ingredients or not steps:
        return {"error": "Thiếu tên món, danh sách nguyên liệu hoặc các bước chế biến."}

    pantry_set = set(str(x) for x in (pantry or []))
    safe_servings = max(1, min(6, int(servings or 2)))
    safe_minutes = max(5, min(90, int(minutes or 20)))

    validated_lines = []
    recipe_ingredients = []
    seen_ids = set()
    for line in ingredients[:15]:
        iid = str(line.get("ingredient_id", "")).strip()
        qty = float(line.get("quantity", 0) or 0)
        if not iid or iid in seen_ids or qty <= 0:
            continue
        ing = db.get(Ingredient, iid)
        if not ing:
            return {
                "error": f"Mã nguyên liệu '{iid}' không tồn tại trong kho. Hãy gọi get_available_ingredients để lấy đúng ID."
            }
        seen_ids.add(iid)
        validated_lines.append({"ingredient_id": iid, "quantity": qty})
        recipe_ingredients.append({"id": iid, "name": ing.name, "quantity": round(qty, 2), "unit": ing.unit})

    if not validated_lines:
        return {"error": "Không có nguyên liệu hợp lệ nào trong đề xuất."}

    buy_lines = [x for x in validated_lines if x["ingredient_id"] not in pantry_set] or validated_lines
    quote = custom_recipe_quote(db, safe_servings, 2, buy_lines)
    if quote["missing"]:
        return {"error": "Một số nguyên liệu hiện chưa sẵn sàng trong danh mục mẫu."}

    slug_seed = json.dumps({"name": clean_name, "ingredients": validated_lines}, sort_keys=True)
    custom_id = f"custom-{hashlib.sha256(slug_seed.encode()).hexdigest()[:10]}"
    clean_tags = [str(t).strip()[:24] for t in (tags or ["AI thiết kế"]) if str(t).strip()][:4]

    recipe_obj = {
        "id": custom_id,
        "name": clean_name,
        "description": health_note.strip()
        or "Món ăn được AI thiết kế riêng theo nhu cầu của bạn từ nguyên liệu thật.",
        "minutes": safe_minutes,
        "servings": 2,
        "emoji": (str(emoji or "🍽️").strip() or "🍽️")[:4],
        "color": "green",
        "tags": clean_tags or ["AI thiết kế"],
        "source": "Công thức phối hợp bởi Trợ lý AI Bữa Nhà",
        "is_custom": True,
        "ingredients": recipe_ingredients,
        "steps": [str(s).strip() for s in steps if str(s).strip()][:8],
        "variants": [],
    }
    selection = {
        "recipe_id": custom_id,
        "servings": safe_servings,
        "ingredient_ids": [x["ingredient_id"] for x in buy_lines],
        "variant_id": None,
    }
    return {
        "status": "ok",
        "custom_recipe_id": custom_id,
        "estimated_total_vnd": quote["total"],
        "recipe": recipe_obj,
        "selection": selection,
    }


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
    return (
        f"Tổng kho Bữa Nhà hiện có {len(recipes)} công thức nấu ăn và {len(MEALS)} mâm cơm gia đình.\n"
        f"Danh sách món ứng viên đã lọc ({min(limit, len(scored))} món):\n{top_recipes}\n\n"
        f"Danh mục mâm cơm:\n{meal_lines}"
    )


def _execute_tool_call(
    db,
    name: str,
    args: dict[str, Any],
    ctx: dict[str, Any],
    custom_cache: dict[str, dict[str, Any]],
) -> dict[str, Any]:
    if name == "search_catalog_recipes":
        return tool_search_catalog_recipes(
            db,
            query=str(args.get("query", "")),
            max_minutes=args.get("max_minutes"),
            exclude_ingredients=args.get("exclude_ingredients") or ctx.get("excluded"),
            required_tags=args.get("required_tags"),
            pantry=ctx.get("pantry"),
            servings=int(ctx.get("servings") or 2),
            shown=ctx.get("shown"),
        )
    if name == "get_available_ingredients":
        return tool_get_available_ingredients(db, category=str(args.get("category", "")))
    if name == "build_custom_recipe":
        built = tool_build_custom_recipe(
            db,
            name=str(args.get("name", "")),
            minutes=int(args.get("minutes") or 20),
            emoji=str(args.get("emoji", "🍽️")),
            tags=args.get("tags"),
            ingredients=args.get("ingredients") or [],
            steps=args.get("steps") or [],
            health_note=str(args.get("health_note", "")),
            servings=int(ctx.get("servings") or 2),
            pantry=ctx.get("pantry"),
        )
        if built.get("status") == "ok":
            cid = built["custom_recipe_id"]
            custom_cache[cid] = built
            return {
                "status": "ok",
                "custom_recipe_id": cid,
                "estimated_total_vnd": built["estimated_total_vnd"],
            }
        return built
    return {"error": f"Tool '{name}' không tồn tại."}


def _post_gemini(url: str, payload: dict[str, Any], timeout: int) -> dict[str, Any]:
    data = json.dumps(payload).encode("utf-8")
    headers = {"Content-Type": "application/json", "User-Agent": "BuaNha-Demo/1.5"}
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def call_gemini(
    api_key: str,
    model: str,
    prompt: str,
    context: dict[str, Any],
    candidates_text: str = "",
    db=None,
    timeout: int = 7,
) -> dict[str, Any] | None:
    global ACTIVE_WORKING_MODEL
    clean_key = api_key.strip().strip('"').strip("'")
    if not clean_key:
        return None

    user_text = (
        f"{candidates_text}\n\n"
        f"Ngữ cảnh hội thoại trước đó: {json.dumps(context, ensure_ascii=False)}\n\n"
        f"Tin nhắn người dùng: {prompt}"
    )

    candidate_list = [ACTIVE_WORKING_MODEL]
    for m_cand in FAST_MODELS:
        if m_cand not in candidate_list:
            candidate_list.append(m_cand)

    for m, ver in candidate_list:
        url = f"https://generativelanguage.googleapis.com/{ver}/models/{m}:generateContent?key={clean_key}"
        contents: list[dict[str, Any]] = [{"role": "user", "parts": [{"text": user_text}]}]
        custom_cache: dict[str, dict[str, Any]] = {}

        # Run bounded agentic tool-calling loop when db is available; fallback to single-shot JSON on 400.
        use_tools = db is not None
        try:
            for _round in range(4 if use_tools else 1):
                payload: dict[str, Any] = {
                    "systemInstruction": {"parts": [{"text": SYSTEM_INSTRUCTION}]},
                    "contents": contents,
                    "generationConfig": {"temperature": 0.55},
                }
                if use_tools and _round < 3:
                    payload["tools"] = [{"functionDeclarations": GEMINI_TOOLS}]
                else:
                    payload["generationConfig"]["responseMimeType"] = "application/json"

                try:
                    res_data = _post_gemini(url, payload, timeout=timeout)
                except urllib.error.HTTPError as e:
                    err_body = e.read().decode("utf-8", errors="ignore")
                    if e.code == 400 and use_tools:
                        # Model endpoint rejected tool declarations; retry cleanly with JSON mode once.
                        use_tools = False
                        payload.pop("tools", None)
                        payload["generationConfig"]["responseMimeType"] = "application/json"
                        res_data = _post_gemini(url, payload, timeout=timeout)
                    else:
                        logger.warning("Gemini API (%s/%s) HTTPError %d: %s", ver, m, e.code, err_body[:100])
                        LAST_STATUS.update(
                            {
                                "status": "error",
                                "model": m,
                                "version": ver,
                                "code": e.code,
                                "error": err_body[:200],
                            }
                        )
                        raise

                cand = res_data.get("candidates", [{}])[0]
                model_content = cand.get("content", {})
                parts = model_content.get("parts", [])
                fn_calls = [p["functionCall"] for p in parts if "functionCall" in p]

                if fn_calls and db is not None and _round < 3:
                    contents.append({"role": "model", "parts": parts})
                    fn_responses = []
                    for fc in fn_calls:
                        fn_name = fc.get("name", "")
                        fn_args = fc.get("args") or {}
                        out = _execute_tool_call(db, fn_name, fn_args, context, custom_cache)
                        fn_responses.append({"functionResponse": {"name": fn_name, "response": out}})
                    contents.append({"role": "user", "parts": fn_responses})
                    continue

                raw_text = "".join(p.get("text", "") for p in parts)
                parsed = extract_json(raw_text)
                if custom_cache:
                    parsed["_custom_recipes"] = custom_cache
                ACTIVE_WORKING_MODEL = (m, ver)
                LAST_STATUS.update(
                    {
                        "status": "ok",
                        "model": m,
                        "version": ver,
                        "error": None,
                        "last_response_preview": str(parsed.get("message", ""))[:100],
                    }
                )
                return parsed
        except urllib.error.HTTPError:
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
    """Combines Google Gemini Agentic Tool Use with deterministic pricing and safety."""

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
                "health_advisory": None,
                "context": ctx,
            }

        candidates_text = build_dynamic_candidates(db, content, ctx, limit=25)
        llm_data = call_gemini(self.api_key, self.model, content, ctx, candidates_text=candidates_text, db=db)
        if not llm_data:
            res = self.fallback.recommend(db, content, context)
            if LAST_STATUS.get("error"):
                res["gemini_error"] = LAST_STATUS["error"]
            return res

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
        if any(kw in text for kw in ("mam com", "combo", "ca bua", "nhieu mon")):
            intent = "meal"
        ai_message = str(llm_data.get("message", "")).strip()
        raw_advisory = llm_data.get("health_advisory")
        health_advisory = str(raw_advisory).strip() if raw_advisory else None

        result = {
            "mode": "gemini",
            "message": ai_message or "Dưới đây là gợi ý bữa cơm nhà vừa vặn nhất cho bạn:",
            "suggestions": [],
            "products": [],
            "health_advisory": health_advisory,
            "context": ctx,
        }

        if intent == "products" and llm_data.get("selected_product_ids"):
            products = []
            for raw_pid in llm_data["selected_product_ids"]:
                p = db.get(Product, str(raw_pid).strip())
                if p and p.available and p.id not in exclusions:
                    products.append(product_data(p))
            if products:
                result["products"] = products
                return result

        custom_cache: dict[str, dict[str, Any]] = llm_data.get("_custom_recipes") or {}
        selected_ids = llm_data.get("selected_ids", [])

        for raw_id in selected_ids:
            sid = str(raw_id).strip()
            if sid in custom_cache:
                built = custom_cache[sid]
                custom_recipe = built["recipe"]
                result["suggestions"].append(
                    {
                        "id": sid,
                        "name": custom_recipe["name"],
                        "recipes": [custom_recipe],
                        "selections": [built["selection"]],
                        "total": built["estimated_total_vnd"],
                        "minutes": custom_recipe["minutes"],
                        "servings": ctx["servings"],
                        "reason": custom_recipe["description"],
                    }
                )
                continue

            meal = resolve_meal(sid)
            if meal:
                key, title = meal["id"], meal["name"]
                if changing and key in ctx.get("shown", []):
                    continue
                dishes = [db.get(Recipe, rid) for rid in meal["recipe_ids"] if db.get(Recipe, rid)]
            else:
                recipe = resolve_recipe(db, sid)
                if not recipe:
                    continue
                key, title = recipe.id, recipe.name
                if changing and key in ctx.get("shown", []):
                    continue
                dishes = [recipe]

            duration = sum(d.minutes for d in dishes)
            if intent != "meal" and ctx["minutes"] is not None and duration > ctx["minutes"]:
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

        # Guarantee custom recipes created during tool calling are surfaced if Gemini omitted IDs
        if not result["suggestions"] and custom_cache:
            for sid, built in list(custom_cache.items())[:3]:
                custom_recipe = built["recipe"]
                result["suggestions"].append(
                    {
                        "id": sid,
                        "name": custom_recipe["name"],
                        "recipes": [custom_recipe],
                        "selections": [built["selection"]],
                        "total": built["estimated_total_vnd"],
                        "minutes": custom_recipe["minutes"],
                        "servings": ctx["servings"],
                        "reason": custom_recipe["description"],
                    }
                )

        if not result["suggestions"] and intent == "meal":
            for meal in MEALS:
                dishes = [db.get(Recipe, rid) for rid in meal["recipe_ids"] if db.get(Recipe, rid)]
                if not dishes:
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
                    buy_ids = [i for i in ids if i not in pantry_set] or ids
                    selections.append(
                        RecipeSelection(
                            recipe_id=r.id,
                            servings=ctx["servings"],
                            ingredient_ids=buy_ids,
                            variant_id=f"{r.id}-nhat" if ctx.get("lighter") else None,
                        )
                    )
                if excluded:
                    continue
                quote = recipe_quote(db, selections)
                if quote["missing"]:
                    continue
                result["suggestions"].append(
                    {
                        "id": meal["id"],
                        "name": meal["name"],
                        "recipes": [recipe_data(db, r) for r in dishes],
                        "selections": [s.model_dump() for s in selections],
                        "total": quote["total"],
                        "minutes": sum(d.minutes for d in dishes),
                        "servings": ctx["servings"],
                        "reason": "Mâm cơm trọn gói đủ món mặn, rau/canh cân bằng cho bữa ăn.",
                    }
                )
                if len(result["suggestions"]) == 3:
                    break

        if result["suggestions"]:
            ctx["shown"] = list(
                dict.fromkeys(ctx.get("shown", []) + [s["id"] for s in result["suggestions"]])
            )[-30:]
        else:
            fallback_res = self.fallback.recommend(db, content, context)
            result["suggestions"] = fallback_res["suggestions"]
            result["products"] = fallback_res["products"]
            if not result["message"]:
                result["message"] = fallback_res["message"]

        return result
