import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { usePWA } from '../context/PWAContext.tsx';
import { Dumbbell, ShieldAlert, Loader2, Download, Smartphone, X, Share2, PlusSquare, ArrowRight } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { loginWithGoogle } = useAuth();
  const { installPrompt, setInstallPrompt, isStandalone, isIOS, isMobile } = usePWA();
  const [loggingIn, setLoggingIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  // Check if the user previously dismissed the prompt during this session or recently
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('dismiss_install_overlay') === 'true';
    } catch {
      return false;
    }
  });

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem('dismiss_install_overlay', 'true');
    } catch (e) {
      // ignore storage access errors
    }
  };

  const handleInstallClick = async () => {
    if (installPrompt) {
      try {
        await installPrompt.prompt();
        const choiceResult = await installPrompt.userChoice;
        if (choiceResult?.outcome === 'accepted') {
          setInstallPrompt(null);
          handleDismiss();
        }
      } catch (err) {
        console.error('Failed to prompt install:', err);
      }
      return;
    }

    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    // Android / browser fallback instructions
    alert(
      "To install the app:\n\n" +
      "1. Tap your browser menu (⋮ in Chrome, Brave, or Edge)\n" +
      "2. Select 'Install app' or 'Add to Home screen'\n" +
      "3. Open the installed app from your home screen for full-screen performance!"
    );
  };

  // Condition: Show banner/overlay only if:
  // 1. User is on phone (isMobile is true)
  // 2. User has NOT downloaded/installed the app yet (isStandalone is false)
  // 3. User hasn't dismissed it in current session
  const showInstallOverlay = isMobile && !isStandalone && !isDismissed;

  const handleLogin = async () => {
    setLoggingIn(true);
    setErrorMsg(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user') {
        // Just ignore if the user closes the popup
        setErrorMsg(null);
      } else {
        setErrorMsg(err.message || 'Authentication error. Please check configuration.');
      }
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] px-4 py-12 relative overflow-hidden">
      {/* Decorative background grid and blurs */}
      <div className="absolute inset-0 bg-[radial-gradient(#1a1a1a_1px,transparent_1px)] [background-size:16px_16px] opacity-35" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-[#C0FF00] rounded-full blur-[140px] opacity-[0.06] pointer-events-none" />

      <div className="w-full max-w-md bg-[#111111]/90 backdrop-blur-md border border-[#222] rounded-[32px] p-8 shadow-[0_0_80px_rgba(0,0,0,0.8)] relative z-10">
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#C0FF00] flex items-center justify-center text-black mb-6 shadow-[0_0_30px_rgba(192,255,0,0.2)]">
            <Dumbbell className="w-7 h-7 stroke-[2.2]" />
          </div>
          
          <h1 className="font-display text-3xl font-black italic tracking-tighter text-white mb-2 uppercase">
            Workout <span className="text-[#C0FF00]">Tracker</span>
          </h1>
          
          <p className="font-sans text-xs text-gray-400 max-w-xs mb-8 uppercase tracking-widest font-semibold leading-relaxed">
            Minimal personal split tracker<br />
            <span className="text-gray-600 font-mono text-[10px]">No fluff. log sets & leave.</span>
          </p>

          {errorMsg && (
            <div className="w-full mb-6 p-4 bg-red-950/40 border border-red-900/60 rounded-xl flex items-start gap-2.5 text-left">
              <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="text-xs text-red-200">
                <span className="font-bold text-red-400">Sign-In Failed:</span> {errorMsg}
                <div className="mt-1 text-[10px] text-red-500 font-mono">
                  Check if Google Auth is enabled in Supabase Authentication Dashboard.
                </div>
              </div>
            </div>
          )}

          <button
            id="google-signin-btn"
            onClick={handleLogin}
            disabled={loggingIn}
            className="w-full flex items-center justify-center gap-3 px-5 py-3.5 bg-[#1a1a1a] hover:bg-[#252525] active:bg-[#151515] border border-[#333] hover:border-[#C0FF00] rounded-xl font-sans text-xs font-bold text-white uppercase tracking-wider transition-all duration-250 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md hover:shadow-[0_0_20px_rgba(192,255,0,0.08)]"
          >
            {loggingIn ? (
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            ) : (
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" width="100%" height="100%">
                <path
                  fill="#EA4335"
                  d="M12 5.04c1.64 0 3.12.56 4.28 1.67l3.2-3.2C17.52 1.58 14.93 1 12 1 7.37 1 3.4 3.66 1.48 7.56l3.8 2.95c.9-2.7 3.43-4.47 6.72-4.47z"
                />
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.81-.07-1.59-.2-2.33H12v4.42h6.45c-.28 1.47-1.11 2.72-2.36 3.56l3.66 2.84c2.14-1.98 3.38-4.89 3.38-8.49z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.51c-.24-.71-.38-1.47-.38-2.26s.14-1.55.38-2.26L1.48 7.04C.54 8.94 0 11.06 0 13.3s.54 4.36 1.48 6.26l3.8-3.05z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.01.68-2.31 1.09-3.9 1.09-3.29 0-5.82-1.77-6.72-4.47l-3.8 2.95C3.4 20.34 7.37 23 12 23z"
                />
              </svg>
            )}
            {loggingIn ? 'Connecting...' : 'Sign in with Google'}
          </button>
        </div>
      </div>

      {/* Phone App Install Overlay / Banner */}
      {showInstallOverlay && (
        <div className="fixed inset-x-0 bottom-0 z-50 p-4 pb-6 sm:pb-6 animate-in slide-in-from-bottom-5 duration-300">
          <div className="max-w-md mx-auto bg-[#141414]/95 backdrop-blur-xl border border-[#C0FF00]/40 rounded-2xl p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] relative">
            {/* Close / Dismiss button */}
            <button
              onClick={handleDismiss}
              aria-label="Dismiss download prompt"
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[#222] hover:bg-[#333] text-gray-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3.5 pr-6">
              <div className="w-10 h-10 rounded-xl bg-[#C0FF00]/15 border border-[#C0FF00]/30 flex items-center justify-center text-[#C0FF00] shrink-0 mt-0.5">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  Install Workout App
                  <span className="text-[10px] bg-[#C0FF00] text-black font-black px-1.5 py-0.5 rounded uppercase">
                    PWA
                  </span>
                </h2>
                <p className="font-sans text-xs text-gray-300 mt-1 leading-relaxed">
                  For a <span className="text-white font-semibold">better and cleaner user experience</span>, we recommend installing the app directly to your phone.
                </p>
              </div>
            </div>

            <div className="mt-3.5 flex items-center gap-2">
              <button
                onClick={handleInstallClick}
                className="flex-1 py-2.5 px-3 bg-[#C0FF00] hover:bg-[#a8e000] active:scale-[0.98] text-black font-sans text-xs font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(192,255,0,0.25)] transition-all"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                Download App
              </button>
              <button
                onClick={handleDismiss}
                className="py-2.5 px-3.5 bg-[#202020] hover:bg-[#282828] text-gray-400 hover:text-gray-200 font-sans text-xs font-semibold uppercase tracking-wider rounded-xl cursor-pointer transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Safari Step-by-step Install Modal */}
      {showIOSInstructions && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#151515] border border-[#2d2d2d] rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowIOSInstructions(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#222] text-gray-400 hover:text-white flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-[#C0FF00]/15 border border-[#C0FF00]/40 flex items-center justify-center text-[#C0FF00] mb-4">
              <Download className="w-6 h-6 stroke-[2.2]" />
            </div>

            <h3 className="font-display text-base font-bold text-white uppercase tracking-wider">
              Install on iOS Safari
            </h3>
            <p className="font-sans text-xs text-gray-400 mt-1 mb-4">
              Add to your Home Screen in 2 quick taps for the full native app experience:
            </p>

            <div className="space-y-3 font-sans text-xs text-gray-300">
              <div className="flex items-center gap-3 p-3 bg-[#1e1e1e] rounded-xl border border-[#2a2a2a]">
                <div className="w-7 h-7 rounded-lg bg-[#2a2a2a] flex items-center justify-center text-[#C0FF00] font-bold shrink-0">
                  1
                </div>
                <div>
                  Tap the <span className="text-white font-semibold inline-flex items-center gap-1">Share button <Share2 className="w-3.5 h-3.5 inline text-[#C0FF00]" /></span> at the bottom of Safari.
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-[#1e1e1e] rounded-xl border border-[#2a2a2a]">
                <div className="w-7 h-7 rounded-lg bg-[#2a2a2a] flex items-center justify-center text-[#C0FF00] font-bold shrink-0">
                  2
                </div>
                <div>
                  Scroll down & select <span className="text-white font-semibold inline-flex items-center gap-1">Add to Home Screen <PlusSquare className="w-3.5 h-3.5 inline text-[#C0FF00]" /></span>.
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-[#1e1e1e] rounded-xl border border-[#2a2a2a]">
                <div className="w-7 h-7 rounded-lg bg-[#2a2a2a] flex items-center justify-center text-[#C0FF00] font-bold shrink-0">
                  3
                </div>
                <div>
                  Tap <span className="text-[#C0FF00] font-bold">Add</span> in the top right.
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setShowIOSInstructions(false);
                handleDismiss();
              }}
              className="w-full mt-5 py-3 bg-[#C0FF00] text-black font-sans text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer hover:bg-[#a8e000] transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
