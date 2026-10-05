from datetime import datetime, timedelta, timezone

import bcrypt
from bson import ObjectId
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from app.core.config import settings
from app.core.database import get_db


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> str | None:
    """Returns the user id, or None if the token is invalid or expired."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None


# ---- optional auth for the chat assistant ----

# auto_error=False: a missing token gives None instead of a 401
_optional_bearer = HTTPBearer(auto_error=False)


async def get_optional_user(
    creds: HTTPAuthorizationCredentials | None = Depends(_optional_bearer),
) -> dict | None:
    """Returns the logged-in user, or None for guests / invalid / expired tokens."""
    if creds is None:
        return None
    user_id = decode_access_token(creds.credentials)
    if not user_id:
        return None
    try:
        user = await get_db().users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        return None
    if not user:
        return None
    return {"id": str(user["_id"]), "email": user.get("email"), "name": user.get("name")}