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

# 5. Entity Premium Q&A Log (Xuất Log Q&A Premium)
class PremiumQALogStatus(str, Enum):
    READY = "ready"           # Đã nhận file audio, sẵn sàng xử lý
    PROCESSING = "processing" # Đang chạy ASR/LLM pipeline
    COMPLETED = "completed"   # Hoàn thành, có final_markdown
    FAILED = "failed"         # Lỗi trong quá trình xử lý

class PremiumQALog(Document):
    seminar: Link[Seminar]  # Liên kết với hội thảo
    
    # File audio gốc
    original_audio_path: str
    
    # Trạng thái xử lý
    status: PremiumQALogStatus = Field(default=PremiumQALogStatus.READY)
    error_message: Optional[str] = None  # Chi tiết lỗi nếu failed
    
    # Kết quả thô từ ASR
    raw_transcription: Optional[str] = None
    raw_segments: Optional[List[dict]] = None  # Segments với timestamp và speaker
    
    # Kết quả cuối cùng từ LLM post-processing
    final_markdown: Optional[str] = None
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    processing_started_at: Optional[datetime] = None
    processing_completed_at: Optional[datetime] = None
    
    # Thông tin xử lý
    total_chunks: Optional[int] = None
    asr_providers_used: Optional[List[str]] = None
    processing_time_seconds: Optional[float] = None

    class Settings:
        name = "premium_qa_logs"

class RefreshToken(Document):
    token: str = Indexed(unique=True)
    user_id: str # Lưu ID user cho nhanh, hoặc dùng Link[User]
    expires_at: datetime
    
    class Settings:
        name = "refresh_tokens"