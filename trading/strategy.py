# strategy.py
import pandas as pd


def sma_trend_signal(daily: pd.DataFrame, fast: int = 20, slow: int = 60) -> str:
    """
    Generate a trading signal based on SMA crossover / trend-following rules.

    Parameters
    ----------
    daily : pd.DataFrame
        Daily bars with at least a ``close`` column, sorted ascending.
    fast : int
        Fast SMA window (default 20).
    slow : int
        Slow SMA window (default 60).

    Returns
    -------
    str
        ``"BUY"`` when price is above the slow SMA and fast SMA is above slow SMA.
        ``"SELL"`` when price closes below the slow SMA.
        ``"HOLD"`` otherwise or when there is insufficient data.
    """
    if daily is None or len(daily) < slow + 2:
        return "HOLD"

    close = daily["close"].astype(float)
    sma_fast = close.rolling(fast).mean()
    sma_slow = close.rolling(slow).mean()

    last_close = float(close.iloc[-1])
    last_fast = float(sma_fast.iloc[-1])
    last_slow = float(sma_slow.iloc[-1])

    if pd.isna(last_fast) or pd.isna(last_slow):
        return "HOLD"

    # Trend entry: price AND fast SMA both above slow SMA
    if last_close > last_slow and last_fast > last_slow:
        return "BUY"

    # Trend exit: price closes below slow SMA
    if last_close < last_slow:
        return "SELL"

    return "HOLD"
