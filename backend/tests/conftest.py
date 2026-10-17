import pytest
from fastapi.testclient import TestClient

from backend.app.main import create_app


@pytest.fixture
def system(tmp_path):
    clock = [1800000000]
    app = create_app(f"sqlite:///{tmp_path / 'test.db'}", clock=lambda: clock[0])
    with TestClient(app) as client:
        assert client.post("/api/v1/sessions", json={}).status_code == 200
        yield app, client, clock


@pytest.fixture
def client(system):
    return system[1]


def add(client, pid="eggs", quantity=1):
    version = client.get("/api/v1/cart").json()["version"]
    return client.patch(
        "/api/v1/cart",
        json={
            "items": [{"product_id": pid, "quantity": quantity}],
            "mode": "add",
            "expected_version": version,
        },
    )


def quote_order(client, scheduled=None):
    return client.post(
        "/api/v1/checkout/quote",
        json={"delivery_mode": "scheduled" if scheduled else "now", "scheduled_at": scheduled},
    )


def order_body(quote_id, key="demo-order-key-0001"):
    return {
        "quote_id": quote_id,
        "idempotency_key": key,
        "address": {"building": "Chung cư mẫu", "tower": "A", "floor": "12", "apartment": "1208"},
        "contact": "Khách demo",
    }


def place(client, scheduled=None):
    add(client)
    q = quote_order(client, scheduled).json()
    return client.post("/api/v1/orders", json=order_body(q["quote_id"])).json()
