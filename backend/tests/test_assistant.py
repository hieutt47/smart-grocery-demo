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


def test_gemini_provider_fallback_on_error(system):
    from unittest.mock import patch

    from backend.app.gemini import GeminiProvider

    app, _, _ = system
    with app.state.factory.begin() as db:
        provider = GeminiProvider(api_key="fake-key")
        with patch("backend.app.gemini.call_gemini", return_value=None):
            result = provider.recommend(db, "100k cho 2 người", {})
            assert result["mode"] == "rules"
            assert len(result["suggestions"]) > 0


def test_gemini_provider_success(system):
    from unittest.mock import patch

    from backend.app.gemini import GeminiProvider

    app, _, _ = system
    mock_llm = {
        "message": "Gợi ý bữa cơm ấm cúng cho 2 người với gà rang gừng thơm phức!",
        "intent": "dish",
        "selected_ids": ["ga-rang-gung"],
        "servings": 2,
        "budget": 100000,
        "minutes": 30,
        "excluded": [],
        "lighter": False,
    }
    with app.state.factory.begin() as db:
        provider = GeminiProvider(api_key="fake-key")
        with patch("backend.app.gemini.call_gemini", return_value=mock_llm):
            result = provider.recommend(db, "muốn nấu gà rang gừng cho 2 người", {})
            assert result["mode"] == "gemini"
            assert len(result["suggestions"]) == 1
            assert result["suggestions"][0]["id"] == "ga-rang-gung"
            assert result["suggestions"][0]["total"] > 0
            assert "gà rang gừng" in result["message"]


def test_gemini_provider_allergy_safety(system):
    from unittest.mock import patch

    from backend.app.gemini import GeminiProvider

    app, _, _ = system
    with app.state.factory.begin() as db:
        provider = GeminiProvider(api_key="fake-key")
        # Untracked high-risk allergen (peanuts) must still trigger deterministic refusal
        peanuts = provider.recommend(db, "tôi dị ứng đậu phộng, ăn gì?", {})
        assert peanuts["mode"] == "gemini"
        assert peanuts["suggestions"] == []

        # Tracked DB allergen (shrimp -> shellfish) records into memory and filters unsafe picks
        mock_llm = {
            "message": "Mình đã ghi nhận dị ứng hải sản và gợi ý món an toàn nhé.",
            "intent": "dish",
            "selected_ids": ["tom-rim-man-ngot", "ga-rang-gung"],
            "servings": 2,
            "excluded": [],
            "lighter": False,
        }
        with patch("backend.app.gemini.call_gemini", return_value=mock_llm):
            shrimp = provider.recommend(db, "tôi dị ứng tôm, ăn gì?", {})
            assert "shellfish" in shrimp["context"]["memory"]["allergies"]
            assert shrimp["health_advisory"]
            # tom-rim-man-ngot must be filtered out while ga-rang-gung passes safely
            assert [s["id"] for s in shrimp["suggestions"]] == ["ga-rang-gung"]


def test_agent_tools_search_and_ingredients(system):
    from backend.app.gemini import tool_get_available_ingredients, tool_search_catalog_recipes

    app, _, _ = system
    with app.state.factory.begin() as db:
        ings = tool_get_available_ingredients(db)
        assert ings["count"] == 48
        found = tool_search_catalog_recipes(db, query="uc ga", max_minutes=20)
        assert found["count"] >= 1
        assert all(r["minutes"] <= 20 for r in found["recipes"])
        no_fish = tool_search_catalog_recipes(db, exclude_ingredients=["fish", "basa-fish"])
        assert all(
            "fish" not in r["ingredients"] and "basa-fish" not in r["ingredients"] for r in no_fish["recipes"]
        )


def test_tool_build_custom_recipe_validation_and_pricing(system):
    from backend.app.gemini import tool_build_custom_recipe

    app, _, _ = system
    with app.state.factory.begin() as db:
        bad = tool_build_custom_recipe(
            db,
            name="Món lỗi",
            minutes=15,
            ingredients=[{"ingredient_id": "thit-rong", "quantity": 200}],
            steps=["Nấu"],
        )
        assert "error" in bad

        good = tool_build_custom_recipe(
            db,
            name="Ức gà hấp bông cải ít muối",
            minutes=15,
            emoji="🥦",
            tags=["eat-clean", "ít muối"],
            ingredients=[
                {"ingredient_id": "chicken-breast", "quantity": 250},
                {"ingredient_id": "broccoli", "quantity": 200},
                {"ingredient_id": "salt", "quantity": 2},
            ],
            steps=["Sơ chế ức gà và bông cải.", "Hấp chín khoảng 12 phút."],
            health_note="Hấp không dầu mỡ, hạn chế muối cho người tim mạch.",
            servings=2,
            pantry=["salt"],
        )
        assert good["status"] == "ok"
        assert good["custom_recipe_id"].startswith("custom-")
        assert good["recipe"]["is_custom"] is True
        # chicken-breast (32k) + broccoli (15k), salt subtracted via pantry
        assert good["estimated_total_vnd"] == 47000


def test_gemini_provider_custom_recipe_and_advisory(system):
    from unittest.mock import patch

    from backend.app.gemini import GeminiProvider, tool_build_custom_recipe

    app, _, _ = system
    with app.state.factory.begin() as db:
        built = tool_build_custom_recipe(
            db,
            name="Cá basa hấp gừng ít muối",
            minutes=15,
            ingredients=[
                {"ingredient_id": "basa-fish", "quantity": 250},
                {"ingredient_id": "ginger", "quantity": 15},
            ],
            steps=["Hấp cá basa với gừng 12 phút."],
            health_note="Ít natri, phù hợp người tim mạch.",
        )
        cid = built["custom_recipe_id"]
        mock_llm = {
            "message": "Mình đã thiết kế riêng món hấp ít muối cho người tim mạch nhé!",
            "intent": "dish",
            "selected_ids": [cid],
            "servings": 2,
            "excluded": [],
            "lighter": True,
            "health_advisory": "Giảm tối đa muối/nước mắm khi nêm và tránh chiên rán.",
            "_custom_recipes": {cid: built},
        }
        provider = GeminiProvider(api_key="fake-key")
        with patch("backend.app.gemini.call_gemini", return_value=mock_llm):
            result = provider.recommend(db, "nhà có người đau tim, tối ăn gì?", {})
            assert result["mode"] == "gemini"
            assert result["health_advisory"]
            assert result["suggestions"][0]["id"] == cid
            assert result["suggestions"][0]["recipes"][0]["is_custom"] is True


def test_gemini_provider_forwards_chat_history_without_persisting(system):
    from unittest.mock import patch

    from backend.app.gemini import GeminiProvider

    app, _, _ = system
    captured = {}

    def fake_call(api_key, model, prompt, context, candidates_text="", db=None, timeout=7):
        captured["history"] = context.get("history")
        return {
            "message": "Nhớ thông tin bệnh tim ở tin trước, mình gợi ý món hấp nhẹ nhé!",
            "intent": "dish",
            "selected_ids": ["ca-basa-hap-gung"],
            "servings": 2,
            "excluded": [],
            "lighter": True,
            "health_advisory": "Giữ chế độ ít muối như đã trao đổi.",
        }

    with app.state.factory.begin() as db:
        provider = GeminiProvider(api_key="fake-key")
        with patch("backend.app.gemini.call_gemini", side_effect=fake_call):
            result = provider.recommend(
                db,
                "Thế tối nay nấu món gì nhanh 15 phút?",
                {"history": [{"role": "user", "text": "Nhà tôi có người bị đau tim"}]},
            )
            assert captured["history"] == [{"role": "user", "text": "Nhà tôi có người bị đau tim"}]
            assert "history" not in result["context"]
            assert result["suggestions"][0]["id"] == "ca-basa-hap-gung"


def test_dual_memory_persists_across_many_turns_and_office_lunch_tool(system):
    from unittest.mock import patch

    from backend.app.gemini import GeminiProvider, tool_search_office_lunch

    app, c, _ = system
    lunch_res = tool_search_office_lunch(max_price=55000, eat_clean_only=True)
    assert lunch_res["count"] >= 1
    assert all(x["price"] <= 55000 for x in lunch_res["lunches"])

    with app.state.factory.begin() as db:
        provider = GeminiProvider(api_key="fake-key")
        turn1_llm = {
            "message": "Đã ghi nhận tim mạch!",
            "intent": "dish",
            "selected_ids": ["ca-basa-hap-gung"],
            "servings": 2,
            "memory_updates": {"add": {"health_conditions": ["tim mạch"], "diet_goals": ["ít muối"]}},
        }
        with patch("backend.app.gemini.call_gemini", return_value=turn1_llm):
            r1 = provider.recommend(db, "Nhà có người đau tim", {})
            ctx = r1["context"]
        assert "tim mạch" in ctx["memory"]["health_conditions"]

        # Simulate 12 subsequent turns -> memory must remain intact
        for idx in range(12):
            turn_n_llm = {
                "message": f"Gợi ý lượt {idx}",
                "intent": "dish",
                "selected_ids": ["uc-ga-ap-chao-bong-cai"],
                "servings": 2,
            }
            with patch("backend.app.gemini.call_gemini", return_value=turn_n_llm):
                rn = provider.recommend(db, "Đổi món khác", ctx)
                ctx = rn["context"]
        assert "tim mạch" in ctx["memory"]["health_conditions"]
        assert "ít muối" in ctx["memory"]["diet_goals"]

        # Office lunch intent inside chat
        lunch_llm = {
            "message": "Trưa nay ăn nhẹ nhàng ngoài quán nhé!",
            "intent": "office_lunch",
            "selected_lunch_ids": ["lunch-salad-uc-ga"],
            "servings": 1,
        }
        with patch("backend.app.gemini.call_gemini", return_value=lunch_llm):
            rl = provider.recommend(db, "Trưa ăn ngoài văn phòng gì nhẹ bụng?", ctx)
            assert rl["lunch_suggestions"][0]["id"] == "lunch-salad-uc-ga"


def test_custom_recipe_persists_in_db_for_sharing(system):
    from backend.app.gemini import tool_build_custom_recipe

    app, c, _ = system
    with app.state.factory.begin() as db:
        built = tool_build_custom_recipe(
            db,
            name="Ức gà hấp bí đỏ ít muối",
            minutes=15,
            ingredients=[
                {"ingredient_id": "chicken-breast", "quantity": 250},
                {"ingredient_id": "pumpkin", "quantity": 200},
            ],
            steps=["Hấp chín ức gà và bí đỏ 12 phút."],
        )
        cid = built["custom_recipe_id"]
        assert built["estimated_kcal"] > 0

    # New anonymous client without cookies can still open the shared custom recipe URL
    c.cookies.clear()
    res = c.get(f"/api/v1/recipes/{cid}")
    assert res.status_code == 200
    data = res.json()
    assert data["is_custom"] is True
    assert data["estimated_kcal"] > 0


def test_taste_profile_ranking_and_general_advisory_intent(system):
    from unittest.mock import patch

    from backend.app.gemini import GeminiProvider, build_dynamic_candidates

    app, _, _ = system
    with app.state.factory.begin() as db:
        candidates = build_dynamic_candidates(
            db,
            "Hôm nay ăn gì?",
            {
                "servings": 2,
                "taste_profile": {
                    "persona": "fit_eatclean",
                    "liked_tags": ["gà"],
                    "disliked_ingredients": ["fish", "basa-fish"],
                    "tag_scores": {"eat-clean": 10, "gà": 8},
                },
            },
            limit=10,
        )
        assert "uc-ga" in candidates
        assert "ca-thu-kho" not in candidates
        assert "ca-basa" not in candidates

        provider = GeminiProvider(api_key="fake-key")
        general_llm = {
            "message": "Người bị tim mạch nên hạn chế thực phẩm nhiều muối, mỡ động vật và đồ chiên rán.",
            "intent": "general",
            "selected_ids": [],
            "servings": 2,
            "health_advisory": "Lưu ý giảm lượng natri dưới 2000mg/ngày.",
        }
        with patch("backend.app.gemini.call_gemini", return_value=general_llm):
            gen_res = provider.recommend(db, "Người bị đau tim nên kiêng ăn những thực phẩm gì?", {})
            assert gen_res["mode"] == "gemini"
            assert gen_res["suggestions"] == []
            assert "muối" in gen_res["message"]

        dish_with_reason_llm = {
            "message": "Mình chọn món ức gà Eat Clean chuẩn gu của bạn!",
            "intent": "dish",
            "selected_ids": ["uc-ga-ap-chao-bong-cai"],
            "reasons": {
                "uc-ga-ap-chao-bong-cai": "Giàu đạm, ít chất béo và nấu nhanh 15 phút hợp gu Eat Clean của bạn."
            },
            "servings": 2,
        }
        with patch("backend.app.gemini.call_gemini", return_value=dish_with_reason_llm):
            dish_res = provider.recommend(
                db,
                "Tối nay ăn gì?",
                {
                    "taste_profile": {
                        "persona": "maternity_care",
                        "health_notes": ["pregnancy", "stomach"],
                        "disliked_ingredients": ["shrimp"],
                    }
                },
            )
            assert "Eat Clean" in dish_res["suggestions"][0]["reason"]
            assert dish_res["context"]["memory"]["pregnancy"] is True
            assert "đau dạ dày" in dish_res["context"]["memory"]["health_conditions"]
            assert "shellfish" in dish_res["context"]["memory"]["allergies"]
            assert dish_res["health_advisory"] and "Mẹ bầu" in dish_res["health_advisory"]
