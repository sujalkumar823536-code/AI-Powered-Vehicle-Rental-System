import logging

from fastapi import APIRouter, Depends, HTTPException, status

from app.ai.rag_chain import answer
from app.schemas.chat import ChatRequest, ChatResponse
from app.core.security import get_optional_user  # adjust to where you put it

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
async def chat(data: ChatRequest, user: dict | None = Depends(get_optional_user)):
    try:
        reply, booked = await answer(data.message, data.history, user)
    except Exception:
        logger.exception("Chat request failed")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The assistant is unavailable right now. Please try again.",
        )
    return {"reply": reply, "booked": booked}