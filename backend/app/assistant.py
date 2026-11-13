"""Deterministic recommendation baseline. No model calls or generated recipe text."""

import re
from typing import Protocol

from sqlalchemy import select

from .domain import normalize, product_data, recipe_data, recipe_quote
from .models import Ingredient, Product, Recipe, RecipeIngredient
from .schemas import RecipeSelection
from .seed import MEALS


class RecommendationProvider(Protocol):
    def recommend(self, db, content: str, context: dict) -> dict: ...


def contains(text, phrase):
    return re.search(r"(?<!\w)" + re.escape(phrase) + r"(?!\w)", text) is not None


class RuleBasedProvider:
    def recommend(self, db, content, context):
        text = normalize(content)
        ctx = {"servings": 2, "budget": None, "minutes": None, "excluded": [], "shown": [], **context}
        result = {"mode": "rules", "message": "", "suggestions": [], "products": [], "context": ctx}
        budget = re.search(r"(\d+(?:[.,]\d+)?)\s*(k|nghin|ngan|trieu|vnd|dong|đ)\b", text)
        if budget:
            number = float(budget[1].replace(",", "."))
            ctx["budget"] = round(
                number
                * (1000000 if budget[2] == "trieu" else 1000 if budget[2] in {"k", "nghin", "ngan"} else 1)
            )
        people = re.search(r"(\d+)\s*(nguoi|khau phan)", text)
        if people:
            if not 1 <= int(people[1]) <= 6:
                result["message"] = "Demo hiện tính khẩu phần cho 1–6 người. Bạn muốn thử cho mấy người?"
                return result
            ctx["servings"] = int(people[1])
        minutes = re.search(r"(\d+)\s*phut", text)
        if minutes:
            ctx["minutes"] = int(minutes[1])
        elif "nhanh" in text or "met" in text:
            ctx["minutes"] = 30
        if any(p in text for p in ["khong gioi han thoi gian", "khong can nhanh"]):
            ctx["minutes"] = None
        if any(p in text for p in ["khong gioi han ngan sach", "bo ngan sach"]):
            ctx["budget"] = None
        products = list(db.scalars(select(Product).order_by(Product.id)))
        exclusions = set(ctx["excluded"])
        negative = re.findall(r"(?:khong thich|khong an|khong dung|tranh|di ung|bo qua)\s+([^.,;!?]+)", text)
        for phrase in negative:
            for p in products:
                names = [normalize(p.name)]
                names += {
                    "fish": ["ca"],
                    "chicken": ["ga"],
                    "beef": ["bo"],
                    "shrimp": ["tom"],
                    "eggs": ["trung"],
                    "pork": ["heo", "lon"],
                    "tofu": ["dau phu", "dau hu"],
                }.get(p.id, [])
                if any(contains(phrase, name) for name in names):
                    # 'cà chua' must not count as 'cá'.
                    if p.id != "fish" or contains(phrase.replace("ca chua", "").replace("ca rot", ""), "ca"):
                        exclusions.add(p.id)
        ctx["excluded"] = sorted(exclusions)
        if "di ung" in text:
            ctx["allergy_uncertain"] = True
        if ctx.get("allergy_uncertain"):
            result["message"] = (
                "Dữ liệu demo chưa đủ để xác nhận món phù hợp với dị ứng bạn nêu. Mình không thể bảo đảm an toàn; bạn có thể xem thành phần sản phẩm. Bắt đầu cuộc trò chuyện mới để thử nhu cầu khác."
            )
            return result
        if "mua" in text and not any(x in text for x in ["nau", "mon", "bua"]):
            result["products"] = [
                product_data(p)
                for p in products
                if p.available
                and p.id not in exclusions
                and (contains(text, normalize(p.name)) or (p.id == "eggs" and contains(text, "trung")))
            ]
            result["message"] = (
                "Đây là sản phẩm bạn cần. Bạn chọn số lượng và thêm vào giỏ nhé."
                if result["products"]
                else "Mình chưa tìm thấy sản phẩm đó. Bạn thử tên như thịt bò, cà chua hoặc trứng nhé."
            )
            return result
        recipes = list(db.scalars(select(Recipe).order_by(Recipe.minutes, Recipe.id)))
        changing = "doi" in text or "khong thich" in text or "mon khac" in text
        direct = next((r for r in recipes if contains(text, normalize(r.name))), None)
        if direct:
            ctx["intent"] = "dish"
            ctx["recipe_id"] = direct.id
            ctx["shown"] = []
        elif "bua" in text or "thuc don" in text:
            ctx["intent"] = "meal"
            ctx.pop("recipe_id", None)
        elif changing:
            ctx.pop("recipe_id", None)
        signals = [
            "an gi",
            "mon",
            "nau",
            "met",
            "goi y",
            "bua",
            "doi",
            "nhanh",
            "ngan sach",
            "nguoi",
            "phut",
            "nhat",
            "thay",
            "khau phan",
        ]
        if not direct and not budget and not any(s in text for s in signals):
            result["message"] = (
                "Mình là trợ lý theo kịch bản, chưa hiểu yêu cầu này. Thử “100k cho 2 người” hoặc “Muốn nấu gà rang gừng” nhé."
            )
            return result
        if "thay" in text:
            result["message"] = (
                "Demo chưa có biến thể thay nguyên liệu phù hợp. Bạn có thể đổi sang món khác; mình sẽ giữ ngân sách và số người."
            )
            return result
        lighter = "nhat" in text or "it muoi" in text
        if lighter:
            ctx["lighter"] = True
        if ctx.get("intent") == "meal":
            candidates = [
                (m["id"], m["name"], [db.get(Recipe, rid) for rid in m["recipe_ids"]]) for m in MEALS
            ]
        elif ctx.get("recipe_id"):
            r = db.get(Recipe, ctx["recipe_id"])
            candidates = [(r.id, r.name, [r])]
        else:
            candidates = [(r.id, r.name, [r]) for r in recipes]
        for key, title, dishes in candidates:
            if changing and key in ctx["shown"]:
                continue
            # Sum cooking estimates for sequential preparation of a meal.
            duration = sum(r.minutes for r in dishes)
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
                # Keep allergen metadata check explicit for future provider integrations.
                if "fish" in exclusions and any("fish" in db.get(Ingredient, i).allergens for i in ids):
                    excluded = True
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
                    "reason": "Giá mẫu tính theo gói nguyên liệu cần mua; bạn có thể bỏ những thứ đã có.",
                }
            )
            if len(result["suggestions"]) == 3:
                break
        if result["suggestions"]:
            ctx["shown"] = list(dict.fromkeys(ctx["shown"] + [s["id"] for s in result["suggestions"]]))[-30:]
            result["message"] = (
                f"Mình gợi ý cho {ctx['servings']} người. Chọn món bạn thích rồi tích nguyên liệu cần mua nhé."
            )
        else:
            result["message"] = (
                "Chưa có món khác đáp ứng đủ yêu cầu trong danh mục mẫu. Bạn có thể tăng ngân sách, thêm thời gian hoặc bắt đầu lại; mình chưa tự nới điều kiện của bạn."
            )
        return result


def get_recommendation_provider() -> RecommendationProvider:
    import os

    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key:
        from .gemini import GeminiProvider

        return GeminiProvider(api_key=gemini_key, model=os.getenv("GEMINI_MODEL", "gemini-2.0-flash"))
    return RuleBasedProvider()
