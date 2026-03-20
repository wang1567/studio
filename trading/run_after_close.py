#!/usr/bin/env python3
"""run_after_close.py

Run this script after the market closes each trading day.
It fetches the latest daily bars for every symbol in the universe,
computes SMA-based signals, and writes PENDING orders to
``pending_orders.csv`` for next-day open-price execution.

Usage::

    python run_after_close.py

The script reads ``config.yaml`` from the same directory.
``FINMIND_TOKEN`` must be set as an environment variable (or in a
``.env`` file loaded before calling this script).
"""
from __future__ import annotations

import sys
from datetime import date, timedelta
from pathlib import Path

import yaml

# Allow running from any working directory
_HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(_HERE))

from data_provider import FinMindDataProvider  # noqa: E402
from strategy import sma_trend_signal           # noqa: E402
from storage import CsvStorage                  # noqa: E402


def main() -> None:
    cfg_path = _HERE / "config.yaml"
    cfg = yaml.safe_load(cfg_path.read_text(encoding="utf-8"))

    symbols: list[str] = cfg["universe"]
    fast: int = int(cfg["strategy"]["sma_fast"])
    slow: int = int(cfg["strategy"]["sma_slow"])
    orders_path: str = cfg["storage"]["orders_path"]

    dp = FinMindDataProvider()
    st = CsvStorage(orders_path=orders_path)

    end_date = date.today().isoformat()
    # Two years of history is sufficient to compute the 60-day SMA comfortably
    start_date = (date.today() - timedelta(days=365 * 2)).isoformat()

    print(f"[run_after_close] date={end_date}  symbols={symbols}")

    for sym in symbols:
        try:
            daily = dp.get_daily_bars(sym, start_date, end_date)
        except Exception as exc:  # pragma: no cover
            print(f"[ERROR] {sym}: {exc}")
            continue

        sig = sma_trend_signal(daily, fast=fast, slow=slow)

        if sig in ("BUY", "SELL"):
            order = {
                "created_date": end_date,
                "symbol": sym,
                "side": sig,
                "status": "PENDING",
            }
            st.append_order(order)
            print(f"[SIGNAL] {sym} -> {sig}")
        else:
            print(f"[HOLD]   {sym}")

    print("[run_after_close] done.")


if __name__ == "__main__":
    main()
