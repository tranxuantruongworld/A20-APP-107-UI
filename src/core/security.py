# src/core/security.py
from datetime import datetime, timedelta
from jose import jwt
from src.config import settings
# from passlib.context import CryptContext

# Tốt nhất nên đưa secret key vào file .env
# SECRET_KEY = "super_secret_key_cua_du_an_nay_can_phai_doi"
# ALGORITHM = "HS256"
# ACCESS_TOKEN_EXPIRE_MINUTES = 30
# REFRESH_TOKEN_EXPIRE_DAYS = 7

from pwdlib import PasswordHash
from pwdlib.hashers.bcrypt import BcryptHasher

# Khởi tạo haser mới thay thế passlib
password_hash = PasswordHash((BcryptHasher(),))

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return password_hash.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return password_hash.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)