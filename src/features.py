
from pathlib import Path
import pandas as pd

ROOT_DIR = Path(__file__).resolve().parent.parent
RAW_DIR = ROOT_DIR / "data" / "raw"
PROCESSED_DIR = ROOT_DIR / "data" / "processed"
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

# Load historical sales
df = pd.read_csv(RAW_DIR / "train.csv")
df["Date"] = pd.to_datetime(df["Date"])

# One row represents a Store-Department-Week
df = df.sort_values(["Store", "Dept", "Date"]).copy()

# Calendar features
df["Year"] = df["Date"].dt.year
df["Month"] = df["Date"].dt.month
df["Week"] = df["Date"].dt.isocalendar().week.astype(int)

# Previous sales for the SAME store and department
grouped_sales = df.groupby(["Store", "Dept"])["Weekly_Sales"]

df["Lag_1"] = grouped_sales.shift(1)
df["Lag_4"] = grouped_sales.shift(4)

# Rolling mean of the previous four weeks.
# shift(1) prevents using the current week's target.
df["Rolling_Mean_4"] = (
    df.groupby(["Store", "Dept"])["Weekly_Sales"]
    .transform(lambda s: s.shift(1).rolling(window=4).mean())
)

print("Dataset shape:", df.shape)
print("\nSample engineered features:")
print(
    df[
        [
            "Store", "Dept", "Date", "Weekly_Sales",
            "Year", "Month", "Week",
            "Lag_1", "Lag_4", "Rolling_Mean_4"
        ]
    ].head(10)
)

print("\nMissing values in lag features:")
print(df[["Lag_1", "Lag_4", "Rolling_Mean_4"]].isnull().sum())

output_path = PROCESSED_DIR / "sales_features.csv"
df.to_csv(output_path, index=False)

print(f"\nSaved engineered dataset to: {output_path}")
