from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from . import models, schemas, database, importer, auth
import os

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")

# Dependency
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/api/import")
def import_data(db: Session = Depends(get_db), current_user: auth.User = Depends(auth.get_current_user)):
    file_path = "practice.xlsx"
    if not os.path.exists(file_path):
        if os.path.exists(f"../{file_path}"):
            file_path = f"../{file_path}"
        else:
             raise HTTPException(status_code=404, detail="File not found")

    db.query(models.Question).delete()
    db.query(models.UserProgress).delete() # Also clear progress
    db.commit()
    
    importer.import_excel(db, file_path)
    return {"message": "Data imported successfully"}

@app.get("/api/questions", response_model=schemas.QuestionListResponse)
def read_questions(
    skip: int = 0, 
    limit: int = 20, 
    category: Optional[str] = None,
    difficulty: Optional[str] = None,
    favorites_only: bool = False,
    wrong_only: bool = False,
    page: int = 1,
    db: Session = Depends(get_db),
    current_user: auth.User = Depends(auth.get_current_user)
):
    query = db.query(models.Question, models.UserProgress).outerjoin(
        models.UserProgress, models.Question.id == models.UserProgress.question_id
    )
    
    if category:
        query = query.filter(models.Question.q_type == category)
    
    if favorites_only:
        query = query.filter(models.UserProgress.is_favorite == True)
        
    if wrong_only:
        query = query.filter(models.UserProgress.wrong_count > 0)
    
    total = query.count()
    
    # Pagination
    offset = (page - 1) * limit
    questions_db = query.offset(offset).limit(limit).all()
    
    # Transform to response format
    questions_response = []
    for q, p in questions_db:
        options = []
        if q.option_a: options.append(f"A. {q.option_a}")
        if q.option_b: options.append(f"B. {q.option_b}")
        if q.option_c: options.append(f"C. {q.option_c}")
        if q.option_d: options.append(f"D. {q.option_d}")
        
        q_resp = schemas.QuestionResponse(
            id=q.id,
            q_type=q.q_type,
            content=q.content,
            answer=q.answer,
            original_id=q.original_id,
            source=q.source,
            remark=q.remark,
            options=options,
            is_favorite=p.is_favorite if p else False,
            wrong_count=p.wrong_count if p else 0,
            is_answered=p.is_answered if p else False,
            user_answer=p.user_answer if p else None,
            notes=p.notes if p else None
        )
        questions_response.append(q_resp)
        
    return {
        "questions": questions_response,
        "total": total,
        "page": page,
        "limit": limit
    }

@app.get("/api/questions/{question_id}", response_model=schemas.QuestionResponse)
def read_question(question_id: int, db: Session = Depends(get_db), current_user: auth.User = Depends(auth.get_current_user)):
    result = db.query(models.Question, models.UserProgress).outerjoin(
        models.UserProgress, models.Question.id == models.UserProgress.question_id
    ).filter(models.Question.id == question_id).first()
    
    if result is None:
        raise HTTPException(status_code=404, detail="Question not found")
    
    q, p = result
    
    options = []
    if q.option_a: options.append(f"A. {q.option_a}")
    if q.option_b: options.append(f"B. {q.option_b}")
    if q.option_c: options.append(f"C. {q.option_c}")
    if q.option_d: options.append(f"D. {q.option_d}")
    
    return schemas.QuestionResponse(
        id=q.id,
        q_type=q.q_type,
        content=q.content,
        answer=q.answer,
        original_id=q.original_id,
        source=q.source,
        remark=q.remark,
        options=options,
        is_favorite=p.is_favorite if p else False,
        wrong_count=p.wrong_count if p else 0,
        is_answered=p.is_answered if p else False,
        user_answer=p.user_answer if p else None,
        notes=p.notes if p else None
    )

@app.post("/api/quiz/submit", response_model=schemas.AnswerSubmitResponse)
def submit_quiz(submit_data: schemas.AnswerSubmitRequest, db: Session = Depends(get_db), current_user: auth.User = Depends(auth.get_current_user)):
    results = []
    correct_count = 0
    total_count = len(submit_data.answers)
    
    for answer_item in submit_data.answers:
        q = db.query(models.Question).filter(models.Question.id == answer_item.question_id).first()
        if not q:
            continue
            
        is_correct = (answer_item.user_answer.strip().upper() == q.answer.strip().upper())
        if is_correct:
            correct_count += 1
            
        results.append(schemas.AnswerResultItem(
            question_id=q.id,
            user_answer=answer_item.user_answer,
            correct_answer=q.answer,
            is_correct=is_correct,
            explanation=q.remark
        ))
        
    score = (correct_count / total_count * 100) if total_count > 0 else 0
    
    return {
        "score": score,
        "correct_count": correct_count,
        "total_count": total_count,
        "results": results
    }

@app.post("/api/questions/{question_id}/favorite")
def toggle_favorite(question_id: int, db: Session = Depends(get_db), current_user: auth.User = Depends(auth.get_current_user)):
    progress = db.query(models.UserProgress).filter(models.UserProgress.question_id == question_id).first()
    if not progress:
        progress = models.UserProgress(question_id=question_id, is_favorite=True)
        db.add(progress)
    else:
        progress.is_favorite = not progress.is_favorite
    
    db.commit()
    return {"is_favorite": progress.is_favorite}

@app.post("/api/questions/{question_id}/wrong")
def record_wrong(question_id: int, db: Session = Depends(get_db), current_user: auth.User = Depends(auth.get_current_user)):
    progress = db.query(models.UserProgress).filter(models.UserProgress.question_id == question_id).first()
    if not progress:
        progress = models.UserProgress(question_id=question_id, wrong_count=1, last_wrong_at=datetime.now())
        db.add(progress)
    else:
        progress.wrong_count += 1
        progress.last_wrong_at = datetime.now()
    
    db.commit()
    return {"wrong_count": progress.wrong_count}

@app.post("/api/questions/{question_id}/answer")
def record_answer(question_id: int, answer_data: schemas.RecordAnswerRequest, db: Session = Depends(get_db), current_user: auth.User = Depends(auth.get_current_user)):
    progress = db.query(models.UserProgress).filter(models.UserProgress.question_id == question_id).first()
    if not progress:
        progress = models.UserProgress(
            question_id=question_id, 
            is_answered=True, 
            user_answer=answer_data.user_answer,
            wrong_count=1 if not answer_data.is_correct else 0,
            last_wrong_at=datetime.now() if not answer_data.is_correct else None
        )
        db.add(progress)
    else:
        progress.is_answered = True
        progress.user_answer = answer_data.user_answer
        if not answer_data.is_correct:
            progress.wrong_count += 1
            progress.last_wrong_at = datetime.now()
    
    db.commit()
    return {"message": "Answer recorded"}

@app.post("/api/questions/{question_id}/note")
def save_note(question_id: int, note_data: schemas.SaveNoteRequest, db: Session = Depends(get_db), current_user: auth.User = Depends(auth.get_current_user)):
    question = db.query(models.Question).filter(models.Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
        
    progress = db.query(models.UserProgress).filter(models.UserProgress.question_id == question_id).first()
    if not progress:
        progress = models.UserProgress(question_id=question_id, notes=note_data.notes)
        db.add(progress)
    else:
        progress.notes = note_data.notes
        
    db.commit()
    return {"message": "Note saved"}

@app.get("/api/stats")
def get_stats(db: Session = Depends(get_db), current_user: auth.User = Depends(auth.get_current_user)):
    total_questions = db.query(models.Question).count()
    categories = db.query(models.Question.q_type).distinct().all()
    categories_list = [c[0] for c in categories if c[0]]
    
    return {
        "total_questions": total_questions,
        "categories": categories_list
    }
