import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { PWAProvider } from './context/PWAContext.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { LoginScreen } from './components/LoginScreen.tsx';
import { Header } from './components/Header.tsx';
import { WorkoutDayTracker } from './components/WorkoutDayTracker.tsx';
import { WorkoutHistory } from './components/WorkoutHistory.tsx';
import { InsightsView } from './components/InsightsView.tsx';
import { DietarySandbox } from './components/DietarySandbox.tsx';
import { PublicSessionView } from './components/PublicSessionView.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { Loader2 } from 'lucide-react';

// Extract public session ID from query param (?session=xxx or ?share=xxx) or hash (#/share/xxx or #/session/xxx)
function getPublicSessionIdFromUrl(): string | null {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionParam = urlParams.get('session') || urlParams.get('share');
    if (sessionParam) return sessionParam;

    const hash = window.location.hash;
    const match = hash.match(/#(?:share|session)\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) return match[1];
  } catch (e) {
    console.warn('Error reading URL parameters:', e);
  }
  return null;
}

const GymAppContent: React.FC = () => {
  const { user, loading, token } = useAuth();
  const [activeTab, setActiveTab] = useState<'tracker' | 'history' | 'insights' | 'dietary'>('tracker');
  const [publicSessionId, setPublicSessionId] = useState<string | null>(() => getPublicSessionIdFromUrl());

  useEffect(() => {
    const handlePopState = () => {
      setPublicSessionId(getPublicSessionIdFromUrl());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // If a public workout session is requested, show public read-only card directly without forcing login
  if (publicSessionId) {
    return (
      <PublicSessionView
        sessionId={publicSessionId}
        onGoToApp={() => {
          // Clear URL parameter and reset state
          window.history.pushState({}, '', window.location.pathname);
          setPublicSessionId(null);
        }}
      />
    );
  }

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
        <div className="flex bg-[#111] border border-[#222] rounded-full p-1 w-full max-w-lg mx-auto mb-8 font-sans">
          <button 
             onClick={() => setActiveTab('tracker')}
             className={`flex-1 py-2 text-[11px] sm:text-xs uppercase tracking-wider font-bold rounded-full transition-all cursor-pointer ${
               activeTab === 'tracker' ? 'bg-[#C0FF00] text-black shadow-md' : 'text-gray-400 hover:text-white'
             }`}
          >
            Today's Session
          </button>
          <button 
             onClick={() => setActiveTab('history')}
             className={`flex-1 py-2 text-[11px] sm:text-xs uppercase tracking-wider font-bold rounded-full transition-all cursor-pointer ${
               activeTab === 'history' ? 'bg-[#C0FF00] text-black shadow-md' : 'text-gray-400 hover:text-white'
             }`}
          >
             Log Book
          </button>
          <button 
             onClick={() => setActiveTab('insights')}
             className={`flex-1 py-2 text-[11px] sm:text-xs uppercase tracking-wider font-bold rounded-full transition-all cursor-pointer ${
               activeTab === 'insights' ? 'bg-[#C0FF00] text-black shadow-md' : 'text-gray-400 hover:text-white'
             }`}
          >
             Insights
          </button>
          <button 
             onClick={() => setActiveTab('dietary')}
             className={`flex-1 py-2 text-[11px] sm:text-xs uppercase tracking-wider font-bold rounded-full transition-all cursor-pointer ${
               activeTab === 'dietary' ? 'bg-[#00ade6] text-black shadow-md' : 'text-gray-400 hover:text-white'
             }`}
          >
             Dietary
          </button>
        </div>

        <div>
          {activeTab === 'tracker' && <WorkoutDayTracker />}
          {activeTab === 'history' && <WorkoutHistory />}
          {activeTab === 'insights' && <InsightsView />}
          {activeTab === 'dietary' && <DietarySandbox />}
        </div>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <PWAProvider>
          <AuthProvider>
            <GymAppContent />
          </AuthProvider>
        </PWAProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
