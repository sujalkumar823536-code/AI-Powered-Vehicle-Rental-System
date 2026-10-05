from pydantic import BaseModel, Field


class ChatTurn(BaseModel):
    role: str
    text: str = Field(max_length=4000)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=500)
    history: list[ChatTurn] = Field(default_factory=list)


class ChatResponse(BaseModel):
    reply: str
    booked: bool = False

