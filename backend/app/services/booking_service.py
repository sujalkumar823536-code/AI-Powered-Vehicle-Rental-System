from datetime import date, datetime, time
from bson import ObjectId
from app.core.database import get_db


class BookingError(Exception):
    pass


def _dt(d: date) -> datetime:
    return datetime.combine(d, time.min)


async def create_booking(user_id: str, vehicle_id: str, start_date: date, end_date: date) -> dict:
    if start_date < date.today():
        raise BookingError("Start date is in the past.")
    if end_date < start_date:
        raise BookingError("End date must not be before the start date.")

    try:
        vid = ObjectId(vehicle_id)
    except Exception:
        raise BookingError("Unknown vehicle.")

    db = get_db()
    vehicle = await db.vehicles.find_one({"_id": vid, "available": True})
    if not vehicle:
        raise BookingError("That vehicle is not available.")

    clash = await db.bookings.find_one({
        "vehicleId": vid,
        "status": {"$ne": "cancelled"},
        "startDate": {"$lte": _dt(end_date)},
        "endDate": {"$gte": _dt(start_date)},
    })
    if clash:
        raise BookingError("The vehicle is already booked for those dates.")

    days = (end_date - start_date).days + 1
    total = days * vehicle["pricePerDay"]
    doc = {
        "userId": ObjectId(user_id),
        "vehicleId": vid,
        "startDate": _dt(start_date),
        "endDate": _dt(end_date),
        "totalPrice": total,
        "status": "confirmed",
        "createdAt": datetime.utcnow(),
    }
    res = await db.bookings.insert_one(doc)
    return {"id": str(res.inserted_id), "total": total}