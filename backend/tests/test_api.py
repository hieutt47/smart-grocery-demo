from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from backend.app.db import Base
from backend.app.main import COOKIE, create_app
from backend.app.models import Conversation, DemoSession, IngredientProductMapping, Order, Product
from backend.app.seed import seed
from backend.tests.conftest import add, order_body, place, quote_order


def test_seed_and_public_access(system):
    app, c, _ = system
    c.cookies.clear()
    assert len(c.get("/api/v1/products").json()) == 30
    assert len(c.get("/api/v1/recipes").json()) == 12
    assert len(c.get("/api/v1/meals").json()) == 3
    assert c.get("/api/v1/health").json()["assistant_mode"] == "rules"
    assert c.get("/api/v1/cart").status_code == 401
    with app.state.factory.begin() as db:
        seed(db)
    assert len(c.get("/api/v1/products").json()) == 30


def test_search(client):
    assert client.get("/api/v1/products?q=thit%20bo").json()[0]["id"] == "beef"
    assert client.get("/api/v1/products?q=zzzz").json() == []
    assert all(
        p["category"] == "Rau củ" for p in client.get("/api/v1/products?category=Rau%20c%E1%BB%A7").json()
    )


def test_cart_math_version_and_refresh(client):
    assert add(client, "eggs", 2).json()["total"] == 30000
    assert add(client, "tomato", 3).json()["total"] == 60000
    old = client.patch(
        "/api/v1/cart", json={"items": [{"product_id": "eggs", "quantity": 1}], "expected_version": 0}
    )
    assert old.status_code == 409
    cart = client.get("/api/v1/cart").json()
    result = client.patch(
        "/api/v1/cart",
        json={"items": [{"product_id": "tomato", "quantity": 0}], "expected_version": cart["version"]},
    )
    assert result.json()["total"] == 30000
    assert client.get("/api/v1/cart").json() == result.json()


def recipe_input(recipe="trung-chien-hanh", servings=2, ingredients=None):
    return {
        "recipe_id": recipe,
        "servings": servings,
        "ingredient_ids": ingredients if ingredients is not None else ["eggs"],
    }


def test_recipe_rounding_and_selection(client):
    q = client.post("/api/v1/recipe-quotes", json={"selections": [recipe_input(servings=3)]}).json()
    assert q["items"][0]["required"] == 4.5
    assert q["items"][0]["quantity"] == 1
    assert q["total"] == 15000
    assert (
        client.post("/api/v1/recipe-quotes", json={"selections": [recipe_input(ingredients=[])]}).json()[
            "total"
        ]
        == 0
    )
    assert (
        client.post(
            "/api/v1/cart/ingredients", json={"selections": [recipe_input()], "expected_version": 0}
        ).json()["count"]
        == 1
    )
    assert [i["product_id"] for i in client.get("/api/v1/cart").json()["items"]] == ["eggs"]


def test_shared_ingredient_rounded_after_sum(client):
    q = client.post(
        "/api/v1/recipe-quotes", json={"selections": [recipe_input(), recipe_input("canh-ca-trung")]}
    ).json()
    assert q["items"][0]["required"] == 5
    assert q["items"][0]["quantity"] == 1


def test_recipe_missing_mapping_and_unit_mismatch(system):
    app, c, _ = system
    with app.state.factory.begin() as db:
        db.get(Product, "eggs").unit = "g"
    quote = c.post("/api/v1/recipe-quotes", json={"selections": [recipe_input()]}).json()
    assert len(quote["missing"]) == 1 and quote["total"] == 0
    response = c.post(
        "/api/v1/cart/ingredients", json={"selections": [recipe_input()], "expected_version": 0}
    )
    assert response.status_code == 409
    with app.state.factory.begin() as db:
        db.delete(db.get(IngredientProductMapping, "eggs"))
    assert c.post("/api/v1/recipe-quotes", json={"selections": [recipe_input()]}).json()["missing"]


@pytest.mark.parametrize(
    "selection", [recipe_input(servings=0), recipe_input(servings=7), recipe_input(ingredients=["beef"])]
)
def test_invalid_recipe_selection(client, selection):
    assert client.post("/api/v1/recipe-quotes", json={"selections": [selection]}).status_code in [400, 422]


def test_price_changes_invalidate_quote_and_order_snapshot(system):
    app, c, _ = system
    add(c)
    q = quote_order(c).json()
    with app.state.factory.begin() as db:
        db.get(Product, "eggs").price = 17000
    assert c.post("/api/v1/orders", json=order_body(q["quote_id"])).json()["code"] == "CART_CHANGED"
    q = quote_order(c).json()
    o = c.post("/api/v1/orders", json=order_body(q["quote_id"])).json()
    with app.state.factory.begin() as db:
        db.get(Product, "eggs").price = 20000
    assert c.get(f"/api/v1/orders/{o['id']}").json()["total"] == 17000
    assert c.post(f"/api/v1/orders/{o['id']}/reorder-preview").json()["total"] == 20000


def test_checkout_idempotency_concurrent_and_quote_reuse(system):
    app, c, _ = system
    add(c)
    body = order_body(quote_order(c).json()["quote_id"])
    with ThreadPoolExecutor(max_workers=2) as pool:
        responses = list(pool.map(lambda _: c.post("/api/v1/orders", json=body), range(2)))
    assert [r.status_code for r in responses] == [200, 200]
    assert responses[0].json()["id"] == responses[1].json()["id"]
    assert c.get("/api/v1/cart").json()["count"] == 0
    assert len(c.get("/api/v1/orders").json()) == 1
    altered = {**body, "contact": "Khách khác"}
    assert c.post("/api/v1/orders", json=altered).json()["code"] == "IDEMPOTENCY_CONFLICT"
    another_key = {**body, "idempotency_key": "another-key-0001"}
    assert c.post("/api/v1/orders", json=another_key).json()["code"] == "QUOTE_USED"


def test_checkout_rejects_client_total_empty_and_stale(client):
    assert quote_order(client).json()["code"] == "EMPTY_CART"
    add(client)
    body = order_body(quote_order(client).json()["quote_id"])
    assert client.post("/api/v1/orders", json={**body, "total": 1}).status_code == 422
    add(client, "tomato")
    assert client.post("/api/v1/orders", json=body).json()["code"] == "CART_CHANGED"


def test_unavailable_stock(system):
    app, c, _ = system
    add(c)
    with app.state.factory.begin() as db:
        db.get(Product, "eggs").available = False
    assert quote_order(c).status_code == 409
    assert add(c).status_code == 409
    cart = c.get("/api/v1/cart").json()
    assert (
        c.patch(
            "/api/v1/cart",
            json={"items": [{"product_id": "eggs", "quantity": 0}], "expected_version": cart["version"]},
        ).status_code
        == 200
    )


def test_delivery_schedule_and_clock(system):
    _, c, clock = system
    add(c)
    for offset in [-100, 100, 8 * 86400]:
        date = datetime.fromtimestamp(clock[0] + offset, timezone.utc).isoformat()
        assert quote_order(c, date).json()["code"] == "INVALID_SCHEDULE"
    assert quote_order(c, "2027-01-01T12:00:00").status_code == 400
    date = datetime.fromtimestamp(clock[0] + 3600, timezone.utc).isoformat()
    q = quote_order(c, date).json()
    o = c.post("/api/v1/orders", json=order_body(q["quote_id"])).json()
    assert o["delivery"]["waiting"] is True
    clock[0] += 3500
    d = c.get(f"/api/v1/orders/{o['id']}/delivery").json()
    assert not d["complete"]
    clock[0] += 100
    assert c.get(f"/api/v1/orders/{o['id']}/delivery").json()["complete"]


def test_now_delivery_refresh_and_advance_isolated(system):
    _, c, clock = system
    first = place(c)
    add(c)
    second = c.post(
        "/api/v1/orders", json=order_body(quote_order(c).json()["quote_id"], "second-order-key")
    ).json()
    clock[0] += 32
    path = f"/api/v1/orders/{first['id']}/delivery"
    assert c.get(path).json()["index"] == 2
    assert c.get(path).json()["index"] == 2
    advanced = c.post(f"/api/v1/orders/{first['id']}/simulation/advance", json={"target": "complete"}).json()
    assert advanced["complete"] and advanced["time_advanced"]
    assert not c.get(f"/api/v1/orders/{second['id']}/delivery").json()["complete"]


def test_ownership_and_session_erasure(system):
    app, c, _ = system
    order = place(c)
    conversation = c.post("/api/v1/assistant/messages", json={"content": "100k cho 2 nguoi"}).json()
    # A separate cookie jar shares the application and DB, not the identity.
    other = TestClient(app)
    other.post("/api/v1/sessions", json={})
    assert other.get("/api/v1/cart").json()["count"] == 0
    assert other.get("/api/v1/orders").json() == []
    for method, route, body in [
        ("GET", "", None),
        ("GET", "/delivery", None),
        ("POST", "/reorder-preview", {}),
        ("POST", "/simulation/advance", {"target": "complete"}),
    ]:
        response = other.request(method, f"/api/v1/orders/{order['id']}{route}", json=body)
        assert response.status_code == 404
    assert (
        other.post(
            "/api/v1/assistant/messages",
            json={"content": "doi mon", "conversation_id": conversation["conversation_id"]},
        ).status_code
        == 404
    )
    assert c.delete("/api/v1/session-data").status_code == 200
    assert c.get("/api/v1/orders").status_code == 401
    assert other.get("/api/v1/cart").status_code == 200
    with app.state.factory() as db:
        assert len(db.scalars(select(Order)).all()) == 0
        assert len(db.scalars(select(Conversation)).all()) == 0


def test_cookie_origin_and_rate_limit(system, monkeypatch):
    app, c, clock = system
    monkeypatch.setenv("COOKIE_SECURE", "true")
    secure = c.post("/api/v1/sessions", json={"renew": True})
    header = secure.headers["set-cookie"].lower()
    assert "httponly" in header and "secure" in header and "samesite=lax" in header
    c.cookies.clear()
    monkeypatch.setenv("COOKIE_SECURE", "false")
    c.post("/api/v1/sessions", json={})
    assert (
        c.post(
            "/api/v1/assistant/messages", json={"content": "100k"}, headers={"origin": "https://evil.example"}
        ).status_code
        == 403
    )
    for _ in range(20):
        assert c.post("/api/v1/assistant/messages", json={"content": "100k cho 2 nguoi"}).status_code == 200
    assert c.post("/api/v1/assistant/messages", json={"content": "100k"}).status_code == 429
    clock[0] += 60
    assert c.post("/api/v1/assistant/messages", json={"content": "100k"}).status_code == 200


def test_expiry_cleanup_and_restart(system, tmp_path):
    app, c, clock = system
    token = c.cookies.get(COOKIE)
    clock[0] += 86401
    assert c.get("/api/v1/cart").json()["code"] == "SESSION_EXPIRED"
    with app.state.factory() as db:
        assert db.get(DemoSession, token) is None
    assert c.post("/api/v1/sessions", json={}).status_code == 401
    assert c.post("/api/v1/sessions", json={"renew": True}).status_code == 200
    new_app = create_app(f"sqlite:///{tmp_path / 'fresh.db'}")
    with TestClient(new_app) as fresh:
        fresh.cookies.set(COOKIE, token)
        assert fresh.get("/api/v1/cart").status_code == 401
        assert len(fresh.get("/api/v1/products").json()) == 30
        assert fresh.post("/api/v1/sessions", json={"renew": True}).status_code == 200


def test_reorder_keeps_cart_until_confirmed(client):
    o = place(client)
    add(client, "tomato")
    p = client.post(f"/api/v1/orders/{o['id']}/reorder-preview").json()
    assert client.get("/api/v1/cart").json()["total"] == 10000
    merged = client.patch(
        "/api/v1/cart",
        json={
            "items": [{"product_id": x["product_id"], "quantity": x["quantity"]} for x in p["items"]],
            "mode": "add",
            "expected_version": p["cart_version"],
        },
    ).json()
    assert merged["total"] == 25000
    assert len(client.get("/api/v1/orders").json()) == 1


def test_schema_in_migration_matches_models(system):
    from alembic.autogenerate import compare_metadata
    from alembic.migration import MigrationContext

    with system[0].state.engine.connect() as connection:
        diffs = compare_metadata(MigrationContext.configure(connection), Base.metadata)
    assert diffs == []


def test_session_is_committed_before_response_leaves_app(tmp_path):
    from http.cookies import SimpleCookie

    app = create_app(f"sqlite:///{tmp_path / 'response-boundary.db'}")

    @app.middleware("http")
    async def inspect_response_boundary(request, call_next):
        response = await call_next(request)
        if request.url.path == "/api/v1/sessions":
            cookie = SimpleCookie(response.headers["set-cookie"])
            with app.state.factory() as observer:
                assert observer.get(DemoSession, cookie[COOKIE].value) is not None
        return response

    with TestClient(app) as client:
        assert client.post("/api/v1/sessions", json={}).status_code == 200
        assert client.get("/api/v1/cart").status_code == 200
