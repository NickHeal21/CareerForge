from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class MentorMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=2000)

    @field_validator("content")
    @classmethod
    def content_must_not_be_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Message cannot be empty.")
        return value


class MentorChatRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    message: str = Field(min_length=1, max_length=2000)
    history: list[MentorMessage] = Field(default_factory=list, max_length=15)

    @field_validator("message")
    @classmethod
    def message_must_not_be_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Message cannot be empty.")
        return value


class MentorContextUsed(BaseModel):
    resume: bool
    profile: bool
    readiness: bool
    roadmap: bool


class MentorChatResponse(BaseModel):
    reply: str
    context_used: MentorContextUsed
