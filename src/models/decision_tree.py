import pandas as pd
import matplotlib.pyplot as plt 
from sklearn.tree import plot_tree
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import classification_report, accuracy_score
import joblib

# 1. Load dataset
df = pd.read_csv("src/uploads/dataset.csv")

# 2. Drop kolom yang tidak relevan
df = df.drop(columns=['Timestamp', 'Country', 'Occupation'])

# 3. Buang baris dengan missing value
df = df.dropna()

# 4. Encode fitur kategorikal
label_encoder = LabelEncoder()
for column in df.columns:
    if df[column].dtype == 'object':
        df[column] = label_encoder.fit_transform(df[column])

# 5. Pisahkan fitur dan label
X = df.drop('treatment', axis=1)
y = df['treatment']

# 6. Split data training dan testing
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 7. Buat dan latih model CART Decision Tree
model = DecisionTreeClassifier(criterion='gini', max_depth=5, random_state=42)
model.fit(X_train, y_train)

# 8. Prediksi dan evaluasi
y_pred = model.predict(X_test)
print("Akurasi:", accuracy_score(y_test, y_pred))
print("Classification Report:\n", classification_report(y_test, y_pred))

# 9. Simpan model
joblib.dump(model, 'src/models/cart_mental_health_model.pkl')


# 10. Visualisasi pohon keputusan
plt.figure(figsize=(20, 10))
plot_tree(model, feature_names=X.columns, class_names=['No Treatment', 'Treatment'], filled=True, rounded=True)
plt.title("Decision Tree for Mental Health Diagnosis")
plt.savefig("src/models/assets/decision_tree_visualization.png")
plt.show()
