from motor.motor_asyncio import AsyncIOMotorClient
from .config import settings

client = AsyncIOMotorClient(settings.MONGO_URI)
db = client[settings.DATABASE_NAME]

async def check_db_health():
    try:
        await client.admin.command('ping')
        return True
    except Exception:
        return False