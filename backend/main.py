
from contextlib import asynccontextmanager
from fastapi import FastAPI
from backend.database import create_database
from fastapi import HTTPException
from backend.database import add_expense
from backend.schemas import ExpenseCreate
from backend.database import get_expenses
from backend.database import update_expense
from backend.database import delete_expense
from backend.analysis import analyze_expense
from backend.analysis import detect_anomalies
from backend.analysis import forecast_expenses
@asynccontextmanager
async def lifespan(app: FastAPI):
    create_database()
    yield


app = FastAPI(title="HELA API", lifespan=lifespan)


@app.get("/")
def home():
    return {"message": "HELA sistema veikia!"}



@app.post("/expense")
def create_expense(expense: ExpenseCreate):
    try:
        expense_id = add_expense(
            expense.client_id,
            expense.amount,
            expense.category,
            expense.description,
            expense.spent_on.isoformat()
        )
        return{
            "message": "Islaida sekmingai prideta",
            "expense_id": expense_id
        }
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))


@app.get("/expenses/{client_id}")
def read_expenses(client_id: int):
    return get_expenses(client_id)


@app.put("/expenses/{expense_id}")
def edit_expense(expense_id: int, expense: ExpenseCreate):
    try:
        updated = update_expense(
            expense_id,
            expense.client_id,
            expense.amount,
            expense.category,
            expense.description,
            expense.spent_on.isoformat()
        )

        if not updated:
            raise HTTPException(
                status_code=404,
                detail="Išlaida nerasta"
            )

        return {"message": "Išlaida sėkmingai atnaujinta"}

    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))

@app.delete("/expenses/{expense_id}")
def remove_expense(expense_id: int, client_id: int):
    deleted = delete_expense(expense_id, client_id)

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Islaida nerasta"
        )
    return{"message" : "Islaida sekmingai istrinta"}

@app.get("/analysis/{client_id}")
def get_analysis(client_id: int):
    expenses = get_expenses(client_id)
    return analyze_expense(expenses)



@app.get("/anomalies/{client_id}")
def get_anomalies(client_id: int):
    expenses = get_expenses(client_id)

    return {
        "client_id": client_id,
        "anomalies": detect_anomalies(expenses)
    }

@app.get("/forecast/{client_id}")
def get_forecast(client_id: int):
    expenses = get_expenses(client_id)

    return {
        "client_id": client_id,
         **forecast_expenses(expenses)
    }



