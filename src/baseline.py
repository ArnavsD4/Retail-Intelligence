
from pathlib import Path
import pandas as pd
import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error

ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = ROOT_DIR / "data" / "processed" / "sales_features.csv"

df = pd.read_csv(DATA_PATH, parse_dates=["Date"])
df = df.sort_values("Date").copy()

# Use the final part of the timeline for validation
unique_dates = np.sort(df["Date"].unique())
split_index = int(len(unique_dates) * 0.8)
split_date = unique_dates[split_index]

train = df[df["Date"] < split_date].copy()
valid = df[df["Date"] >= split_date].copy()

# Baseline prediction: previous available observation
valid = valid.dropna(subset=["Lag_1"]).copy()
valid["Prediction"] = valid["Lag_1"]

mae = mean_absolute_error(
    valid["Weekly_Sales"], valid["Prediction"]
)
rmse = np.sqrt(mean_squared_error(
    valid["Weekly_Sales"], valid["Prediction"]
))

print("===== BASELINE RESULTS =====")
print("Training rows:", len(train))
print("Validation rows:", len(valid))
print("Validation starts:", split_date)
print(f"MAE: ${mae:,.2f}")
print(f"RMSE: ${rmse:,.2f}")
