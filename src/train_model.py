
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.impute import SimpleImputer
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OrdinalEncoder
import joblib

ROOT_DIR = Path(__file__).resolve().parent.parent
RAW_DIR = ROOT_DIR / "data" / "raw"
REPORT_DIR = ROOT_DIR / "reports"
REPORT_DIR.mkdir(parents=True, exist_ok=True)

# 1. Load datasets
sales = pd.read_csv(RAW_DIR / "train.csv", parse_dates=["Date"])
features = pd.read_csv(RAW_DIR / "features.csv", parse_dates=["Date"])
stores = pd.read_csv(RAW_DIR / "stores.csv")

# 2. Merge sales with external features and store information
df = sales.merge(
    features,
    on=["Store", "Date", "IsHoliday"],
    how="left",
    validate="many_to_one",
)

df = df.merge(
    stores,
    on="Store",
    how="left",
    validate="many_to_one",
)

df = df.sort_values(["Store", "Dept", "Date"]).copy()

# 3. Calendar features
df["Year"] = df["Date"].dt.year
df["Month"] = df["Date"].dt.month
df["Week"] = df["Date"].dt.isocalendar().week.astype(int)

# 4. Lag features calculated within each store-department series
grouped = df.groupby(["Store", "Dept"])["Weekly_Sales"]
df["Lag_1"] = grouped.shift(1)
df["Lag_4"] = grouped.shift(4)

df["Rolling_Mean_4"] = (
    df.groupby(["Store", "Dept"])["Weekly_Sales"]
    .transform(lambda s: s.shift(1).rolling(4).mean())
)

# 5. Chronological validation split
unique_dates = np.sort(df["Date"].unique())
split_index = int(len(unique_dates) * 0.8)
split_date = pd.Timestamp(unique_dates[split_index])

train = df[df["Date"] < split_date].copy()
valid = df[df["Date"] >= split_date].copy()

# Require at least one previous observation for this first experiment
train = train.dropna(subset=["Lag_1"])
valid = valid.dropna(subset=["Lag_1"])

target = "Weekly_Sales"

numeric_features = [
    "Store", "Dept", "Size", "Temperature", "Fuel_Price",
    "MarkDown1", "MarkDown2", "MarkDown3", "MarkDown4",
    "MarkDown5", "CPI", "Unemployment",
    "Year", "Month", "Week", "Lag_1", "Lag_4", "Rolling_Mean_4",
]

categorical_features = ["Type"]

# 6. Preprocessing: impute missing values and encode store type
numeric_pipeline = Pipeline([
    ("imputer", SimpleImputer(strategy="median")),
])

categorical_pipeline = Pipeline([
    ("imputer", SimpleImputer(strategy="most_frequent")),
    ("encoder", OrdinalEncoder(
        handle_unknown="use_encoded_value",
        unknown_value=-1,
    )),
])

preprocessor = ColumnTransformer([
    ("numeric", numeric_pipeline, numeric_features),
    ("categorical", categorical_pipeline, categorical_features),
])

model = Pipeline([
    ("preprocessor", preprocessor),
    ("regressor", HistGradientBoostingRegressor(
        max_iter=150,
        learning_rate=0.08,
        max_leaf_nodes=31,
        random_state=42,
    )),
])

X_train = train[numeric_features + categorical_features]
y_train = train[target]
X_valid = valid[numeric_features + categorical_features]
y_valid = valid[target]

# 7. Train and predict
print("Training rows:", len(train))
print("Validation rows:", len(valid))
print("Validation starts:", split_date.date())
print("Training model...")

model.fit(X_train, y_train)
predictions = model.predict(X_valid)

# 8. Evaluate
mae = mean_absolute_error(y_valid, predictions)
rmse = np.sqrt(mean_squared_error(y_valid, predictions))

# WAPE: aggregate absolute error divided by aggregate absolute actual sales
denominator = np.abs(y_valid).sum()
wape = (
    np.abs(y_valid.to_numpy() - predictions).sum() / denominator * 100
    if denominator != 0 else np.nan
)

print("\n===== HIST GRADIENT BOOSTING RESULTS =====")
print(f"MAE:  ${mae:,.2f}")
print(f"RMSE: ${rmse:,.2f}")
print(f"WAPE: {wape:.2f}%")

# Save validation predictions for later analysis
results = valid[["Store", "Dept", "Date", target]].copy()
results["Prediction"] = predictions
results.to_csv(REPORT_DIR / "validation_predictions.csv", index=False)

# Save the trained model for reuse by the API and MCP tools
MODEL_DIR = ROOT_DIR / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

model_path = MODEL_DIR / "demand_model.joblib"
joblib.dump(model, model_path)

print(f"Saved trained model to {model_path}")

print("\nSaved predictions to reports/validation_predictions.csv")
