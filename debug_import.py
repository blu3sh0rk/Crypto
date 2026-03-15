from backend import models, database, importer
from sqlalchemy.orm import Session
import os

# Create tables
models.Base.metadata.create_all(bind=database.engine)

db = database.SessionLocal()

try:
    print("Testing import...")
    importer.import_excel(db, "practice.xlsx")
    print("Import finished.")
    
    count = db.query(models.Question).count()
    print(f"Total questions: {count}")
    
    if count > 0:
        q = db.query(models.Question).first()
        print(f"First question: {q.content}")
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
