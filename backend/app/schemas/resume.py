from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class ResumeRename(BaseModel):
    name: str = Field(min_length=1, max_length=150)


class ResumeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    name: str
    original_filename: str
    extracted_text: str
    is_default: bool
    created_at: datetime
    updated_at: datetime
