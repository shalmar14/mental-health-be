import pandas as pd
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.preprocessing import StandardScaler
from imblearn.over_sampling import SMOTE
from sklearn.ensemble import RandomForestClassifier
# Path dataset & model
DATASET_PATH = "src/uploads/dataset.csv"
MODEL_PATH = "src/models/depression_model.pkl"

# Cek apakah file dataset ada sebelum membacanya
if not os.path.exists(DATASET_PATH):
    raise FileNotFoundError(f"File {DATASET_PATH} tidak ditemukan!")

# Load dataset dengan pemisah titik koma (;)
df = pd.read_csv(DATASET_PATH, sep=';')

# Bersihkan nama kolom dari spasi
df.columns = df.columns.str.strip()

# Hapus karakter tak terlihat pada label
df['DepressionState'] = df['DepressionState'].astype(str).str.strip()


# Tampilkan dataset setelah parsing
print("Dataset setelah parsing:\n", df.head())
print("Distribusi kelas sebelum pemrosesan:")
print(df['DepressionState'].value_counts())

# Cek apakah ada nilai kosong (NaN)
if df.isnull().values.any():
    df = df.dropna()
    print("Nilai NaN telah dihapus.")

# Pisahkan fitur (X) dan label (y)
X = df.iloc[:, :-1]
y = df.iloc[:, -1]

# Bagi data menjadi training (80%) dan testing (20%)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.1, random_state=42, stratify=y)

# Pastikan jumlah sampel cukup sebelum SMOTE

#if len(y_train.value_counts()) > 1:  # SMOTE hanya bisa diterapkan jika ada lebih dari satu kelas
#    smote = SMOTE(random_state=42, k_neighbors=min(3, X_train.shape[0] - 1))
#    X_train, y_train = smote.fit_resample(X_train, y_train)
#    print("Distribusi kelas setelah SMOTE:")
#    print(y_train.value_counts())
#else:
#    print("SMOTE tidak diterapkan karena hanya ada satu kelas dalam data training.")

# Normalisasi data
scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_test = scaler.transform(X_test)

# Buat model Decision Tree dengan parameter yang lebih optimal
model = DecisionTreeClassifier(
    criterion="gini",
    random_state=42
)
model.fit(X_train, y_train)
y_pred = model.predict(X_test)
print("Semua kolom dalam dataset:", df.columns.tolist())
print("hasil y_pred", y_pred)
# Evaluasi model
accuracy = model.score(X_test, y_test)
print(f"Akurasi model: {accuracy * 100:.2f}%")

# Simpan model
joblib.dump(model, MODEL_PATH)
print(f"Model berhasil disimpan di {MODEL_PATH}")