import React, { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, Lock, Eye, EyeOff, Info } from 'lucide-react';
import { RadialBarChart, RadialBar, PolarAngleAxis, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

function PasswordAnalyzer() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyzePassword = async () => {
    if (!password) return;
    setLoading(true);
    try {
      const response = await fetch('https://password-analyzer-fyp.onrender.com/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password })
      });
      const data = await response.json();
      if (data.status === 'ok') {
        const recommendations = [];
        if (data.length < 12) recommendations.push('Increase password length to at least 12 characters');
        if (!/[A-Z]/.test(password)) recommendations.push('Add uppercase letters');
        if (!/[a-z]/.test(password)) recommendations.push('Add lowercase letters');
        if (!/[0-9]/.test(password)) recommendations.push('Add numbers');
        if (!/[^a-zA-Z0-9]/.test(password)) recommendations.push('Add special characters (!@#$%^&*)');
        if (data.breached) recommendations.push('⚠️ This password has been breached - NEVER use it!');

        const pwd = password;
        const upper = (pwd.match(/[A-Z]/g) || []).length;
        const lower = (pwd.match(/[a-z]/g) || []).length;
        const nums = (pwd.match(/[0-9]/g) || []).length;
        const special = (pwd.match(/[^a-zA-Z0-9]/g) || []).length;
        const uniqueRatio = Math.round((new Set(pwd).size / pwd.length) * 10);

        const features = [
          { name: 'Length', value: Math.min(pwd.length, 20), max: 20, actual: pwd.length },
          { name: 'Uppercase', value: upper, max: 10, actual: upper },
          { name: 'Lowercase', value: lower, max: 10, actual: lower },
          { name: 'Numbers', value: nums, max: 10, actual: nums },
          { name: 'Special', value: special, max: 10, actual: special },
          { name: 'Unique', value: uniqueRatio, max: 10, actual: Math.round((new Set(pwd).size / pwd.length) * 100) + '%' },
        ];

        setAnalysis({
          entropy: data.entropy,
          length: data.length,
          charsetSize: 94,
          breached: data.breached,
          count: data.count,
          strength: data.strength,
          rfPrediction: data.rf_prediction,
          rfConfidence: data.rf_confidence,
          features: features,
          recommendations: recommendations
        });
      }
    } catch (error) {
      console.error('Backend connection error:', error);
      alert('Cannot connect to backend! Make sure Flask server is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') analyzePassword();
  };

  const getColor = (level) => {
    if (level === 'Weak') return '#ef4444';
    if (level === 'Medium') return '#eab308';
    return '#22c55e';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-900 p-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-12 h-12 text-blue-700" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Password Web Analyzer</h1>
          <p className="text-gray-600">UniKL MIIT</p>
        </div>

        {/* Password Input */}
        <div className="bg-white rounded-lg shadow-xl p-8 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter Password to Analyze
          </label>
          <div className="relative mb-4">
            <input
type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your password..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none pr-12"
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            ⚠️ Password analyzed securely via k-anonymity protocol — not stored
          </p>
          <button
            onClick={analyzePassword}
            disabled={!password || loading}
            className="w-full bg-blue-700 text-white py-3 rounded-lg font-medium hover:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Analyzing...' : 'Analyze Password Security'}
          </button>
        </div>

        {analysis && (
          <div className="space-y-6">

            {/* SECTION 1 — Entropy */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center mb-4">
                <span className="bg-blue-700 text-white text-xs font-bold px-2 py-1 rounded mr-3">01</span>
                <h3 className="text-xl font-bold text-gray-800 flex items-center">
                  <Lock className="w-5 h-5 mr-2" /> Entropy Scoring
                </h3>
              </div>
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700 font-medium">Entropy Score:</span>
                  <span className={'text-2xl font-bold ' + analysis.strength.color}>
                    {analysis.entropy.toFixed(1)} bits
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className={'h-full transition-all ' + (
                      analysis.entropy < 28 ? 'bg-red-500' :
                      analysis.entropy < 50 ? 'bg-yellow-500' : 'bg-green-500'
                    )}
                    style={{ width: Math.min(analysis.entropy, 100) + '%' }}
                  />
                </div>
              </div>
              <div className={'rounded-lg p-4 mb-4 ' + analysis.strength.bg}>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700">Strength Level:</span>
                  <span className={'text-xl font-bold ' + analysis.strength.color}>
                    {analysis.strength.level}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-gray-600">Password Length</div>
                  <div className="font-bold text-gray-800">{analysis.length} characters</div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-gray-600">Character Set Size</div>
                  <div className="font-bold text-gray-800">{analysis.charsetSize}</div>
                </div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start">
                  <Info className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <strong>Formula: H = L × log₂(R)</strong> — Measures password randomness in bits.
                    <div className="mt-2">
                      • &lt;28 bits: Weak (easily cracked)<br/>
 • 28-50 bits: Medium (moderate protection)<br/>
                      • &gt;50 bits: Strong (difficult to crack)
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2 — Breach Detection */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center mb-4">
                <span className="bg-blue-700 text-white text-xs font-bold px-2 py-1 rounded mr-3">02</span>
                <h3 className="text-xl font-bold text-gray-800 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" /> Leaked Password Detection
                </h3>
              </div>
              {analysis.breached ? (
                <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4">
                  <p className="text-red-800 font-bold text-lg mb-1">⚠️ PASSWORD BREACHED!</p>
                  <p className="text-red-700 mb-2">
                    Found <strong>{analysis.count.toLocaleString()} times</strong> in breach databases.
                  </p>
                  <p className="text-red-600 font-medium">DO NOT USE THIS PASSWORD!</p>
                </div>
              ) : (
                <div className="bg-green-50 border-2 border-green-400 rounded-lg p-4">
                  <p className="text-green-800 font-bold text-lg">✅ Password Not Found in Breaches</p>
                  <p className="text-green-700 text-sm mt-1">This password has not been exposed in known data breaches.</p>
                </div>
              )}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                <strong>HIBP API + K-Anonymity:</strong> Only first 5 chars of SHA-1 hash sent — your password is never exposed.
              </div>
            </div>

            {/* SECTION 3 — ML Classification */}
            {analysis.rfPrediction && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center mb-4">
                  <span className="bg-blue-700 text-white text-xs font-bold px-2 py-1 rounded mr-3">03</span>
                  <h3 className="text-xl font-bold text-gray-800">
                    🌲 ML Classification (Random Forest)
                  </h3>
                </div>

                {/* Gauge */}
                <div className="flex flex-col items-center mb-6">
                  <p className="text-sm text-gray-500 mb-2">Overall Password Strength</p>
                  <RadialBarChart
                    width={250}
                    height={150}
                    cx={125}
                    cy={130}
                    innerRadius={80}
                    outerRadius={110}
                    startAngle={180}
                    endAngle={0}
                    data={[{ value: analysis.rfConfidence, fill: getColor(analysis.rfPrediction) }]}
                  >
                    <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                    <RadialBar dataKey="value" cornerRadius={10} background={{ fill: '#e5e7eb' }} />
                  </RadialBarChart>
                  <div className="text-center -mt-8">
                    <p className="text-3xl font-bold" style={{ color: getColor(analysis.rfPrediction) }}>
                      {analysis.rfPrediction}
                    </p>
                    <p className="text-sm text-gray-500">{analysis.rfConfidence}% confidence</p>
                  </div>
                </div>

                {/* ML Explanation */}
                <div className="mb-4 p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
                  <p className="font-bold mb-2">🤖 What does this mean?</p>
                  {analysis.rfPrediction === 'Weak' && (
                    <p>Your password is predicted as <strong className="text-red-600">Weak</strong>. It lacks character variety or follows a common pattern easily guessed by attackers. Please improve it using the recommendations below.</p>
 )}
                  {analysis.rfPrediction === 'Medium' && (
                    <p>Your password is predicted as <strong className="text-yellow-600">Medium</strong>. It has some good features but still missing a few elements. Consider adding more character variety to make it stronger.</p>
                  )}
                  {analysis.rfPrediction === 'Strong' && (
                    <p>Your password is predicted as <strong className="text-green-600">Strong</strong>. It has good character variety and does not follow common patterns. Great job!</p>
                  )}
                </div>

                {/* Bar Chart */}
                <p className="text-sm font-semibold text-gray-700 mb-3">Password Feature Breakdown</p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={analysis.features} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value, name, props) => [props.payload.actual, 'Count']} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {analysis.features.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={entry.value === 0 ? '#ef4444' : entry.value < 3 ? '#eab308' : '#3b82f6'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-xs text-gray-400 text-center mt-1">
                  🔴 Missing &nbsp;|&nbsp; 🟡 Low &nbsp;|&nbsp; 🔵 Good
                </p>

                {/* Feature Cards */}
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  {analysis.features.map((f, idx) => (
                    <div key={idx} className={'p-3 rounded-lg border ' + (
                      f.value === 0 ? 'bg-red-50 border-red-300' :
                      f.value < 3 ? 'bg-yellow-50 border-yellow-300' :
                      'bg-green-50 border-green-300'
                    )}>
                      <p className="font-semibold text-gray-700">{f.name}</p>
                      <p className="text-gray-600">
                        {f.value === 0 ? '❌ Missing — add some!' :
                         f.value < 3 ? '⚠️ Low — consider adding more' :
                         '✅ Good'}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
                  <strong>Entropy-based:</strong> {analysis.strength.level} &nbsp;|&nbsp;
                  <strong>ML Prediction:</strong> {analysis.rfPrediction}
                  {analysis.strength.level !== analysis.rfPrediction && (
                    <p className="mt-1 text-blue-600">
                      ⚡ ML detected pattern-based weakness not captured by entropy alone.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* SECTION 4 — Recommendations */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center mb-4">
                <span className="bg-blue-700 text-white text-xs font-bold px-2 py-1 rounded mr-3">04</span>
                <h3 className="text-xl font-bold text-gray-800">
                  Security Alert & Recommendations
                </h3>
              </div>
              {analysis.recommendations.length > 0 ? (
                <ul className="space-y-2">
                  {analysis.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-blue-700 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{rec}</span>
</li>
                  ))}
                </ul>
              ) : (
                <p className="text-green-600 font-medium">
                  ✓ Excellent! Your password meets all security requirements.
                </p>
              )}
            </div>

          </div>
        )}

        {/* Landing state */}
        {!analysis && !loading && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <Shield className="w-16 h-16 text-blue-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-700 mb-2">Ready to Analyze</h3>
            <p className="text-gray-600 mb-4">Enter a password above and click Analyze</p>
            <div className="grid grid-cols-2 gap-3 text-left text-sm text-gray-600">
              <div className="bg-gray-50 p-3 rounded">
                <p className="font-bold text-blue-700 mb-1">01 Entropy Scoring</p>
                <p>Shannon's formula H = L × log₂(R)</p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="font-bold text-blue-700 mb-1">02 Breach Detection</p>
                <p>Real HIBP API + k-anonymity</p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="font-bold text-blue-700 mb-1">03 ML Classification</p>
                <p>Random Forest — 669k passwords trained</p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="font-bold text-blue-700 mb-1">04 Recommendations</p>
                <p>Actionable security tips</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default PasswordAnalyzer;