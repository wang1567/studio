"""Tests for strategy.py — sma_trend_signal()"""
import sys
from pathlib import Path

import pandas as pd
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from strategy import sma_trend_signal


def _make_bars(closes: list[float]) -> pd.DataFrame:
    return pd.DataFrame({"close": closes})


class TestSmaTrendSignal:
    def test_insufficient_data_returns_hold(self):
        # Fewer than slow+2 rows → always HOLD
        bars = _make_bars([100.0] * 61)
        assert sma_trend_signal(bars, fast=20, slow=60) == "HOLD"

    def test_none_returns_hold(self):
        assert sma_trend_signal(None) == "HOLD"

    def test_empty_dataframe_returns_hold(self):
        assert sma_trend_signal(pd.DataFrame({"close": []})) == "HOLD"

    def test_buy_signal_when_price_above_slow_sma(self):
        # First 60 bars at 100, last bar at 150 → price >> slow SMA → BUY
        closes = [100.0] * 62 + [150.0] * 10
        bars = _make_bars(closes)
        sig = sma_trend_signal(bars, fast=20, slow=60)
        assert sig == "BUY"

    def test_sell_signal_when_price_below_slow_sma(self):
        # All bars at 100, then a big drop → SELL
        closes = [100.0] * 70 + [50.0] * 5
        bars = _make_bars(closes)
        sig = sma_trend_signal(bars, fast=20, slow=60)
        assert sig == "SELL"

    def test_hold_when_price_between_smas(self):
        # Craft a scenario where close > slow SMA but fast SMA ≤ slow SMA
        # We use 80 bars at 100 to establish SMAs, then hold flat
        closes = [100.0] * 80
        bars = _make_bars(closes)
        sig = sma_trend_signal(bars, fast=20, slow=60)
        # price == fast == slow → neither strictly BUY nor strictly SELL
        # (100 is not < 100, and 100 is not > 100 AND fast > slow)
        assert sig == "HOLD"

    def test_custom_windows(self):
        # With fast=5, slow=10 the minimum required rows is 12
        closes = [100.0] * 12 + [200.0] * 5
        bars = _make_bars(closes)
        sig = sma_trend_signal(bars, fast=5, slow=10)
        assert sig == "BUY"
