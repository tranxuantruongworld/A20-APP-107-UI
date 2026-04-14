from src.models import Seminar
from src.schemas.seminar_schema import SeminarCreate, SeminarUpdate
from beanie import PydanticObjectId

class SeminarService:
    @staticmethod
    async def create(data: SeminarCreate):
        new_seminar = Seminar(**data.model_dump())
        await new_seminar.insert()
        return new_seminar

    @staticmethod
    async def get_all():
        return await Seminar.find_all().to_list()

    @staticmethod
    async def get_one(id: str):
        return await Seminar.get(id)

    @staticmethod
    async def update(id: str, data: SeminarUpdate):
        seminar = await Seminar.get(id)
        if seminar:
            update_data = data.model_dump(exclude_unset=True)
            await seminar.set(update_data)
        return seminar

    @staticmethod
    async def delete(id: str):
        seminar = await Seminar.get(id)
        if seminar:
            await seminar.delete()
            return True
        return False