
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from src.inventory import calculate_inventory_recommendation

app = FastAPI(
    title="Retail Intelligence API",
    description="Demand forecasting and inventory recommendations",
    version="0.1.0",
)


class InventoryRequest(BaseModel):
    forecast_weekly_demand: float = Field(gt=0)
    current_stock: float = Field(ge=0)
    lead_time_days: int = Field(gt=0)
    review_period_days: int = Field(gt=0)


@app.get("/")
def home():
    return {
        "message": "Retail Intelligence API is running",
        "status": "healthy",
    }


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/inventory/recommend")
def recommend_inventory(request: InventoryRequest):
    try:
        result = calculate_inventory_recommendation(
            forecast_demand=request.forecast_weekly_demand,
            current_stock=request.current_stock,
            lead_time_days=request.lead_time_days,
            review_period_days=request.review_period_days,
        )
        
        return result
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
