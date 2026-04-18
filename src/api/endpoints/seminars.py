from cmath import log

from fastapi import APIRouter, HTTPException, status, Depends
from src.schemas.guest_schema import GuestJoinSchema
from src.api.deps import get_current_user
from src.models import QA, Guest, RoleEnum, Seminar, User
from src.schemas.qa_schema import AnswerCreate, PersonInfo, QuestionCreate, QuestionListResponse, QuestionOut
from src.schemas.seminar_schema import SeminarCreate, SeminarOut, SeminarUpdate
from src.services.qa_service import QAService
from src.services.seminar_service import SeminarService
from typing import List, Optional
from beanie import PydanticObjectId
from src.core.socket_manager import sio

router = APIRouter()

#TODO check api my-seminars
@router.get("/my-seminars")
async def get_my_seminars(
    guest_id: Optional[str] = None,
    current_user: Optional[User] = Depends(get_current_user)
):
    if not current_user and not guest_id:
        raise HTTPException(
            status_code=400, 
            detail="Vui lòng cung cấp guest_id hoặc đăng nhập để xem hội thảo của bạn"
        )

    # Khởi tạo filter trống
    query_filter = {}

    if current_user:
        # User đã login: tìm trong mảng participants
        query_filter = Seminar.participants.id == current_user.id
    elif guest_id:
        # Trường hợp là Guest: phải convert guest_id sang ObjectId
        try:
            # Ép kiểu từ string sang ObjectId để MongoDB hiểu được
            obj_id = PydanticObjectId(guest_id)
            query_filter = Seminar.guests.id == obj_id
        except Exception:
            raise HTTPException(status_code=400, detail="guest_id không đúng định dạng ObjectId")

    # Thực hiện tìm kiếm
    my_seminars = await Seminar.find(query_filter).to_list()
    
    return {"status": "success", "data": my_seminars}

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_seminar(payload: SeminarCreate):
    return await SeminarService.create(payload)

@router.get("/", response_model=List[SeminarOut])
async def list_seminars():
    return await SeminarService.get_all()

@router.get("/{id}")
async def get_seminar(id: str):
    seminar = await SeminarService.get_one(id)
    if not seminar:
        raise HTTPException(status_code=404, detail="Seminar not found")
    return seminar

@router.patch("/{id}")
async def update_seminar(id: str, payload: SeminarUpdate):
    updated = await SeminarService.update(id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Seminar not found")
    return updated

@router.delete("/{id}")
async def delete_seminar(id: str):
    success = await SeminarService.delete(id)
    if not success:
        raise HTTPException(status_code=404, detail="Seminar not found")
    return {"message": "Deleted successfully"}

@router.post("/{seminar_id}/join")
async def join_seminar(
    seminar_id: str,
    guest_data: Optional[GuestJoinSchema] = None,
    current_user: Optional[User] = Depends(get_current_user) # Có thể None nếu chưa login
):
    # 1. Tìm hội thảo
    seminar = await Seminar.get(seminar_id)
    if not seminar:
        raise HTTPException(status_code=404, detail="Không tìm thấy hội thảo")

    # 2. Trường hợp là User (Đã login)
    if current_user:
        # Kiểm tra xem đã join chưa để tránh trùng lặp
        if any(link.ref.id == current_user.id for link in seminar.participants):
            return {"status": "success", "message": "Bạn đã tham gia hội thảo này rồi"}
        
        # Thêm User vào danh sách participants
        seminar.participants.append(current_user)
        await seminar.save()
        return {"status": "success", "message": f"User {current_user.full_name} đã tham gia"}

    # 3. Trường hợp là Guest (Chưa login)
    if not guest_data:
        raise HTTPException(
            status_code=400, 
            detail="Vui lòng cung cấp thông tin khách mời hoặc đăng nhập"
        )

    # Tìm Guest cũ hoặc tạo mới dựa trên email
    guest = await Guest.find_one(Guest.email == guest_data.email)
    if not guest:
        guest = Guest(**guest_data.model_dump())
        await guest.insert()
    
    # Kiểm tra xem Guest đã trong danh sách chưa
    if any(link.ref.id == guest.id for link in seminar.guests):
        return {"status": "success", "message": "Khách mời đã tham gia hội thảo này"}

    # Thêm Guest vào danh sách guests
    seminar.guests.append(guest)
    await seminar.save()

    return {"status": "success", "message": f"Khách mời {guest.full_name} đã tham gia"}

@router.post("/{seminar_id}/questions", status_code=status.HTTP_201_CREATED)
async def ask_question(
    seminar_id: str,
    data: QuestionCreate,
    current_user: Optional[User] = Depends(get_current_user)
):
    try:
        # Gọi chung 1 service
        qa_data = await QAService.create_question(
            seminar_id=seminar_id,
            question=data.question,
            current_user=current_user,
            guest_id=data.guest_id
        )
        
        # API vẫn làm nhiệm vụ phát sóng Socket cho phòng
        await sio.emit("new_question", qa_data, room=seminar_id)
        
        return {"status": "success", "data": qa_data}
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{seminar_id}/questions", response_model=QuestionListResponse)
async def get_seminar_questions(seminar_id: str):
    try:
        sem_id = PydanticObjectId(seminar_id)
    except Exception:
        raise HTTPException(status_code=400, detail="ID hội thảo không hợp lệ")

    questions = await QA.find(QA.seminar.id == sem_id, fetch_links=True).to_list()    
    
    result = []
    for q in questions:
        # 1. Gom thông tin người hỏi (Dùng Class thay vì dict {})
        asker_info = PersonInfo(name="Ẩn danh", type="unknown")
        
        if q.asked_by_user:
            asker_info.name = q.asked_by_user.full_name
            asker_info.id = str(q.asked_by_user.id)
            asker_info.type = "user"
        elif q.asked_by_guest:
            asker_info.name = q.asked_by_guest.full_name
            asker_info.id = str(q.asked_by_guest.id)
            asker_info.type = "guest"
            
        # 2. Gom thông tin người trả lời
        answerer_info = None
        if q.answered_by:
            answerer_info = PersonInfo(
                id=str(q.answered_by.id),
                name=q.answered_by.full_name,
                type="speaker"
            )
            
        # 3. Đổ thẳng vào Khuôn QuestionOut
        q_out = QuestionOut(
            id=str(q.id),
            seminar_id=str(q.seminar.id) if q.seminar else seminar_id,
            question=q.question,
            answer=q.answer,
            asker=asker_info,
            answerer=answerer_info,
            ai_summary=q.ai_summary,
            ai_relevance_score=q.ai_relevance_score,
            user_feedbacks=q.user_feedbacks,
            guest_feedbacks=q.guest_feedbacks
        )
        result.append(q_out)
        
    return QuestionListResponse(status="success", data=result)

@router.post("/questions/{qa_id}/answer")
async def answer_question_api(
    qa_id: str,
    payload: AnswerCreate,
    current_user: User = Depends(get_current_user) 
):
    # 1. Kiểm tra quyền: Phải là Speaker mới được trả lời
    if current_user.role.value != RoleEnum.SPEAKER.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Chỉ Speaker mới có quyền trả lời câu hỏi"
        )
    
    # Note: Các check khác như "User này có phải chủ của Seminar này không" 
    # hoặc "Seminar có đang diễn ra không" sẽ được bổ sung sau.

    try:
        # 2. Gọi service để lưu vào DB
        qa_data = await QAService.answer_question(qa_id, payload.answer, current_user)
        
        # 3. PHÁT SÓNG REAL-TIME: Bắn tin cho cả phòng hội thảo
        # room=qa_data["seminar_id"] đảm bảo chỉ những người trong phòng đó mới nhận được
        await sio.emit("question_answered", qa_data, room=qa_data["seminar_id"])
        
        return {"status": "success", "data": qa_data}
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    