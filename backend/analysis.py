
from collections import defaultdict

from backend.database import add_expense


def analyze_expense(expenses):
    total = 0
    by_category = {}

    for expense in expenses:
        amount = expense["amount"]
        category = expense["category"]

        total += amount

        if category not in by_category:
            by_category[category] = 0

        by_category[category] += amount

    top_category = None

    if by_category:
        top_category = max(
            by_category.items(),
            key=lambda item: item[1]
        )[0]

    return {
        "total": round(total, 2),
        "by_category": {
            category: round(amount, 2)
            for category, amount in by_category.items()
        },
        "top_category": top_category
    }


def detect_anomalies(expenses):
    monthly = defaultdict(float)

    for expense in expenses:
        month = str(expense["spent_on"])[:7]
        monthly[month] += expense["amount"]

    if len(monthly) < 3:
        return []

    anomalies = []

    for month, amount in sorted(monthly.items()):
        previous = [
            value
            for other_month, value in monthly.items()
            if other_month < month
        ]

        if len(previous) < 2:
            continue

        average = sum(previous) / len(previous)

        if average > 0 and amount > average * 2:
            anomalies.append({
                "month": month,
                "amount": round(amount, 2),
                "average": round(average, 2),
                "message": "Neįprastai didelės išlaidos"
            })

    return anomalies

def forecast_expenses(expenses):
    monthly = defaultdict(float)

    for expense in expenses:
        month = str(expense["spent_on"])[:7]
        monthly[month] += expense["amount"]

    if len(monthly) < 3:
        return {
            "forecast": None,
            "message": "Prognozei reikia bent 3 mėnesių duomenų"

        }
    months = sorted(monthly.keys())
    last_three = months[-3:]

    values = [monthly[month] for month in last_three]

    forecast = sum(values) / len(values)

    return {
        "forecast": round(forecast, 2),
        "based_on_months": last_three,
        "method": "Paskutiniu 3 menesiu vidurkis"
    }

