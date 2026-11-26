"""Google Gemini Agentic Provider with Dual Memory, 4 Tools & Allergen-aware Filtering."""

import hashlib
import json
import logging
import time
import urllib.error
import urllib.request
from typing import Any

from sqlalchemy import select

from .domain import custom_recipe_quote, normalize, product_data, recipe_data, recipe_quote
from .lunch_data import INGREDIENT_KCAL_PER_UNIT, OFFICE_LUNCH_OPTIONS, estimate_recipe_kcal
from .models import CustomRecipe, Ingredient, Product, Recipe, RecipeIngredient
from .schemas import RecipeSelection
from .seed import MEALS

logger = logging.getLogger("grocery.gemini")

FAST_MODELS = [
    ("gemini-flash-latest", "v1beta"),
    ("gemini-flash-lite-latest", "v1beta"),
    ("gemini-3-flash-preview", "v1beta"),
]

ACTIVE_WORKING_MODEL: tuple[str, str] = ("gemini-flash-latest", "v1beta")
LAST_STATUS: dict[str, Any] = {
    "status": "ready",
    "model": ACTIVE_WORKING_MODEL[0],
    "version": ACTIVE_WORKING_MODEL[1],
    "error": None,
}

KNOWN_ALLERGEN_KEYWORDS: dict[str, list[str]] = {
    "shellfish": ["tom", "hai san", "tep", "cua", "ghe", "so", "oc", "dau hao"],
    "fish": ["ca", "ca thu", "ca basa", "nuoc mam"],
    "egg": ["trung", "trung ga", "mi soi"],
    "soy": ["dau nanh", "dau hu", "dau phu", "nuoc tuong", "xi dau"],
    "wheat": ["lua mi", "bot mi", "gluten"],
    "sesame": ["me", "vung", "dau me"],
}

UNTRACKED_ALLERGEN_KEYWORDS = ["dau phong", "lac", "hat dieu", "oc cho", "hanh nhan", "sua bo"]

ALLERGEN_LABELS: dict[str, str] = {
    "shellfish": "Tôm / Hải sản",
    "fish": "Cá / Nước mắm",
    "egg": "Trứng",
    "soy": "Đậu nành / Đậu hũ",
    "wheat": "Lúa mì",
    "sesame": "Mè / Vừng",
}

PERSONA_DESCRIPTIONS: dict[str, str] = {
    "office_busy": "Dân văn phòng bận rộn (ưu tiên nấu siêu tốc <= 15 phút, cơm hộp mang đi làm, trưa ăn ngoài tỉnh táo)",
    "fit_eatclean": "Eat Clean & Giữ dáng / Tập luyện (ưu tiên giàu đạm, ít dầu mỡ, kiểm soát <= 380 kcal/phần)",
    "student_saver": "Sống 1 mình / Ăn ngon tiết kiệm (ưu tiên chi phí < 50.000đ, nguyên liệu tối giản, dễ nấu 1-2 người)",
    "family_care": "Chăm sóc Gia đình & Sức khỏe (ưu tiên mâm cơm đủ chất, hấp/luộc thanh đạm, ít muối cho người lớn tuổi/tim mạch/bà bầu)",
}

SYSTEM_INSTRUCTION = """Bạn là trợ lý tư vấn ăn uống thông minh và linh hoạt của Bữa Nhà — chuyên đồng hành cùng dân văn phòng trẻ và gia đình Việt.

Bạn có 4 công cụ (tools) kết nối trực tiếp với kho dữ liệu thật:
1. `search_catalog_recipes`: Tìm kiếm trong kho 60 công thức nấu ăn có sẵn (tự động loại trừ món dị ứng và món user không thích).
2. `get_available_ingredients`: Xem danh sách 48 nguyên liệu/sản phẩm thật đang có trong kho (kèm giá, đơn vị, kcal/đơn vị, dị ứng).
3. `build_custom_recipe`: Tự thiết kế một món ăn mới hoàn chỉnh CHỈ dùng `ingredient_id` thật từ `get_available_ingredients` khi kho 60 món chưa đáp ứng tốt (vd: tủ lạnh chỉ còn vài nguyên liệu lẻ, bệnh lý tim mạch/dạ dày/tiểu đường, phụ nữ mang thai, hoặc chế độ ăn đặc biệt).
4. `search_office_lunch`: Tìm kiếm gợi ý **ăn trưa ngoài quán / đặt đồ văn phòng** (20 lựa chọn quen thuộc với giá, calo, tag nhẹ bụng/không buồn ngủ).

Nguyên tắc vận hành:
1. PHẢI đọc kỹ `TRÍ NHỚ DÀI HẠN (memory)`, `HỒ SƠ CÁ NHÂN HÓA (taste_profile)` và `Lịch sử hội thoại` để hiểu đúng đối tượng người dùng (Dân văn phòng bận rộn, Eat Clean giữ dáng, Tiết kiệm, hay Chăm sóc gia đình/bệnh lý) và chủ động gợi ý sát gu nhất ngay cả khi người dùng chỉ hỏi ngắn gọn như "Hôm nay ăn gì?".
2. Nếu người dùng hỏi **kiến thức dinh dưỡng, mẹo nấu ăn, hỏi tại sao, hoặc trò chuyện tư vấn không yêu cầu chọn món** (vd: "Đau tim nên kiêng gì?", "Cách luộc ức gà không khô?"), hãy đặt `intent = "general"`, `selected_ids = []` và trả lời phân tích sâu sắc, chi tiết, dễ hiểu trong `message`.
3. Nếu người dùng hỏi **ăn trưa ngoài / đi làm lười nấu / đặt cơm văn phòng**, đặt `intent = "office_lunch"`, gọi `search_office_lunch` và điền `selected_lunch_ids`.
4. Nếu nhu cầu nấu ăn khớp với kho 60 món, chọn 2-3 mã ID đa dạng; khi gặp tình huống đặc thù (tủ lạnh còn đồ lẻ, bệnh lý, thai kỳ), gọi `get_available_ingredients` rồi `build_custom_recipe`.
5. Nếu `intent = "meal"` (combo mâm cơm), `selected_ids` BẮT BUỘC chỉ chọn mã mâm cơm bắt đầu bằng `bua-`.
6. ĐA DẠNG GỢI Ý: Kiểm tra `shown` và ưu tiên chọn món CHƯA xuất hiện trong `shown`.
7. Cá nhân hóa lời giải thích qua trường `reasons`: Với mỗi ID trong `selected_ids`, hãy viết 1 câu ngắn gọn giải thích tại sao món đó lại hợp với đối tượng/khẩu vị/yêu cầu của người dùng.
8. Kết quả cuối cùng PHẢI là JSON object thuần túy:
{
  "servings": <int 1..6>,
  "budget": <int VND hoặc null nếu câu hiện tại không giới hạn>,
  "minutes": <int hoặc null nếu câu hiện tại không giới hạn>,
  "excluded": [<ingredient_id>],
  "intent": "dish" | "meal" | "office_lunch" | "products" | "general",
  "selected_ids": [<recipe_id hoặc meal_id hoặc custom_recipe_id>],
  "selected_lunch_ids": [<lunch_id nếu intent là office_lunch>],
  "selected_product_ids": [<product_id nếu mua lẻ>],
  "reasons": {"<id>": "<lý do cá nhân hóa ngắn gọn riêng cho món này>"},
  "lighter": <boolean>,
  "health_advisory": <string ngắn gọn lưu ý dinh dưỡng/chế biến nếu có bệnh lý, thai kỳ hoặc dị ứng, hoặc null>,
  "memory_updates": {
    "add": {"health_conditions": [], "pregnancy": false, "allergies": [], "dislikes": [], "diet_goals": [], "fridge_items": []},
    "remove": {"health_conditions": [], "pregnancy": false, "allergies": [], "dislikes": [], "diet_goals": [], "fridge_items": []}
  },
  "message": <lời nhắn tiếng Việt tự nhiên, thông minh, phân tích rõ lý do gợi ý theo đúng gu của người dùng>
}"""

GEMINI_TOOLS = [
    {
        "name": "search_catalog_recipes",
        "description": "Tìm kiếm công thức nấu ăn trong toàn bộ kho 60 món của Bữa Nhà theo từ khóa, thời gian, tag hoặc loại trừ nguyên liệu.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "query": {"type": "STRING", "description": "Từ khóa tên món hoặc nguyên liệu"},
                "max_minutes": {"type": "INTEGER", "description": "Thời gian nấu tối đa (phút)"},
                "exclude_ingredients": {
                    "type": "ARRAY",
                    "items": {"type": "STRING"},
                    "description": "Danh sách mã nguyên liệu cần tránh",
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
        "description": "Liệt kê 48 nguyên liệu/sản phẩm thật đang có trong kho kèm đơn vị, giá, calo và chất dị ứng.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "category": {
                    "type": "STRING",
                    "description": "Nhóm nguyên liệu hoặc để trống để lấy tất cả",
                }
            },
        },
    },
    {
        "name": "build_custom_recipe",
        "description": "Tự thiết kế và lưu một món ăn mới cho 2 người từ các ingredient_id thật trong kho.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "name": {"type": "STRING", "description": "Tên món ăn bằng tiếng Việt"},
                "minutes": {"type": "INTEGER", "description": "Thời gian nấu ước tính (phút)"},
                "emoji": {"type": "STRING", "description": "1 emoji đại diện món ăn"},
                "tags": {"type": "ARRAY", "items": {"type": "STRING"}, "description": "1-3 tag ngắn"},
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
                            "quantity": {"type": "NUMBER", "description": "Định lượng cho 2 người"},
                        },
                        "required": ["ingredient_id", "quantity"],
                    },
                },
                "steps": {
                    "type": "ARRAY",
                    "items": {"type": "STRING"},
                    "description": "3-4 bước nấu ngắn gọn",
                },
                "health_note": {"type": "STRING", "description": "Ghi chú chế biến phù hợp sức khỏe"},
            },
            "required": ["name", "minutes", "ingredients", "steps"],
        },
    },
    {
        "name": "search_office_lunch",
        "description": "Tìm món ăn trưa văn phòng (ăn ngoài / đặt đồ) theo từ khóa, ngân sách tối đa, calo tối đa hoặc eat clean.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "query": {"type": "STRING", "description": "Từ khóa (vd: bun, com, salad, nhe bung, nhom)"},
                "max_price": {"type": "INTEGER", "description": "Ngân sách tối đa VNĐ (vd: 55000)"},
                "max_kcal": {"type": "INTEGER", "description": "Calo tối đa mỗi phần (vd: 450)"},
                "eat_clean_only": {"type": "BOOLEAN", "description": "Chỉ lọc món eat clean / nhẹ bụng"},
            },
        },
    },
]


def default_memory() -> dict[str, Any]:
    return {
        "health_conditions": [],
        "pregnancy": False,
        "allergies": [],
        "dislikes": [],
        "diet_goals": [],
        "fridge_items": [],
    }


def normalize_memory(raw: dict[str, Any] | None) -> dict[str, Any]:
    mem = default_memory()
    if not isinstance(raw, dict):
        return mem
    for key in ("health_conditions", "allergies", "dislikes", "diet_goals", "fridge_items"):
        vals = raw.get(key) or []
        if isinstance(vals, list):
            mem[key] = list(dict.fromkeys(str(x).strip() for x in vals if str(x).strip()))[:15]
    mem["pregnancy"] = bool(raw.get("pregnancy"))
    return mem


def merge_memory(memory: dict[str, Any], updates: dict[str, Any] | None) -> dict[str, Any]:
    mem = normalize_memory(memory)
    if not isinstance(updates, dict):
        return mem
    add_block = updates.get("add") or {}
    rem_block = updates.get("remove") or {}
    if isinstance(add_block, dict):
        if add_block.get("pregnancy") is True:
            mem["pregnancy"] = True
        for key in ("health_conditions", "allergies", "dislikes", "diet_goals", "fridge_items"):
            items = add_block.get(key)
            if isinstance(items, list):
                merged = mem[key] + [str(x).strip() for x in items if str(x).strip()]
                mem[key] = list(dict.fromkeys(merged))[:15]
    if isinstance(rem_block, dict):
        if rem_block.get("pregnancy") is True or rem_block.get("pregnancy") is False:
            if "pregnancy" in rem_block:
                mem["pregnancy"] = False
        for key in ("health_conditions", "allergies", "dislikes", "diet_goals", "fridge_items"):
            items = rem_block.get(key)
            if isinstance(items, list):
                drop = {normalize(str(x)) for x in items}
                mem[key] = [x for x in mem[key] if normalize(x) not in drop]
    return mem


def recipe_has_allergen(db, ing_ids: list[str], blocked_allergens: set[str]) -> bool:
    if not blocked_allergens:
        return False
    for iid in ing_ids:
        ing = db.get(Ingredient, iid)
        if ing and blocked_allergens.intersection(ing.allergens or []):
            return True
    return False


def tool_search_catalog_recipes(
    db,
    query: str = "",
    max_minutes: int | None = None,
    exclude_ingredients: list[str] | None = None,
    required_tags: list[str] | None = None,
    pantry: list[str] | None = None,
    servings: int = 2,
    shown: list[str] | None = None,
    blocked_allergens: list[str] | None = None,
) -> dict[str, Any]:
    """Deterministic SQLite search over all 60+ catalog recipes with allergen & dislike safety."""
    norm_q = normalize(query or "").strip()
    exclusions = set(str(x) for x in (exclude_ingredients or []))
    allergen_set = set(str(x) for x in (blocked_allergens or []))
    if "fish" in exclusions:
        allergen_set.add("fish")
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
        if recipe_has_allergen(db, ing_ids, allergen_set):
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
    """Return authoritative inventory ingredients/products with calorie metadata."""
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
                "kcal_per_unit": INGREDIENT_KCAL_PER_UNIT.get(p.id, 1.0),
                "allergens": ing.allergens if ing else [],
            }
        )
    return {"count": len(items), "ingredients": items}


def tool_search_office_lunch(
    query: str = "",
    max_price: int | None = None,
    max_kcal: int | None = None,
    eat_clean_only: bool = False,
) -> dict[str, Any]:
    """Search curated Vietnamese office-lunch out-of-home options."""
    norm_q = normalize(query or "").strip()
    results = []
    for opt in OFFICE_LUNCH_OPTIONS:
        if max_price is not None and opt["price"] > int(max_price):
            continue
        if max_kcal is not None and opt["kcal"] > int(max_kcal):
            continue
        if eat_clean_only and "eat clean" not in normalize(opt["tag"]):
            continue
        if norm_q:
            haystack = normalize(f"{opt['name']} {opt['tag']} {opt['note']}")
            if not all(word in haystack for word in norm_q.split()):
                continue
        results.append(opt)
    return {"count": len(results), "lunches": results[:8]}


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
    persist: bool = True,
) -> dict[str, Any]:
    """Validate ingredients, compute kcal + cost, and persist CustomRecipe in SQLite."""
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
    clean_tags = [str(t).strip()[:24] for t in (tags or ["AI thiết kế"]) if str(t).strip()][:4] or [
        "AI thiết kế"
    ]
    clean_steps = [str(s).strip() for s in steps if str(s).strip()][:8]
    clean_emoji = (str(emoji or "🍽️").strip() or "🍽️")[:4]
    clean_desc = (
        health_note.strip() or "Món ăn được AI thiết kế riêng theo nhu cầu của bạn từ nguyên liệu thật."
    )
    est_kcal = estimate_recipe_kcal(validated_lines, base_servings=2)

    if persist and not db.get(CustomRecipe, custom_id):
        db.add(
            CustomRecipe(
                id=custom_id,
                name=clean_name,
                description=clean_desc,
                minutes=safe_minutes,
                servings=2,
                emoji=clean_emoji,
                color="green",
                tags=clean_tags,
                ingredients=recipe_ingredients,
                steps=clean_steps,
                estimated_kcal=est_kcal,
                created_at=int(time.time()),
            )
        )
        db.flush()

    recipe_obj = {
        "id": custom_id,
        "name": clean_name,
        "description": clean_desc,
        "minutes": safe_minutes,
        "servings": 2,
        "emoji": clean_emoji,
        "color": "green",
        "tags": clean_tags,
        "source": "Công thức phối hợp bởi Trợ lý AI Bữa Nhà",
        "is_custom": True,
        "estimated_kcal": est_kcal,
        "ingredients": recipe_ingredients,
        "steps": clean_steps,
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
        "estimated_kcal": est_kcal,
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
    """SQL Pre-filter + TikTok Behavioral Affinity Scoring over 60+ recipes."""
    text = normalize(content)
    exclusions = set(str(x) for x in ctx.get("excluded", []))
    memory = normalize_memory(ctx.get("memory"))
    taste = ctx.get("taste_profile") if isinstance(ctx.get("taste_profile"), dict) else {}
    persona = str(taste.get("persona") or "")
    liked_tags = {normalize(str(t)) for t in (taste.get("liked_tags") or []) if str(t).strip()}
    disliked_ings = {str(x) for x in (taste.get("disliked_ingredients") or []) if str(x).strip()}
    tag_scores = taste.get("tag_scores") if isinstance(taste.get("tag_scores"), dict) else {}

    allergen_set = set(memory["allergies"])
    exclusions.update(memory["dislikes"])
    exclusions.update(disliked_ings)
    if "fish" in exclusions or "basa-fish" in exclusions:
        allergen_set.add("fish")

    pantry_set = set(str(x) for x in ctx.get("pantry", []))
    shown_set = set(str(x) for x in ctx.get("shown", []))
    servings = max(1, min(6, int(ctx.get("servings") or 2)))

    recipes = list(db.scalars(select(Recipe).order_by(Recipe.minutes, Recipe.id)))
    scored: list[tuple[int, int, str]] = []
    valid_recipe_ids: set[str] = set()

    for r in recipes:
        ing_ids = list(
            db.scalars(select(RecipeIngredient.ingredient_id).where(RecipeIngredient.recipe_id == r.id))
        )
        if exclusions.intersection(ing_ids):
            continue
        if recipe_has_allergen(db, ing_ids, allergen_set):
            continue

        buy_ids = [i for i in ing_ids if i not in pantry_set] or ing_ids
        quote = recipe_quote(
            db,
            [RecipeSelection(recipe_id=r.id, servings=servings, ingredient_ids=buy_ids, variant_id=None)],
        )
        if quote["missing"]:
            continue
        valid_recipe_ids.add(r.id)

        est_total = quote["total"]
        norm_tags = [normalize(t) for t in r.tags]
        norm_name = normalize(r.name)
        score = 0
        if r.id not in shown_set:
            score += 50
        if norm_name in text or any(nt in text for nt in norm_tags):
            score += 35

        # Persona-based affinity boost
        if persona == "office_busy" and (r.minutes <= 15 or "nhanh" in norm_tags):
            score += 35
        elif persona == "fit_eatclean" and ("eat-clean" in r.tags or "rau" in norm_tags):
            score += 40
        elif persona == "student_saver" and est_total <= 48000:
            score += 40
        elif persona == "family_care" and (
            "canh" in norm_tags or any(w in norm_name for w in ("hap", "luoc", "ham"))
        ):
            score += 35

        # Explicit liked tags & implicit behavioral tag_scores boost
        for nt in norm_tags:
            if nt in liked_tags:
                score += 25
            score += max(-15, min(30, int(tag_scores.get(nt, 0) or 0) * 2))
        for iid in ing_ids:
            if iid in liked_tags:
                score += 20
            score += max(-15, min(25, int(tag_scores.get(iid, 0) or 0) * 2))

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
    meal_lines = "\n".join(
        f"- {m['id']}: {m['name']} ({' + '.join(m['recipe_ids'])})"
        for m in MEALS
        if all(rid in valid_recipe_ids for rid in m["recipe_ids"])
    )
    return (
        f"Tổng kho Bữa Nhà hiện có {len(recipes)} công thức nấu ăn, {len(MEALS)} mâm cơm và {len(OFFICE_LUNCH_OPTIONS)} món ăn trưa văn phòng.\n"
        f"Danh sách món nấu ứng viên đã xếp hạng theo gu người dùng ({min(limit, len(scored))} món):\n{top_recipes}\n\n"
        f"Danh mục mâm cơm:\n{meal_lines}"
    )


def _execute_tool_call(
    db,
    name: str,
    args: dict[str, Any],
    ctx: dict[str, Any],
    custom_cache: dict[str, dict[str, Any]],
) -> dict[str, Any]:
    memory = normalize_memory(ctx.get("memory"))
    if name == "search_catalog_recipes":
        merged_exclude = list(
            set(args.get("exclude_ingredients") or [])
            | set(ctx.get("excluded") or [])
            | set(memory["dislikes"])
        )
        return tool_search_catalog_recipes(
            db,
            query=str(args.get("query", "")),
            max_minutes=args.get("max_minutes"),
            exclude_ingredients=merged_exclude,
            required_tags=args.get("required_tags"),
            pantry=ctx.get("pantry"),
            servings=int(ctx.get("servings") or 2),
            shown=ctx.get("shown"),
            blocked_allergens=memory["allergies"],
        )
    if name == "get_available_ingredients":
        return tool_get_available_ingredients(db, category=str(args.get("category", "")))
    if name == "search_office_lunch":
        return tool_search_office_lunch(
            query=str(args.get("query", "")),
            max_price=args.get("max_price"),
            max_kcal=args.get("max_kcal"),
            eat_clean_only=bool(args.get("eat_clean_only")),
        )
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
            persist=False,
        )
        if built.get("status") == "ok":
            cid = built["custom_recipe_id"]
            custom_cache[cid] = built
            return {
                "status": "ok",
                "custom_recipe_id": cid,
                "estimated_total_vnd": built["estimated_total_vnd"],
                "estimated_kcal": built["estimated_kcal"],
            }
        return built
    return {"error": f"Tool '{name}' không tồn tại."}


def _post_gemini(url: str, payload: dict[str, Any], timeout: int) -> dict[str, Any]:
    data = json.dumps(payload).encode("utf-8")
    headers = {"Content-Type": "application/json", "User-Agent": "BuaNha-Demo/2.0"}
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
    timeout: int = 10,
) -> dict[str, Any] | None:
    global ACTIVE_WORKING_MODEL
    clean_key = api_key.strip().strip('"').strip("'")
    if not clean_key:
        return None

    memory = normalize_memory(context.get("memory"))
    taste = context.get("taste_profile") if isinstance(context.get("taste_profile"), dict) else {}
    persona_key = str(taste.get("persona") or "")
    persona_desc = PERSONA_DESCRIPTIONS.get(persona_key, "Chưa chọn chân dung cố định")
    taste_summary = {
        "persona": persona_desc,
        "liked_tags": taste.get("liked_tags") or [],
        "disliked_ingredients": taste.get("disliked_ingredients") or [],
        "top_behavior_tags": sorted(
            (taste.get("tag_scores") or {}).items(), key=lambda kv: kv[1], reverse=True
        )[:6]
        if isinstance(taste.get("tag_scores"), dict)
        else [],
    }
    history_lines = []
    for turn in context.get("history", [])[-8:]:
        role_label = "Người dùng" if turn.get("role") == "user" else "Trợ lý"
        history_lines.append(f"- {role_label}: {turn.get('text', '')}")
    history_block = (
        "Lịch sử hội thoại gần đây:\n" + "\n".join(history_lines) + "\n\n" if history_lines else ""
    )
    clean_ctx = {k: v for k, v in context.items() if k not in {"history", "memory", "taste_profile"}}
    user_text = (
        f"TRÍ NHỚ DÀI HẠN (memory - KHÔNG BAO GIỜ QUÊN): {json.dumps(memory, ensure_ascii=False)}\n"
        f"HỒ SƠ CÁ NHÂN HÓA & HÀNH VI (taste_profile): {json.dumps(taste_summary, ensure_ascii=False)}\n\n"
        f"{candidates_text}\n\n"
        f"{history_block}"
        f"Ngữ cảnh phiên: {json.dumps(clean_ctx, ensure_ascii=False)}\n\n"
        f"Tin nhắn người dùng hiện tại: {prompt}"
    )

    candidate_list = [ACTIVE_WORKING_MODEL]
    for m_cand in FAST_MODELS:
        if m_cand not in candidate_list:
            candidate_list.append(m_cand)

    deadline = time.monotonic() + max(float(timeout), 15.0)

    for m, ver in candidate_list:
        if time.monotonic() >= deadline:
            break
        url = f"https://generativelanguage.googleapis.com/{ver}/models/{m}:generateContent?key={clean_key}"
        contents: list[dict[str, Any]] = [{"role": "user", "parts": [{"text": user_text}]}]
        custom_cache: dict[str, dict[str, Any]] = {}
        use_tools = db is not None

        try:
            for _round in range(4 if use_tools else 1):
                remaining = deadline - time.monotonic()
                if remaining <= 0.5:
                    raise TimeoutError("Gemini request budget exceeded")
                per_call_timeout = min(float(timeout), remaining)
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
                    res_data = _post_gemini(url, payload, timeout=per_call_timeout)
                except urllib.error.HTTPError as e:
                    err_body = e.read().decode("utf-8", errors="ignore")
                    if e.code == 400 and use_tools:
                        use_tools = False
                        payload.pop("tools", None)
                        payload["generationConfig"]["responseMimeType"] = "application/json"
                        res_data = _post_gemini(url, payload, timeout=per_call_timeout)
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


def _detect_allergens(text: str) -> tuple[list[str], bool]:
    """Detect known DB allergens vs untracked high-risk allergens in Vietnamese text."""
    if "di ung" not in text:
        return [], False
    if any(kw in text for kw in UNTRACKED_ALLERGEN_KEYWORDS):
        return [], True
    detected = []
    for allergen_code, keywords in KNOWN_ALLERGEN_KEYWORDS.items():
        for kw in keywords:
            if kw in text:
                if allergen_code == "fish" and kw == "ca":
                    cleaned = text.replace("ca chua", "").replace("ca rot", "")
                    if " ca " not in f" {cleaned} ":
                        continue
                detected.append(allergen_code)
                break
    if not detected:
        return [], True
    return list(dict.fromkeys(detected)), False


class GeminiProvider:
    """Combines Google Gemini Dual Memory + 4 Tools with deterministic pricing & safety."""

    def __init__(self, api_key: str, model: str = "gemini-flash-lite-latest"):
        self.api_key = api_key
        self.model = model
        from .assistant import RuleBasedProvider

        self.fallback = RuleBasedProvider()

    def recommend(self, db, content: str, context: dict) -> dict:
        text = normalize(content)
        raw_history = context.get("history", [])
        memory = normalize_memory(context.get("memory"))
        ctx = {
            "servings": 2,
            "budget": None,
            "minutes": None,
            "excluded": [],
            "shown": [],
            "memory": memory,
            **{k: v for k, v in context.items() if k not in {"history", "memory"}},
        }

        detected_allergens, untracked_allergy = _detect_allergens(text)
        if untracked_allergy or ctx.get("allergy_uncertain"):
            ctx["allergy_uncertain"] = True
            return {
                "mode": "gemini",
                "message": (
                    "Dữ liệu hiện tại chưa đủ để xác nhận món phù hợp với dị ứng bạn nêu (như đậu phộng/hạt/sữa). "
                    "Mình không thể bảo đảm an toàn; bạn có thể xem kỹ thành phần sản phẩm hoặc bắt đầu cuộc trò chuyện mới."
                ),
                "suggestions": [],
                "products": [],
                "lunch_suggestions": [],
                "health_advisory": "Cảnh báo dị ứng ngoài danh mục kiểm soát: vui lòng tham khảo thông tin dị ứng thực phẩm trực tiếp.",
                "context": ctx,
            }

        if detected_allergens:
            memory["allergies"] = list(dict.fromkeys(memory["allergies"] + detected_allergens))
            ctx["memory"] = memory

        candidates_text = build_dynamic_candidates(db, content, ctx, limit=25)
        call_ctx = {**ctx, "history": raw_history} if raw_history else ctx
        llm_data = call_gemini(
            self.api_key, self.model, content, call_ctx, candidates_text=candidates_text, db=db
        )
        if not llm_data:
            res = self.fallback.recommend(db, content, {k: v for k, v in ctx.items() if k != "history"})
            if LAST_STATUS.get("error"):
                res["gemini_error"] = LAST_STATUS["error"]
            return res

        # Merge persistent memory updates returned by Gemini
        memory = merge_memory(memory, llm_data.get("memory_updates"))
        if detected_allergens:
            memory["allergies"] = list(dict.fromkeys(memory["allergies"] + detected_allergens))
        ctx["memory"] = memory

        # Prevent context contamination across unrelated turns
        is_refinement = any(
            kw in text for kw in ("doi mon", "mon khac", "khong thich", "re hon", "nhanh hon", "them mon")
        )
        if isinstance(llm_data.get("servings"), (int, float)) and llm_data["servings"] >= 1:
            ctx["servings"] = min(6, max(1, int(llm_data["servings"])))
        elif not is_refinement:
            ctx["servings"] = 2

        if "budget" in llm_data:
            if llm_data["budget"] is not None and isinstance(llm_data["budget"], (int, float)):
                ctx["budget"] = round(float(llm_data["budget"]))
            elif not is_refinement:
                ctx["budget"] = None
        elif not is_refinement:
            ctx["budget"] = None

        if "minutes" in llm_data:
            if llm_data["minutes"] is not None and isinstance(llm_data["minutes"], (int, float)):
                ctx["minutes"] = int(llm_data["minutes"])
            elif not is_refinement:
                ctx["minutes"] = None
        elif not is_refinement:
            ctx["minutes"] = None

        if llm_data.get("lighter"):
            ctx["lighter"] = True

        taste_obj = ctx.get("taste_profile") if isinstance(ctx.get("taste_profile"), dict) else {}
        taste_dislikes = [str(x) for x in (taste_obj.get("disliked_ingredients") or []) if str(x).strip()]
        new_excluded = llm_data.get("excluded", [])
        if isinstance(new_excluded, list):
            ctx["excluded"] = sorted(
                set(
                    ctx.get("excluded", [])
                    + memory["dislikes"]
                    + taste_dislikes
                    + [str(x) for x in new_excluded]
                )
            )

        exclusions = set(ctx["excluded"])
        blocked_allergens = set(memory["allergies"])
        if "fish" in exclusions or "basa-fish" in exclusions:
            blocked_allergens.add("fish")

        pantry_set = set(str(x) for x in ctx.get("pantry", []))
        intent = llm_data.get("intent", "dish")
        if any(kw in text for kw in ("mam com", "combo", "ca bua", "nhieu mon")):
            intent = "meal"
        elif any(kw in text for kw in ("an ngoai", "dat do", "quan com", "trua van phong")):
            intent = "office_lunch"

        ai_message = str(llm_data.get("message", "")).strip()
        raw_advisory = llm_data.get("health_advisory")
        health_advisory = str(raw_advisory).strip() if raw_advisory else None
        if blocked_allergens and not health_advisory:
            names = ", ".join(ALLERGEN_LABELS.get(a, a) for a in sorted(blocked_allergens))
            health_advisory = f"Đã tự động loại bỏ các món chứa: {names}. Vui lòng kiểm tra kỹ nhãn sản phẩm trước khi chế biến."

        result = {
            "mode": "gemini",
            "message": ai_message or "Dưới đây là gợi ý phù hợp nhất cho bạn:",
            "suggestions": [],
            "products": [],
            "lunch_suggestions": [],
            "health_advisory": health_advisory,
            "context": ctx,
        }

        if intent == "general" and not llm_data.get("selected_ids") and ai_message:
            return result

        if intent == "office_lunch":
            lunch_ids = [str(x).strip() for x in (llm_data.get("selected_lunch_ids") or [])]
            lunch_map = {opt["id"]: opt for opt in OFFICE_LUNCH_OPTIONS}
            picked_lunches = [lunch_map[lid] for lid in lunch_ids if lid in lunch_map]
            if not picked_lunches:
                max_p = ctx["budget"] if ctx["budget"] and ctx["budget"] >= 35000 else None
                picked_lunches = tool_search_office_lunch(
                    query="",
                    max_price=max_p,
                    eat_clean_only=("eat-clean" in memory["diet_goals"] or "eat clean" in text),
                )["lunches"][:3]
            result["lunch_suggestions"] = picked_lunches[:3]
            if result["lunch_suggestions"]:
                return result

        if intent == "products" and llm_data.get("selected_product_ids"):
            products = []
            for raw_pid in llm_data["selected_product_ids"]:
                p = db.get(Product, str(raw_pid).strip())
                if p and p.available and p.id not in exclusions:
                    ing = db.get(Ingredient, p.id)
                    if ing and blocked_allergens.intersection(ing.allergens or []):
                        continue
                    products.append(product_data(p))
            if products:
                result["products"] = products
                return result

        custom_cache: dict[str, dict[str, Any]] = llm_data.get("_custom_recipes") or {}
        reasons_map: dict[str, Any] = (
            llm_data.get("reasons") if isinstance(llm_data.get("reasons"), dict) else {}
        )
        selected_ids = llm_data.get("selected_ids", [])

        for raw_id in selected_ids:
            sid = str(raw_id).strip()
            if sid in custom_cache:
                built = custom_cache[sid]
                custom_recipe = built["recipe"]
                c_ing_ids = [x["id"] for x in custom_recipe["ingredients"]]
                if exclusions.intersection(c_ing_ids) or recipe_has_allergen(
                    db, c_ing_ids, blocked_allergens
                ):
                    continue
                custom_reason = str(reasons_map.get(sid) or "").strip() or custom_recipe["description"]
                result["suggestions"].append(
                    {
                        "id": sid,
                        "name": custom_recipe["name"],
                        "recipes": [custom_recipe],
                        "selections": [built["selection"]],
                        "total": built["estimated_total_vnd"],
                        "minutes": custom_recipe["minutes"],
                        "servings": ctx["servings"],
                        "reason": custom_reason,
                    }
                )
                continue

            meal = resolve_meal(sid)
            if meal:
                key, title = meal["id"], meal["name"]
                if is_refinement and key in ctx.get("shown", []):
                    continue
                dishes = [db.get(Recipe, rid) for rid in meal["recipe_ids"] if db.get(Recipe, rid)]
            else:
                recipe = resolve_recipe(db, sid)
                if not recipe:
                    continue
                key, title = recipe.id, recipe.name
                if is_refinement and key in ctx.get("shown", []):
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
                if exclusions.intersection(ids) or recipe_has_allergen(db, ids, blocked_allergens):
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
            if quote["missing"]:
                continue
            if intent != "meal" and ctx["budget"] is not None and quote["total"] > ctx["budget"]:
                continue

            custom_reason = (
                str(reasons_map.get(key) or reasons_map.get(sid) or "").strip()
                or "Phù hợp với khẩu vị và thời gian của bạn; đã tự trừ các gia vị có sẵn ở nhà."
            )
            result["suggestions"].append(
                {
                    "id": key,
                    "name": title,
                    "recipes": [recipe_data(db, r) for r in dishes],
                    "selections": [s.model_dump() for s in selections],
                    "total": quote["total"],
                    "minutes": duration,
                    "servings": ctx["servings"],
                    "reason": custom_reason,
                }
            )

        if not result["suggestions"] and custom_cache:
            for sid, built in list(custom_cache.items())[:3]:
                custom_recipe = built["recipe"]
                c_ing_ids = [x["id"] for x in custom_recipe["ingredients"]]
                if exclusions.intersection(c_ing_ids) or recipe_has_allergen(
                    db, c_ing_ids, blocked_allergens
                ):
                    continue
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
                    if exclusions.intersection(ids) or recipe_has_allergen(db, ids, blocked_allergens):
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
        elif not result["lunch_suggestions"]:
            # Safe fallback that still enforces allergen & dislike exclusions from memory
            safe_ctx = {
                **{k: v for k, v in ctx.items() if k != "history"},
                "excluded": sorted(exclusions | ({"fish"} if "fish" in blocked_allergens else set())),
            }
            fallback_res = self.fallback.recommend(db, content, safe_ctx)
            filtered_fallback = []
            for s in fallback_res["suggestions"]:
                s_ings = [iid for sel in s["selections"] for iid in sel["ingredient_ids"]]
                if not recipe_has_allergen(db, s_ings, blocked_allergens):
                    filtered_fallback.append(s)
            result["suggestions"] = filtered_fallback
            result["products"] = fallback_res["products"]
            if not result["message"]:
                result["message"] = fallback_res["message"]

        return result
