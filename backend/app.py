from flask import Flask, request, jsonify
from flask_cors import CORS
import hashlib
import requests
import math
import re
import joblib
import os

app = Flask(__name__)
CORS(app)

# ── Load RF Model ──────────────────────────────────────────
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model', 'rf_model.pkl')
rf_model = None

try:
    rf_model = joblib.load(MODEL_PATH)
    print("✅ Random Forest model loaded successfully!")
except Exception as e:
    print(f"⚠️  RF model not found: {e}")
    print("   Run model/train_model.py first to generate the model!")

# ── Helper Functions ───────────────────────────────────────
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

def calc_entropy(pwd):
    if not pwd:
        return 0
    L = len(pwd)
    R = 0
    if re.search(r'[a-z]', pwd):
        R = R + 26
    if re.search(r'[A-Z]', pwd):
        R = R + 26
    if re.search(r'[0-9]', pwd):
        R = R + 10
    if re.search(r'[^a-zA-Z0-9]', pwd):
        R = R + 32
    if R > 0:
        return L * math.log2(R)
    else:
        return 0

def check_breach(pwd):
    try:
        print(f"\n🔍 Checking password breach status...")
        h = hashlib.sha1(pwd.encode()).hexdigest().upper()
        p = h[0:5]
        s = h[5:]
        print(f"   → SHA-1 Hash prefix: {p}...")
        print(f"   → Querying HIBP API...")
        url = 'https://api.pwnedpasswords.com/range/' + p
        r = requests.get(url, timeout=3)
        if r.status_code == 200:
            lines = r.text.split('\r\n')
            for line in lines:
                if ':' in line:
                    parts = line.split(':')
                    if parts[0] == s:
                        print(f"   ⚠️  PASSWORD FOUND IN BREACH! Count: {parts[1]}")
                        return True, int(parts[1])
            print(f"   ✅ Password NOT found in breaches")
            return False, 0
        return False, 0
    except Exception as e:
        print(f"   ❌ Error checking HIBP: {e}")
        return False, 0

def rf_predict(pwd):
    if rf_model is None:
        return None, None
    try:
        features = extract_features(pwd)
        pred = rf_model.predict([features])[0]
        proba = rf_model.predict_proba([features])[0]
        labels = {0: "Weak", 1: "Medium", 2: "Strong"}
        return labels[int(pred)], round(float(max(proba)) * 100, 1)
    except Exception as e:
        print(f"   ❌ RF prediction error: {e}")
        return None, None

# ── Routes ─────────────────────────────────────────────────
@app.route('/api/analyze', methods=['POST'])
def analyze():
    data = request.json
    pwd = data.get('password', '')

    print(f"\n{'='*50}")
    print(f"📊 NEW PASSWORD ANALYSIS REQUEST")
    print(f"   Password Length: {len(pwd)} characters")
    print(f"{'='*50}")

    if not pwd:
        return jsonify({'error': 'No password'}), 400

    ent = calc_entropy(pwd)
    breach, count = check_breach(pwd)

    if ent < 28:
        strength = {'level': 'Weak', 'color': 'text-red-600', 'bg': 'bg-red-100'}
    elif ent < 50:
        strength = {'level': 'Medium', 'color': 'text-yellow-600', 'bg': 'bg-yellow-100'}
    else:
        strength = {'level': 'Strong', 'color': 'text-green-600', 'bg': 'bg-green-100'}

    rf_label, rf_confidence = rf_predict(pwd)

    print(f"\n✅ Analysis Complete!")
    print(f"   Entropy: {ent:.1f} bits")
    print(f"   Strength: {strength['level']}")
    print(f"   Breached: NO ✅ (HIBP disabled)")
    if rf_label:
        print(f"   🌲 RF Prediction: {rf_label} ({rf_confidence}% confidence)")
    print(f"{'='*50}\n")

    return jsonify({
        'entropy': ent,
        'length': len(pwd),
        'breached': breach,
        'count': count,
        'strength': strength,
        'rf_prediction': rf_label,
        'rf_confidence': rf_confidence,
        'status': 'ok'
    })

@app.route('/api/health')
def health():
    return jsonify({
        'status': 'running',
        'rf_model': 'loaded' if rf_model else 'not loaded'
    })

@app.route('/')
def home():
    return jsonify({'message': 'Password Analyzer Backend - FYP2'})

print("\n" + "="*50)
print("🚀 PASSWORD ANALYZER BACKEND - FYP2")
print("📡 Server: http://localhost:5000")
print("🔗 API: http://localhost:5000/api/analyze")
print("🌲 Random Forest: " + ("✅ Ready" if rf_model else "⚠️  Model not loaded"))
print("="*50 + "\n")

app.run(debug=True, port=5000, host='0.0.0.0')