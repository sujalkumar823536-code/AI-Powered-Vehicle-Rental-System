from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import settings

client: AsyncIOMotorClient | None = None


async def connect_db() -> None:
    global client
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DB_NAME]
    # One account per email
    await db.users.create_index("email", unique=True)


async def close_db() -> None:
    if client:
        client.close()


def get_db() -> AsyncIOMotorDatabase:
    return client[settings.DB_NAME]
