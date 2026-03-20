# storage.py
from __future__ import annotations

import csv
from pathlib import Path
from typing import Dict, Any


class CsvStorage:
    """
    Lightweight CSV-based persistence for fill records and pending orders.

    Files are created on first write; subsequent writes append rows.
    """

    def __init__(
        self,
        fills_path: str = "./fills.csv",
        orders_path: str = "./pending_orders.csv",
    ) -> None:
        self.fills_path = Path(fills_path)
        self.orders_path = Path(orders_path)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def append_fill(self, row: Dict[str, Any]) -> None:
        """Append one fill record to the fills CSV."""
        self._append(self.fills_path, row)

    def append_order(self, row: Dict[str, Any]) -> None:
        """Append one pending-order record to the orders CSV."""
        self._append(self.orders_path, row)

    def mark_orders_done(self, symbols: list[str], created_date: str) -> None:
        """
        Mark PENDING orders for *symbols* created on *created_date* as DONE
        by rewriting the pending-orders CSV in-place.
        """
        path = self.orders_path
        if not path.exists():
            return

        updated: list[dict] = []
        with path.open("r", newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                if (
                    row.get("status") == "PENDING"
                    and row.get("symbol") in symbols
                    and row.get("created_date") == created_date
                ):
                    row["status"] = "DONE"
                updated.append(row)

        if not updated:
            return

        with path.open("w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=list(updated[0].keys()))
            writer.writeheader()
            writer.writerows(updated)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _append(self, path: Path, row: Dict[str, Any]) -> None:
        exists = path.exists()
        with path.open("a", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=list(row.keys()))
            if not exists:
                writer.writeheader()
            writer.writerow(row)
