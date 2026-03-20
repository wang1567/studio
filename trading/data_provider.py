# data_provider.py
import os
import pandas as pd
from FinMind.data import DataLoader


class FinMindDataProvider:
    """Fetch daily OHLCV bars and open prices from FinMind."""

    def __init__(self, token: str | None = None):
        self.token = token or os.getenv("FINMIND_TOKEN")
        if not self.token:
            raise RuntimeError(
                "FINMIND_TOKEN not set. "
                "Set the environment variable or pass token= explicitly."
            )
        self.dl = DataLoader()
        self.dl.login_by_token(api_token=self.token)

    def get_daily_bars(
        self, symbol: str, start_date: str, end_date: str
    ) -> pd.DataFrame:
        """
        Fetch daily bars for *symbol* in [start_date, end_date].

        Returns a DataFrame with columns:
            date (datetime64[ns]), open, high, low, close, volume
        Sorted ascending by date.  Returns an empty DataFrame when no data.
        """
        df = self.dl.taiwan_stock_daily(
            stock_id=symbol,
            start_date=start_date,
            end_date=end_date,
        )
        if df is None or df.empty:
            return pd.DataFrame(columns=["date", "open", "high", "low", "close", "volume"])

        # FinMind column normalisation
        # Common variants: max->high, min->low, Trading_Volume->volume
        rename_map: dict[str, str] = {
            "max": "high",
            "min": "low",
            "Trading_Volume": "volume",
        }
        df = df.rename(columns=rename_map)

        keep = ["date", "open", "high", "low", "close", "volume"]
        df = df[[c for c in keep if c in df.columns]].copy()

        df["date"] = pd.to_datetime(df["date"])
        df = df.sort_values("date").reset_index(drop=True)
        return df

    def get_open_price(self, symbol: str, date: str) -> float | None:
        """
        Return the opening price for *symbol* on *date* (YYYY-MM-DD).

        Returns None when the market was closed or data is unavailable.
        """
        df = self.get_daily_bars(symbol, date, date)
        if df.empty:
            return None
        return float(df.iloc[0]["open"])
