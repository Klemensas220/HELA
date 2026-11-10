
import sqlite3
from pathlib import Path
from contextlib import closing

DB_PATH = Path(__file__).resolve().parent / "hela.db"


def get_connection():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection



def create_database():
    with closing(get_connection()) as connection:
        with connection:
            connection.execute("""
                CREATE TABLE IF NOT EXISTS clients (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL
                )
            """)

            connection.execute("""
                CREATE TABLE IF NOT EXISTS expenses (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    client_id INTEGER NOT NULL,
                    amount REAL NOT NULL CHECK (amount >= 0),
                    category TEXT NOT NULL,
                    description TEXT,
                    spent_on TEXT NOT NULL,
                    FOREIGN KEY (client_id) REFERENCES clients(id)
                )
            """)

            connection.execute("""
                INSERT OR IGNORE INTO clients (id, name)
                VALUES (1, 'Šeima A'), (2, 'Šeima B')
            """)


def add_expense(client_id, amount, category, description, spent_on):
    if amount < 0:
        raise ValueError("Neigiama suma")

    with closing(get_connection()) as connection:
        with connection:
            cursor = connection.execute("""
                INSERT INTO expenses
                (client_id, amount, category, description, spent_on)
                VALUES (?, ?, ?, ?, ?)
            """, (client_id, amount, category, description, spent_on))

            return cursor.lastrowid

def get_expenses(client_id):
    with closing(get_connection()) as connection:
        cursor = connection.execute("""
            SELECT id, client_id, amount, category,
                   description, spent_on
            FROM expenses
            WHERE client_id = ?
            ORDER BY spent_on DESC, id DESC
        """, (client_id,))

        return [dict(row) for row in cursor.fetchall()]


def update_expense(expense_id, client_id, amount, category, description, spent_on):
    if amount <= 0:
        raise ValueError("Suma turi būti didesnė už 0")

    with closing(get_connection()) as connection:
        with connection:
            cursor = connection.execute("""
                UPDATE expenses
                SET amount = ?, category = ?, description = ?, spent_on = ?
                WHERE id = ? AND client_id = ?
            """, (
                amount,
                category,
                description,
                spent_on,
                expense_id,
                client_id
            ))

            return cursor.rowcount > 0


def delete_expense(expense_id, client_id):
    with closing(get_connection()) as connection:
        with connection:
            cursor = connection.execute("""
                DELETE FROM expenses
                WHERE id = ? AND client_id = ?
            """, (expense_id, client_id))

            return cursor.rowcount > 0


