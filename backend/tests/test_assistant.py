import pytest

CASES = [
    ("Hôm nay đi làm về mệt quá, có món nào nấu trong 20 phút không?", "suggestions"),
    ("Tối nay 2 người, khoảng 100k, không biết ăn gì.", "suggestions"),
    ("T muốn nấu gà rang gừng.", "ga-rang-gung"),
    ("Đổi món khác đi, hôm nay không thích cá.", "no-fish"),
    ("Lên cho nhà 3 người bữa cơm khoảng 150k.", "meal"),
    ("T chỉ cần mua thịt bò với cà chua thôi.", "products"),
    ("100k cho 2 nguoi", "suggestions"),
    ("100 nghìn cho 2 người", "suggestions"),
    ("100 ngan cho 2 nguoi", "suggestions"),
    ("Nấu trong 10 phút", "suggestions"),
    ("Nấu trong 15 phút", "suggestions"),
    ("Nấu trong 5 phút", "empty"),
    ("1k cho 2 người", "empty"),
    ("Bữa cơm cho 2 người 100k", "meal"),
    ("Bữa cơm 3 người 150k", "meal"),
    ("Muốn nấu trứng chiên hành", "trung-chien-hanh"),
    ("Muốn nấu đậu hũ sốt cà chua", "dau-hu-sot-ca"),
    ("Muốn nấu canh cải đậu hũ", "canh-cai-dau-hu"),
    ("Muốn nấu mì xào rau củ", "mi-xao-rau"),
    ("Mua cà chua", "products"),
    ("Mua trứng", "products"),
    ("Mua thit bo", "products"),
    ("Hôm nay không thích cá, gợi ý món", "no-fish"),
    ("Gợi ý món cho 7 người", "unsupported"),
    ("Gợi ý món cho 0 người", "unsupported"),
    ("Tôi dị ứng đậu phộng, ăn gì?", "allergy"),
    ("Tôi dị ứng tôm, gợi ý món", "allergy"),
    ("Dự báo thời tiết ngày mai", "unsupported"),
    ("Thay gà bằng nấm", "unsupported"),
    ("Nấu gà rang gừng, nêm nhạt hơn", "variant"),
]


@pytest.mark.parametrize("content,expected", CASES, ids=[f"AI-{i:02d}" for i in range(1, 31)])
def test_assistant_baseline(client, content, expected):
    response = client.post("/api/v1/assistant/messages", json={"content": content})
    assert response.status_code == 200
    result = response.json()
    assert result["mode"] == "rules"
    assert client.get("/api/v1/cart").json()["count"] == 0
    suggestions = result["suggestions"]
    if expected in ["empty", "unsupported", "allergy"]:
        assert suggestions == [] and result["message"]
        if expected == "allergy":
            assert "chưa đủ" in result["message"]
    elif expected == "products":
        assert result["products"] and not suggestions
    else:
        assert suggestions
        if expected == "meal":
            assert len(suggestions[0]["recipes"]) > 1
        elif expected == "no-fish":
            assert all("fish" not in s["selections"][0]["ingredient_ids"] for s in suggestions)
        elif expected == "variant":
            assert suggestions[0]["selections"][0]["variant_id"]
        elif expected != "suggestions":
            assert suggestions[0]["id"] == expected
        for s in suggestions:
            quote = client.post("/api/v1/recipe-quotes", json={"selections": s["selections"]}).json()
            assert quote["total"] == s["total"]
            if result["context"]["budget"] is not None:
                assert s["total"] <= result["context"]["budget"]
            if result["context"]["minutes"] is not None:
                assert s["minutes"] <= result["context"]["minutes"]


def test_context_change_and_history(client):
    first = client.post("/api/v1/assistant/messages", json={"content": "100k cho 2 nguoi, 30 phut"}).json()
    second = client.post(
        "/api/v1/assistant/messages",
        json={
            "content": "Đổi món khác đi, hôm nay không thích cá",
            "conversation_id": first["conversation_id"],
        },
    ).json()
    assert second["context"]["budget"] == 100000
    assert second["context"]["servings"] == 2
    assert second["context"]["minutes"] == 30
    assert "fish" in second["context"]["excluded"]
    assert not set(s["id"] for s in first["suggestions"]).intersection(s["id"] for s in second["suggestions"])
    third = client.post(
        "/api/v1/assistant/messages",
        json={"content": "150k cho 3 nguoi", "conversation_id": first["conversation_id"]},
    ).json()
    assert third["context"]["servings"] == 3 and third["context"]["budget"] == 150000
    assert len(client.get("/api/v1/assistant/conversation").json()["messages"]) == 6


def test_allergy_uncertainty_persists(client):
    client.post("/api/v1/assistant/messages", json={"content": "Tôi dị ứng cá"})
    result = client.post("/api/v1/assistant/messages", json={"content": "đổi món khác"}).json()
    assert result["suggestions"] == []
    assert "an toàn" in result["message"]
    client.delete("/api/v1/assistant/conversation")
    assert client.post("/api/v1/assistant/messages", json={"content": "100k cho 2 người"}).json()[
        "suggestions"
    ]
