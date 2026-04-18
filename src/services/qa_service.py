# src/services/qa_service.py
from fastapi import HTTPException
from src.models import QA, Seminar, Guest, User
from typing import Optional
from beanie import PydanticObjectId

class QAService:
    @staticmethod
    async def create_question(
        seminar_id: str, 
        question: str, 
        current_user: Optional[User] = None, 
        guest_id: Optional[str] = None
    ) -> dict:
        # 1. Tìm hội thảo
        try:
            seminar = await Seminar.get(PydanticObjectId(seminar_id))
            if not seminar:
                raise ValueError("Hội thảo không tồn tại")
        except:
            raise ValueError("ID hội thảo không hợp lệ")

        # 2. Xác định danh tính
        asked_by_user = None
        asked_by_guest = None
        asker_name = "Ẩn danh"

        if current_user:
            asked_by_user = current_user
            asker_name = current_user.full_name
        elif guest_id:
            try:
                guest = await Guest.get(PydanticObjectId(guest_id))
                if not guest:
                    raise ValueError("Không tìm thấy thông tin Guest")
                asked_by_guest = guest
                asker_name = guest.full_name
            except:
                raise ValueError("guest_id không hợp lệ")
        else:
            raise ValueError("Vui lòng đăng nhập hoặc cung cấp guest_id")

        # 3. Lưu DB
        new_qa = QA(
            seminar=seminar,
            question=question,
            asked_by_user=asked_by_user,
            asked_by_guest=asked_by_guest
        )
        await new_qa.insert()

        # 4. Trả về format chuẩn để phát qua Socket/API
        return {
            "id": str(new_qa.id),
            "question": new_qa.question,
            "asker_name": asker_name,
            "status": "Chưa trả lời"
        }
    
    @staticmethod
    async def answer_question(qa_id: str, answer_text: str, current_user: User) -> dict:
        try:
            qa_obj = await QA.get(PydanticObjectId(qa_id), fetch_links=True)
            if not qa_obj:
                raise ValueError("Không tìm thấy câu hỏi này")
            
            # Cập nhật câu trả lời
            qa_obj.answer = answer_text
            qa_obj.answered_by = current_user
            await qa_obj.save()

            return {
                "id": str(qa_obj.id),
                "seminar_id": str(qa_obj.seminar.id),
                "question": qa_obj.question,
                "answer": qa_obj.answer,
                "status": "Đã trả lời"
            }
        except Exception as e:
            raise ValueError(f"Lỗi khi lưu câu trả lời: {str(e)}")
        