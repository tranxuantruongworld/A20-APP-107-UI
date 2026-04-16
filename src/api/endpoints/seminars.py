from cmath import log

from fastapi import APIRouter, HTTPException, status, Depends
from src.schemas.guest_schema import GuestJoinSchema
from src.api.deps import get_current_user
from src.models import QA, Guest, Seminar, User
from src.schemas.qa_schema import QuestionCreate
from src.schemas.seminar_schema import SeminarCreate, SeminarOut, SeminarUpdate
from src.services.qa_service import QAService
from src.services.seminar_service import SeminarService
from typing import List, Optional
from beanie import PydanticObjectId
from src.core.socket_manager import sio

router = APIRouter()

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
        query_filter = {"participants.$id": current_user.id}
    elif guest_id:
        # Trường hợp là Guest: phải convert guest_id sang ObjectId
        try:
            # Ép kiểu từ string sang ObjectId để MongoDB hiểu được
            obj_id = PydanticObjectId(guest_id)
            query_filter = {"guests.$id": obj_id}
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

@router.get("/{seminar_id}/questions")
async def get_seminar_questions(seminar_id: str):
    try:
        sem_id = PydanticObjectId(seminar_id)
    except:
        raise HTTPException(status_code=400, detail="ID hội thảo không hợp lệ")

    # fetch_links=True giúp lấy data thật của User/Guest thay vì chỉ lấy Link(ID)
    questions = await QA.find(QA.seminar.id == sem_id, fetch_links=True).to_list()    
    result = []
    for q in questions:
        # Xác định tên người hỏi
        asker_name = "Ẩn danh"
        if q.asked_by_user:
            asker_name = q.asked_by_user.full_name
        elif q.asked_by_guest:
            asker_name = q.asked_by_guest.full_name
            
        result.append({
            "id": str(q.id),
            "question": q.question,
            "answer": q.answer,
            "asker_name": asker_name,
            "ai_relevance_score": q.ai_relevance_score
        })
        
    return {"status": "success", "data": result}