# src/api/deps.py
from fastapi import Request, HTTPException, status
from jose import jwt, JWTError
from src.models import RoleEnum, User
from fastapi import Depends
from src.config import settings

async def get_current_user(request: Request) -> User:
    # 1. Lấy token từ Cookie
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    
    try:
        # 2. Giải mã token
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired or invalid")
    
    # 3. Lấy User từ DB
    user = await User.get(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    
    return user


class RoleChecker:
    def __init__(self, allowed_roles: list[RoleEnum]):
        self.allowed_roles = allowed_roles

    # Hàm __call__ giúp class này hoạt động như một function khi dùng với Depends()
    def __call__(self, user: User = Depends(get_current_user)):
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bạn không có quyền thực hiện hành động này"
            )
        return user