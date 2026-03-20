"""Tests for storage.py — CsvStorage"""
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from storage import CsvStorage


@pytest.fixture
def tmp_storage(tmp_path):
    fills = tmp_path / "fills.csv"
    orders = tmp_path / "orders.csv"
    return CsvStorage(fills_path=str(fills), orders_path=str(orders))


class TestAppendFill:
    def test_creates_file_with_header(self, tmp_storage):
        tmp_storage.append_fill({"date": "2026-03-19", "symbol": "2330", "side": "BUY"})
        lines = tmp_storage.fills_path.read_text().splitlines()
        assert lines[0] == "date,symbol,side"
        assert lines[1] == "2026-03-19,2330,BUY"

    def test_appends_multiple_rows(self, tmp_storage):
        tmp_storage.append_fill({"a": 1})
        tmp_storage.append_fill({"a": 2})
        lines = tmp_storage.fills_path.read_text().splitlines()
        assert len(lines) == 3  # header + 2 rows


class TestAppendOrder:
    def test_creates_order_file(self, tmp_storage):
        tmp_storage.append_order(
            {"created_date": "2026-03-19", "symbol": "2330", "side": "BUY", "status": "PENDING"}
        )
        assert tmp_storage.orders_path.exists()
        lines = tmp_storage.orders_path.read_text().splitlines()
        assert "PENDING" in lines[1]


class TestMarkOrdersDone:
    def _seed(self, st: CsvStorage, rows):
        for r in rows:
            st.append_order(r)

    def test_marks_matching_orders_as_done(self, tmp_storage):
        self._seed(
            tmp_storage,
            [
                {"created_date": "2026-03-19", "symbol": "2330", "side": "BUY", "status": "PENDING"},
                {"created_date": "2026-03-19", "symbol": "2317", "side": "SELL", "status": "PENDING"},
            ],
        )
        tmp_storage.mark_orders_done(["2330"], "2026-03-19")
        import csv
        with tmp_storage.orders_path.open() as f:
            rows = list(csv.DictReader(f))
        assert rows[0]["status"] == "DONE"
        assert rows[1]["status"] == "PENDING"  # untouched

    def test_no_op_when_file_missing(self, tmp_storage):
        # Should not raise
        tmp_storage.mark_orders_done(["2330"], "2026-03-19")

    def test_only_marks_matching_date(self, tmp_storage):
        self._seed(
            tmp_storage,
            [
                {"created_date": "2026-03-18", "symbol": "2330", "side": "BUY", "status": "PENDING"},
                {"created_date": "2026-03-19", "symbol": "2330", "side": "BUY", "status": "PENDING"},
            ],
        )
        tmp_storage.mark_orders_done(["2330"], "2026-03-19")
        import csv
        with tmp_storage.orders_path.open() as f:
            rows = list(csv.DictReader(f))
        assert rows[0]["status"] == "PENDING"  # old date — untouched
        assert rows[1]["status"] == "DONE"
