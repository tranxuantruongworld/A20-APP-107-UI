# src/api/endpoints/auth.py
from fastapi import APIRouter, Depends, HTTPException, Response, Request, status
from pydantic import BaseModel
from datetime import datetime, timedelta
from src.models import RoleEnum, User, RefreshToken
from src.core.security import (
    get_password_hash, verify_password, create_access_token, create_refresh_token, 
)
from src.api.deps import get_current_user
from src.schemas.user_schema import UserCreate
from src.config import settings

router = APIRouter()

class LoginData(BaseModel):
    username: str
    password: str

@router.post("/login")
async def login(response: Response, data: LoginData):
    # 1. Kiểm tra User
    user = await User.find_one(User.username == data.username)
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Sai tài khoản hoặc mật khẩu")

    # 2. Tạo Tokens
    token_payload = {
        "sub": str(user.id), 
        "role": user.role.value # Lấy value dạng string của Enum
    }
    access_token = create_access_token(data=token_payload)
    refresh_token_str = create_refresh_token(data={"sub": str(user.id)})

    # 3. Lưu Refresh Token vào DB
    expires_at = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    new_rt = RefreshToken(token=refresh_token_str, user_id=str(user.id), expires_at=expires_at)
    await new_rt.insert()

    # 4. Set Cookie
    # httponly=True để chống XSS (Javascript không đọc được cookie này)
    # secure=True nếu bạn chạy HTTPS trên production
    response.set_cookie(
        key="access_token", value=access_token, httponly=True, 
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60, samesite="lax"
    )
    response.set_cookie(
        key="refresh_token", value=refresh_token_str, httponly=True, 
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60, samesite="lax"
    )

    # 5. Trả về đúng 1 chữ status theo yêu cầu
    return {"status": "success"}

@router.post("/refresh")
async def refresh_token(request: Request, response: Response):
    old_refresh_token = request.cookies.get("refresh_token")
    if not old_refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token missing")

    # 1. Tìm token trong DB
    db_token = await RefreshToken.find_one(RefreshToken.token == old_refresh_token)
    if not db_token:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    # 2. Kiểm tra hết hạn chưa
    if db_token.expires_at < datetime.utcnow():
        await db_token.delete() # Xóa token rác
        raise HTTPException(status_code=401, detail="Refresh token expired, please login again")

    # 3. TÌM USER ĐỂ LẤY ROLE
    if db_token.user_id is None:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    user = await User.get(db_token.user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
        
    # 4. XOAY VÒNG TOKEN - Refresh Token cũ sẽ bị xóa và tạo mới hoàn toàn cả Access Token lẫn Refresh Token
    # Xóa token cũ ngay lập tức để không bị tích tụ rác trong DB
    await db_token.delete()
    
    # Tạo Access Token và Refresh Token mới hoàn toàn
    new_access_token = create_access_token(data={
        "sub": str(user.id), 
        "role": user.role.value
    })    
    new_refresh_token_str = create_refresh_token(data={"sub": str(user.id)})
    
    # Lưu Refresh Token mới vào DB
    expires_at = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    new_rt = RefreshToken(token=new_refresh_token_str, user_id=str(user.id), expires_at=expires_at)
    await new_rt.insert()

    # 5. Set Cookie mới
    response.set_cookie(
        key="access_token", value=new_access_token, httponly=True, 
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60, samesite="lax"
    )
    response.set_cookie(
        key="refresh_token", value=new_refresh_token_str, httponly=True, 
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60, samesite="lax"
    )
    
    return {"status": "success"}

@router.post("/logout")
async def logout(request: Request, response: Response):
    # Lấy refresh token để xóa khỏi DB
    refresh_token = request.cookies.get("refresh_token")
    if refresh_token:
        db_token = await RefreshToken.find_one(RefreshToken.token == refresh_token)
        if db_token:
            await db_token.delete()

    # Xóa cookies ở Browser
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    
    return {"status": "success"}


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def create_account(data: UserCreate):
    # 1. Kiểm tra xem username đã tồn tại chưa
    existing_username = await User.find_one(User.username == data.username)
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Tên đăng nhập này đã có người sử dụng"
        )
    
    # 2. Kiểm tra xem email đã tồn tại chưa
    existing_email = await User.find_one(User.email == data.email)
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Email này đã được đăng ký"
        )

    # 3. Mã hóa mật khẩu (Tuyệt đối không lưu plain text)
    hashed_pwd = get_password_hash(data.password)

    # 4. Tạo User entity và lưu xuống DB
    new_user = User(
        username=data.username,
        email=data.email,
        password_hash=hashed_pwd,
        full_name=data.full_name,
        role=RoleEnum.USER
    )
    
    await new_user.insert()

    # Trả về thông tin cơ bản, Beanie/Pydantic sẽ tự động ẩn field password_hash
    # vì mình đã set `exclude=True` trong Model.
    return {
        "status": "success", 
        "message": "Tạo tài khoản thành công",
        "user": {
            "id": str(new_user.id),
            "username": new_user.username,
            "full_name": new_user.full_name,
            "role": new_user.role
        }
    }