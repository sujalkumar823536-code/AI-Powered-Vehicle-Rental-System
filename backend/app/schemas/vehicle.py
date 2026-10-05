from pydantic import BaseModel


class VehicleOut(BaseModel):
    id: str
    name: str
    type: str
    seats: int
    fuel: str
    pricePerDay: int
    available: bool
