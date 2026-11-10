
from datetime import datetime
from pydantic import BaseModel, Field

class ExpenseCreate(BaseModel):
    client_id: int
    amount: float = Field(gt=0)
    category: str = Field(min_length=1)
    description: str = ""
    spent_on: datetime