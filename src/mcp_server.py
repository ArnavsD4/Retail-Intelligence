import sys
from pathlib import Path
import joblib
import pandas as pd


# Ensure the project root is available for Python imports.
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from mcp.server.fastmcp import FastMCP
from src.inventory import calculate_inventory_recommendation
from src.rag import build_knowledge_base, search_documents
from src.llm import explain_inventory_recommendation

mcp = FastMCP("Retail Intelligence")

# Load the retail policy knowledge base once at startup.
chunks, embeddings = build_knowledge_base()

# Load the trained demand forecasting model once at startup.
MODEL_PATH = PROJECT_ROOT / "models" / "demand_model.joblib"
FORECAST_MODEL = joblib.load(MODEL_PATH)

RAW_DIR = PROJECT_ROOT / "data" / "raw"
SALES_DATA = pd.read_csv(RAW_DIR / "train.csv", parse_dates=["Date"])
FEATURES_DATA = pd.read_csv(
    RAW_DIR / "features.csv",
    parse_dates=["Date"],
)
STORES_DATA = pd.read_csv(RAW_DIR / "stores.csv")


@mcp.tool()
def analyze_inventory(
    forecast_weekly_demand: float,
    current_stock: float,
    lead_time_days: int,
    review_period_days: int = 7,
    safety_stock: int = 0,
) -> dict:
    """Calculate reorder quantity, target stock, days of cover,
    and stockout risk for a retail product."""

    return calculate_inventory_recommendation(
        forecast_demand=forecast_weekly_demand,
        current_stock=current_stock,
        lead_time_days=lead_time_days,
        review_period_days=review_period_days,
        safety_stock=safety_stock,
    )


@mcp.tool()
def search_retail_policies(query: str, top_k: int = 3) -> list[dict]:
    """Search the local retail policy knowledge base using RAG."""

    if not query.strip():
        raise ValueError("Query cannot be empty.")

    if not 1 <= top_k <= 5:
        raise ValueError("top_k must be between 1 and 5.")

    results = search_documents(
        query=query,
        chunks=chunks,
        embeddings=embeddings,
        top_k=top_k,
    )

    return [
        {
            "source": result.get("source"),
            "heading": result.get("heading"),
            "score": result.get("score"),
            "text": result.get("text"),
        }
        for result in results
    ]

@mcp.tool()
def forecast_demand(
    store: int,
    department: int,
    forecast_date: str,
) -> dict:
    """
    Predict weekly sales for a store and department on a date
    present in the Walmart dataset, using only earlier sales
    for lag features.
    """
    target_date = pd.to_datetime(forecast_date, errors="raise")

    # Find historical observations for this store and department.
    history = SALES_DATA[
        (SALES_DATA["Store"] == store)
        & (SALES_DATA["Dept"] == department)
        & (SALES_DATA["Date"] < target_date)
    ].sort_values("Date")

    if len(history) < 4:
        raise ValueError(
            "At least four earlier sales observations are required."
        )

    # Require the requested date to exist in the Walmart features dataset.
    future_features = FEATURES_DATA[
        (FEATURES_DATA["Store"] == store)
        & (FEATURES_DATA["Date"] == target_date)
    ].copy()

    if future_features.empty:
        raise ValueError(
            "No Walmart feature record exists for this store and date."
        )

    store_info = STORES_DATA[STORES_DATA["Store"] == store]

    if store_info.empty:
        raise ValueError(f"Store {store} was not found.")

    # The final available historical sales values generate lag features.
    sales_values = history["Weekly_Sales"].tail(4).to_numpy()

    lag_1 = float(sales_values[-1])
    lag_4 = float(sales_values[0])
    rolling_mean_4 = float(sales_values.mean())

    row = future_features.iloc[0].to_dict()
    row.update(store_info.iloc[0].to_dict())

    row["Dept"] = department
    row["Year"] = target_date.year
    row["Month"] = target_date.month
    row["Week"] = int(target_date.isocalendar().week)
    row["Lag_1"] = lag_1
    row["Lag_4"] = lag_4
    row["Rolling_Mean_4"] = rolling_mean_4

    feature_columns = [
        "Store", "Dept", "Size", "Temperature", "Fuel_Price",
        "MarkDown1", "MarkDown2", "MarkDown3", "MarkDown4",
        "MarkDown5", "CPI", "Unemployment", "Year", "Month",
        "Week", "Lag_1", "Lag_4", "Rolling_Mean_4", "Type",
    ]

    missing_columns = [
        column for column in feature_columns if column not in row
    ]

    if missing_columns:
        raise ValueError(
            f"Required forecast features are missing: {missing_columns}"
        )

    input_df = pd.DataFrame(
        [{column: row[column] for column in feature_columns}]
    )

    prediction = float(FORECAST_MODEL.predict(input_df)[0])

    return {
        "store": store,
        "department": department,
        "forecast_date": target_date.date().isoformat(),
        "predicted_weekly_sales": round(prediction, 2),
        "currency": "USD",
        "model": "HistGradientBoostingRegressor",
        "note": (
            "Prediction represents weekly sales revenue in USD, "
            "not physical product demand in units. Inventory "
            "recommendations require a compatible demand measure."
        ),       
    }



@mcp.tool()
def analyze_store_inventory(
    store: int,
    department: int,
    forecast_date: str,
    current_stock: float,
    lead_time_days: int,
    review_period_days: int = 7,
    safety_stock: int = 0,
    weekly_demand_units: float = 0,
) -> dict:
    """Forecast sales revenue and calculate inventory only from explicit unit demand."""

    # Step 1: Forecast sales revenue in USD.
    forecast = forecast_demand(
        store=store,
        department=department,
        forecast_date=forecast_date,
    )

    # Step 2: Only calculate physical inventory when unit demand is provided.
    if weekly_demand_units <= 0:
        return {
            "forecast": forecast,
            "inventory_recommendation": None,
            "message": (
                "The model predicts weekly sales revenue in USD, not "
                "physical units. Provide a positive weekly_demand_units "
                "value to calculate a physical inventory recommendation."
            ),
        }

    # Step 3: Calculate inventory from compatible unit-demand input.
    inventory = calculate_inventory_recommendation(
        forecast_demand=weekly_demand_units,
        current_stock=current_stock,
        lead_time_days=lead_time_days,
        review_period_days=review_period_days,
        safety_stock=safety_stock,
    )

    # Step 4: Explain the inventory calculation using retail policies.
    explanation_result = explain_inventory_recommendation(inventory)

    return {
        "forecast": forecast,
        "inventory_recommendation": inventory,
        "ai_explanation": explanation_result["explanation"],
        "policy_sources": explanation_result["sources"],
    }




if __name__ == "__main__":
    mcp.run(transport="stdio")
