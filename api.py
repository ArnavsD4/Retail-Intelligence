
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware

from src.inventory import calculate_inventory_recommendation
from src.llm import answer_retail_question, explain_inventory_recommendation
from src.mcp_server import forecast_demand


app = FastAPI(
    title="Retail Intelligence API",
    description=(
        "Sales revenue forecasting, inventory recommendations, "
        "and retail policy Q&A"
    ),
    version="0.3.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


class InventoryRequest(BaseModel):
    # Physical demand, not sales revenue.
    forecast_weekly_demand: float = Field(gt=0)
    current_stock: float = Field(ge=0)
    lead_time_days: int = Field(gt=0)
    review_period_days: int = Field(gt=0)


class InventoryAnalysisRequest(InventoryRequest):
    safety_stock: int = Field(default=0, ge=0)


class ForecastRequest(BaseModel):
    store: int = Field(gt=0)
    department: int = Field(gt=0)
    forecast_date: str = Field(min_length=10, max_length=10)


class RetailQuestionRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)


@app.get("/")
def home():
    return {
        "message": "Retail Intelligence API is running",
        "status": "healthy",
    }


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/forecast")
def forecast_sales(request: ForecastRequest):
    try:
        return forecast_demand(
            store=request.store,
            department=request.department,
            forecast_date=request.forecast_date,
        )
    except (ValueError, KeyError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/inventory/recommend")
def recommend_inventory(request: InventoryRequest):
    try:
        return calculate_inventory_recommendation(
            forecast_demand=request.forecast_weekly_demand,
            current_stock=request.current_stock,
            lead_time_days=request.lead_time_days,
            review_period_days=request.review_period_days,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/inventory/analyze")
def analyze_inventory(request: InventoryAnalysisRequest):
    try:
        inventory_result = calculate_inventory_recommendation(
            forecast_demand=request.forecast_weekly_demand,
            current_stock=request.current_stock,
            lead_time_days=request.lead_time_days,
            review_period_days=request.review_period_days,
            safety_stock=request.safety_stock,
        )
        return explain_inventory_recommendation(inventory_result)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        print(f"Inventory analysis failed: {type(exc).__name__}: {exc}")
        raise HTTPException(
            status_code=502,
            detail="Unable to generate inventory explanation right now.",
        ) from exc


@app.post("/ask")
def ask_retail_question(request: RetailQuestionRequest):
    try:
        return answer_retail_question(request.question)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        print(f"RAG request failed: {type(exc).__name__}: {exc}")
        raise HTTPException(
            status_code=502,
            detail="Unable to generate an answer right now. Please try again.",
        ) from exc
