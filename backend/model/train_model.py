import pandas as pd
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import os

def extract_features(pwd):
    pwd = str(pwd)
    length = len(pwd)
    return [
        length,
        sum(c.isupper() for c in pwd),
        sum(c.islower() for c in pwd),
        sum(c.isdigit() for c in pwd),
        sum(not c.isalnum() for c in pwd),
        len(set(pwd)) / length if length > 0 else 0
    ]

print("="*50)
print("🌲 RANDOM FOREST MODEL TRAINING")
print("="*50)

# ── Load Dataset ───────────────────────────────────────────
# Download dari Kaggle: "password strength classifier dataset"
# Letak passwords.csv dalam folder model/ ni jugak
CSV_PATH = os.path.join(os.path.dirname(__file__), 'passwords.csv')

try:
    df = pd.read_csv(CSV_PATH, on_bad_lines='skip')
    print(f"✅ Dataset loaded: {len(df)} rows")
except FileNotFoundError:
    print("❌ passwords.csv not found!")
    print("   Download from Kaggle: 'password strength classifier dataset'")
    print(f"   Save it as: {CSV_PATH}")
    exit()

# ── Preprocessing ──────────────────────────────────────────
df.dropna(inplace=True)
df['password'] = df['password'].astype(str)

print(f"   After cleaning: {len(df)} rows")
print(f"   Label distribution:\n{df['strength'].value_counts()}")

# ── Feature Extraction ─────────────────────────────────────
print("\n⚙️  Extracting features...")
X = df['password'].apply(extract_features).tolist()
y = df['strength']

# ── Train/Test Split ───────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)
print(f"   Train: {len(X_train)} | Test: {len(X_test)}")

# ── Train Model ────────────────────────────────────────────
print("\n🌲 Training Random Forest...")
model = RandomForestClassifier(
    n_estimators=100,
    random_state=42,
    n_jobs=-1  # guna semua CPU cores, lagi laju
)
model.fit(X_train, y_train)

# ── Evaluate ───────────────────────────────────────────────
y_pred = model.predict(X_test)
acc = accuracy_score(y_test, y_pred)

print(f"\n📊 Results:")
print(f"   Accuracy: {acc:.4f} ({acc*100:.2f}%)")
print(f"\n{classification_report(y_test, y_pred, target_names=['Weak','Medium','Strong'])}")

# ── Save Model ─────────────────────────────────────────────
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'rf_model.pkl')
joblib.dump(model, MODEL_PATH)
print(f"✅ Model saved → {MODEL_PATH}")
print("="*50)
print("Done! Now restart Flask server.")
print("="*50)