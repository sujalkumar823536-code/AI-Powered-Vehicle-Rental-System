from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.errors import DuplicateKeyError

from app.api.deps import get_current_user, serialize_user
from app.core.database import get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.schemas.user import TokenResponse, UserCreate, UserLogin, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(data: UserCreate):
    db = get_db()
    doc = {
        "name": data.name.strip(),
        "email": data.email.lower(),
        "password_hash": hash_password(data.password),
        "role": "user",
        "created_at": datetime.now(timezone.utc),
    }
    try:
        result = await db.users.insert_one(doc)
    except DuplicateKeyError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This email is already registered.")
    doc["_id"] = result.inserted_id
    return serialize_user(doc)


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin):
    user = await get_db().users.find_one({"email": data.email.lower()})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password.")
    return {
        "access_token": create_access_token(str(user["_id"])),
        "token_type": "bearer",
        "user": serialize_user(user),
    }


@router.get("/me", response_model=UserOut)
async def me(user: dict = Depends(get_current_user)):
    return serialize_user(user)
