
from unittest.mock import patch

from fastapi.testclient import TestClient

from api import app

client = TestClient(app)


def test_inventory_analyze_returns_calculation_and_explanation():
    fake_explanation = {
        "inventory": {
            "forecast_weekly_demand": 700,
            "current_stock": 450,
            "daily_demand": 100,
            "days_of_cover": 4.5,
            "target_stock": 1250,
            "reorder_quantity": 800,
            "stockout_risk": "High",
            "reorder_required": True,
        },
        "explanation": "Reorder stock because inventory cover is low.",
        "sources": [
            {
                "source": "retail_policies.md",
                "section": "Policy 2: Stockout Risk",
                "similarity": 0.691,
            }
        ],
    }

    payload = {
        "forecast_weekly_demand": 700,
        "current_stock": 450,
        "lead_time_days": 5,
        "review_period_days": 7,
        "safety_stock": 50,
    }

    with patch(
        "api.explain_inventory_recommendation",
        return_value=fake_explanation,
    ) as mock_explain:
        response = client.post("/inventory/analyze", json=payload)

    assert response.status_code == 200

    body = response.json()
    assert body["inventory"]["target_stock"] == 1250
    assert body["inventory"]["reorder_quantity"] == 800
    assert body["inventory"]["stockout_risk"] == "High"
    assert body["explanation"] == fake_explanation["explanation"]
    assert body["sources"][0]["section"] == "Policy 2: Stockout Risk"

    mock_explain.assert_called_once()


def test_inventory_analyze_rejects_negative_safety_stock():
    payload = {
        "forecast_weekly_demand": 700,
        "current_stock": 450,
        "lead_time_days": 5,
        "review_period_days": 7,
        "safety_stock": -10,
    }

    response = client.post("/inventory/analyze", json=payload)

    assert response.status_code == 422


def test_inventory_analyze_handles_explanation_failure():
    payload = {
        "forecast_weekly_demand": 700,
        "current_stock": 450,
        "lead_time_days": 5,
        "review_period_days": 7,
        "safety_stock": 50,
    }

    with patch(
        "api.explain_inventory_recommendation",
        side_effect=RuntimeError("Simulated provider failure"),
    ):
        response = client.post("/inventory/analyze", json=payload)

    assert response.status_code == 502
    assert "Unable to generate inventory explanation" in response.json()["detail"]
