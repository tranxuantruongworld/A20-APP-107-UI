from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import List, Optional
from beanie import PydanticObjectId # Thêm import này

class SeminarCreate(BaseModel):
    title: str
    description: str
    start_time: datetime

class SeminarUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None

class SeminarOut(BaseModel):
    # id: str = Field(alias="_id") # Beanie lưu id trong trường _id
    id: PydanticObjectId = Field(alias="_id")
    title: str
    description: str
    start_time: datetime
    # Trả về ID của participants thay vì cả object Link nếu cần gọn
    # participant_ids: List[str] = []
    model_config = ConfigDict(
        from_attributes=True, 
        populate_by_name=True,
        arbitrary_types_allowed=True # Cho phép các kiểu dữ liệu đặc biệt của Mongo
    )