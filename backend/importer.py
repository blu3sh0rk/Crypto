import pandas as pd
from sqlalchemy.orm import Session
from . import models

def import_excel(db: Session, file_path: str):
    # Skip the first row (header description) and use the second row as header
    # header=1 means 0-indexed row 1 is the header
    try:
        df = pd.read_excel(file_path, header=1)
    except Exception as e:
        print(f"Error reading excel: {e}")
        return

    for _, row in df.iterrows():
        def get_val(val):
            if pd.isna(val):
                return None
            return str(val).strip()

        # Check if the row is valid (e.g. has content)
        content = get_val(row.get('题干'))
        if not content:
            continue

        question = models.Question(
            q_type=get_val(row.get('题型')),
            content=content,
            option_a=get_val(row.get('选项A')),
            option_b=get_val(row.get('选项B')),
            option_c=get_val(row.get('选项C')),
            option_d=get_val(row.get('选项D')),
            answer=get_val(row.get('答案')),
            original_id=get_val(row.get('原4805题号')),
            source=get_val(row.get('新题依据')),
            remark=get_val(row.get('备注'))
        )
        db.add(question)
    
    db.commit()
