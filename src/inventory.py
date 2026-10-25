
import math


def calculate_inventory_recommendation(
    forecast_demand: float,
    current_stock: int,
    lead_time_days: int,
    review_period_days: int = 7,
    safety_stock: int = 0,
) -> dict:
    """
    Calculate a basic inventory reorder recommendation.

    forecast_demand: Expected demand per week.
    current_stock: Units currently available.
    lead_time_days: Supplier delivery time in days.
    review_period_days: Days until the next inventory review.
    safety_stock: Extra units kept as a buffer.
    """
    if forecast_demand < 0:
        raise ValueError("Forecast demand cannot be negative.")

    if current_stock < 0:
        raise ValueError("Current stock cannot be negative.")

    if lead_time_days < 0 or review_period_days < 0:
        raise ValueError("Lead time and review period cannot be negative.")

    if safety_stock < 0:
        raise ValueError("Safety stock cannot be negative.")

    # Convert weekly forecast to expected daily demand.
    daily_demand = forecast_demand / 7

    # Stock needed to cover supplier lead time and review period.
    protection_days = lead_time_days + review_period_days
    expected_demand = daily_demand * protection_days

    # Target stock includes a safety buffer.
    target_stock = math.ceil(expected_demand + safety_stock)

    # Reorder only if current stock is below the target.
    reorder_quantity = max(0, target_stock - current_stock)

    # Estimate whether stock will run out before replenishment.
    if daily_demand == 0:
        days_of_cover = None
        stockout_risk = "Low"
    else:
        days_of_cover = current_stock / daily_demand

        if days_of_cover < lead_time_days:
            stockout_risk = "High"
        elif days_of_cover < protection_days:
            stockout_risk = "Medium"
        else:
            stockout_risk = "Low"

    return {
        "forecast_weekly_demand": round(forecast_demand, 2),
        "current_stock": current_stock,
        "daily_demand": round(daily_demand, 2),
        "days_of_cover": (
            round(days_of_cover, 2)
            if days_of_cover is not None
            else None
        ),
        "target_stock": target_stock,
        "reorder_quantity": reorder_quantity,
        "stockout_risk": stockout_risk,
        "reorder_required": reorder_quantity > 0,
    }


if __name__ == "__main__":
    result = calculate_inventory_recommendation(
        forecast_demand=700,
        current_stock=450,
        lead_time_days=5,
        review_period_days=7,
        safety_stock=50,
    )

    for key, value in result.items():
        print(f"{key}: {value}")
