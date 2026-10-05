from bson import ObjectId
from fastapi import APIRouter, HTTPException, Query, status

from app.core.database import get_db
from app.schemas.vehicle import VehicleOut

router = APIRouter(prefix="/vehicles", tags=["vehicles"])


def serialize_vehicle(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "name": doc["name"],
        "type": doc["type"],
        "seats": doc["seats"],
        "fuel": doc["fuel"],
        "pricePerDay": doc["pricePerDay"],
        "available": doc.get("available", True),
    }


@router.get("", response_model=list[VehicleOut])
async def list_vehicles(type: str | None = Query(default=None)):
    query = {"type": type} if type else {}
    docs = await get_db().vehicles.find(query).sort("pricePerDay", 1).to_list(length=200)
    return [serialize_vehicle(d) for d in docs]


@router.get("/{vehicle_id}", response_model=VehicleOut)
async def get_vehicle(vehicle_id: str):
    if not ObjectId.is_valid(vehicle_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found.")
    doc = await get_db().vehicles.find_one({"_id": ObjectId(vehicle_id)})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found.")
    return serialize_vehicle(doc)
