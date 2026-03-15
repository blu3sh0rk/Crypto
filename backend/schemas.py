from pydantic import BaseModel, Field, computed_field
from typing import Optional, List
from datetime import datetime

class QuestionBase(BaseModel):
    id: int
    q_type: Optional[str] = Field(None, alias="category")
    content: Optional[str] = None
    answer: Optional[str] = Field(None, alias="correct_answer")
    original_id: Optional[str] = None
    source: Optional[str] = None
    remark: Optional[str] = Field(None, alias="explanation")

    class Config:
        from_attributes = True
        populate_by_name = True

class QuestionResponse(QuestionBase):
    options: List[str] = []
    is_favorite: bool = False
    wrong_count: int = 0
    is_answered: bool = False
    user_answer: Optional[str] = None

class QuestionListResponse(BaseModel):
    questions: List[QuestionResponse]
    total: int
    page: int
    limit: int

class AnswerSubmitItem(BaseModel):
    question_id: int
    user_answer: str

class AnswerSubmitRequest(BaseModel):
    answers: List[AnswerSubmitItem]

class AnswerResultItem(BaseModel):
    question_id: int
    user_answer: str
    correct_answer: str
    is_correct: bool
    explanation: Optional[str] = None

class AnswerSubmitResponse(BaseModel):
    score: float
    correct_count: int
    total_count: int
    results: List[AnswerResultItem]

class ToggleFavoriteRequest(BaseModel):
    is_favorite: bool

class RecordWrongRequest(BaseModel):
    pass

class RecordAnswerRequest(BaseModel):
    user_answer: str
    is_correct: bool
