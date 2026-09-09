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
import { AdminPortalView } from './components/admin/AdminPortalView.tsx';
import { CoachViewAsBanner } from './components/coach/CoachViewAsBanner.tsx';
import { CoachInviteAcceptModal } from './components/modals/CoachInviteAcceptModal.tsx';
import { LandingPage } from './components/landing/LandingPage.tsx';
import { fetchInviteByCode } from './lib/db/roles.ts';
import { CoachAthleteLink } from './models.ts';
import { ErrorBoundary } from './components/ui/ErrorBoundary.tsx';
import { isGoogleAuthUrl, sanitizeAuthenticatedSession } from './utils/authUrl.ts';
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

type TabType = 'tracker' | 'history' | 'insights' | 'dietary' | 'coach' | 'admin';

function getInitialTab(): TabType {
  try {
    const hash = (typeof window !== 'undefined' ? window.location.hash : '').toLowerCase();
    if (hash.includes('admin')) return 'admin';
    if (hash.includes('coach') || hash.includes('roster')) return 'coach';
    if (hash.includes('history') || hash.includes('logbook')) return 'history';
    if (hash.includes('insights')) return 'insights';
    if (hash.includes('dietary')) return 'dietary';
    if (hash.includes('tracker') || hash.includes('session')) return 'tracker';

    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('workout_tracker_active_tab') as TabType;
      if (stored && ['tracker', 'history', 'insights', 'dietary', 'coach', 'admin'].includes(stored)) {
        return stored;
      }
    }
  } catch {
    // ignore
  }
  return 'tracker';
}

const GymAppContent: React.FC = () => {
  const { user, loading, token, isCoach, isAdmin, specialty } = useAuth();
  const [activeTab, setActiveTabState] = useState<TabType>(() => getInitialTab());
  const [publicSessionId, setPublicSessionId] = useState<string | null>(() => getPublicSessionIdFromUrl());
  const [pendingInviteCode, setPendingInviteCode] = useState<string | null>(() => getCoachInviteCodeFromUrl());
  const [coachInviteData, setCoachInviteData] = useState<CoachAthleteLink | null>(null);
  const [inspectingClient, setInspectingClient] = useState<{ athleteId: string; athleteName: string } | null>(null);
  const [coachPersonalWorkoutMode, setCoachPersonalWorkoutMode] = useState<boolean>(() => {
    return localStorage.getItem('coach_personal_workout_mode') === 'true';
  });

  const isLoginRoute = () => {
    if (typeof window === 'undefined') return false;
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();
    const pathname = window.location.pathname.toLowerCase();
    return (
      pathname.includes('/login') ||
      pathname.includes('/signin') ||
      pathname.includes('/admin') ||
      hash.includes('login') ||
      hash.includes('admin') ||
      search.includes('login')
    );
  };

  // Determines whether to show the landing page vs direct login screen
  const [showLoginModal, setShowLoginModal] = useState<boolean>(() => isLoginRoute());

  const navigateToRoute = (path: string) => {
    try {
      window.history.pushState(null, '', path);
    } catch {}
    setShowLoginModal(isLoginRoute());
  };

  // Automatically default admins to 'admin' tab if no specific tab was requested
  useEffect(() => {
    if (isAdmin && (!window.location.hash || window.location.hash === '#' || window.location.hash === '#tracker')) {
      const storedTab = localStorage.getItem('workout_tracker_active_tab');
      if (!storedTab || storedTab === 'tracker') {
        setActiveTab('admin');
      }
    }
  }, [isAdmin]);

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
    // Prevent back-swipe from ever exiting to the login screen or Google sign-in when authenticated
    if (user) {
      try {
        const currentHash = window.location.hash || '#tracker';
        sanitizeAuthenticatedSession(currentHash);

        // Trap back-navigation so users cannot be pushed back to Google signin or OAuth pages
        for (let i = 1; i <= 5; i++) {
          window.history.pushState({ appState: 'barrier', index: i, tab: activeTab }, '', `${window.location.pathname}#${activeTab}`);
        }
      } catch {}
    }

    const handlePopState = (_e?: Event) => {
      setPublicSessionId(getPublicSessionIdFromUrl());
      setPendingInviteCode(getCoachInviteCodeFromUrl());
      const hash = window.location.hash.toLowerCase();
      const pathname = window.location.pathname.toLowerCase();

      setShowLoginModal(isLoginRoute());

      // If user is authenticated and navigating back, trap history so it stays in app instead of Google signin
      if (user) {
        if (!hash || hash === '#' || hash === '#/' || hash.includes('login') || pathname.includes('/login') || isGoogleAuthUrl()) {
          const fallbackTab = (localStorage.getItem('workout_tracker_active_tab') as TabType) || 'tracker';
          setActiveTabState(fallbackTab);
          sanitizeAuthenticatedSession(`#${fallbackTab}`);
          for (let i = 1; i <= 3; i++) {
            window.history.pushState({ appState: 'barrier', index: i, tab: fallbackTab }, '', `${window.location.pathname}#${fallbackTab}`);
          }
          return;
        }
      }

      if (pathname.includes('/admin') || hash.includes('admin')) setActiveTabState('admin');
      else if (pathname.includes('/coach') || hash.includes('coach') || hash.includes('roster')) setActiveTabState('coach');
      else if (pathname.includes('/history') || hash.includes('history') || hash.includes('logbook')) setActiveTabState('history');
      else if (pathname.includes('/insights') || hash.includes('insights')) setActiveTabState('insights');
      else if (pathname.includes('/dietary') || hash.includes('dietary')) setActiveTabState('dietary');
      else if (pathname.includes('/tracker') || hash.includes('tracker')) setActiveTabState('tracker');
    };

    const handleCustomTabSwitch: EventListener = (e: Event) => {
      const customEvent = e as CustomEvent<TabType>;
      if (customEvent.detail) {
        setActiveTab(customEvent.detail);
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    window.addEventListener('switch_app_tab', handleCustomTabSwitch);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
      window.removeEventListener('switch_app_tab', handleCustomTabSwitch);
    };
  }, [user, activeTab]);

  // Sync coach_personal_workout_mode when toggled in Settings or other windows
  useEffect(() => {
    const handleCoachModeChange = () => {
      setCoachPersonalWorkoutMode(localStorage.getItem('coach_personal_workout_mode') === 'true');
    };
    window.addEventListener('coach_mode_changed', handleCoachModeChange);
    window.addEventListener('storage', handleCoachModeChange);
    return () => {
      window.removeEventListener('coach_mode_changed', handleCoachModeChange);
      window.removeEventListener('storage', handleCoachModeChange);
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
    if (showLoginModal) {
      return (
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              navigateToRoute('/');
            }}
            className="fixed top-4 left-4 z-50 px-3 py-1.5 rounded-xl bg-[#141414] hover:bg-[#202020] border border-[#2a2a2a] text-xs font-mono text-gray-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-md"
          >
            &larr; Back to Home
          </button>
          <LoginScreen />
        </div>
      );
    }
    return (
      <LandingPage
        onSignIn={() => navigateToRoute('/login')}
        onStartNow={() => navigateToRoute('/login')}
        onOpenAdminLogin={() => navigateToRoute('/admin')}
      />
    );
  }

  // Pure Admin Experience: Strip all athlete and coaching modules
  if (isAdmin) {
    return (
      <div className="min-h-screen bg-[#050505] text-[#f3f4f6] pb-16">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <AdminPortalView />
        </main>
      </div>
    );
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
              window.dispatchEvent(new Event('coach_mode_changed'));
            }}
          />
        ) : (
          /* Athlete & Client-Inspection Navigation Tabs */
          <>
            <div className="flex bg-[#111] border border-[#222] rounded-full p-1 w-full max-w-xl mx-auto mb-8 font-sans flex-wrap gap-1">
              {!inspectingClient && (
                <button 
                  onClick={() => setActiveTab('tracker')}
                  className={`flex-1 py-2 text-[11px] sm:text-xs uppercase tracking-wider font-bold rounded-full transition-all cursor-pointer ${
                    activeTab === 'tracker' ? 'bg-[#C0FF00] text-black shadow-md' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Today's Session
                </button>
              )}
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
              {isAdmin && !inspectingClient && (
                <button 
                  onClick={() => setActiveTab('admin')}
                  className={`flex-1 py-2 text-[11px] sm:text-xs uppercase tracking-wider font-bold rounded-full transition-all cursor-pointer ${
                    activeTab === 'admin' ? 'bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'text-purple-400 hover:text-purple-300'
                  }`}
                >
                  Admin
                </button>
              )}
            </div>

            <div>
              {!inspectingClient && activeTab === 'tracker' && <WorkoutDayTracker />}
              {activeTab === 'history' && (
                <WorkoutHistory
                  targetUserId={inspectingClient?.athleteId}
                  isReadOnlyClientMode={Boolean(inspectingClient)}
                />
              )}
              {activeTab === 'insights' && (
                <InsightsView userId={inspectingClient?.athleteId} />
              )}
              {activeTab === 'dietary' && (
                <DietaryView userId={inspectingClient?.athleteId} />
              )}
              {isAdmin && activeTab === 'admin' && (
                <AdminPortalView />
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
