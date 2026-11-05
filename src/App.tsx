import { useState } from 'react';
import PatientApp from './components/PatientApp';
import CaregiverDashboard from './components/CaregiverDashboard';

type View = 'landing' | 'patient' | 'caregiver';

export default function App() {
  const [view, setView] = useState<View>('landing');

  if (view === 'patient') {
    return <PatientApp onBack={() => setView('landing')} />;
  }

  if (view === 'caregiver') {
    return <CaregiverDashboard onBack={() => setView('landing')} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-purple-50 flex flex-col">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-600/10 to-purple-600/10"></div>
        <div className="relative max-w-6xl mx-auto px-6 py-12 md:py-20">
          <div className="text-center">
            {/* Logo/Brand */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-xl mb-6">
              <span className="text-4xl">🪷</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-2">
              शिनाख्त
            </h1>
            <p className="text-xl md:text-2xl text-amber-700 font-medium mb-1">An Identity</p>
            <p className="text-lg text-gray-600 mb-2">एक पहचान</p>
            <p className="text-base md:text-lg text-gray-500 max-w-2xl mx-auto mt-4">
              A companion and safety ecosystem for elderly individuals, people with cognitive decline, 
              and their caregivers. No special hardware needed — just your smartphone.
            </p>
          </div>
        </div>
      </header>

      {/* Feature Cards */}
      <section className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-sm border border-amber-100 hover:shadow-lg transition">
            <span className="text-4xl mb-3 block">🧠</span>
            <h3 className="font-bold text-lg text-gray-800 mb-2">Adaptive Brain Games</h3>
            <p className="text-sm text-gray-600">
              AI-powered difficulty tuning that adapts to cognitive stage. Normalizes, smooths, 
              and decides the right challenge level for each session.
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-sm border border-purple-100 hover:shadow-lg transition">
            <span className="text-4xl mb-3 block">🧘</span>
            <h3 className="font-bold text-lg text-gray-800 mb-2">Ask Smriti</h3>
            <p className="text-sm text-gray-600">
              Voice-activated companion using Web Speech API. Answers questions about time, 
              meals, medicines, and provides calm, reassuring responses.
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-sm border border-blue-100 hover:shadow-lg transition">
            <span className="text-4xl mb-3 block">📍</span>
            <h3 className="font-bold text-lg text-gray-800 mb-2">Location Safety</h3>
            <p className="text-sm text-gray-600">
              Named safe zones with geofencing. Movement tracking and instant alerts 
              when user goes outside designated boundaries.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-sm border border-red-100 hover:shadow-lg transition">
            <span className="text-4xl mb-3 block">🆘</span>
            <h3 className="font-bold text-lg text-gray-800 mb-2">One-Tap SOS</h3>
            <p className="text-sm text-gray-600">
              Emergency button with offline queue support. Alerts caregivers instantly 
              via SMS/data fallback when reconnected.
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-sm border border-green-100 hover:shadow-lg transition">
            <span className="text-4xl mb-3 block">👨‍⚕️</span>
            <h3 className="font-bold text-lg text-gray-800 mb-2">Caregiver Dashboard</h3>
            <p className="text-sm text-gray-600">
              Live map tracking, alert management, response metrics, and downloadable 
              clinician trend reports for medical professionals.
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition">
            <span className="text-4xl mb-3 block">🔒</span>
            <h3 className="font-bold text-lg text-gray-800 mb-2">Privacy by Design</h3>
            <p className="text-sm text-gray-600">
              Patient-controlled consent, one-time link codes, access audit logs, 
              and complete data erasure option.
            </p>
          </div>
        </div>
      </section>

      {/* Entry Points */}
      <section className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Patient App Entry */}
          <button
            onClick={() => setView('patient')}
            className="group bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-8 text-white shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02]"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="text-3xl">👴</span>
              </div>
              <div className="text-left">
                <h3 className="text-xl font-bold">Patient App</h3>
                <p className="text-amber-200 text-sm">मरीज़ का ऐप</p>
              </div>
            </div>
            <p className="text-sm text-amber-100 text-left mb-4">
              Access brain games, voice assistant, safety map, and SOS. 
              Designed for elderly users with large buttons and simple navigation.
            </p>
            <div className="flex items-center gap-2 text-sm font-medium">
              <span>Open Patient Interface</span>
              <i className="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
            </div>
          </button>

          {/* Caregiver Dashboard Entry */}
          <button
            onClick={() => setView('caregiver')}
            className="group bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-8 text-white shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02]"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="text-3xl">👨‍⚕️</span>
              </div>
              <div className="text-left">
                <h3 className="text-xl font-bold">Caregiver Dashboard</h3>
                <p className="text-indigo-200 text-sm">देखरेख डैशबोर्ड</p>
              </div>
            </div>
            <p className="text-sm text-indigo-100 text-left mb-4">
              Monitor location, manage alerts, view game performance trends, 
              and download clinician reports.
            </p>
            <div className="flex items-center gap-2 text-sm font-medium">
              <span>Open Dashboard</span>
              <i className="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
            </div>
          </button>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="bg-white/60 backdrop-blur rounded-2xl p-8 border">
          <h3 className="text-center font-bold text-gray-800 mb-6">🛠️ Architecture & Tech Stack</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <i className="fas fa-mobile-alt text-blue-600"></i>
              </div>
              <p className="text-xs font-medium text-gray-700">Patient PWA</p>
              <p className="text-xs text-gray-500">React + Tailwind</p>
            </div>
            <div className="p-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <i className="fas fa-server text-green-600"></i>
              </div>
              <p className="text-xs font-medium text-gray-700">Backend API</p>
              <p className="text-xs text-gray-500">Flask REST + CORS</p>
            </div>
            <div className="p-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <i className="fas fa-brain text-purple-600"></i>
              </div>
              <p className="text-xs font-medium text-gray-700">AI Engine</p>
              <p className="text-xs text-gray-500">Adaptive Tuning</p>
            </div>
            <div className="p-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <i className="fas fa-map-marked-alt text-amber-600"></i>
              </div>
              <p className="text-xs font-medium text-gray-700">Mapping</p>
              <p className="text-xs text-gray-500">OSM + Leaflet.js</p>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t text-center">
            <p className="text-xs text-gray-500">
              Firebase/FireStore • Web Speech API • SSE/FCM • Service Workers • OpenStreetMap
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-auto">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-2xl">🪷</span>
            <span className="text-xl font-bold">शिनाख्त : An Identity</span>
          </div>
          <p className="text-gray-400 text-sm mb-2">
            A companion and safety ecosystem for elderly care
          </p>
          <p className="text-gray-500 text-xs">
            Built with compassion • Privacy by design • No diagnosis, only support
          </p>
          <p className="text-gray-600 text-xs mt-4">
            Prototype Version 1.0 • React • TypeScript • Tailwind CSS • Leaflet.js
          </p>
        </div>
      </footer>
    </div>
  );
}
