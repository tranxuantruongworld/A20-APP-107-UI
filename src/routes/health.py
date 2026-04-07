from fastapi import APIRouter
from ..database import check_db_health

router = APIRouter(prefix="/health", tags=["System"])

@router.get("/")
async def health_check():
    db_status = await check_db_health()
    return {
        "status": "online",
        "database": "connected" if db_status else "disconnected"
    }