import hashlib
import json
import math
import unicodedata
from datetime import datetime, timezone
from fractions import Fraction

from sqlalchemy import select

from .models import (
    Cart,
    CartItem,
    DeliverySimulation,
    Ingredient,
    IngredientProductMapping,
    OrderItem,
    Product,
    Recipe,
    RecipeIngredient,
    RecipeStep,
    RecipeVariant,
)


class DomainError(Exception):
    def __init__(self, code, message, status=400):
        self.code, self.message, self.status = code, message, status


def normalize(value: str) -> str:
    value = value.lower().replace("đ", "d")
    return "".join(c for c in unicodedata.normalize("NFD", value) if not unicodedata.combining(c))


def fingerprint(value) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True, ensure_ascii=False).encode()).hexdigest()


def iso(timestamp: int | None):
    return datetime.fromtimestamp(timestamp, timezone.utc).isoformat() if timestamp is not None else None


def product_data(p):
    return {
        k: getattr(p, k)
        for k in ("id", "name", "category", "price", "pack_size", "unit", "emoji", "available", "origin")
    }


def recipe_data(db, recipe, detail=False):
    data = {
        k: getattr(recipe, k)
        for k in ("id", "name", "description", "minutes", "servings", "emoji", "color", "tags", "source")
    }
    if detail:
        rows = db.scalars(select(RecipeIngredient).where(RecipeIngredient.recipe_id == recipe.id)).all()
        data["ingredients"] = [
            {
                "id": r.ingredient_id,
                "name": db.get(Ingredient, r.ingredient_id).name,
                "quantity": r.quantity,
                "unit": db.get(Ingredient, r.ingredient_id).unit,
            }
            for r in rows
        ]
        data["steps"] = list(
            db.scalars(
                select(RecipeStep.text).where(RecipeStep.recipe_id == recipe.id).order_by(RecipeStep.position)
            )
        )
        data["variants"] = [
            {"id": v.id, "name": v.name, "note": v.note}
            for v in db.scalars(select(RecipeVariant).where(RecipeVariant.recipe_id == recipe.id))
        ]
    return data


def recipe_quote(db, selections):
    totals = {}
    seen_recipes = set()
    for selection in selections:
        rid = selection.recipe_id
        recipe = db.get(Recipe, rid)
        if not recipe or rid in seen_recipes:
            raise DomainError("INVALID_RECIPE", "Món không hợp lệ hoặc bị chọn lặp.")
        seen_recipes.add(rid)
        rows = {
            r.ingredient_id: r
            for r in db.scalars(select(RecipeIngredient).where(RecipeIngredient.recipe_id == rid))
        }
        factors = {}
        if selection.variant_id:
            variant = db.get(RecipeVariant, selection.variant_id)
            if not variant or variant.recipe_id != rid:
                raise DomainError("INVALID_VARIANT", "Biến thể không thuộc món đã chọn.")
            factors = variant.quantity_factors
        for iid in set(selection.ingredient_ids):
            if iid not in rows:
                raise DomainError("INVALID_INGREDIENT", "Nguyên liệu không thuộc công thức.")
            amount = Fraction(rows[iid].quantity * selection.servings, recipe.servings)
            amount *= Fraction(str(factors.get(iid, 1)))
            totals[iid] = totals.get(iid, Fraction(0)) + amount
    # Aggregate mapped demand by SKU before pack rounding, including aliases to the same product.
    by_product, missing = {}, []
    for iid, required in totals.items():
        ingredient = db.get(Ingredient, iid)
        mapping = db.get(IngredientProductMapping, iid)
        product = db.get(Product, mapping.product_id) if mapping else None
        if not product or not product.available or product.unit != ingredient.unit or mapping.factor <= 0:
            missing.append(
                {
                    "ingredient_id": iid,
                    "name": ingredient.name,
                    "reason": "Chưa có sản phẩm phù hợp trong danh mục mẫu.",
                }
            )
            continue
        line = by_product.setdefault(
            product.id, {"product": product, "required": Fraction(0), "ingredient_ids": []}
        )
        line["required"] += required * mapping.factor
        line["ingredient_ids"].append(iid)
    lines = []
    for pid, line in sorted(by_product.items()):
        p = line["product"]
        packs = math.ceil(line["required"] / p.pack_size)
        if packs > 99:
            raise DomainError("QUANTITY_LIMIT", "Số gói vượt giới hạn demo.")
        lines.append(
            {
                "product_id": pid,
                "name": p.name,
                "emoji": p.emoji,
                "unit": p.unit,
                "required": float(line["required"]),
                "pack_size": p.pack_size,
                "quantity": packs,
                "purchased": packs * p.pack_size,
                "price": p.price,
                "subtotal": packs * p.price,
                "ingredient_ids": line["ingredient_ids"],
            }
        )
    return {
        "items": lines,
        "missing": missing,
        "total": sum(x["subtotal"] for x in lines),
        "sample_prices": True,
    }


def cart_data(db, sid):
    cart = db.get(Cart, sid)
    items = []
    for row in db.scalars(select(CartItem).where(CartItem.session_id == sid).order_by(CartItem.product_id)):
        p = db.get(Product, row.product_id)
        items.append(
            {
                **product_data(p),
                "product_id": p.id,
                "quantity": row.quantity,
                "subtotal": row.quantity * p.price,
            }
        )
    return {
        "items": items,
        "version": cart.version,
        "total": sum(i["subtotal"] for i in items),
        "count": sum(i["quantity"] for i in items),
        "delivery_fee": 0,
    }


def update_cart(db, sid, lines, mode, expected_version):
    cart = db.get(Cart, sid)
    if cart.version != expected_version:
        raise DomainError("CART_CHANGED", "Giỏ đã thay đổi. Vui lòng xem lại trước khi tiếp tục.", 409)
    ids = [line.product_id for line in lines]
    if len(ids) != len(set(ids)):
        raise DomainError("DUPLICATE_PRODUCT", "Mỗi sản phẩm chỉ xuất hiện một lần trong yêu cầu.")
    for line in lines:
        p = db.get(Product, line.product_id)
        if not p or (not p.available and line.quantity > 0):
            raise DomainError("PRODUCT_UNAVAILABLE", "Sản phẩm hiện không có trong kho mẫu.", 409)
        row = db.get(CartItem, (sid, p.id))
        quantity = line.quantity + (row.quantity if row and mode == "add" else 0)
        if quantity > 99:
            raise DomainError("QUANTITY_LIMIT", "Tối đa 99 gói mỗi sản phẩm trong demo.")
        if quantity == 0:
            if row:
                db.delete(row)
        elif row:
            row.quantity = quantity
        else:
            db.add(CartItem(session_id=sid, product_id=p.id, quantity=quantity))
    cart.version += 1
    db.flush()
    return cart_data(db, sid)


STAGES = [
    "Đã xác nhận",
    "Đang chuẩn bị",
    "Sẵn sàng giao",
    "Robot nhận hàng",
    "Đang đến căn hộ",
    "Đã giao mô phỏng",
]
OFFSETS = [0, 15, 30, 45, 60, 90]


def delivery_data(db, order, now):
    sim = db.get(DeliverySimulation, order.id)
    elapsed = now + sim.offset_seconds - sim.start_at
    index = max((i for i, seconds in enumerate(OFFSETS) if elapsed >= seconds), default=0)
    waiting = elapsed < 0
    return {
        "index": index,
        "stages": STAGES,
        "status": "Chờ giờ giao" if waiting else STAGES[index],
        "waiting": waiting,
        "complete": index == 5,
        "progress": max(0, min(100, round(elapsed / 90 * 100))),
        "estimated_at": iso(sim.start_at + 90),
        "simulated": True,
        "time_advanced": sim.offset_seconds > 0,
        "destination": f"Tòa {order.address['tower']} · Tầng {order.address['floor']} · Căn {order.address['apartment']}",
    }


def order_data(db, order, now):
    items = [
        {
            k: getattr(row, k)
            for k in ("product_id", "name", "quantity", "price", "pack_size", "unit", "emoji")
        }
        for row in db.scalars(select(OrderItem).where(OrderItem.order_id == order.id))
    ]
    return {
        "id": order.id,
        "created_at": iso(order.created_at),
        "total": order.total,
        "items": items,
        "delivery_mode": order.delivery_mode,
        "scheduled_at": iso(order.scheduled_at),
        "address": order.address,
        "contact": order.contact,
        "payment_status": "not_charged_demo",
        "delivery": delivery_data(db, order, now),
    }
