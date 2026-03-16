from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, func
from .database import Base

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    q_type = Column(String, index=True, nullable=True) # 题型
    content = Column(String, nullable=True) # 题干
    option_a = Column(String, nullable=True)
    option_b = Column(String, nullable=True)
    option_c = Column(String, nullable=True)
    option_d = Column(String, nullable=True)
    answer = Column(String, nullable=True)
    original_id = Column(String, nullable=True) # 原4805题号
    source = Column(String, nullable=True) # 新题依据
    remark = Column(String, nullable=True) # 备注
    ai_explanation = Column(String, nullable=True) # AI 解析

class UserProgress(Base):
    __tablename__ = "user_progress"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"), unique=True)
    is_favorite = Column(Boolean, default=False)
    wrong_count = Column(Integer, default=0)
    is_answered = Column(Boolean, default=False)
    user_answer = Column(String, nullable=True)
    last_wrong_at = Column(DateTime, nullable=True)
    notes = Column(String, nullable=True) # 个人笔记
