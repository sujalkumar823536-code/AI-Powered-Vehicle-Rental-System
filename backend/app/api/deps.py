from bson import ObjectId
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.database import get_db
from app.core.security import decode_access_token

bearer_scheme = HTTPBearer(auto_error=False)


def serialize_user(doc: dict) -> dict:
    return {"id": str(doc["_id"]), "name": doc["name"], "email": doc["email"], "role": doc["role"]}


async def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Please log in again.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if creds is None:
        raise unauthorized
    user_id = decode_access_token(creds.credentials)
    if not user_id or not ObjectId.is_valid(user_id):
        raise unauthorized
    user = await get_db().users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise unauthorized
    return user


async def get_admin_user(user: dict = Depends(get_current_user)) -> dict:
    if user["role"] != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admins only.")
    return user
