import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  Dumbbell,
  ShieldCheck,
  Zap,
  ArrowRight,
  Lock,
  Layers,
  Sparkles,
  CheckCircle2,
  Award,
  Flame,
  Clock,
  HeartPulse,
  Eye,
  Server,
  Smartphone,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

interface LandingPageProps {
  onStartNow: () => void;
  onOpenAdminLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStartNow, onOpenAdminLogin }) => {
  const { loginWithGoogle } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      await loginWithGoogle();
    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code: unknown }).code === 'auth/popup-closed-by-user'
      ) {
        setAuthError(null);
      } else {
        setAuthError(err instanceof Error ? err.message : 'Sign-in error. Please try again.');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#f3f4f6] font-sans selection:bg-[#C0FF00] selection:text-black">
      {/* Skip to Main Content for WCAG 2.2 */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#C0FF00] focus:text-black focus:font-bold focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
      >
        Skip to main content
      </a>

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-[#1c1c1c]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl bg-[#C0FF00] flex items-center justify-center text-black shadow-[0_0_15px_rgba(192,255,0,0.3)]"
              aria-hidden="true"
            >
              <Dumbbell className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-black text-lg tracking-tight uppercase leading-none">
                KINISIA
              </span>
              <span className="text-[9px] font-mono tracking-widest text-[#C0FF00] font-bold uppercase">
                Zero-Fluff Split Tracker
              </span>
            </div>
          </div>

          <nav aria-label="Main Navigation" className="flex items-center gap-3 sm:gap-4">
            <a
              href="#philosophy"
              className="text-xs font-mono text-gray-400 hover:text-white transition-colors hidden sm:inline-block"
            >
              Philosophy
            </a>
            <a
              href="#standards"
              className="text-xs font-mono text-gray-400 hover:text-white transition-colors hidden sm:inline-block"
            >
              EU Standards
            </a>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              className="px-4 py-2 rounded-xl bg-[#C0FF00] hover:bg-[#b0f000] text-black font-display font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-[0_0_15px_rgba(192,255,0,0.25)] cursor-pointer active:scale-95 flex items-center gap-1.5"
            >
              <span>{isSigningIn ? 'Connecting...' : 'Sign In'}</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content">
        {/* HERO SECTION */}
        <section
          aria-labelledby="hero-heading"
          className="relative px-4 sm:px-6 pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden text-center"
        >
          {/* Subtle Glow & Grid Backdrops */}
          <div
            className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#C0FF00] rounded-full blur-[160px] opacity-[0.09] pointer-events-none"
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 bg-[radial-gradient(#1f1f1f_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none"
            aria-hidden="true"
          />

          <div className="relative max-w-4xl mx-auto space-y-6">
            <h1
              id="hero-heading"
              className="text-4xl sm:text-6xl md:text-7xl font-display font-black tracking-tight text-white uppercase leading-[1.05]"
            >
              NO FLUFF. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C0FF00] via-[#e2ff70] to-[#C0FF00]">
                LOG SETS &amp; LEAVE.
              </span>
            </h1>

            <p className="max-w-2xl mx-auto text-sm sm:text-base md:text-lg text-gray-300 font-sans leading-relaxed">
              The high-performance progressive overload logbook designed for serious athletes.
              Instant 0-lag set logging, 1,500+ verified animated form guides, atomic 1-tap rest timing,
              and enterprise-grade EU privacy standards.
            </p>

            {/* Error Announcement if auth fails */}
            {authError && (
              <div
                role="alert"
                className="max-w-md mx-auto p-3 rounded-xl bg-red-950/50 border border-red-900/60 text-red-300 text-xs font-mono text-left"
              >
                <strong className="font-bold text-red-400">Authentication Error:</strong> {authError}
              </div>
            )}

            {/* CTA BUTTONS */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSigningIn}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#C0FF00] hover:bg-[#b0f000] text-black font-display font-black text-sm uppercase tracking-wider transition-all duration-200 shadow-[0_0_30px_rgba(192,255,0,0.35)] hover:shadow-[0_0_40px_rgba(192,255,0,0.5)] cursor-pointer active:scale-95 flex items-center justify-center gap-2.5"
              >
                <Zap className="w-4 h-4 fill-black text-black" aria-hidden="true" />
                <span>{isSigningIn ? 'Connecting with Google...' : 'START NOW — FREE'}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={onStartNow}
                className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-[#141414] hover:bg-[#1f1f1f] border border-[#2a2a2a] text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Sign In Options &rarr;
              </button>
            </div>

            {/* Trust Micro-Badges */}
            <div className="pt-6 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-gray-400 font-mono">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#C0FF00]" aria-hidden="true" />
                No ads or paywalls
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#C0FF00]" aria-hidden="true" />
                Offline-First PWA
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#C0FF00]" aria-hidden="true" />
                GDPR Art. 9/17 Certified
              </span>
            </div>
          </div>
        </section>

        {/* CORE PILLARS SECTION */}
        <section aria-labelledby="pillars-heading" className="py-12 bg-[#0c0c0c] border-y border-[#1c1c1c]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <h2 id="pillars-heading" className="sr-only">
              Core Capabilities
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="bg-[#121212] border border-[#222] rounded-3xl p-6 sm:p-7 space-y-3 shadow-lg hover:border-[#C0FF00]/40 transition-colors">
                <div
                  className="w-11 h-11 rounded-2xl bg-[#C0FF00]/10 border border-[#C0FF00]/20 flex items-center justify-center text-[#C0FF00]"
                  aria-hidden="true"
                >
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-display font-black text-white uppercase tracking-tight">
                  Progressive Overload Machine
                </h3>
                <p className="text-xs text-gray-300 font-sans leading-relaxed">
                  Automatic benchmarking from your previous sessions. View your previous weight and reps directly
                  on the set row so every workout progressively challenges your muscular limits.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-[#121212] border border-[#222] rounded-3xl p-6 sm:p-7 space-y-3 shadow-lg hover:border-[#C0FF00]/40 transition-colors">
                <div
                  className="w-11 h-11 rounded-2xl bg-[#C0FF00]/10 border border-[#C0FF00]/20 flex items-center justify-center text-[#C0FF00]"
                  aria-hidden="true"
                >
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-display font-black text-white uppercase tracking-tight">
                  1,500+ Pure Animated GIFs
                </h3>
                <p className="text-xs text-gray-300 font-sans leading-relaxed">
                  Every single catalog exercise includes verified looping demonstration GIFs, anatomical heatmaps,
                  setup and peak contraction phases, plus direct 1080p YouTube &amp; TikTok tutorials.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-[#121212] border border-[#222] rounded-3xl p-6 sm:p-7 space-y-3 shadow-lg hover:border-[#C0FF00]/40 transition-colors">
                <div
                  className="w-11 h-11 rounded-2xl bg-[#C0FF00]/10 border border-[#C0FF00]/20 flex items-center justify-center text-[#C0FF00]"
                  aria-hidden="true"
                >
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-display font-black text-white uppercase tracking-tight">
                  Frictionless Workout Flow
                </h3>
                <p className="text-xs text-gray-300 font-sans leading-relaxed">
                  Single-tap set check-offs with automatic floating rest countdowns, haptic buzzer alerts, and
                  streamlined post-session recovery check-ins (sleep, energy, bodyweight, notes).
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* PHILOSOPHY SECTION */}
        <section id="philosophy" aria-labelledby="philosophy-heading" className="py-16 sm:py-24 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-3">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#C0FF00] bg-[#C0FF00]/10 border border-[#C0FF00]/20 px-3 py-1 rounded-full">
                THE KINISIA MANIFESTO
              </span>
              <h2
                id="philosophy-heading"
                className="text-3xl sm:text-5xl font-display font-black text-white uppercase tracking-tight"
              >
                Our Training Philosophy
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 font-sans max-w-xl mx-auto">
                Built by athletes, engineered for pure efficiency in the gym.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-[#101010] border border-[#222] rounded-2xl p-5 sm:p-6 space-y-2">
                <div className="flex items-center gap-2 text-white font-display font-bold text-sm uppercase">
                  <span className="text-[#C0FF00] font-mono text-base font-black">01.</span>
                  <span>Zero Social Feeds or Distractions</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed font-sans pl-7">
                  Modern workout apps are cluttered with influencer feeds, premium paywalls, and social noise.
                  Kinisia gets out of your way: open the app, look at your benchmark, lift, tap complete, and get on with your life.
                </p>
              </div>

              <div className="bg-[#101010] border border-[#222] rounded-2xl p-5 sm:p-6 space-y-2">
                <div className="flex items-center gap-2 text-white font-display font-bold text-sm uppercase">
                  <span className="text-[#C0FF00] font-mono text-base font-black">02.</span>
                  <span>Objective Progressive Overload</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed font-sans pl-7">
                  Muscle growth and athletic performance require mechanical tension and systematic progression. We record exact
                  tonnage, reps, and RIR benchmarks so you never guess what weight to load onto the bar.
                </p>
              </div>

              <div className="bg-[#101010] border border-[#222] rounded-2xl p-5 sm:p-6 space-y-2">
                <div className="flex items-center gap-2 text-white font-display font-bold text-sm uppercase">
                  <span className="text-[#C0FF00] font-mono text-base font-black">03.</span>
                  <span>True Data Sovereignty &amp; Privacy</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed font-sans pl-7">
                  Your biometric health data belongs exclusively to you. No tracking pixels, no behavioral profiling,
                  and no selling health logs to third parties. Export complete backups or wipe your account anytime.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CERTIFIED STANDARDS SECTION */}
        <section
          id="standards"
          aria-labelledby="standards-heading"
          className="py-16 sm:py-24 px-4 sm:px-6 bg-[#0c0c0c] border-t border-[#1c1c1c]"
        >
          <div className="max-w-5xl mx-auto space-y-10">
            <div className="text-center space-y-3">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#C0FF00] bg-[#C0FF00]/10 border border-[#C0FF00]/20 px-3 py-1 rounded-full">
                ENTERPRISE COMPLIANCE
              </span>
              <h2
                id="standards-heading"
                className="text-3xl sm:text-5xl font-display font-black text-white uppercase tracking-tight"
              >
                Certified Engineering Standards
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 font-sans max-w-xl mx-auto">
                Audited against strict European Union software and security benchmarks.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Standard 1 */}
              <div className="bg-[#121212] border border-[#222] rounded-2xl p-5 space-y-2.5">
                <div className="flex items-center gap-2 text-[#C0FF00]">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="font-mono text-xs font-bold uppercase">GDPR Art. 9 &amp; 17</span>
                </div>
                <h3 className="font-display font-bold text-sm text-white">Biometric Privacy</h3>
                <p className="text-[11px] text-gray-400 font-sans leading-relaxed">
                  Special category health data protection, isolated row-level security (RLS), and 1-tap atomic
                  cascade purge (&quot;Right to be Forgotten&quot;).
                </p>
              </div>

              {/* Standard 2 */}
              <div className="bg-[#121212] border border-[#222] rounded-2xl p-5 space-y-2.5">
                <div className="flex items-center gap-2 text-[#C0FF00]">
                  <Award className="w-4 h-4" />
                  <span className="font-mono text-xs font-bold uppercase">WCAG 2.2 Level AA</span>
                </div>
                <h3 className="font-display font-bold text-sm text-white">Full Accessibility</h3>
                <p className="text-[11px] text-gray-400 font-sans leading-relaxed">
                  High-contrast ratio palette ($\ge 4.5:1$), keyboard trap defense, aria-live status announcements,
                  and unconstrained mobile zoom.
                </p>
              </div>

              {/* Standard 3 */}
              <div className="bg-[#121212] border border-[#222] rounded-2xl p-5 space-y-2.5">
                <div className="flex items-center gap-2 text-[#C0FF00]">
                  <Lock className="w-4 h-4" />
                  <span className="font-mono text-xs font-bold uppercase">EU CRA &amp; NIS2</span>
                </div>
                <h3 className="font-display font-bold text-sm text-white">Cyber Resilience</h3>
                <p className="text-[11px] text-gray-400 font-sans leading-relaxed">
                  Zero hardcoded secrets, complete Software Bill of Materials (SBOM), TLS 1.3 enforced transit,
                  and automated bot defense.
                </p>
              </div>

              {/* Standard 4 */}
              <div className="bg-[#121212] border border-[#222] rounded-2xl p-5 space-y-2.5">
                <div className="flex items-center gap-2 text-[#C0FF00]">
                  <Server className="w-4 h-4" />
                  <span className="font-mono text-xs font-bold uppercase">ISO/IEC 25010</span>
                </div>
                <h3 className="font-display font-bold text-sm text-white">Software Quality</h3>
                <p className="text-[11px] text-gray-400 font-sans leading-relaxed">
                  Strict modular architecture, 100% automated regression test coverage across 120 test suites,
                  and offline IndexedDB transaction safety.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* BOTTOM FINAL CALL TO ACTION */}
        <section aria-labelledby="cta-heading" className="py-20 px-4 sm:px-6 text-center relative overflow-hidden">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2
              id="cta-heading"
              className="text-3xl sm:text-5xl font-display font-black text-white uppercase tracking-tight"
            >
              READY TO TRAIN WITH PURPOSE?
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 font-sans max-w-lg mx-auto">
              Join serious lifters and athletes tracking their progression without distractions.
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSigningIn}
                className="px-8 py-4 rounded-2xl bg-[#C0FF00] hover:bg-[#b0f000] text-black font-display font-black text-sm uppercase tracking-wider transition-all duration-200 shadow-[0_0_30px_rgba(192,255,0,0.35)] cursor-pointer active:scale-95 inline-flex items-center gap-2.5"
              >
                <Zap className="w-4 h-4 fill-black text-black" aria-hidden="true" />
                <span>{isSigningIn ? 'Connecting...' : 'GET STARTED WITH GOOGLE'}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-[#1c1c1c] bg-[#080808] py-8 text-center text-xs text-gray-400 font-mono">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-white uppercase">KINISIA</span>
            <span>&bull;</span>
            <span>&copy; {new Date().getFullYear()} Kinisia</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onOpenAdminLogin}
              className="hover:text-white underline cursor-pointer"
            >
              Admin Sign-In
            </button>
            <span>&bull;</span>
            <a href="https://kinisia.nl/#tracker" className="hover:text-white underline">
              Open App
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
