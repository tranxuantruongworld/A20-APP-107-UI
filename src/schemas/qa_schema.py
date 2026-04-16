from pydantic import BaseModel, Field
from typing import Optional

class QuestionCreate(BaseModel):
    question: str = Field(..., min_length=1, description="Nội dung câu hỏi")
    guest_id: Optional[str] = None