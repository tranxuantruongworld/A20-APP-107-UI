from pymongo import AsyncMongoClient
from beanie import init_beanie
from .models import User, Guest, Seminar, QA, RefreshToken
from .config import settings


async def init_db():
    # Khởi tạo client bên trong hàm async để nó chạy đúng Event Loop của Python 3.11
    client = AsyncMongoClient(settings.MONGO_URI)
    db = client[settings.DATABASE_NAME]
    
    # Khởi tạo Beanie
    await init_beanie(
        database=db, 
        document_models=[User, Guest, Seminar, QA, RefreshToken]
    )
    print("✅ Kết nối Database và khởi tạo Beanie thành công!")

async def check_db_health():
    # Nếu cần check health, ta tạo một client tạm thời hoặc dùng client global nếu bạn khai báo global
    try:
        temp_client = AsyncMongoClient(settings.MONGO_URI)
        await temp_client.admin.command('ping')
        return True
    except Exception:
        return False