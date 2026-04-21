from contextlib import asynccontextmanager

from src.api.endpoints import seminars, auth
from src.database import init_db

import os
import shutil
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import socketio
from src.core.socket_manager import sio
import src.api.sockets.seminar_events

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
app.include_router(seminars.router, prefix="/api/seminars", tags=["Seminars"])
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
# app.include_router(questions.router)
# app.include_router(asr.router)
# app.include_router(tts.router)

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

combined_app = socketio.ASGIApp(sio, app)

