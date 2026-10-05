import asyncio
import logging
from datetime import date

from langchain_core.messages import (
    AIMessage, HumanMessage, SystemMessage, ToolMessage,
)
from langchain_core.tools import tool

from app.ai.llm import get_llm
from app.ai.prompts import SYSTEM_PROMPT
from app.ai.vector_store import get_vector_store
from app.core.database import get_db
from app.schemas.chat import ChatTurn
from app.services.booking_service import BookingError, create_booking as create_booking_record

logger = logging.getLogger(__name__)
MAX_HISTORY = 8
MAX_TOOL_ROUNDS = 4


# ---- your existing helpers (unchanged) ----

async def _vehicle_context() -> str:
    docs = await get_db().vehicles.find({"available": True}).sort("pricePerDay", 1).to_list(length=30)
    today = f"Today's date is {date.today().isoformat()}."
    if not docs:
        return f"{today}\nNo vehicles are listed right now."
    lines = "\n".join(
        f"- {d['name']} | id: {d['_id']} | {d['type']} | {d['seats']} seats | {d['fuel']} | ₹{d['pricePerDay']}/day"
        for d in docs
    )
    return f"{today}\n{lines}"


def _policy_context(question: str) -> str:
    try:
        docs = get_vector_store().similarity_search(question, k=4)
    except Exception:
        logger.exception("Vector search failed")
        return "No policy information could be loaded."
    if not docs:
        return "No matching policy information found."
    return "\n\n".join(d.page_content for d in docs)


def _history_messages(history: list[ChatTurn], message: str) -> list:
    turns = [t for t in history if t.role in ("user", "assistant") and t.text.strip()]
    if turns and turns[-1].role == "user" and turns[-1].text.strip() == message.strip():
        turns = turns[:-1]
    messages = [
        HumanMessage(content=t.text) if t.role == "user" else AIMessage(content=t.text)
        for t in turns[-MAX_HISTORY:]
    ]
    while messages and isinstance(messages[0], AIMessage):
        messages.pop(0)
    return messages


def _to_text(content) -> str:
    if isinstance(content, str):
        return content
    return "".join(p.get("text", "") if isinstance(p, dict) else str(p) for p in content)


# ---- new: booking tool ----

def build_tools(user: dict | None):
    @tool
    async def create_booking(vehicle_id: str, start_date: str, end_date: str) -> str:
        """Book a vehicle for the logged-in customer.
        Call ONLY after the customer explicitly confirmed vehicle, dates and price.
        vehicle_id is the id from the vehicle list. Dates must be YYYY-MM-DD."""
        if user is None:
            return "NOT_LOGGED_IN"
        try:
            booking = await create_booking_record(
                user_id=str(user["id"]),
                vehicle_id=vehicle_id,
                start_date=date.fromisoformat(start_date),
                end_date=date.fromisoformat(end_date),
            )
        except (BookingError, ValueError) as e:
            return f"FAILED: {e}"
        return f"BOOKED: id={booking['id']}, total=₹{booking['total']}"

    return [create_booking]


# ---- main entry ----

async def answer(message: str, history: list, user: dict | None = None):
    policies = await asyncio.to_thread(_policy_context, message)
    vehicles = await _vehicle_context()

    messages = [
        SystemMessage(content=SYSTEM_PROMPT.format(policies=policies, vehicles=vehicles)),
        *_history_messages(history, message),
        HumanMessage(content=message),
    ]

    tools = build_tools(user)
    tool_map = {t.name: t for t in tools}
    llm_with_tools = get_llm().bind_tools(tools)

    booked = False
    ai = None
    for _ in range(MAX_TOOL_ROUNDS):
        ai = await llm_with_tools.ainvoke(messages)
        messages.append(ai)
        if not ai.tool_calls:
            break
        for call in ai.tool_calls:
            result = await tool_map[call["name"]].ainvoke(call["args"])
            booked = booked or result.startswith("BOOKED")
            messages.append(ToolMessage(content=result, tool_call_id=call["id"]))

    reply = _to_text(ai.content).strip() if ai else ""
    return reply or "Sorry, I couldn't complete that. Please try again.", booked