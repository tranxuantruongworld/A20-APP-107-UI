from contextlib import asynccontextmanager

from src.api.v1.endpoints import seminars
from src.database import init_db

import os
import shutil
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import socketio

from .routes import health, questions, asr, tts

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Đang khởi tạo kết nối Database...")
    await init_db()
    yield
    print("🛑 Đang đóng kết nối Database...")

app = FastAPI(title="FastAPI Mongo Starter", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

STORAGE_DIR = Path("storage")
STORAGE_DIR.mkdir(exist_ok=True)

app.include_router(health.router)
app.include_router(seminars.router, prefix="/api/v1/seminars", tags=["Seminars"])
app.include_router(questions.router)
app.include_router(asr.router)
app.include_router(tts.router)

FRONTEND_DIR = Path(__file__).resolve().parent / "static"
if FRONTEND_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")


@app.get("/")
async def root():
    """Serve trang audience frontend. Trả về index.html nếu tồn tại, ngược lại trả về JSON welcome."""
    index_path = FRONTEND_DIR / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    return {"message": "Welcome to FastAPI MongoDB API"}


@app.get("/app")
async def audience_app():
    """Alias route cho giao diện audience. Dùng khi cần link trực tiếp vào app mà không dùng route root."""
    index_path = FRONTEND_DIR / "index.html"
    if not index_path.exists():
        raise HTTPException(status_code=404, detail="Frontend app not found")
    return FileResponse(index_path)


@app.get("/demo")
async def full_demo_app():
    """Serve full product demo UI that simulates all completed use cases."""
    demo_path = FRONTEND_DIR / "demo-full.html"
    if not demo_path.exists():
        raise HTTPException(status_code=404, detail="Demo app not found")
    return FileResponse(demo_path)

sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')

combined_app = socketio.ASGIApp(sio, app)

# --- KHU VỰC XỬ LÝ SỰ KIỆN SOCKET ---

@sio.event
async def connect(sid, environ):
    print(f"🔥 Thiết bị đã kết nối: {sid}")

@sio.event
async def disconnect(sid):
    print(f"❌ Thiết bị đã ngắt kết nối: {sid}")

# Sự kiện join vào phòng hội thảo
@sio.on("join_conference")
async def handle_join(sid, data):
    room_id = data.get("room_id")
    await sio.enter_room(sid, room_id)
    print(f"User {sid} đã vào phòng: {room_id}")
    await sio.emit("notification", {"msg": f"Chào mừng bạn đến với phòng {room_id}"}, room=sid)

# Sự kiện nhận audio và xử lý (để bạn phát triển tiếp)
@sio.on("send_audio")
async def handle_audio(sid, data):
    room_id = data.get("room_id")
    # Logic Voice Agent sẽ nằm ở đây
    # Sau đó emit text cho cả phòng
    # await sio.emit("new_transcript", {"text": "Hello..."}, room=room_id)
    pass
