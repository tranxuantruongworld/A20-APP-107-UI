from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class SeminarCreate(BaseModel):
    title: str
    description: str
    start_time: datetime

class SeminarUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None

class SeminarOut(BaseModel):
    id: str
    title: str
    description: str
    start_time: datetime
    # Trả về ID của participants thay vì cả object Link nếu cần gọn
    participant_ids: List[str] = []