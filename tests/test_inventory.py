
import pytest

from src.inventory import calculate_inventory_recommendation


def test_high_stockout_risk():
    result = calculate_inventory_recommendation(
        forecast_demand=700,
        current_stock=450,
        lead_time_days=5,
        safety_stock=50,
    )

    assert result["stockout_risk"] == "High"
    assert result["reorder_quantity"] == 800
    assert result["reorder_required"] is True


def test_low_stockout_risk():
    result = calculate_inventory_recommendation(
        forecast_demand=700,
        current_stock=2000,
        lead_time_days=5,
        safety_stock=50,
    )

    assert result["stockout_risk"] == "Low"
    assert result["reorder_quantity"] == 0
    assert result["reorder_required"] is False


def test_zero_demand():
    result = calculate_inventory_recommendation(
        forecast_demand=0,
        current_stock=100,
        lead_time_days=5,
    )

    assert result["daily_demand"] == 0
    assert result["stockout_risk"] == "Low"
    assert result["days_of_cover"] is None


def test_negative_stock_rejected():
    with pytest.raises(ValueError):
        calculate_inventory_recommendation(
            forecast_demand=700,
            current_stock=-10,
            lead_time_days=5,
        )


def test_medium_stockout_risk():
    result = calculate_inventory_recommendation(
        forecast_demand=700,
        current_stock=800,
        lead_time_days=5,
    )

    assert result["stockout_risk"] == "Medium"
    assert result["reorder_quantity"] == 400
