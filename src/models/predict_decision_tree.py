import sys
import json
import pandas as pd
import joblib

MODEL_PATH = "src/models/depression_model.pkl"
DATASET_PATH = "src/uploads/dataset.csv"

try:
    # Load model
    print("sys.argv:", sys.argv, file=sys.stderr)
    model = joblib.load(MODEL_PATH)
    print("Model loaded successfully", file=sys.stderr)

    # Ambil jawaban user dari Node.js
    user_answers = json.loads(sys.argv[1])
    print("Jawaban user:", user_answers, file=sys.stderr)

    # Load dataset untuk mendapatkan nama fitur
    df = pd.read_csv(DATASET_PATH, sep=";")  # Pastikan delimiter sesuai dataset

    # Bersihkan spasi di nama kolom
    df.columns = df.columns.str.strip()

    # Hanya ambil nama fitur (kolom kecuali DepressionState)
    feature_names = df.columns[:-1]  # Ambil semua kolom kecuali kolom terakhir (DepressionState)
    print("Feature names (cleaned):", list(feature_names), file=sys.stderr)  # Debugging

    # Pastikan input user sesuai dengan jumlah fitur (14 kolom)
    if len(user_answers) != len(feature_names):
        raise ValueError(f"Jumlah jawaban tidak sesuai, harus {len(feature_names)} kolom.")

    # Konversi input user ke DataFrame dengan nama fitur yang sesuai
    user_df = pd.DataFrame([user_answers], columns=feature_names)
    print("User DataFrame:", user_df, file=sys.stderr)  # Debugging

    # Prediksi menggunakan model
    prediction = model.predict(user_df)
    print("Prediksi hasil:", prediction, file=sys.stderr)  # Debugging

    # Kirim hasil diagnosa ke Node.js (langsung sebagai string, bukan integer)
    print(json.dumps({"diagnosis": prediction[0]}))

except Exception as e:
    print(json.dumps({"error": str(e)}), file=sys.stderr)
