from sqlalchemy import JSON, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


class Product(Base):
    __tablename__ = "products"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str]
    category: Mapped[str]
    price: Mapped[int]
    pack_size: Mapped[int]
    unit: Mapped[str]
    emoji: Mapped[str]
    aliases: Mapped[str]
    available: Mapped[bool] = mapped_column(default=True)
    origin: Mapped[str] = mapped_column(default="Nguồn hàng minh họa · Điểm tập kết An Nhiên")


class Ingredient(Base):
    __tablename__ = "ingredients"
    id: Mapped[str] = mapped_column(primary_key=True)
    name: Mapped[str]
    unit: Mapped[str]
    allergens: Mapped[list] = mapped_column(JSON, default=list)


class IngredientProductMapping(Base):
    __tablename__ = "ingredient_product_mappings"
    ingredient_id: Mapped[str] = mapped_column(ForeignKey("ingredients.id"), primary_key=True)
    product_id: Mapped[str] = mapped_column(ForeignKey("products.id"))
    # Canonical units only; no implicit g/ml conversion.
    factor: Mapped[int] = mapped_column(default=1)


class Recipe(Base):
    __tablename__ = "recipes"
    id: Mapped[str] = mapped_column(primary_key=True)
    name: Mapped[str]
    description: Mapped[str]
    minutes: Mapped[int]
    servings: Mapped[int] = mapped_column(default=2)
    emoji: Mapped[str]
    color: Mapped[str]
    tags: Mapped[list] = mapped_column(JSON)
    source: Mapped[str] = mapped_column(default="Nội dung demo tự biên soạn; chưa thẩm định chuyên môn")


class RecipeIngredient(Base):
    __tablename__ = "recipe_ingredients"
    recipe_id: Mapped[str] = mapped_column(ForeignKey("recipes.id"), primary_key=True)
    ingredient_id: Mapped[str] = mapped_column(ForeignKey("ingredients.id"), primary_key=True)
    quantity: Mapped[int]


class RecipeStep(Base):
    __tablename__ = "recipe_steps"
    recipe_id: Mapped[str] = mapped_column(ForeignKey("recipes.id"), primary_key=True)
    position: Mapped[int] = mapped_column(primary_key=True)
    text: Mapped[str]


class RecipeVariant(Base):
    __tablename__ = "recipe_variants"
    id: Mapped[str] = mapped_column(primary_key=True)
    recipe_id: Mapped[str] = mapped_column(ForeignKey("recipes.id"))
    name: Mapped[str]
    note: Mapped[str]
    quantity_factors: Mapped[dict] = mapped_column(JSON)


class DemoSession(Base):
    __tablename__ = "demo_sessions"
    id: Mapped[str] = mapped_column(primary_key=True)
    created_at: Mapped[int]
    expires_at: Mapped[int] = mapped_column(index=True)


class Cart(Base):
    __tablename__ = "carts"
    session_id: Mapped[str] = mapped_column(
        ForeignKey("demo_sessions.id", ondelete="CASCADE"), primary_key=True
    )
    version: Mapped[int] = mapped_column(default=0)


class CartItem(Base):
    __tablename__ = "cart_items"
    session_id: Mapped[str] = mapped_column(
        ForeignKey("carts.session_id", ondelete="CASCADE"), primary_key=True
    )
    product_id: Mapped[str] = mapped_column(ForeignKey("products.id"), primary_key=True)
    quantity: Mapped[int]


class Conversation(Base):
    __tablename__ = "conversations"
    id: Mapped[str] = mapped_column(primary_key=True)
    session_id: Mapped[str] = mapped_column(ForeignKey("demo_sessions.id", ondelete="CASCADE"), index=True)
    context: Mapped[dict] = mapped_column(JSON, default=dict)
    messages: Mapped[list] = mapped_column(JSON, default=list)


class CheckoutQuote(Base):
    __tablename__ = "checkout_quotes"
    id: Mapped[str] = mapped_column(primary_key=True)
    session_id: Mapped[str] = mapped_column(ForeignKey("demo_sessions.id", ondelete="CASCADE"), index=True)
    cart_version: Mapped[int]
    fingerprint: Mapped[str]
    delivery_mode: Mapped[str]
    scheduled_at: Mapped[int | None]
    expires_at: Mapped[int]
    total: Mapped[int]


class Order(Base):
    __tablename__ = "orders"
    __table_args__ = (UniqueConstraint("session_id", "idempotency_key"), UniqueConstraint("quote_id"))
    id: Mapped[str] = mapped_column(primary_key=True)
    session_id: Mapped[str] = mapped_column(ForeignKey("demo_sessions.id", ondelete="CASCADE"), index=True)
    quote_id: Mapped[str]
    idempotency_key: Mapped[str]
    request_hash: Mapped[str]
    created_at: Mapped[int]
    total: Mapped[int]
    delivery_mode: Mapped[str]
    scheduled_at: Mapped[int | None]
    address: Mapped[dict] = mapped_column(JSON)
    contact: Mapped[str]


class OrderItem(Base):
    __tablename__ = "order_items"
    order_id: Mapped[str] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), primary_key=True)
    product_id: Mapped[str] = mapped_column(primary_key=True)
    name: Mapped[str]
    price: Mapped[int]
    quantity: Mapped[int]
    pack_size: Mapped[int]
    unit: Mapped[str]
    emoji: Mapped[str]


class DeliverySimulation(Base):
    __tablename__ = "delivery_simulations"
    order_id: Mapped[str] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), primary_key=True)
    start_at: Mapped[int]
    offset_seconds: Mapped[int] = mapped_column(default=0)


class RateWindow(Base):
    __tablename__ = "rate_windows"
    session_id: Mapped[str] = mapped_column(
        ForeignKey("demo_sessions.id", ondelete="CASCADE"), primary_key=True
    )
    kind: Mapped[str] = mapped_column(primary_key=True)
    window: Mapped[int] = mapped_column(Integer)
    count: Mapped[int]
