# paper_broker.py
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, Optional


@dataclass
class Position:
    qty: int = 0
    avg_price: float = 0.0


@dataclass
class FillRecord:
    symbol: str
    side: str        # "BUY" or "SELL"
    qty: int
    price: float     # fill price (after slippage)
    fee: float
    tax: float


class PaperBroker:
    """
    Simulates next-open-price order execution with fee, tax, and slippage.

    Parameters
    ----------
    initial_cash : float
        Starting cash in NTD.
    fee_rate : float
        Brokerage fee as a fraction (e.g. 0.001425 for 0.1425 %).
    tax_sell_rate : float
        Transaction tax on sells as a fraction (e.g. 0.003 for stocks).
    slippage_bp : float
        One-way slippage in basis points (e.g. 5 means ±0.05 %).
    """

    def __init__(
        self,
        initial_cash: float,
        fee_rate: float,
        tax_sell_rate: float,
        slippage_bp: float,
    ) -> None:
        self.cash = float(initial_cash)
        self.fee_rate = float(fee_rate)
        self.tax_sell_rate = float(tax_sell_rate)
        self.slippage_bp = float(slippage_bp)
        self.positions: Dict[str, Position] = {}

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _apply_slippage(self, price: float, side: str) -> float:
        s = self.slippage_bp / 10_000.0
        if side == "BUY":
            return price * (1 + s)
        if side == "SELL":
            return price * (1 - s)
        raise ValueError(f"side must be 'BUY' or 'SELL', got {side!r}")

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def buy(
        self, symbol: str, qty: int, open_price: float
    ) -> Optional[dict]:
        """
        Attempt to buy *qty* shares of *symbol* at *open_price*.

        Returns a fill dict on success, or None if there is insufficient cash.
        """
        if qty <= 0:
            return None

        fill_price = self._apply_slippage(open_price, "BUY")
        gross = fill_price * qty
        fee = gross * self.fee_rate
        total_cost = gross + fee

        if total_cost > self.cash:
            return None  # Insufficient funds — skip silently

        pos = self.positions.get(symbol, Position())
        new_qty = pos.qty + qty
        new_avg = (pos.avg_price * pos.qty + fill_price * qty) / new_qty

        self.positions[symbol] = Position(qty=new_qty, avg_price=new_avg)
        self.cash -= total_cost

        return {
            "symbol": symbol,
            "side": "BUY",
            "qty": qty,
            "price": round(fill_price, 4),
            "fee": round(fee, 4),
            "tax": 0.0,
        }

    def sell_all(
        self, symbol: str, open_price: float
    ) -> Optional[dict]:
        """
        Liquidate the entire position in *symbol* at *open_price*.

        Returns a fill dict on success, or None if there is no position.
        """
        pos = self.positions.get(symbol)
        if not pos or pos.qty <= 0:
            return None

        qty = pos.qty
        fill_price = self._apply_slippage(open_price, "SELL")
        gross = fill_price * qty
        fee = gross * self.fee_rate
        tax = gross * self.tax_sell_rate
        net = gross - fee - tax

        self.cash += net
        self.positions.pop(symbol, None)

        return {
            "symbol": symbol,
            "side": "SELL",
            "qty": qty,
            "price": round(fill_price, 4),
            "fee": round(fee, 4),
            "tax": round(tax, 4),
        }

    # ------------------------------------------------------------------
    # Portfolio summary
    # ------------------------------------------------------------------

    def portfolio_value(self, prices: Dict[str, float]) -> float:
        """
        Return total portfolio value (cash + mark-to-market positions).

        Parameters
        ----------
        prices : dict
            Mapping of symbol -> current price.
        """
        equity = sum(
            pos.qty * prices.get(sym, pos.avg_price)
            for sym, pos in self.positions.items()
        )
        return self.cash + equity
