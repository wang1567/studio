"""Tests for paper_broker.py — PaperBroker"""
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from paper_broker import PaperBroker, Position


INITIAL_CASH = 1_000_000.0
FEE = 0.001425
TAX = 0.003
SLIP = 5  # bp


def make_broker(**kwargs) -> PaperBroker:
    defaults = dict(
        initial_cash=INITIAL_CASH,
        fee_rate=FEE,
        tax_sell_rate=TAX,
        slippage_bp=SLIP,
    )
    defaults.update(kwargs)
    return PaperBroker(**defaults)


class TestBuy:
    def test_successful_buy_reduces_cash(self):
        broker = make_broker()
        fill = broker.buy("2330", 1000, 600.0)
        assert fill is not None
        assert fill["side"] == "BUY"
        assert fill["qty"] == 1000
        # Fill price should be slightly above open (slippage)
        expected_fill = 600.0 * (1 + SLIP / 10_000)
        assert abs(fill["price"] - expected_fill) < 0.01
        # Cash reduced by gross + fee
        gross = expected_fill * 1000
        fee = gross * FEE
        assert abs(broker.cash - (INITIAL_CASH - gross - fee)) < 0.01

    def test_buy_creates_position(self):
        broker = make_broker()
        broker.buy("2330", 1000, 600.0)
        assert "2330" in broker.positions
        assert broker.positions["2330"].qty == 1000

    def test_buy_adds_to_existing_position(self):
        broker = make_broker()
        broker.buy("2330", 1000, 600.0)
        broker.buy("2330", 500, 610.0)
        pos = broker.positions["2330"]
        assert pos.qty == 1500

    def test_buy_insufficient_cash_returns_none(self):
        broker = make_broker(initial_cash=100.0)
        fill = broker.buy("2330", 1000, 600.0)
        assert fill is None
        assert broker.cash == 100.0  # unchanged

    def test_buy_zero_qty_returns_none(self):
        broker = make_broker()
        fill = broker.buy("2330", 0, 600.0)
        assert fill is None

    def test_buy_tax_is_zero(self):
        broker = make_broker()
        fill = broker.buy("2330", 1000, 600.0)
        assert fill["tax"] == 0.0


class TestSellAll:
    def test_sell_all_removes_position(self):
        broker = make_broker()
        broker.buy("2330", 1000, 600.0)
        fill = broker.sell_all("2330", 620.0)
        assert fill is not None
        assert "2330" not in broker.positions

    def test_sell_all_returns_none_when_no_position(self):
        broker = make_broker()
        fill = broker.sell_all("2330", 600.0)
        assert fill is None

    def test_sell_all_increases_cash(self):
        broker = make_broker()
        broker.buy("2330", 1000, 600.0)
        cash_after_buy = broker.cash
        broker.sell_all("2330", 620.0)
        assert broker.cash > cash_after_buy

    def test_sell_all_applies_tax(self):
        broker = make_broker()
        broker.buy("2330", 1000, 600.0)
        fill = broker.sell_all("2330", 620.0)
        assert fill["tax"] > 0.0

    def test_sell_slippage_reduces_fill_price(self):
        broker = make_broker()
        broker.buy("2330", 1000, 600.0)
        fill = broker.sell_all("2330", 620.0)
        expected_fill = 620.0 * (1 - SLIP / 10_000)
        assert abs(fill["price"] - expected_fill) < 0.01


class TestPortfolioValue:
    def test_portfolio_value_cash_only(self):
        broker = make_broker()
        assert broker.portfolio_value({}) == INITIAL_CASH

    def test_portfolio_value_with_position(self):
        broker = make_broker()
        broker.buy("2330", 1000, 600.0)
        val = broker.portfolio_value({"2330": 650.0})
        assert val == broker.cash + 1000 * 650.0

    def test_portfolio_value_fallback_to_avg_price(self):
        broker = make_broker()
        broker.buy("2330", 1000, 600.0)
        pos = broker.positions["2330"]
        val = broker.portfolio_value({})  # no market price provided
        assert val == broker.cash + 1000 * pos.avg_price
