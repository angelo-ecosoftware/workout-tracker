import React, { useEffect, useState, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { PWAProvider } from './context/PWAContext.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { Header } from './components/ui/Header.tsx';
import { CoachViewAsBanner } from './components/coach/CoachViewAsBanner.tsx';
import { CoachInviteAcceptModal } from './components/modals/CoachInviteAcceptModal.tsx';
import { fetchInviteByCode } from './lib/db/roles.ts';
import { fetchAllCatalogExercises } from './lib/supabaseData.ts';
import { CoachAthleteLink } from './models.ts';
import { ErrorBoundary } from './components/ui/ErrorBoundary.tsx';
import { isGoogleAuthUrl, sanitizeAuthenticatedSession } from './utils/authUrl.ts';
import { Loader2 } from 'lucide-react';

// LAZY LOADED COMPONENTS: Downloaded only when rendered
const WorkoutDayTracker = lazy(() => import('./components/workout/WorkoutDayTracker.tsx').then(m => ({ default: m.WorkoutDayTracker })));
const WorkoutHistory = lazy(() => import('./components/workout/WorkoutHistory.tsx').then(m => ({ default: m.WorkoutHistory })));
const InsightsView = lazy(() => import('./components/insights/InsightsView.tsx').then(m => ({ default: m.InsightsView })));
const DietaryView = lazy(() => import('./components/dietary/DietaryView.tsx').then(m => ({ default: m.DietaryView })));
const PublicSessionView = lazy(() => import('./components/workout/PublicSessionView.tsx').then(m => ({ default: m.PublicSessionView })));
const CoachPortalView = lazy(() => import('./components/coach/CoachPortalView.tsx').then(m => ({ default: m.CoachPortalView })));
const AdminPortalView = lazy(() => import('./components/admin/AdminPortalView.tsx').then(m => ({ default: m.AdminPortalView })));
const LandingPage = lazy(() => import('./components/landing/LandingPage.tsx').then(m => ({ default: m.LandingPage })));
const LoginScreen = lazy(() => import('./components/auth/LoginScreen.tsx').then(m => ({ default: m.LoginScreen })));

// Helper functions for URL parsing
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

  const [showLoginModal, setShowLoginModal] = useState<boolean>(() => isLoginRoute());

  const navigateToRoute = (path: string) => {
    try {
      window.history.pushState(null, '', path);
    } catch {}
    setShowLoginModal(isLoginRoute());
  };

  // Deferred prefetch: wait until user is authenticated and main thread is idle
  useEffect(() => {
    if (!user) return;

    if ('requestIdleCallback' in window) {
      const handle = window.requestIdleCallback(() => {
        fetchAllCatalogExercises().catch(() => {});
      });
      return () => window.cancelIdleCallback(handle);
    } else {
      const timer = setTimeout(() => {
        fetchAllCatalogExercises().catch(() => {});
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  // Default admins to admin tab
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
    if (user) {
      try {
        const currentHash = window.location.hash || '#tracker';
        sanitizeAuthenticatedSession(currentHash);
      } catch {}
    }

    const handlePopState = (_e?: Event) => {
      setPublicSessionId(getPublicSessionIdFromUrl());
      setPendingInviteCode(getCoachInviteCodeFromUrl());
      const hash = window.location.hash.toLowerCase();
      const pathname = window.location.pathname.toLowerCase();

      setShowLoginModal(isLoginRoute());

      if (user) {
        if (!hash || hash === '#' || hash === '#/' || hash.includes('login') || pathname.includes('/login') || isGoogleAuthUrl()) {
          const fallbackTab = (localStorage.getItem('workout_tracker_active_tab') as TabType) || 'tracker';
          setActiveTabState(fallbackTab);
          sanitizeAuthenticatedSession(`#${fallbackTab}`);
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

  useEffect(() => {
    if (pendingInviteCode && user) {
      fetchInviteByCode(pendingInviteCode).then((invite) => {
        if (invite) {
          setCoachInviteData(invite);
        }
      });
    }
  }, [pendingInviteCode, user]);

  const loadingSpinner = (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-[#C0FF00]" />
      <span className="font-sans text-xs text-gray-400 uppercase tracking-widest font-semibold">
        Loading...
      </span>
    </div>
  );

  if (publicSessionId) {
    return (
      <Suspense fallback={loadingSpinner}>
        <PublicSessionView
          sessionId={publicSessionId}
          onGoToApp={() => {
            window.history.pushState({}, '', window.location.pathname);
            setPublicSessionId(null);
          }}
        />
      </Suspense>
    );
  }

  if (loading || (user && !token)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#C0FF00]" />
        <span className="font-sans text-xs text-gray-400 uppercase tracking-widest font-semibold">
          Authenticating with server...
        </span>
      </div>
    );
  }

  if (!user) {
    if (showLoginModal) {
      return (
        <Suspense fallback={loadingSpinner}>
          <div className="relative">
            <button
              type="button"
              onClick={() => navigateToRoute('/')}
              className="fixed top-4 left-4 z-50 px-3 py-1.5 rounded-xl bg-[#141414] hover:bg-[#202020] border border-[#2a2a2a] text-xs font-mono text-gray-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-md"
            >
              &larr; Back to Home
            </button>
            <LoginScreen />
          </div>
        </Suspense>
      );
    }
    return (
      <Suspense fallback={loadingSpinner}>
        <LandingPage
          onSignIn={() => navigateToRoute('/login')}
          onStartNow={() => navigateToRoute('/login')}
          onOpenAdminLogin={() => navigateToRoute('/admin')}
        />
      </Suspense>
    );
  }

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-[#050505] text-[#f3f4f6] pb-16">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <Suspense fallback={loadingSpinner}>
            <AdminPortalView />
          </Suspense>
        </main>
      </div>
    );
  }

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
        <Suspense fallback={loadingSpinner}>
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
                {activeTab === 'insights' && <InsightsView userId={inspectingClient?.athleteId} />}
                {activeTab === 'dietary' && <DietaryView userId={inspectingClient?.athleteId} />}
                {isAdmin && activeTab === 'admin' && <AdminPortalView />}
              </div>
            </>
          )}
        </Suspense>
      </main>

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