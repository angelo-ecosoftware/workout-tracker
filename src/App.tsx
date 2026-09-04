import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { PWAProvider } from './context/PWAContext.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { LoginScreen } from './components/auth/LoginScreen.tsx';
import { Header } from './components/ui/Header.tsx';
import { WorkoutDayTracker } from './components/workout/WorkoutDayTracker.tsx';
import { WorkoutHistory } from './components/workout/WorkoutHistory.tsx';
import { InsightsView } from './components/insights/InsightsView.tsx';
import { DietaryView } from './components/dietary/DietaryView.tsx';
import { PublicSessionView } from './components/workout/PublicSessionView.tsx';
import { CoachPortalView } from './components/coach/CoachPortalView.tsx';
import { CoachViewAsBanner } from './components/coach/CoachViewAsBanner.tsx';
import { CoachInviteAcceptModal } from './components/modals/CoachInviteAcceptModal.tsx';
import { fetchInviteByCode } from './lib/db/roles.ts';
import { CoachAthleteLink } from './models.ts';
import { ErrorBoundary } from './components/ui/ErrorBoundary.tsx';
import { Loader2, UserCheck, Dumbbell } from 'lucide-react';

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

// Extract coach invite code from query param (?coach_invite=xxx or ?invite=xxx)
function getCoachInviteCodeFromUrl(): string | null {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('coach_invite') || urlParams.get('invite');
    if (code) return code.trim();

    const hash = window.location.hash;
    const match = hash.match(/#(?:coach_invite|invite)\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) return match[1].trim();
  } catch (e) {
    console.warn('Error reading coach invite URL parameters:', e);
  }
  return null;
}

type TabType = 'tracker' | 'history' | 'insights' | 'dietary' | 'coach';

function getInitialTab(): TabType {
  try {
    const hash = (typeof window !== 'undefined' ? window.location.hash : '').toLowerCase();
    if (hash.includes('coach') || hash.includes('roster')) return 'coach';
    if (hash.includes('history') || hash.includes('logbook')) return 'history';
    if (hash.includes('insights')) return 'insights';
    if (hash.includes('dietary')) return 'dietary';
    if (hash.includes('tracker') || hash.includes('session')) return 'tracker';

    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('workout_tracker_active_tab') as TabType;
      if (stored && ['tracker', 'history', 'insights', 'dietary', 'coach'].includes(stored)) {
        return stored;
      }
    }
  } catch {
    // ignore
  }
  return 'tracker';
}

const GymAppContent: React.FC = () => {
  const { user, loading, token, isCoach, specialty } = useAuth();
  const [activeTab, setActiveTabState] = useState<TabType>(() => getInitialTab());
  const [publicSessionId, setPublicSessionId] = useState<string | null>(() => getPublicSessionIdFromUrl());
  const [pendingInviteCode, setPendingInviteCode] = useState<string | null>(() => getCoachInviteCodeFromUrl());
  const [coachInviteData, setCoachInviteData] = useState<CoachAthleteLink | null>(null);
  const [inspectingClient, setInspectingClient] = useState<{ athleteId: string; athleteName: string } | null>(null);
  const [coachPersonalWorkoutMode, setCoachPersonalWorkoutMode] = useState<boolean>(() => {
    return localStorage.getItem('coach_personal_workout_mode') === 'true';
  });

  const setActiveTab = (tab: TabType) => {
    setActiveTabState(tab);
    try {
      localStorage.setItem('workout_tracker_active_tab', tab);
      if (window.location.hash !== `#${tab}`) {
        window.history.replaceState(null, '', `#${tab}`);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      setPublicSessionId(getPublicSessionIdFromUrl());
      setPendingInviteCode(getCoachInviteCodeFromUrl());
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('coach') || hash.includes('roster')) setActiveTabState('coach');
      else if (hash.includes('history') || hash.includes('logbook')) setActiveTabState('history');
      else if (hash.includes('insights')) setActiveTabState('insights');
      else if (hash.includes('dietary')) setActiveTabState('dietary');
      else if (hash.includes('tracker')) setActiveTabState('tracker');
    };

    const handleCustomTabSwitch = (e: CustomEvent<TabType>) => {
      if (e.detail) {
        setActiveTab(e.detail);
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    window.addEventListener('switch_app_tab' as any, handleCustomTabSwitch as any);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
      window.removeEventListener('switch_app_tab' as any, handleCustomTabSwitch as any);
    };
  }, []);

  // Fetch coach invite metadata when pendingInviteCode is detected in URL
  useEffect(() => {
    if (pendingInviteCode && user) {
      fetchInviteByCode(pendingInviteCode).then((invite) => {
        if (invite) {
          setCoachInviteData(invite);
        }
      });
    }
  }, [pendingInviteCode, user]);

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

  // Coach Workspace vs Personal Athlete Mode toggle
  const isDedicatedCoachWorkspace = isCoach && !coachPersonalWorkoutMode && !inspectingClient;

  return (
    <div className="min-h-screen bg-[#050505] text-[#f3f4f6] pb-16">
      {inspectingClient && (
        <CoachViewAsBanner
          athleteName={inspectingClient.athleteName}
          onExit={() => {
            setInspectingClient(null);
            setActiveTab('coach');
          }}
        />
      )}

      {/* Quick Trainer Mode Header Bar for Coaches */}
      {isCoach && !inspectingClient && (
        <div className="bg-[#111] border-b border-[#222] px-4 py-2 text-xs">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isDedicatedCoachWorkspace ? 'bg-[#C0FF00]' : 'bg-gray-500'}`} />
              <span className="font-mono text-gray-300">
                Mode: <strong className={isDedicatedCoachWorkspace ? 'text-[#C0FF00]' : 'text-white'}>
                  {isDedicatedCoachWorkspace ? 'Coach Command Center' : 'Personal Athlete Log Book'}
                </strong>
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                const newMode = !coachPersonalWorkoutMode;
                setCoachPersonalWorkoutMode(newMode);
                localStorage.setItem('coach_personal_workout_mode', String(newMode));
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#1a1a1a] hover:bg-[#252525] text-gray-300 hover:text-white border border-[#333] font-mono text-[11px] font-bold transition-all cursor-pointer"
            >
              {isDedicatedCoachWorkspace ? (
                <>
                  <Dumbbell className="w-3.5 h-3.5 text-[#C0FF00]" />
                  <span>Switch to Personal Workouts</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-3.5 h-3.5 text-[#C0FF00]" />
                  <span>Switch to Coach Portal</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* If in Dedicated Coach Portal Mode, show Coach Management Command Center */}
        {isDedicatedCoachWorkspace ? (
          <CoachPortalView
            coachId={user.uid}
            coachName={user.displayName}
            specialty={specialty || 'strength'}
            onInspectClient={(athleteId, athleteName) => {
              setInspectingClient({ athleteId, athleteName });
              setActiveTab('history');
            }}
            onPrescribeNutrition={(athleteId, athleteName) => {
              setInspectingClient({ athleteId, athleteName });
              setActiveTab('dietary');
            }}
            onSwitchToPersonalMode={() => {
              setCoachPersonalWorkoutMode(true);
              localStorage.setItem('coach_personal_workout_mode', 'true');
            }}
          />
        ) : (
          /* Athlete & Client-Inspection Navigation Tabs */
          <>
            <div className="flex bg-[#111] border border-[#222] rounded-full p-1 w-full max-w-xl mx-auto mb-8 font-sans flex-wrap gap-1">
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
              {activeTab === 'history' && (
                <WorkoutHistory
                  targetUserId={inspectingClient?.athleteId}
                  isReadOnlyClientMode={Boolean(inspectingClient)}
                />
              )}
              {activeTab === 'insights' && <InsightsView />}
              {activeTab === 'dietary' && (
                <DietaryView userId={inspectingClient?.athleteId} />
              )}
            </div>
          </>
        )}
      </main>

      {/* Coach Invitation Acceptance Modal (Triggered automatically when opening ?coach_invite=xxx) */}
      {pendingInviteCode && user && (
        <CoachInviteAcceptModal
          isOpen={Boolean(pendingInviteCode)}
          onClose={() => {
            setPendingInviteCode(null);
            setCoachInviteData(null);
            window.history.pushState({}, '', window.location.pathname);
          }}
          inviteCode={pendingInviteCode}
          athleteId={user.uid}
          athleteName={user.displayName}
          coachInviteData={coachInviteData}
          onAccepted={() => {
            setPendingInviteCode(null);
            setCoachInviteData(null);
            window.history.pushState({}, '', window.location.pathname);
          }}
        />
      )}
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
