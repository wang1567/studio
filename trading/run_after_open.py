#!/usr/bin/env python3
"""run_after_open.py

Run this script after the market opens each trading day (typically
09:05–09:30 TW time, after opening-auction prices are available).

It reads PENDING orders from ``pending_orders.csv``, fetches today's
open price for each symbol, and executes virtual fills through
:class:`PaperBroker`.  Processed orders are marked as DONE.

Position sizing uses **Option B**: each BUY consumes at most
``position_pct`` (default 33 %) of available cash, rounded down to the
nearest whole lot (1 lot = ``lot_size`` shares).

Usage::

    python run_after_open.py

The script reads ``config.yaml`` from the same directory.
``FINMIND_TOKEN`` must be set as an environment variable.
"""
from __future__ import annotations

import sys
from datetime import date
from pathlib import Path

import pandas as pd
import yaml

_HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(_HERE))

from data_provider import FinMindDataProvider  # noqa: E402
from paper_broker import PaperBroker           # noqa: E402
from storage import CsvStorage                 # noqa: E402


def decide_qty(
    position_cash: float,
    open_price: float,
    lot_size: int,
) -> int:
    """
    Calculate how many shares to buy given a cash budget.

    Rounds down to the nearest whole lot.

    Parameters
    ----------
    position_cash : float
        Cash budget for this position.
    open_price : float
        Open price used as fill reference.
    lot_size : int
        Shares per lot (Taiwan standard: 1000).

    Returns
    -------
    int
        Number of shares (multiple of *lot_size*), or 0 if not affordable.
    """
    if open_price <= 0:
        return 0
    max_shares = int(position_cash // open_price)
    lots = max_shares // lot_size
    return max(lots, 0) * lot_size


def main() -> None:
    cfg_path = _HERE / "config.yaml"
    cfg = yaml.safe_load(cfg_path.read_text(encoding="utf-8"))

    fills_path: str = cfg["storage"]["fills_path"]
    orders_path: str = cfg["storage"]["orders_path"]

    dp = FinMindDataProvider()
    st = CsvStorage(fills_path=fills_path, orders_path=orders_path)

    broker = PaperBroker(
        initial_cash=float(cfg["portfolio"]["initial_cash"]),
        fee_rate=float(cfg["execution"]["fee_rate"]),
        tax_sell_rate=float(cfg["execution"]["tax_sell_rate_stock"]),
        slippage_bp=float(cfg["execution"]["slippage_bp"]),
    )

    max_positions: int = int(cfg["portfolio"]["max_positions"])
    lot_size: int = int(cfg["portfolio"]["lot_size"])
    position_pct: float = float(cfg["portfolio"]["position_pct"])

    today = date.today().isoformat()
    print(f"[run_after_open] date={today}")

    # ------------------------------------------------------------------ #
    # Load pending orders
    # ------------------------------------------------------------------ #
    orders_file = Path(orders_path)
    if not orders_file.exists():
        print("[run_after_open] no pending_orders.csv — nothing to do.")
        return

    orders_df = pd.read_csv(orders_file)
    pending = orders_df[orders_df["status"] == "PENDING"].copy()
    if pending.empty:
        print("[run_after_open] no PENDING orders — nothing to do.")
        return

    filled_symbols: list[str] = []

    # ------------------------------------------------------------------ #
    # 1. Process SELL orders first (free up positions)
    # ------------------------------------------------------------------ #
    for _, od in pending[pending["side"] == "SELL"].iterrows():
        sym: str = str(od["symbol"])
        op = dp.get_open_price(sym, today)
        if op is None:
            print(f"[SKIP] {sym}: no open price for {today} (non-trading day?)")
            continue

        fill = broker.sell_all(sym, op)
        if fill:
            fill["date"] = today
            st.append_fill(fill)
            filled_symbols.append(sym)
            print(f"[FILL] {fill}")
        else:
            print(f"[SKIP] {sym}: no position to sell")
            filled_symbols.append(sym)  # mark as done anyway

    # ------------------------------------------------------------------ #
    # 2. Process BUY orders (respect max_positions)
    # ------------------------------------------------------------------ #
    for _, od in pending[pending["side"] == "BUY"].iterrows():
        if len(broker.positions) >= max_positions:
            print(
                f"[SKIP] max positions ({max_positions}) reached — "
                "remaining BUY orders skipped."
            )
            break

        sym = str(od["symbol"])
        op = dp.get_open_price(sym, today)
        if op is None:
            print(f"[SKIP] {sym}: no open price for {today} (non-trading day?)")
            continue

        position_cash = broker.cash * position_pct
        qty = decide_qty(position_cash, op, lot_size)
        if qty <= 0:
            print(f"[SKIP] {sym}: insufficient funds or price too high")
            filled_symbols.append(sym)
            continue

        fill = broker.buy(sym, qty, op)
        if fill:
            fill["date"] = today
            st.append_fill(fill)
            filled_symbols.append(sym)
            print(f"[FILL] {fill}")
        else:
            print(f"[SKIP] {sym}: buy failed (insufficient funds)")
            filled_symbols.append(sym)

    # ------------------------------------------------------------------ #
    # 3. Mark processed orders as DONE
    # ------------------------------------------------------------------ #
    if filled_symbols:
        st.mark_orders_done(filled_symbols, today)

    print(f"[run_after_open] cash remaining : {broker.cash:,.0f}")
    print(f"[run_after_open] open positions : {broker.positions}")
    print("[run_after_open] done.")


if __name__ == "__main__":
    main()
