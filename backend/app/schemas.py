from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class Input(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class RecipeSelection(Input):
    recipe_id: str = Field(max_length=80)
    servings: int = Field(ge=1, le=6, default=2)
    ingredient_ids: list[str] = Field(max_length=30)
    variant_id: str | None = None


class RecipeQuoteInput(Input):
    selections: list[RecipeSelection] = Field(min_length=1, max_length=3)


class CartLine(Input):
    product_id: str = Field(max_length=80)
    quantity: int = Field(ge=0, le=99)


class CartPatch(Input):
    items: list[CartLine] = Field(min_length=1, max_length=30)
    mode: Literal["set", "add"] = "set"
    expected_version: int = Field(ge=0)


class AddIngredients(RecipeQuoteInput):
    expected_version: int = Field(ge=0)


class DeliveryInput(Input):
    delivery_mode: Literal["now", "scheduled"]
    scheduled_at: datetime | None = None


class Address(Input):
    building: str = Field(min_length=1, max_length=80)
    tower: str = Field(min_length=1, max_length=30)
    floor: str = Field(min_length=1, max_length=10)
    apartment: str = Field(min_length=1, max_length=20)


class OrderInput(Input):
    quote_id: str = Field(min_length=1, max_length=80)
    idempotency_key: str = Field(min_length=8, max_length=80)
    address: Address
    contact: str = Field(min_length=3, max_length=80)


class AssistantInput(Input):
    content: str = Field(min_length=1, max_length=500)
    conversation_id: str | None = Field(default=None, max_length=80)


class AdvanceInput(Input):
    target: Literal["next", "complete"] = "next"


class SessionInput(Input):
    renew: bool = False
