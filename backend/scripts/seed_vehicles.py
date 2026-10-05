"""Adds sample vehicles to MongoDB. Safe to run more than once.

Run from the backend folder:  python -m scripts.seed_vehicles
"""
import asyncio

from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings

VEHICLES = [
    {"name": "Maruti Swift", "type": "Hatchback", "seats": 5, "fuel": "Petrol", "pricePerDay": 1500, "available": True},
    {"name": "Hyundai Creta", "type": "SUV", "seats": 5, "fuel": "Diesel", "pricePerDay": 2800, "available": True},
    {"name": "Toyota Innova", "type": "MPV", "seats": 7, "fuel": "Diesel", "pricePerDay": 3500, "available": True},
    {"name": "Royal Enfield Classic", "type": "Bike", "seats": 2, "fuel": "Petrol", "pricePerDay": 900, "available": True},
    {"name": "Tata Nexon EV", "type": "SUV", "seats": 5, "fuel": "Electric", "pricePerDay": 3000, "available": True},
    {"name": "Mahindra Thar", "type": "SUV", "seats": 4, "fuel": "Diesel", "pricePerDay": 3200, "available": True},
    {"name": "Royal Enfield Meteor", "type": "Bike", "seats": 2, "fuel": "Petrol", "pricePerDay": 1000, "available": True},
]


async def main():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DB_NAME]
    added = 0
    for v in VEHICLES:
        result = await db.vehicles.update_one({"name": v["name"]}, {"$setOnInsert": v}, upsert=True)
        if result.upserted_id:
            added += 1
    print(f"Added {added} vehicle(s). Total in database: {await db.vehicles.count_documents({})}")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
