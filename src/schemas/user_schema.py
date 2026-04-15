from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from src.models import RoleEnum

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6, description="Mật khẩu ít nhất 6 ký tự")
    full_name: str
    
    # # Cho phép truyền role, nếu không truyền sẽ tự lấy mặc định là USER
    # role: Optional[RoleEnum] = RoleEnum.USER