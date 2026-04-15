from fastapi import APIRouter, HTTPException, status
from src.schemas.seminar_schema import SeminarCreate, SeminarUpdate
from src.services.seminar_service import SeminarService
from typing import List

router = APIRouter()

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_seminar(payload: SeminarCreate):
    return await SeminarService.create(payload)

@router.get("/", response_model=List[SeminarCreate])
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