from pydantic import BaseModel, EmailStr
from typing import Optional

class GuestJoinSchema(BaseModel):
    email: EmailStr
    full_name: str
    organization: Optional[str] = None