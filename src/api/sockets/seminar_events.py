import logging
from src.core.socket_manager import sio
from src.services.qa_service import QAService
from src.models import User
from src.config import settings
from http.cookies import SimpleCookie
from jose import jwt, JWTError

log = logging.getLogger(__name__)

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
            # Bóc token bằng jose 
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            user_id = payload.get("sub")
            if user_id:
                return await User.get(user_id)
        except JWTError as e:
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

# --- CASE 2: SEND QA (Khán giả gửi câu hỏi) ---
@sio.on("send_qa")
async def handle_send_qa(sid, data):
    seminar_id = data.get("seminar_id")
    question = data.get("question")
    guest_id = data.get("guest_id") 
    
    session = await sio.get_session(sid)
    current_user = session.get("current_user")
    
    try:
        qa_data = await QAService.create_question(
            seminar_id=seminar_id,
            question=question,
            current_user=current_user,
            guest_id=guest_id
        )
        
        # Bắn cho cả phòng thấy câu hỏi mới
        await sio.emit("new_question", qa_data, room=seminar_id)
        
        # RETURN: Báo cho Frontend biết là "Gửi thành công rồi!"
        return {"status": "success", "message": "Gửi câu hỏi thành công!", "data": qa_data}
        
    except ValueError as e:
        print(f"❌ [Socket Error] Lỗi từ {sid}: {str(e)}")
        # RETURN: Báo lỗi cho Frontend
        return {"status": "error", "message": str(e)}

# --- CASE 3: ANSWER QA (Speaker trả lời câu hỏi) ---
@sio.on("answer_question")
async def handle_answer_qa(sid, data):
    qa_id = data.get("qa_id")
    answer = data.get("answer")

    session = await sio.get_session(sid)
    current_user = session.get("current_user")

    # 1. Kiểm tra bảo mật: Phải đăng nhập và Role phải là Speaker
    if not current_user:
        return {"status": "error", "message": "Bạn cần đăng nhập để trả lời."}
        
    if current_user.role.value != "speaker":
        return {"status": "error", "message": "Chỉ Speaker mới có quyền trả lời câu hỏi!"}

    try:
        # 2. Gọi Service để update DB
        qa_data = await QAService.answer_question(qa_id, answer, current_user)

        # 3. Phát sóng câu trả lời cho toàn bộ khán giả trong phòng
        await sio.emit("question_answered", qa_data, room=qa_data["seminar_id"])

        # 4. RETURN: Báo cho màn hình của Speaker biết là cập nhật thành công
        return {"status": "success", "message": "Đã gửi câu trả lời!", "data": qa_data}

    except ValueError as e:
        print(f"❌ [Socket Error] Lỗi trả lời từ {sid}: {str(e)}")
        return {"status": "error", "message": str(e)}