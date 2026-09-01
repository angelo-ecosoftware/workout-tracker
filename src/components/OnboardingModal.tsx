import React, { useState } from 'react';
import { Target, TrendingUp, Zap, Check, Loader2 } from 'lucide-react';
import { saveUserOnboarding } from '../lib/supabaseData.ts';

interface OnboardingModalProps {
  userId: string;
  onComplete: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ userId, onComplete }) => {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await saveUserOnboarding(userId);
      onComplete();
    } catch (err) {
      console.error('Failed to complete onboarding:', err);
      // Still allow UI to progress to not trap user
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

        <div>
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1a1a1a] border border-[#333] text-[#C0FF00] text-xs font-mono font-bold uppercase tracking-wider mb-5">
            <Zap className="w-3.5 h-3.5 fill-[#C0FF00]" />
            Thank You For Using Our Tracker
          </div>

          <h2 className="text-2xl sm:text-3xl font-display font-black text-white uppercase tracking-tight leading-none mb-3">
            Level Up Your <span className="text-[#C0FF00]">Training</span>
          </h2>

          <p className="text-gray-400 font-sans text-sm leading-relaxed mb-6">
            Thank you for using Workout Tracker. Built for serious lifters focused on precision, continuous overload, and structured progression.
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
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-4 px-6 rounded-2xl bg-[#C0FF00] hover:bg-[#a6dc00] text-black font-display font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.99] transition-all shadow-[0_0_20px_rgba(192,255,0,0.2)] disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Getting Started...</span>
              </>
            ) : (
              <>
                <span>Get Started</span>
                <Check className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};