# src/api/sockets/seminar_events.py
from cmath import log

from src.core.socket_manager import sio
from src.services.qa_service import QAService
from src.models import User
from src.config import settings
from http.cookies import SimpleCookie
import jwt

# --- HÀM HỖ TRỢ: Bóc Cookie để tìm User ---
async def get_user_from_cookie(environ) -> User | None:
    cookie_header = environ.get("HTTP_COOKIE", "")
    if not cookie_header:
        return None
    
    cookie = SimpleCookie()
    cookie.load(cookie_header)
    
    if "access_token" in cookie:
        token = cookie["access_token"].value
        try:
            # Decode y hệt như trong deps.py của bạn
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            user_id = payload.get("sub")
            if user_id:
                return await User.get(user_id)
        except Exception as e:
            log.error(f"Error decoding token: {e}")
            return None
    return None

# --- SỰ KIỆN KẾT NỐI ---
@sio.event
async def connect(sid, environ):
    # 1. Bóc token từ Cookie để xem ai đang kết nối
    current_user = await get_user_from_cookie(environ)
    # 2. Lưu thông tin user vào Session của Socket này
    await sio.save_session(sid, {"current_user": current_user})
    
    user_type = f"User ({current_user.username})" if current_user else "Guest"
    print(f"🔥 [Socket] {user_type} đã kết nối: {sid}")

@sio.event
async def disconnect(sid):
    print(f"❌ [Socket] Thiết bị đã ngắt kết nối: {sid}")

# --- CASE 1: JOIN ROOM ---
@sio.on("join_conference")
async def handle_join(sid, data):
    room_id = data.get("room_id")
    await sio.enter_room(sid, room_id)
    print(f"[Socket] {sid} đã vào phòng: {room_id}")
    await sio.emit("notification", {"msg": f"Bạn đã kết nối vào phòng {room_id}"}, room=sid)

# --- CASE 2: SEND QA ---
@sio.on("send_qa")
async def handle_send_qa(sid, data):
    seminar_id = data.get("seminar_id")
    question = data.get("question")
    guest_id = data.get("guest_id") 
    
    # 1. Lấy thông tin User từ Session đã lưu lúc connect
    session = await sio.get_session(sid)
    current_user = session.get("current_user")
    
    try:
        # 2. Gọi Service. Đưa cả current_user và guest_id vào. Service sẽ tự biết ưu tiên ai.
        qa_data = await QAService.create_question(
            seminar_id=seminar_id,
            question=question,
            current_user=current_user, # Truyền User vào đây!
            guest_id=guest_id
        )
        
        # 3. Thành công: Bắn sự kiện "new_question" cho CẢ PHÒNG
        await sio.emit("new_question", qa_data, room=seminar_id)
        
    except ValueError as e:
        # 4. Thất bại: Chủ động bắn sự kiện "error_msg" vào RIÊNG mặt người gửi (room=sid)
        print(f"❌ [Socket Error] Lỗi từ {sid}: {str(e)}")
        await sio.emit("error_msg", {"msg": str(e)}, room=sid)