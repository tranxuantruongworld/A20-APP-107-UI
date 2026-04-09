from fastapi import FastAPI
import socketio
from .routes import health

app = FastAPI(title="FastAPI Mongo Starter")

app.include_router(health.router)

@app.get("/")
async def root():
    return {"message": "Welcome to FastAPI MongoDB API"}

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