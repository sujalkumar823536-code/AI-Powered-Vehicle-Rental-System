from datetime import date, datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user
from app.core.database import get_db
from app.schemas.booking import BookingCreate, BookingOut, DetailForm

router = APIRouter(prefix="/bookings", tags=["bookings"])


def serialize_details(form: dict | None) -> dict | None:
    """Stored detail form -> the names the frontend uses. None for older bookings."""
    if not form:
        return None
    return {
        "fullName": form.get("full_name"),
        "phone": form.get("phone"),
        "email": form.get("email"),
        "licence": form.get("licence"),
        "location": form.get("pickup_location"),
        "notes": form.get("notes"),
    }


def serialize_booking(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "vehicleId": str(doc["vehicle_id"]),
        "vehicleName": doc["vehicle_name"],
        "startDate": doc["start_date"],
        "endDate": doc["end_date"],
        "totalPrice": doc["total_price"],
        "status": doc["status"],
        "details": serialize_details(doc.get("detail_form")),
    }


def clean_detail_form(data: DetailForm) -> dict:
    """Detail form values, trimmed. Empty values become None."""

    def clean(value: str | None) -> str | None:
        value = (value or "").strip()
        return value or None

    licence = clean(data.licence)
    phone = clean(data.phone)
    return {
        "full_name": clean(data.fullName),
        "phone": phone.replace(" ", "").replace("-", "") if phone else None,
        "email": clean(data.email).lower() if clean(data.email) else None,
        "licence": licence.replace(" ", "").replace("-", "").upper() if licence else None,
        "pickup_location": clean(data.location),
        "notes": clean(data.notes),
    }


@router.post("", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
async def create_booking(data: BookingCreate, user: dict = Depends(get_current_user)):
    db = get_db()

    if data.startDate < date.today():
        raise HTTPException(status_code=400, detail="Pick-up date cannot be in the past.")
    if data.endDate < data.startDate:
        raise HTTPException(status_code=400, detail="Return date must be on or after the pick-up date.")

    if not ObjectId.is_valid(data.vehicleId):
        raise HTTPException(status_code=404, detail="Vehicle not found.")
    vehicle = await db.vehicles.find_one({"_id": ObjectId(data.vehicleId)})
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found.")
    if not vehicle.get("available", True):
        raise HTTPException(status_code=400, detail="This vehicle is not available for booking.")

    start, end = data.startDate.isoformat(), data.endDate.isoformat()

    # Reject if another confirmed booking overlaps these dates
    clash = await db.bookings.find_one(
        {
            "vehicle_id": vehicle["_id"],
            "status": "confirmed",
            "start_date": {"$lte": end},
            "end_date": {"$gte": start},
        }
    )
    if clash:
        raise HTTPException(status_code=409, detail="This vehicle is already booked for those dates.")

    days = (data.endDate - data.startDate).days + 1  # both days count
    doc = {
        "user_id": user["_id"],
        "vehicle_id": vehicle["_id"],
        "vehicle_name": vehicle["name"],
        "start_date": start,
        "end_date": end,
        "total_price": days * vehicle["pricePerDay"],
        "status": "confirmed",
        "detail_form": clean_detail_form(data),  # filled in on the detail form
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.bookings.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_booking(doc)


@router.get("/me", response_model=list[BookingOut])
async def my_bookings(user: dict = Depends(get_current_user)):
    docs = (
        await get_db()
        .bookings.find({"user_id": user["_id"], "status": "confirmed"})
        .sort("start_date", -1)
        .to_list(length=200)
    )
    return [serialize_booking(d) for d in docs]


@router.delete("/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_booking(booking_id: str, user: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(booking_id):
        raise HTTPException(status_code=404, detail="Booking not found.")
    result = await get_db().bookings.update_one(
        {"_id": ObjectId(booking_id), "user_id": user["_id"], "status": "confirmed"},
        {"$set": {"status": "cancelled"}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found.")