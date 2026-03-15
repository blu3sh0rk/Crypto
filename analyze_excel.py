
import pandas as pd

try:
    df = pd.read_excel("practice.xlsx")
    print("Headers:", df.columns.tolist())
    print("First row:", df.iloc[0].tolist() if not df.empty else "Empty")
except Exception as e:
    print("Error:", e)
