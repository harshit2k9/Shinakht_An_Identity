import { useState, useEffect } from 'react';
import BrainGames from './BrainGames';
import VoiceAssistant from './VoiceAssistant';
import MapModule from './MapModule';
import { CognitiveStage } from '../utils/brainGamesAI';

interface PatientAppProps {
  onBack: () => void;
}

interface Alert {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'danger';
  timestamp: number;
  handled: boolean;
}

type PatientTab = 'home' | 'games' | 'smriti' | 'map' | 'privacy';

export default function PatientApp({ onBack }: PatientAppProps) {
  const [activeTab, setActiveTab] = useState<PatientTab>('home');
  const [stage, setStage] = useState<CognitiveStage>(() => {
    return (localStorage.getItem('shinakht_stage') as CognitiveStage) || 'early';
  });
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showSOSConfirm, setShowSOSConfirm] = useState(false);
  const [sosSent, setSosSent] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    localStorage.setItem('shinakht_stage', stage);
  }, [stage]);

  const handleAlert = (message: string, type: 'warning' | 'danger') => {
    const newAlert: Alert = {
      id: Date.now().toString(),
      message,
      type,
      timestamp: Date.now(),
      handled: false,
    };
    setAlerts(prev => [newAlert, ...prev].slice(0, 20));
  };

  const handleSOS = () => {
    setShowSOSConfirm(true);
  };

  const confirmSOS = () => {
    setSosSent(true);
    setShowSOSConfirm(false);
    handleAlert('🆘 SOS Activated! Caregiver has been notified with your location.', 'danger');

    // Queue for offline support
    const sosData = {
      timestamp: Date.now(),
      location: { lat: 28.6139, lng: 77.2090 },
      status: 'queued',
    };
    const queue = JSON.parse(localStorage.getItem('shinakht_sos_queue') || '[]');
    queue.push(sosData);
    localStorage.setItem('shinakht_sos_queue', JSON.stringify(queue));

    setTimeout(() => setSosSent(false), 5000);
  };

  const handleEraseData = () => {
    if (confirm('Are you sure you want to erase ALL data? This cannot be undone.')) {
      localStorage.clear();
      alert('All data has been erased successfully.');
      window.location.reload();
    }
  };

  const tabs: { id: PatientTab; icon: string; label: string }[] = [
    { id: 'home', icon: '🏠', label: 'Home' },
    { id: 'games', icon: '🧠', label: 'Games' },
    { id: 'smriti', icon: '🧘', label: 'Smriti' },
    { id: 'map', icon: '📍', label: 'Safety' },
    { id: 'privacy', icon: '🔒', label: 'Privacy' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-amber-600 to-orange-600 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-white/80 hover:text-white">
              <i className="fas fa-arrow-left text-lg"></i>
            </button>
            <div>
              <h1 className="text-xl font-bold">शिनाख्त</h1>
              <p className="text-xs text-amber-200">An Identity • आपकी पहचान</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Alert Badge */}
            {alerts.filter(a => !a.handled).length > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                {alerts.filter(a => !a.handled).length} alerts
              </span>
            )}
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center"
            >
              <i className="fas fa-user"></i>
            </button>
          </div>
        </div>
      </header>

      {/* Profile Dropdown */}
      {showProfile && (
        <div className="absolute top-16 right-4 bg-white rounded-xl shadow-xl p-4 z-50 w-64 border">
          <h4 className="font-bold text-gray-800 mb-2">Patient Profile</h4>
          <div className="space-y-2 text-sm">
            <p><strong>Name:</strong> Ramesh Kumar</p>
            <p><strong>Stage:</strong> {stage.charAt(0).toUpperCase() + stage.slice(1)}</p>
            <p><strong>Caregiver:</strong> Priya (Daughter)</p>
            <p><strong>Connected:</strong> ✅ Active</p>
          </div>
          <div className="mt-3 pt-3 border-t">
            <label className="text-xs text-gray-500 block mb-1">Cognitive Stage:</label>
            <select
              value={stage}
              onChange={e => setStage(e.target.value as CognitiveStage)}
              className="w-full px-2 py-1 border rounded text-sm"
            >
              <option value="early">Early Stage</option>
              <option value="moderate">Moderate Stage</option>
              <option value="severe">Severe Stage</option>
            </select>
          </div>
          <button onClick={() => setShowProfile(false)} className="mt-3 text-xs text-gray-500">Close</button>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {activeTab === 'home' && (
          <div className="p-4 space-y-4">
            {/* Welcome Card */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-4xl">🙏</span>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Namaste, Ramesh ji</h2>
                  <p className="text-sm text-gray-500">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                </div>
              </div>
              <div className="bg-amber-50 rounded-xl p-3">
                <p className="text-sm text-amber-800">
                  📋 Today's Reminders:<br />
                  • Morning walk at 7:00 AM ✅<br />
                  • Medicine at 9:00 AM ⏰<br />
                  • Lunch at 12:30 PM<br />
                  • Brain games at 4:00 PM
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setActiveTab('games')}
                className="bg-white rounded-xl p-4 shadow-sm border hover:border-amber-300 transition text-left"
              >
                <span className="text-3xl">🧠</span>
                <p className="font-semibold mt-2 text-gray-800">Brain Games</p>
                <p className="text-xs text-gray-500">Keep your mind sharp</p>
              </button>
              <button
                onClick={() => setActiveTab('smriti')}
                className="bg-white rounded-xl p-4 shadow-sm border hover:border-purple-300 transition text-left"
              >
                <span className="text-3xl">🧘</span>
                <p className="font-semibold mt-2 text-gray-800">Ask Smriti</p>
                <p className="text-xs text-gray-500">Your voice companion</p>
              </button>
              <button
                onClick={() => setActiveTab('map')}
                className="bg-white rounded-xl p-4 shadow-sm border hover:border-blue-300 transition text-left"
              >
                <span className="text-3xl">📍</span>
                <p className="font-semibold mt-2 text-gray-800">Safety Map</p>
                <p className="text-xs text-gray-500">Safe zones & tracking</p>
              </button>
              <button
                onClick={() => setActiveTab('privacy')}
                className="bg-white rounded-xl p-4 shadow-sm border hover:border-green-300 transition text-left"
              >
                <span className="text-3xl">🔒</span>
                <p className="font-semibold mt-2 text-gray-800">Privacy</p>
                <p className="text-xs text-gray-500">Your data, your control</p>
              </button>
            </div>

            {/* Recent Alerts */}
            {alerts.length > 0 && (
              <div className="bg-white rounded-2xl p-4 shadow-sm border">
                <h3 className="font-bold text-gray-800 mb-2">🔔 Recent Alerts</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {alerts.slice(0, 5).map(alert => (
                    <div key={alert.id} className={`p-2 rounded-lg text-sm ${
                      alert.type === 'danger' ? 'bg-red-50 text-red-700' :
                      alert.type === 'warning' ? 'bg-yellow-50 text-yellow-700' :
                      'bg-blue-50 text-blue-700'
                    }`}>
                      {alert.message}
                      <span className="text-xs block text-gray-400 mt-1">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'games' && <BrainGames stage={stage} />}
        {activeTab === 'smriti' && (
          <div className="h-full">
            <VoiceAssistant />
          </div>
        )}
        {activeTab === 'map' && (
          <div className="h-[calc(100vh-180px)]">
            <MapModule onAlert={handleAlert} />
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="p-4 space-y-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border">
              <h3 className="text-lg font-bold text-gray-800 mb-3">🔒 Privacy & Security</h3>
              <p className="text-sm text-gray-600 mb-4">Your data belongs to you. Control who sees what.</p>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Caregiver Access</p>
                    <p className="text-xs text-gray-500">Priya (Daughter) - Active</p>
                  </div>
                  <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">Connected</span>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-sm mb-1">One-Time Link Code</p>
                  <p className="text-xs text-gray-500 mb-2">Share this code to connect a new caregiver</p>
                  <div className="flex items-center gap-2">
                    <code className="bg-white px-3 py-1 rounded border font-mono text-sm">SHK-7X9M-2024</code>
                    <button className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Copy</button>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-sm mb-2">Access Audit Log</p>
                  <div className="space-y-1 text-xs text-gray-600">
                    <p>📋 Today 9:00 AM - Priya viewed location</p>
                    <p>📋 Yesterday 3:30 PM - Priya viewed game stats</p>
                    <p>📋 2 days ago - System backup completed</p>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-sm mb-1">Consent Settings</p>
                  <div className="space-y-2 mt-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" defaultChecked className="rounded" />
                      Share location with caregiver
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" defaultChecked className="rounded" />
                      Share game performance data
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" className="rounded" />
                      Allow clinician reports
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleEraseData}
                  className="w-full bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-sm font-medium hover:bg-red-100 transition"
                >
                  🗑️ Erase All My Data
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* SOS Button - Always visible */}
      <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-40">
        <button
          onClick={handleSOS}
          className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all ${
            sosSent
              ? 'bg-green-500 scale-110'
              : 'bg-red-600 hover:bg-red-700 hover:scale-110 animate-pulse'
          }`}
        >
          <span className="text-white font-bold text-lg">{sosSent ? '✓' : 'SOS'}</span>
        </button>
      </div>

      {/* SOS Confirmation Modal */}
      {showSOSConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
            <span className="text-5xl mb-3 block">🆘</span>
            <h3 className="text-xl font-bold text-red-600 mb-2">Emergency SOS</h3>
            <p className="text-gray-600 mb-4">
              This will immediately notify your caregiver (Priya) with your current location. Are you sure?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSOSConfirm(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmSOS}
                className="flex-1 bg-red-600 text-white py-3 rounded-xl font-medium hover:bg-red-700"
              >
                Send SOS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="flex justify-around py-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center px-3 py-1 rounded-lg transition ${
                activeTab === tab.id ? 'text-amber-600 bg-amber-50' : 'text-gray-500'
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="text-xs mt-0.5">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
