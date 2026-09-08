import React, { useState } from 'react';
import {
  X,
  Layers,
  Dumbbell,
  Check,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Trophy,
  Zap,
  Search,
  Sparkles,
  Info,
  Clock,
  Minus,
  Plus,
} from 'lucide-react';

interface RoutineOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRoutineEditor?: () => void;
}

export const RoutineOnboardingModal: React.FC<RoutineOnboardingModalProps> = ({
  isOpen,
  onClose,
  onOpenRoutineEditor,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Interactive mock state for Step 3
  const [mockWeight, setMockWeight] = useState<number>(20);
  const [mockReps, setMockReps] = useState<number>(10);
  const [mockChecked, setMockChecked] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSkip = () => {
    onClose();
  };

  const handleFinish = () => {
    onClose();
    if (onOpenRoutineEditor) {
      onOpenRoutineEditor();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Routine and Workout Logging Walkthrough"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#111] border border-[#262626] rounded-[28px] max-w-lg w-full p-5 sm:p-7 shadow-2xl relative overflow-hidden text-left flex flex-col justify-between max-h-[92vh] animate-in zoom-in-95 duration-200"
      >
        {/* Glow accent in header */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[#C0FF00]/10 blur-3xl pointer-events-none rounded-full" />

        {/* Top Header: Step Indicator & Skip Button */}
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-[#222]">
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all ${
                    s === step
                      ? 'w-6 bg-[#C0FF00]'
                      : s < step
                      ? 'w-3 bg-[#C0FF00]/60'
                      : 'w-3 bg-[#262626]'
                  }`}
                />
              ))}
              <span className="text-[10px] font-mono font-bold text-gray-400 uppercase ml-2">
                Step {step} of 4
              </span>
            </div>

            <button
              type="button"
              onClick={handleSkip}
              className="text-xs font-mono font-bold text-gray-400 hover:text-white uppercase tracking-wider transition-colors px-2 py-1 rounded-lg hover:bg-[#1a1a1a] cursor-pointer"
            >
              Skip Walkthrough
            </button>
          </div>

          {/* ========================================================================= */}
          {/* STEP 1: CREATE A ROUTINE DAY                                             */}
          {/* ========================================================================= */}
          {step === 1 && (
            <div className="py-4 space-y-4 animate-in fade-in duration-150">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#C0FF00] uppercase tracking-wider">
                  <Layers className="w-4 h-4" />
                  <span>Routine Architecture</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-display font-black text-white uppercase tracking-tight">
                  1. Create a Routine Day
                </h3>
                <p className="text-xs text-gray-300 font-sans leading-relaxed">
                  Organize your week into structured split days (e.g. <em>Day 1: Upper Body</em>, <em>Day 2: Lower Body</em>, or <em>Push / Pull / Legs</em>).
                </p>
              </div>

              {/* Visual Interactive Mockup */}
              <div className="bg-[#161616] border border-[#2a2a2a] rounded-2xl p-4 space-y-3">
                <div className="text-[10px] font-mono text-gray-400 uppercase font-bold tracking-wider">
                  Routine Split Selector Preview
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-[#C0FF00] text-black font-black text-xs uppercase flex items-center justify-between shadow-[0_0_15px_rgba(192,255,0,0.2)]">
                    <span>Day 1: Upper Body</span>
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#1c1c1c] border border-[#333] text-gray-400 font-bold text-xs uppercase flex items-center justify-between">
                    <span>Day 2: Lower Body</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#262626]">
                  <span className="text-[10px] font-mono text-gray-400 uppercase block mb-1">
                    Routine Day Name
                  </span>
                  <div className="bg-[#111] border border-[#383838] rounded-xl px-3 py-2 text-xs font-bold text-white font-mono flex items-center justify-between">
                    <span>Day 1 - Upper Body A</span>
                    <span className="text-[10px] text-[#C0FF00] font-sans font-normal">Active Day</span>
                  </div>
                </div>
              </div>

              {/* Pro Tip Callout */}
              <div className="bg-[#121212] border border-[#262626] rounded-xl p-3 text-xs text-gray-300 font-sans flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-[#C0FF00] shrink-0 mt-0.5" />
                <span>
                  <strong>Tip:</strong> Start with a clean 3 or 4-day split. You can reorder days or add new routines anytime under <em>Training → Edit Routines</em>.
                </span>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: ADD YOUR FIRST EXERCISE                                          */}
          {/* ========================================================================= */}
          {step === 2 && (
            <div className="py-4 space-y-4 animate-in fade-in duration-150">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#C0FF00] uppercase tracking-wider">
                  <Dumbbell className="w-4 h-4" />
                  <span>Exercise Catalog</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-display font-black text-white uppercase tracking-tight">
                  2. Add 1 Exercise to Your Day
                </h3>
                <p className="text-xs text-gray-300 font-sans leading-relaxed">
                  Search 100+ movements with muscle anatomy heatmaps, form GIFs, and 1080p tutorials.
                </p>
              </div>

              {/* Visual Interactive Mockup */}
              <div className="bg-[#161616] border border-[#2a2a2a] rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 bg-[#111] border border-[#333] rounded-xl px-3 py-2 text-xs text-gray-400 font-mono">
                  <Search className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-white">Bench Press</span>
                </div>

                <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-xs sm:text-sm text-white uppercase">
                        Barbell Bench Press
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[9px] font-mono font-bold">
                        Chest
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-[#C0FF00] mt-0.5">
                      Target Volume: 4 sets × 6-10 reps
                    </div>
                  </div>

                  <div className="p-1.5 rounded-lg bg-[#242424] text-gray-300 border border-[#383838]">
                    <Info className="w-3.5 h-3.5 text-[#C0FF00]" />
                  </div>
                </div>
              </div>

              {/* Pro Tip Callout */}
              <div className="bg-[#121212] border border-[#262626] rounded-xl p-3 text-xs text-gray-300 font-sans flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-[#C0FF00] shrink-0 mt-0.5" />
                <span>
                  <strong>Tip:</strong> Tap the <strong>(i)</strong> icon on any exercise card during your workout to see full anatomical muscle highlights, cues, and form breakdowns.
                </span>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: LOG SETS & OVERLOAD                                              */}
          {/* ========================================================================= */}
          {step === 3 && (
            <div className="py-4 space-y-4 animate-in fade-in duration-150">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#C0FF00] uppercase tracking-wider">
                  <Clock className="w-4 h-4" />
                  <span>Live Tracking & Rest</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-display font-black text-white uppercase tracking-tight">
                  3. Log Sets & Check Off
                </h3>
                <p className="text-xs text-gray-300 font-sans leading-relaxed">
                  Adjust weight and reps with steppers, then tap the checkmark to trigger rest timers and overload tracking.
                </p>
              </div>

              {/* Real Interactive Set Row Simulation */}
              <div className="bg-[#161616] border border-[#2a2a2a] rounded-2xl p-4 space-y-3">
                <div className="text-[10px] font-mono text-gray-400 uppercase font-bold tracking-wider flex items-center justify-between">
                  <span>Interactive Practice Row</span>
                  <span className="text-[#C0FF00]">Try checking off!</span>
                </div>

                <div className="grid grid-cols-12 gap-1.5 items-center p-2 rounded-xl bg-[#121212] border border-[#282828]">
                  {/* Checkbox */}
                  <div className="col-span-2 flex items-center gap-1.5">
                    <button
                      type="button"
                      aria-label="Check off practice set"
                      onClick={() => setMockChecked(!mockChecked)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer border ${
                        mockChecked
                          ? 'bg-[#C0FF00] border-[#C0FF00] text-black shadow-md'
                          : 'bg-[#1a1a1a] border-[#383838] text-gray-500 hover:text-white'
                      }`}
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                    </button>
                    <span className="font-mono text-xs font-bold text-white">1</span>
                  </div>

                  {/* Weight Stepper */}
                  <div className="col-span-5 flex items-stretch h-8 bg-[#0d0d0d] border border-[#333] rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setMockWeight(Math.max(0, mockWeight - 2.5))}
                      className="w-7 bg-[#1c1c1c] text-white flex items-center justify-center text-xs font-bold cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <div className="flex-1 flex items-center justify-center font-mono font-bold text-xs text-white">
                      {mockWeight} kg
                    </div>
                    <button
                      type="button"
                      onClick={() => setMockWeight(mockWeight + 2.5)}
                      className="w-7 bg-[#1c1c1c] text-white flex items-center justify-center text-xs font-bold cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Reps Stepper */}
                  <div className="col-span-5 flex items-stretch h-8 bg-[#0d0d0d] border border-[#333] rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setMockReps(Math.max(1, mockReps - 1))}
                      className="w-7 bg-[#1c1c1c] text-white flex items-center justify-center text-xs font-bold cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <div className="flex-1 flex items-center justify-center font-mono font-bold text-xs text-white">
                      {mockReps} reps
                    </div>
                    <button
                      type="button"
                      onClick={() => setMockReps(mockReps + 1)}
                      className="w-7 bg-[#1c1c1c] text-white flex items-center justify-center text-xs font-bold cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Status Notice upon checking */}
                {mockChecked ? (
                  <div className="p-2.5 rounded-xl bg-[#C0FF00]/15 border border-[#C0FF00]/30 text-[#C0FF00] font-mono text-xs flex items-center gap-2 animate-in fade-in">
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>Set complete! Background Rest Timer auto-started.</span>
                  </div>
                ) : (
                  <div className="text-[11px] font-mono text-gray-400 text-center">
                    Tap the checkmark button [✓] above to log the set.
                  </div>
                )}
              </div>

              {/* Overload Callout */}
              <div className="bg-[#121212] border border-[#262626] rounded-xl p-3 text-xs text-gray-300 font-sans flex items-start gap-2.5">
                <Zap className="w-4 h-4 text-[#C0FF00] shrink-0 mt-0.5" />
                <span>
                  <strong>Progressive Overload:</strong> When you hit the top rep target on all sets, the coach algorithm prompts you with <em>+2.5 kg next session</em>.
                </span>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 4: WELCOME TO THE APP!                                              */}
          {/* ========================================================================= */}
          {step === 4 && (
            <div className="py-5 space-y-5 text-center animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-3xl bg-[#C0FF00]/15 border border-[#C0FF00]/40 flex items-center justify-center text-[#C0FF00] mx-auto shadow-[0_0_30px_rgba(192,255,0,0.25)]">
                <Trophy className="w-8 h-8 stroke-[2.5]" />
              </div>

              <div className="space-y-1.5 max-w-sm mx-auto">
                <span className="text-[10px] font-mono font-bold text-[#C0FF00] uppercase tracking-widest bg-[#C0FF00]/10 border border-[#C0FF00]/25 px-2.5 py-0.5 rounded-full">
                  Walkthrough Complete
                </span>
                <h3 className="text-2xl sm:text-3xl font-display font-black text-white uppercase tracking-tight">
                  Welcome to the App!
                </h3>
                <p className="text-xs text-gray-300 font-sans leading-relaxed">
                  You know how to create routines, add exercises, and log sets with automated rest timers and overload intelligence.
                </p>
              </div>

              {/* Ready Summary Checklist */}
              <div className="bg-[#141414] border border-[#242424] rounded-2xl p-4 text-left space-y-2 text-xs font-sans text-gray-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#C0FF00] shrink-0" />
                  <span>Routines, exercises & rep goals ready</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#C0FF00] shrink-0" />
                  <span>1-Tap set logging with background vibration timers</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#C0FF00] shrink-0" />
                  <span>Weekly consistency streaks & PR celebration confetti</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation Buttons */}
        <div className="pt-4 border-t border-[#222] flex items-center justify-between gap-3 shrink-0">
          {step > 1 && step < 4 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as any)}
              className="px-4 py-2.5 rounded-xl border border-[#333] text-gray-300 hover:text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 3 && (
            <button
              type="button"
              onClick={() => setStep((s) => (s + 1) as any)}
              className="px-5 py-2.5 rounded-xl bg-[#C0FF00] hover:bg-[#a6dc00] text-black font-display font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-md cursor-pointer ml-auto"
            >
              <span>{step === 1 ? 'Next: Add an Exercise' : 'Next: How to Log Sets'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {step === 3 && (
            <button
              type="button"
              onClick={() => setStep(4)}
              className="px-5 py-2.5 rounded-xl bg-[#C0FF00] hover:bg-[#a6dc00] text-black font-display font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-md cursor-pointer ml-auto"
            >
              <span>Complete Walkthrough</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {step === 4 && (
            <button
              type="button"
              onClick={handleFinish}
              className="w-full py-3 px-5 rounded-xl bg-[#C0FF00] hover:bg-[#a6dc00] text-black font-display font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_25px_rgba(192,255,0,0.25)] cursor-pointer"
            >
              <span>Start Lifting & Track Workouts</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
