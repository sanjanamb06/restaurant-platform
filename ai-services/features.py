"""
Feature engineering for the demand forecasting model.

Raw data shape coming in (one row per order item):
  - orderId, menuItemId, menuItemName, quantity, orderDate (datetime)

Features produced per (menuItemId, date) aggregate:
  - day_of_week    : 0=Mon … 6=Sun
  - day_of_month   : 1-31
  - month          : 1-12
  - is_weekend     : 0 or 1
  - rolling_7d_avg : average daily quantity sold over the preceding 7 days
  - rolling_14d_avg: average daily quantity sold over the preceding 14 days
  - lag_1          : quantity sold yesterday
  - lag_7          : quantity sold 7 days ago
  - target         : total quantity sold on that date (what we predict)
"""
import pandas as pd
import numpy as np


FEATURE_COLS = [
    "day_of_week",
    "day_of_month",
    "month",
    "is_weekend",
    "rolling_7d_avg",
    "rolling_14d_avg",
    "lag_1",
    "lag_7",
]


def build_daily_series(df: pd.DataFrame, menu_item_id: str) -> pd.DataFrame:
    """
    For a single menu item, aggregate order rows to a daily time series
    and compute all lag / rolling-window features.
    """
    item_df = df[df["menuItemId"] == menu_item_id].copy()

    # Normalise date to midnight
    item_df["date"] = pd.to_datetime(item_df["orderDate"]).dt.normalize()

    daily = (
        item_df.groupby("date")["quantity"]
        .sum()
        .reset_index()
        .rename(columns={"quantity": "target"})
    )

    # Fill in missing dates with 0
    all_dates = pd.date_range(daily["date"].min(), daily["date"].max(), freq="D")
    daily = daily.set_index("date").reindex(all_dates, fill_value=0).reset_index()
    daily.columns = ["date", "target"]

    # Calendar features
    daily["day_of_week"] = daily["date"].dt.dayofweek
    daily["day_of_month"] = daily["date"].dt.day
    daily["month"] = daily["date"].dt.month
    daily["is_weekend"] = (daily["day_of_week"] >= 5).astype(int)

    # Lag features
    daily["lag_1"] = daily["target"].shift(1).fillna(0)
    daily["lag_7"] = daily["target"].shift(7).fillna(0)

    # Rolling averages (min_periods=1 avoids NaN at the start)
    daily["rolling_7d_avg"] = (
        daily["target"].shift(1).rolling(7, min_periods=1).mean().fillna(0)
    )
    daily["rolling_14d_avg"] = (
        daily["target"].shift(1).rolling(14, min_periods=1).mean().fillna(0)
    )

    return daily


def build_future_features(last_date: pd.Timestamp, horizon: int, history_series: pd.Series) -> pd.DataFrame:
    """
    Build feature rows for `horizon` future dates starting from last_date + 1 day.
    `history_series` is the full historical daily target series (index = date).
    """
    future_dates = pd.date_range(last_date + pd.Timedelta(days=1), periods=horizon, freq="D")
    rows = []

    # Combine history with any already-predicted rows for rolling window calc
    combined = history_series.copy()

    for fut_date in future_dates:
        lag_1 = combined.get(fut_date - pd.Timedelta(days=1), 0)
        lag_7 = combined.get(fut_date - pd.Timedelta(days=7), 0)

        # Rolling averages from the combined series up to yesterday
        recent_vals = [combined.get(fut_date - pd.Timedelta(days=i), 0) for i in range(1, 15)]
        rolling_7d_avg = float(np.mean(recent_vals[:7]))
        rolling_14d_avg = float(np.mean(recent_vals[:14]))

        rows.append(
            {
                "date": fut_date,
                "day_of_week": fut_date.dayofweek,
                "day_of_month": fut_date.day,
                "month": fut_date.month,
                "is_weekend": int(fut_date.dayofweek >= 5),
                "lag_1": lag_1,
                "lag_7": lag_7,
                "rolling_7d_avg": rolling_7d_avg,
                "rolling_14d_avg": rolling_14d_avg,
            }
        )
        # Feed back a placeholder (rolling avg) so future rows can use it
        combined[fut_date] = rolling_7d_avg

    return pd.DataFrame(rows)
