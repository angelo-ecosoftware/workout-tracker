import React, { useState } from 'react';
import { Dumbbell, Target, TrendingUp, Zap, ChevronRight, Check } from 'lucide-react';
import { saveUserOnboarding } from '../lib/supabaseData.ts';

interface OnboardingModalProps {
  userId: string;
  onComplete: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ userId, onComplete }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [days, setDays] = useState<number>(4);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await saveUserOnboarding(userId, days);
      onComplete();
    } catch (err) {
      console.error('Failed to complete onboarding:', err);
      // Still allow UI to progress to not trap user if DB column is pending
      onComplete();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#111] border border-[#222] rounded-[28px] max-w-lg w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden text-left">
        {/* Subtle glow header background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[#C0FF00]/10 blur-3xl pointer-events-none rounded-full" />

        {step === 1 ? (
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1a1a1a] border border-[#333] text-[#C0FF00] text-xs font-mono font-bold uppercase tracking-wider mb-5">
              <Zap className="w-3.5 h-3.5 fill-[#C0FF00]" />
              Welcome to Spartan
            </div>

            <h2 className="text-2xl sm:text-3xl font-display font-black text-white uppercase tracking-tight leading-none mb-3">
              Level Up Your <span className="text-[#C0FF00]">Training</span>
            </h2>

            <p className="text-gray-400 font-sans text-sm leading-relaxed mb-6">
              Thank you for using Spartan Workout Tracker. Built for serious lifters focused on precision, continuous overload, and structured progression.
            </p>

            {/* Feature highlights */}
            <div className="space-y-3 mb-8">
              <div className="flex items-start gap-3 bg-[#181818] p-3.5 rounded-2xl border border-[#262626]">
                <div className="p-2 rounded-xl bg-[#C0FF00]/10 text-[#C0FF00] shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-white font-display font-bold text-sm uppercase tracking-wide">Progressive Overload</h4>
                  <p className="text-gray-400 text-xs mt-0.5">Automated suggestions and target weights based on your previous performance.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-[#181818] p-3.5 rounded-2xl border border-[#262626]">
                <div className="p-2 rounded-xl bg-[#C0FF00]/10 text-[#C0FF00] shrink-0">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-white font-display font-bold text-sm uppercase tracking-wide">Clean Log Book</h4>
                  <p className="text-gray-400 text-xs mt-0.5">Master-detail history tracking with compact overviews of every session.</p>
                </div>
              </div>
            </div>

            {/* Proceed Action */}
            <button
              onClick={() => setStep(2)}
              className="w-full py-4 px-6 rounded-2xl bg-[#C0FF00] text-black font-sans font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#b0eb00] active:scale-[0.99] transition-all shadow-lg shadow-[#C0FF00]/20"
            >
              <span>Proceed</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div>
            {/* Step 2 Indicator */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1a1a1a] border border-[#333] text-[#C0FF00] text-xs font-mono font-bold uppercase tracking-wider mb-5">
              <Dumbbell className="w-3.5 h-3.5" />
              Step 2 of 2
            </div>

            <h2 className="text-2xl sm:text-3xl font-display font-black text-white uppercase tracking-tight leading-tight mb-2">
              How Many Days Are You Planning to Train?
            </h2>

            <p className="text-gray-400 font-sans text-sm mb-8">
              Select your weekly training target. You can configure your routines and exercises right after.
            </p>

            {/* Theme-matching Slider Display */}
            <div className="bg-[#181818] border border-[#282828] rounded-2xl p-6 mb-8 text-center">
              <div className="flex items-baseline justify-center gap-2 mb-4">
                <span className="text-5xl font-display font-black text-[#C0FF00] tracking-tight">{days}</span>
                <span className="text-gray-400 font-mono text-sm uppercase tracking-wider">
                  {days === 1 ? 'Day / Week' : 'Days / Week'}
                </span>
              </div>

              {/* Slider Input */}
              <div className="space-y-3 px-2">
                <input
                  type="range"
                  min="1"
                  max="7"
                  step="1"
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="w-full h-2 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer accent-[#C0FF00]"
                />

                {/* Day Labels */}
                <div className="flex justify-between text-[11px] font-mono text-gray-500 pt-1">
                  {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setDays(num)}
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold transition-all ${
                        days === num 
                          ? 'bg-[#C0FF00] text-black scale-110 shadow-sm' 
                          : 'hover:text-white'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={submitting}
                className="py-4 px-5 rounded-2xl bg-[#1c1c1c] text-gray-400 hover:text-white font-sans font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-4 px-6 rounded-2xl bg-[#C0FF00] text-black font-sans font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#b0eb00] active:scale-[0.99] transition-all shadow-lg shadow-[#C0FF00]/20 disabled:opacity-50"
              >
                {submitting ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <span>Submit & Get Started</span>
                    <Check className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};