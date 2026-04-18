from fastapi import APIRouter
from ..database import check_db_health

router = APIRouter(prefix="/health", tags=["System"])

@router.get("/")
async def health_check():
    """Check service liveness and database connectivity.

    Returns:
    - ``status``: Always ``"online"`` when the app is running.
    - ``database``: ``"connected"`` or ``"disconnected"`` based on a MongoDB ping.
    """
    db_status = await check_db_health()
    return {
        "status": "online",
        "database": "connected" if db_status else "disconnected"
    }