import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Dumbbell, ShieldAlert, Loader2 } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { loginWithGoogle } = useAuth();
  const [loggingIn, setLoggingIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoggingIn(true);
    setErrorMsg(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error. Please check configuration.');
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
                  Check if authorized in Firebase Authentication Console.
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
    </div>
  );
};
