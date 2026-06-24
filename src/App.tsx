import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { PWAProvider } from './context/PWAContext.tsx';
import { LoginScreen } from './components/LoginScreen.tsx';
import { Header } from './components/Header.tsx';
import { WorkoutDayTracker } from './components/WorkoutDayTracker.tsx';
import { WorkoutHistory } from './components/WorkoutHistory.tsx';
import { Loader2 } from 'lucide-react';

const GymAppContent: React.FC = () => {
  const { user, loading, token } = useAuth();
  const [activeTab, setActiveTab] = useState<'tracker' | 'history'>('tracker');

  if (loading || (user && !token)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#C0FF00]" />
        <span className="font-sans text-xs text-gray-400 uppercase tracking-widest font-semibold">Authenticating with server...</span>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#f3f4f6] pb-16">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex bg-[#111] border border-[#222] rounded-full p-1 w-full max-w-sm mx-auto mb-8 font-sans">
          <button 
             onClick={() => setActiveTab('tracker')}
             className={`flex-1 py-2 text-xs uppercase tracking-widest font-bold rounded-full transition-all ${
               activeTab === 'tracker' ? 'bg-[#C0FF00] text-black shadow-md' : 'text-gray-400 hover:text-white'
             }`}
          >
            Today's Session
          </button>
          <button 
             onClick={() => setActiveTab('history')}
             className={`flex-1 py-2 text-xs uppercase tracking-widest font-bold rounded-full transition-all ${
               activeTab === 'history' ? 'bg-[#C0FF00] text-black shadow-md' : 'text-gray-400 hover:text-white'
             }`}
          >
             Log Book
          </button>
        </div>

        <div>
          {activeTab === 'tracker' ? <WorkoutDayTracker /> : <WorkoutHistory />}
        </div>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <PWAProvider>
      <AuthProvider>
        <GymAppContent />
      </AuthProvider>
    </PWAProvider>
  );
}
