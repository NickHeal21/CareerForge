"""Interview schemas."""

from pydantic import BaseModel


class InterviewStartRequest(BaseModel):
    interview_type: str = "technical"
    topic: str
    num_questions: int = 5


class InterviewAnswerRequest(BaseModel):
    question_index: int
    question: str
    answer: str
