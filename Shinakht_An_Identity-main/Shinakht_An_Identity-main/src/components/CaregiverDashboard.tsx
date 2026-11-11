import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface CaregiverDashboardProps {
  onBack: () => void;
}

interface Alert {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'danger' | 'sos';
  timestamp: number;
  status: 'pending' | 'handled' | 'false_alarm';
}

interface GameStat {
  date: string;
  score: number;
  difficulty: string;
}

export default function CaregiverDashboard({ onBack }: CaregiverDashboardProps) {
  const [alerts, setAlerts] = useState<Alert[]>(() => {
    const saved = localStorage.getItem('shinakht_caregiver_alerts');
    return saved ? JSON.parse(saved) : generateSampleAlerts();
  });
  const [activeView, setActiveView] = useState<'overview' | 'map' | 'alerts' | 'report'>('overview');
  const [patientLocation] = useState({ lat: 28.6139, lng: 77.2090 });
  const [gameStats] = useState<GameStat[]>(generateSampleGameStats());

  useEffect(() => {
    localStorage.setItem('shinakht_caregiver_alerts', JSON.stringify(alerts));
  }, [alerts]);

  // Simulate real-time alerts
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const types: Alert['type'][] = ['info', 'warning', 'danger'];
        const messages = [
          'Patient completed a brain game session',
          'Patient moved outside safe zone boundary',
          'Medication reminder acknowledged',
          'Patient is active and moving normally',
        ];
        const newAlert: Alert = {
          id: Date.now().toString(),
          message: messages[Math.floor(Math.random() * messages.length)],
          type: types[Math.floor(Math.random() * types.length)],
          timestamp: Date.now(),
          status: 'pending',
        };
        setAlerts(prev => [newAlert, ...prev].slice(0, 50));
      }
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleAlert = (id: string, status: 'handled' | 'false_alarm') => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  const pendingAlerts = alerts.filter(a => a.status === 'pending');
  const handledAlerts = alerts.filter(a => a.status === 'handled');
  const falseAlarms = alerts.filter(a => a.status === 'false_alarm');
  const responseRate = alerts.length > 0 ? Math.round((handledAlerts.length / alerts.length) * 100) : 0;

  const generateReport = () => {
    const report = {
      patientName: 'Ramesh Kumar',
      generatedAt: new Date().toISOString(),
      cognitiveStage: 'Early',
      summary: {
        totalGamesPlayed: gameStats.length,
        averageScore: Math.round(gameStats.reduce((s, g) => s + g.score, 0) / gameStats.length),
        trend: 'Stable',
        alertsHandled: handledAlerts.length,
        falseAlarmRate: alerts.length > 0 ? Math.round((falseAlarms.length / alerts.length) * 100) : 0,
      },
      recommendations: [
        'Continue memory games - showing improvement',
        'Consider increasing difficulty in number sequences',
        'Maintain current safe zone boundaries',
      ],
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shinakht_report_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const safeZones = [
    { name: 'Home', lat: 28.6139, lng: 77.2090, radius: 200, color: '#22c55e' },
    { name: 'Temple', lat: 28.6219, lng: 77.2130, radius: 150, color: '#f59e0b' },
    { name: 'Park', lat: 28.6080, lng: 77.2150, radius: 180, color: '#3b82f6' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-700 to-purple-700 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-white/80 hover:text-white">
              <i className="fas fa-arrow-left text-lg"></i>
            </button>
            <div>
              <h1 className="text-xl font-bold">Caregiver Dashboard</h1>
              <p className="text-xs text-indigo-200">Monitoring: Ramesh Kumar (Father)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pendingAlerts.length > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                {pendingAlerts.length} pending
              </span>
            )}
            <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
              <i className="fas fa-user-nurse"></i>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b px-4 py-2 flex gap-2 overflow-x-auto">
        {[
          { id: 'overview' as const, icon: '📊', label: 'Overview' },
          { id: 'map' as const, icon: '🗺️', label: 'Live Map' },
          { id: 'alerts' as const, icon: '🔔', label: `Alerts (${pendingAlerts.length})` },
          { id: 'report' as const, icon: '📋', label: 'Report' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition ${
              activeView === tab.id ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="flex-1 p-4 overflow-y-auto">
        {activeView === 'overview' && (
          <div className="space-y-4 max-w-4xl mx-auto">
            {/* Patient Status Card */}
            <div className="bg-white rounded-xl p-5 shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center text-2xl">👴</div>
                  <div>
                    <h3 className="font-bold text-lg">Ramesh Kumar</h3>
                    <p className="text-sm text-gray-500">Age 78 • Early Stage Cognitive Decline</p>
                  </div>
                </div>
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                  🟢 Active Now
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-700">{gameStats.length}</p>
                  <p className="text-xs text-blue-600">Games This Week</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-700">{responseRate}%</p>
                  <p className="text-xs text-green-600">Response Rate</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-purple-700">{pendingAlerts.length}</p>
                  <p className="text-xs text-purple-600">Pending Alerts</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-amber-700">7 🔥</p>
                  <p className="text-xs text-amber-600">Day Streak</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition text-left">
                <span className="text-2xl">💊</span>
                <p className="font-medium text-sm mt-2">Send Reminder</p>
                <p className="text-xs text-gray-500">Medication alert</p>
              </button>
              <button className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition text-left">
                <span className="text-2xl">📞</span>
                <p className="font-medium text-sm mt-2">Call Patient</p>
                <p className="text-xs text-gray-500">Voice/video call</p>
              </button>
              <button className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition text-left">
                <span className="text-2xl">📍</span>
                <p className="font-medium text-sm mt-2">Check Location</p>
                <p className="text-xs text-gray-500">Last seen 2 min ago</p>
              </button>
              <button className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition text-left">
                <span className="text-2xl">📊</span>
                <p className="font-medium text-sm mt-2">View Trends</p>
                <p className="text-xs text-gray-500">Weekly performance</p>
              </button>
            </div>

            {/* Game Performance Chart */}
            <div className="bg-white rounded-xl p-5 shadow-sm border">
              <h3 className="font-bold text-gray-800 mb-3">📈 Game Performance (Last 7 Days)</h3>
              <div className="flex items-end gap-2 h-32">
                {gameStats.map((stat, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div
                      className={`w-full rounded-t-lg transition-all ${
                        stat.difficulty === 'hard' ? 'bg-red-400' :
                        stat.difficulty === 'medium' ? 'bg-amber-400' : 'bg-green-400'
                      }`}
                      style={{ height: `${stat.score}%` }}
                    ></div>
                    <span className="text-xs text-gray-500 mt-1">{stat.date}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 mt-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-400 rounded"></span> Easy</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-amber-400 rounded"></span> Medium</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-400 rounded"></span> Hard</span>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl p-5 shadow-sm border">
              <h3 className="font-bold text-gray-800 mb-3">🕐 Recent Activity</h3>
              <div className="space-y-2">
                {alerts.slice(0, 5).map(alert => (
                  <div key={alert.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                    <span className={`w-2 h-2 rounded-full ${
                      alert.type === 'danger' ? 'bg-red-500' :
                      alert.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`}></span>
                    <p className="text-sm flex-1">{alert.message}</p>
                    <span className="text-xs text-gray-400">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeView === 'map' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-3 border-b flex items-center justify-between">
                <h3 className="font-bold text-gray-800">🗺️ Live Location Tracking</h3>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">GPS Active</span>
              </div>
              <div style={{ height: '450px' }}>
                <MapContainer center={[patientLocation.lat, patientLocation.lng]} zoom={15} className="h-full w-full z-0">
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[patientLocation.lat, patientLocation.lng]}>
                    <Popup>
                      <strong>Ramesh Kumar</strong><br />
                      Last updated: Just now<br />
                      Status: 🟢 Active
                    </Popup>
                  </Marker>
                  {safeZones.map((zone, i) => (
                    <Circle
                      key={i}
                      center={[zone.lat, zone.lng]}
                      radius={zone.radius}
                      pathOptions={{ color: zone.color, fillColor: zone.color, fillOpacity: 0.1 }}
                    >
                      <Popup>{zone.name}</Popup>
                    </Circle>
                  ))}
                </MapContainer>
              </div>
              <div className="p-3 border-t bg-gray-50">
                <div className="flex flex-wrap gap-3 text-xs">
                  {safeZones.map((zone, i) => (
                    <span key={i} className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: zone.color }}></span>
                      {zone.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'alerts' && (
          <div className="max-w-4xl mx-auto space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-gray-800">🔔 Alert Management</h3>
              <div className="flex gap-2 text-xs">
                <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full">{pendingAlerts.length} Pending</span>
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full">{handledAlerts.length} Handled</span>
                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full">{falseAlarms.length} False</span>
              </div>
            </div>

            {alerts.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center text-gray-500">
                <span className="text-4xl block mb-2">✅</span>
                No alerts. All is well!
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.map(alert => (
                  <div key={alert.id} className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${
                    alert.type === 'sos' ? 'border-l-red-600' :
                    alert.type === 'danger' ? 'border-l-red-400' :
                    alert.type === 'warning' ? 'border-l-yellow-400' : 'border-l-blue-400'
                  } ${alert.status !== 'pending' ? 'opacity-60' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            alert.type === 'sos' ? 'bg-red-100 text-red-700' :
                            alert.type === 'danger' ? 'bg-red-50 text-red-600' :
                            alert.type === 'warning' ? 'bg-yellow-50 text-yellow-700' : 'bg-blue-50 text-blue-700'
                          }`}>
                            {alert.type.toUpperCase()}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            alert.status === 'handled' ? 'bg-green-100 text-green-700' :
                            alert.status === 'false_alarm' ? 'bg-gray-100 text-gray-600' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {alert.status === 'pending' ? '⏳ Pending' : alert.status === 'handled' ? '✅ Handled' : '❌ False Alarm'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800">{alert.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                      {alert.status === 'pending' && (
                        <div className="flex gap-2 ml-3">
                          <button
                            onClick={() => handleAlert(alert.id, 'handled')}
                            className="bg-green-100 text-green-700 text-xs px-3 py-1.5 rounded-lg hover:bg-green-200"
                          >
                            ✓ Handled
                          </button>
                          <button
                            onClick={() => handleAlert(alert.id, 'false_alarm')}
                            className="bg-gray-100 text-gray-600 text-xs px-3 py-1.5 rounded-lg hover:bg-gray-200"
                          >
                            ✗ False
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeView === 'report' && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="bg-white rounded-xl p-5 shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800">📋 Clinician Trend Report</h3>
                <button
                  onClick={generateReport}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 flex items-center gap-2"
                >
                  <i className="fas fa-download"></i> Download Report
                </button>
              </div>

              {/* Cognitive Assessment Summary */}
              <div className="bg-indigo-50 rounded-xl p-4 mb-4">
                <h4 className="font-semibold text-indigo-800 mb-2">Cognitive Assessment Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-xs text-gray-500">Current Stage</p>
                    <p className="font-bold text-indigo-700">Early</p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-xs text-gray-500">Trend</p>
                    <p className="font-bold text-green-600">↗ Stable/Improving</p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-xs text-gray-500">AI Confidence</p>
                    <p className="font-bold text-purple-600">87%</p>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <h4 className="font-semibold text-gray-800 mb-2">Performance Metrics</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-2">Metric</th>
                      <th className="text-center p-2">This Week</th>
                      <th className="text-center p-2">Last Week</th>
                      <th className="text-center p-2">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t">
                      <td className="p-2">Memory Games</td>
                      <td className="text-center p-2">78%</td>
                      <td className="text-center p-2">72%</td>
                      <td className="text-center p-2 text-green-600">+6%</td>
                    </tr>
                    <tr className="border-t bg-gray-50">
                      <td className="p-2">Number Sequences</td>
                      <td className="text-center p-2">65%</td>
                      <td className="text-center p-2">68%</td>
                      <td className="text-center p-2 text-red-600">-3%</td>
                    </tr>
                    <tr className="border-t">
                      <td className="p-2">Word Recall</td>
                      <td className="text-center p-2">55%</td>
                      <td className="text-center p-2">50%</td>
                      <td className="text-center p-2 text-green-600">+5%</td>
                    </tr>
                    <tr className="border-t bg-gray-50">
                      <td className="p-2">Simple Math</td>
                      <td className="text-center p-2">82%</td>
                      <td className="text-center p-2">80%</td>
                      <td className="text-center p-2 text-green-600">+2%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* AI Recommendations */}
              <div className="mt-4 bg-amber-50 rounded-xl p-4">
                <h4 className="font-semibold text-amber-800 mb-2">🤖 AI Recommendations</h4>
                <ul className="space-y-1 text-sm text-amber-700">
                  <li>• Memory games showing improvement - consider increasing to Medium difficulty</li>
                  <li>• Number sequences slightly declined - maintain current level</li>
                  <li>• Patient engagement is consistent (7-day streak) - excellent!</li>
                  <li>• Word recall needs attention - suggest more frequent sessions</li>
                </ul>
                <p className="text-xs text-amber-600 mt-2 italic">
                  Note: AI does not diagnose. These are difficulty tuning suggestions only.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function generateSampleAlerts(): Alert[] {
  const now = Date.now();
  return [
    { id: '1', message: '🆘 SOS Activated by patient', type: 'sos', timestamp: now - 300000, status: 'pending' },
    { id: '2', message: 'Patient moved outside Home safe zone', type: 'warning', timestamp: now - 600000, status: 'pending' },
    { id: '3', message: 'Completed Memory Match game - Score: 85%', type: 'info', timestamp: now - 1200000, status: 'handled' },
    { id: '4', message: 'Medication reminder acknowledged', type: 'info', timestamp: now - 3600000, status: 'handled' },
    { id: '5', message: 'Patient location ping - Temple zone', type: 'info', timestamp: now - 7200000, status: 'handled' },
    { id: '6', message: 'Unusual movement pattern detected', type: 'warning', timestamp: now - 10800000, status: 'false_alarm' },
  ];
}

function generateSampleGameStats(): GameStat[] {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const difficulties = ['easy', 'medium', 'hard', 'medium', 'medium', 'hard', 'medium'];
  return days.map((day, i) => ({
    date: day,
    score: 50 + Math.floor(Math.random() * 40),
    difficulty: difficulties[i],
  }));
}
