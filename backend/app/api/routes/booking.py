from datetime import date

from pydantic import BaseModel, Field


class DetailForm(BaseModel):
    """Renter details from the detail form on the vehicle page. All optional."""

    fullName: str | None = Field(default=None, max_length=80)
    phone: str | None = Field(default=None, max_length=20)
    email: str | None = Field(default=None, max_length=120)
    licence: str | None = Field(default=None, max_length=30)
    location: str | None = Field(default=None, max_length=200)
    notes: str | None = Field(default=None, max_length=500)


class BookingCreate(DetailForm):
    vehicleId: str
    startDate: date
    endDate: date


class DetailOut(BaseModel):
    """The renter details sent back with each booking."""

    fullName: str | None = None
    phone: str | None = None
    email: str | None = None
    licence: str | None = None
    location: str | None = None
    notes: str | None = None


class BookingOut(BaseModel):
    id: str
    vehicleId: str
    vehicleName: str
    startDate: str
    endDate: str
    totalPrice: int
    status: str
    details: DetailOut | None = None  # None for bookings made before the detail form existed