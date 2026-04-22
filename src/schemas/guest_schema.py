from pydantic import BaseModel, EmailStr
from typing import Optional

class GuestJoinSchema(BaseModel):
    full_name: str