import pandas as pd
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.preprocessing import StandardScaler

# Path dataset & model
DATASET_PATH = "src/uploads/depression_dataset.csv"
MODEL_PATH = "src/models/depression_model.pkl"

# Cek apakah file dataset ada sebelum membacanya
if not os.path.exists(DATASET_PATH):
    raise FileNotFoundError(f"File {DATASET_PATH} tidak ditemukan!")

# Load dataset dengan pemisah titik koma (;)
df = pd.read_csv(DATASET_PATH, sep=';')

# Bersihkan nama kolom dari spasi
df.columns = df.columns.str.strip()

# Bersihkan label dari karakter tidak diinginkan
df['DepressionState'] = (
    df['DepressionState']
    .astype(str)
    .str.replace(r'^\d+\s*\\?t*', '', regex=True)  # Hapus angka+tab di depan
    .str.replace(r'\s+', ' ', regex=True)          # Ganti spasi berlebih dengan satu spasi
    .str.strip()                                   # Hapus spasi depan-belakang
)

# Tampilkan dataset setelah parsing
print("Dataset setelah parsing:\n", df.head())

# Tampilkan distribusi kelas sebelum filter
print("Distribusi kelas sebelum pemrosesan:")
print(df['DepressionState'].value_counts())

# Hapus kelas yang jumlahnya cuma 1 (tidak bisa di-stratify)
counts = df['DepressionState'].value_counts()
df = df[df['DepressionState'].isin(counts[counts > 1].index)]

# Tampilkan distribusi kelas setelah filter
print("Distribusi kelas setelah filter:")
print(df['DepressionState'].value_counts())

# Hapus nilai kosong jika ada
if df.isnull().values.any():
    df = df.dropna()
    print("Nilai NaN telah dihapus.")

# Pisahkan fitur dan label
X = df.iloc[:, :-1]
y = df.iloc[:, -1]

# Split data (stratify sudah aman karena semua kelas > 1)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.1, random_state=42, stratify=y)

# Normalisasi data
scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_test = scaler.transform(X_test)

# Buat model Decision Tree
model = DecisionTreeClassifier(
    criterion="gini",
    random_state=42
)
model.fit(X_train, y_train)
y_pred = model.predict(X_test)

# Evaluasi model
accuracy = model.score(X_test, y_test)
print(f"Akurasi model: {accuracy * 100:.2f}%")

# Simpan model
joblib.dump(model, MODEL_PATH)
print(f"Model berhasil disimpan di {MODEL_PATH}")
