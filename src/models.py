from enum import Enum
from typing import List, Optional
from beanie import Document, Link, Indexed
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime

class RoleEnum(str, Enum):
    ADMIN = "admin"         # Toàn quyền
    SPEAKER = "speaker"     # Diễn giả (được tạo hội thảo)
    USER = "user"           # Khán giả bình thường có tài khoản
    
# 1. Entity Người dùng (User)
class User(Document):
    username: str = Indexed(unique=True)
    email: EmailStr
    password_hash: str
    full_name: str

    role: RoleEnum = Field(default=RoleEnum.USER)
    
    class Settings:
        name = "users"

# 2. Entity Khách mời (Guest) - Thường không cần tài khoản, chỉ cần thông tin định danh
class Guest(Document):
    email: EmailStr = Indexed(unique=True)
    full_name: str
    organization: Optional[str] = None

    class Settings:
        name = "guests"

# 3. Entity Hội thảo (Seminar)
class Seminar(Document):
    title: str
    description: str
    start_time: datetime
    # Quan hệ Many-to-Many: Một hội thảo có nhiều User và Guest
    # Beanie sẽ lưu danh sách các ID tham chiếu
    participants: List[Link[User]] = []
    guests: List[Link[Guest]] = []

    class Settings:
        name = "seminars"

# 4. Entity Q&A (Câu hỏi & Trả lời)
class QA(Document):
    seminar: Link[Seminar]
    
    question: str
    asked_by_user: Optional[Link[User]] = None
    asked_by_guest: Optional[Link[Guest]] = None
    
    # SỬA Ở ĐÂY: Thêm Optional vì câu hỏi mới tạo chưa có câu trả lời
    answer: Optional[str] = None
    answered_by: Optional[Link[User]] = None 
    
    ai_summary: Optional[str] = None
    ai_relevance_score: Optional[float] = Field(None, ge=0, le=10)
    user_feedbacks: List[dict] = []
    guest_feedbacks: List[dict] = []

    class Settings:
        name = "qa_sessions"

class RefreshToken(Document):
    token: str = Indexed(unique=True)
    user_id: str # Lưu ID user cho nhanh, hoặc dùng Link[User]
    expires_at: datetime
    
    class Settings:
        name = "refresh_tokens"