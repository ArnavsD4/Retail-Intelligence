
from pathlib import Path
import pandas as pd

# Project ka root folder locate karo
ROOT_DIR = Path(__file__).resolve().parent.parent
RAW_DIR = ROOT_DIR / "data" / "raw"

# CSV files load karo
train = pd.read_csv(RAW_DIR / "train.csv")
features = pd.read_csv(RAW_DIR / "features.csv")
stores = pd.read_csv(RAW_DIR / "stores.csv")

# Dataset dimensions aur first 5 rows
print("\n========== TRAIN DATA ==========")
print("Shape:", train.shape)
print(train.head())

print("\n========== FEATURES DATA ==========")
print("Shape:", features.shape)
print(features.head())

print("\n========== STORES DATA ==========")
print("Shape:", stores.shape)
print(stores.head())

# Data types
print("\n========== DATA TYPES ==========")
print(train.dtypes)

# Missing values
print("\n========== MISSING VALUES ==========")
print("Train:\n", train.isnull().sum())
print("\nFeatures:\n", features.isnull().sum())
print("\nStores:\n", stores.isnull().sum())

# Weekly sales ka statistical summary
print("\n========== SALES SUMMARY ==========")
print(train["Weekly_Sales"].describe())

# Dates ko proper datetime format mein convert karo
train["Date"] = pd.to_datetime(train["Date"])
features["Date"] = pd.to_datetime(features["Date"])

print("\n========== DATASET OVERVIEW ==========")
print("Date range:", train["Date"].min(), "to", train["Date"].max())
print("Number of stores:", train["Store"].nunique())
print("Number of departments:", train["Dept"].nunique())
print("Total sales records:", len(train))


import matplotlib.pyplot as plt

# Create a folder to save plots
PLOT_DIR = ROOT_DIR / "reports" / "figures"
PLOT_DIR.mkdir(parents=True, exist_ok=True)

# 1. Average weekly sales over time
weekly_sales = (
    train.groupby("Date")["Weekly_Sales"]
    .mean()
    .sort_index()
)

plt.figure(figsize=(12, 5))
plt.plot(weekly_sales.index, weekly_sales.values)
plt.title("Average Weekly Sales Across All Store-Department Records")
plt.xlabel("Date")
plt.ylabel("Average Weekly Sales ($)")
plt.xticks(rotation=45)
plt.tight_layout()
plt.savefig(PLOT_DIR / "weekly_sales_trend.png", dpi=150)
plt.show()
plt.close()

# 2. Holiday vs non-holiday sales
holiday_sales = (
    train.groupby("IsHoliday")["Weekly_Sales"]
    .mean()
)

print("\n===== AVERAGE SALES: HOLIDAY VS NON-HOLIDAY =====")
print(holiday_sales)

plt.figure(figsize=(7, 5))
holiday_sales.rename({
    False: "Non-holiday",
    True: "Holiday"
}).plot(kind="bar")

plt.title("Average Sales: Holiday vs Non-Holiday")
plt.xlabel("Week Type")
plt.ylabel("Average Weekly Sales ($)")
plt.xticks(rotation=0)
plt.tight_layout()
plt.savefig(PLOT_DIR / "holiday_sales_comparison.png", dpi=150)
plt.show()
plt.close()

print("\nPlots saved in:", PLOT_DIR)
