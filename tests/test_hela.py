import unittest
from backend.analysis import forecast_expenses
from backend.database import add_expense
import tempfile
from pathlib import Path
from unittest.mock import patch
from backend import database

class TestHela(unittest.TestCase):

    def test_normal_forecast(self):
        expenses = [
            {
                "amount": 100,
                "spent_on": "2026-01-10"
            },
            {
                "amount": 120,
                "spent_on": "2026-02-10"
            },
            {
                "amount": 500,
                "spent_on": "2026-03-10"
            }


        ]

        result = forecast_expenses(expenses)

        self.assertEqual(result["forecast"], 240.0)

        self.assertEqual(
            result["based_on_months"],
            ["2026-01", "2026-02", "2026-03"]
        )
        if __name__ == "__main__":
            unittest.main()


    def test_forecast_not_enough_months(self):
        expenses = [
            {
                "amount": 100,
                "spent_on": "2026-01-10"
            },
            {
                "amount": 200,
                "spent_on": "2026-02-10"
            }
        ]

        result = forecast_expenses(expenses)

        self.assertIsNone(result["forecast"])

        self.assertEqual(
            result["message"],
            "Prognozei reikia bent 3 mėnesių duomenų"
        )

    def test_negative_expenses(self):
        with self.assertRaisesRegex(ValueError, "Neigiama suma"):
            add_expense(
                1,
                -50,
                "Maistas",
                "Testinis pirkinys",
                "2026-11-10"
            )


    def test_client_data_isolation(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            test_db = Path(temp_dir) / "test_hela.db"

            with patch.object(database, "DB_PATH", test_db):
                database.create_database()

                database.add_expense(
                    1, 50, "Maistas", "Kliento 1 pirkinys", "2026-11-10"
                )

                database.add_expense(
                    2, 100, "Transportas", "Kliento 2 pirkinys", "2026-11-10"
                )

                client1_expenses = database.get_expenses(1)
                client2_expenses = database.get_expenses(2)

                self.assertEqual(len(client1_expenses), 1)
                self.assertEqual(len(client2_expenses), 1)

                self.assertEqual(client1_expenses[0]["amount"], 50)
                self.assertEqual(client2_expenses[0]["amount"], 100)

                self.assertEqual(client1_expenses[0]["client_id"], 1)
                self.assertEqual(client2_expenses[0]["client_id"], 2)
