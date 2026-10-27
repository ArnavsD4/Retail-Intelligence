
from src.mcp_server import analyze_inventory, search_retail_policies


def test_mcp_inventory_tool():
    result = analyze_inventory(
        forecast_weekly_demand=700,
        current_stock=450,
        lead_time_days=5,
        review_period_days=7,
        safety_stock=50,
    )

    assert result["daily_demand"] == 100
    assert result["target_stock"] == 1250
    assert result["reorder_quantity"] == 800
    assert result["stockout_risk"] == "High"
    assert result["reorder_required"] is True


def test_mcp_policy_search_tool():
    results = search_retail_policies(
        query="How should a retailer decide when to reorder stock?",
        top_k=3,
    )

    assert len(results) == 3
    assert all(result["source"] for result in results)
    assert any(
        "Reorder Planning" in result.get("heading", "")
        for result in results
    )


from src.mcp_server import analyze_store_inventory


def test_inventory_without_unit_demand_returns_no_recommendation():
    result = analyze_store_inventory(
        store=1,
        department=1,
        forecast_date="2012-11-02",
        current_stock=20000,
        lead_time_days=7,
    )

    assert result["forecast"]["currency"] == "USD"
    assert result["inventory_recommendation"] is None
    assert "weekly_demand_units" in result["message"]


def test_inventory_with_unit_demand_returns_recommendation():
    result = analyze_store_inventory(
        store=1,
        department=1,
        forecast_date="2012-11-02",
        current_stock=20000,
        lead_time_days=7,
        review_period_days=7,
        safety_stock=1000,
        weekly_demand_units=5000,
    )

    inventory = result["inventory_recommendation"]

    assert inventory is not None
    assert inventory["forecast_weekly_demand"] == 5000
    assert inventory["target_stock"] == 11000
    assert inventory["reorder_quantity"] == 0
    assert result["forecast"]["currency"] == "USD"


def test_zero_unit_demand_does_not_create_inventory_recommendation():
    result = analyze_store_inventory(
        store=1,
        department=1,
        forecast_date="2012-11-02",
        current_stock=20000,
        lead_time_days=7,
        weekly_demand_units=0,
    )

    assert result["inventory_recommendation"] is None
    assert result["forecast"]["currency"] == "USD"
