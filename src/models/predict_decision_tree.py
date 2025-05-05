import sys
import json
import joblib
import pandas as pd

# 1. Ambil input dari Node.js
if len(sys.argv) < 2:
    print(json.dumps({"error": "No input provided"}))
    sys.exit(1)

# 2. Parse jawaban user (dalam bentuk list angka)
jawaban = json.loads(sys.argv[1])

# 3. Fitur sesuai urutan saat training
feature_names = [
    'Gender',
    'self_employed',
    'family_history',
    'Days_Indoors',
    'Growing_Stress',
    'Changes_Habits',
    'Mental_Health_History',
    'Mood_Swings',
    'Coping_Struggles',
    'Work_Interest',
    'Social_Weakness',
    'mental_health_interview',
    'care_options'
]

# 4. Load model
model = joblib.load("src/models/cart_mental_health_model.pkl")

# 5. Prediksi
df_input = pd.DataFrame([jawaban], columns=feature_names)

hasil = model.predict(df_input)[0]

# 6. Tentukan pesan
if hasil == 1:
    message = "It is recommended that you seek professional help for mental health." 
else:
    message = "No indication of need for treatment at this time" 


# 7. Output ke stdout sebagai JSON
print(json.dumps({
    "result": int(hasil),
    "message": message
}))