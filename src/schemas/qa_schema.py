from pydantic import BaseModel, Field
from typing import Any, List, Optional

class QuestionCreate(BaseModel):
    question: str = Field(..., min_length=1, description="Nội dung câu hỏi")
    guest_id: Optional[str] = None

class AnswerCreate(BaseModel):
    answer: str

# 1. Khuôn thông tin định danh
class PersonInfo(BaseModel):
    id: Optional[str] = None
    name: str
    type: Optional[str] = None # "user" hoặc "guest"

# 2. Khuôn xuất dữ liệu cho 1 câu hỏi
class QuestionOut(BaseModel):
    id: str
    seminar_id: str
    question: str
    answer: Optional[str] = None
    
    asker: PersonInfo
    answerer: Optional[PersonInfo] = None
    
    ai_summary: Optional[str] = None
    ai_relevance_score: Optional[float] = None
    user_feedbacks: List[Any] = []
    guest_feedbacks: List[Any] = []

# 3. Khuôn trả về tổng quát
class QuestionListResponse(BaseModel):
    status: str
    data: List[QuestionOut]