
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error

ROOT_DIR = Path(__file__).resolve().parent.parent
RAW_DIR = ROOT_DIR / "data" / "raw"
REPORT_DIR = ROOT_DIR / "reports"

sales = pd.read_csv(
    RAW_DIR / "train.csv",
    parse_dates=["Date"],
)

predictions = pd.read_csv(
    REPORT_DIR / "validation_predictions.csv",
    parse_dates=["Date"],
)

# Recreate the previous-observation baseline
sales = sales.sort_values(["Store", "Dept", "Date"]).copy()
sales["Lag_1"] = (
    sales.groupby(["Store", "Dept"])["Weekly_Sales"]
    .shift(1)
)

comparison = predictions.merge(
    sales[["Store", "Dept", "Date", "Lag_1"]],
    on=["Store", "Dept", "Date"],
    how="left",
    validate="one_to_one",
)

comparison = comparison.dropna(subset=["Lag_1"]).copy()

actual = comparison["Weekly_Sales"]
baseline_pred = comparison["Lag_1"]
model_pred = comparison["Prediction"]

def calculate_metrics(y_true, y_pred):
    mae = mean_absolute_error(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    wape = (
        np.abs(y_true - y_pred).sum() / np.abs(y_true).sum() * 100
    )
    return {"MAE": mae, "RMSE": rmse, "WAPE (%)": wape}

results = pd.DataFrame({
    "Baseline": calculate_metrics(actual, baseline_pred),
    "Gradient Boosting": calculate_metrics(actual, model_pred),
}).T

print("\n===== FAIRER MODEL COMPARISON =====")
print(results.round(2))
print("\nComparable validation rows:", len(comparison))

results.to_csv(REPORT_DIR / "model_comparison.csv")
print("\nSaved report to reports/model_comparison.csv")


# Error analysis by store
comparison["Baseline_Error"] = (
    comparison["Weekly_Sales"] - comparison["Lag_1"]
).abs()

comparison["Model_Error"] = (
    comparison["Weekly_Sales"] - comparison["Prediction"]
).abs()

store_errors = (
    comparison.groupby("Store")[["Baseline_Error", "Model_Error"]]
    .mean()
    .sort_values("Baseline_Error", ascending=False)
)

print("\n===== 10 STORES WITH HIGHEST BASELINE ERROR =====")
print(store_errors.head(10).round(2))

# Error analysis by department
dept_errors = (
    comparison.groupby("Dept")[["Baseline_Error", "Model_Error"]]
    .mean()
    .sort_values("Baseline_Error", ascending=False)
)

print("\n===== 10 DEPARTMENTS WITH HIGHEST BASELINE ERROR =====")
print(dept_errors.head(10).round(2))

store_errors.to_csv(REPORT_DIR / "store_error_analysis.csv")
dept_errors.to_csv(REPORT_DIR / "department_error_analysis.csv")


# Compare errors by store
store_wins = store_errors.assign(
    Model_Better=lambda x: x["Model_Error"] < x["Baseline_Error"]
)

print("\n===== STORE-LEVEL MODEL WINS =====")
print("Stores where model has lower MAE:",
      int(store_wins["Model_Better"].sum()), "out of", len(store_wins))

# Compare errors by department
dept_wins = dept_errors.assign(
    Model_Better=lambda x: x["Model_Error"] < x["Baseline_Error"]
)

print("\n===== DEPARTMENT-LEVEL MODEL WINS =====")
print("Departments where model has lower MAE:",
      int(dept_wins["Model_Better"].sum()), "out of", len(dept_wins))
