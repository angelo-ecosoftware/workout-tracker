import React, { useState } from 'react';
import { Target, TrendingUp, Zap, Check, ArrowRight, User } from 'lucide-react';
import { UserMetrics, Somatotype } from '../../models.ts';
import { saveUserMetrics } from '../../lib/supabaseData.ts';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  onCompletedOnboarding?: (metrics: UserMetrics) => void;
}

const GOAL_OPTIONS = [
  'Build Muscle (Hypertrophy)',
  'Increase Pure Strength (Powerlifting)',
  'Fat Loss & Body Recomposition',
  'General Fitness & Longevity',
];

const EXPERIENCE_OPTIONS: Array<{ level: UserMetrics['fitnessLevel']; label: string; desc: string }> = [
  { level: 'beginner', label: 'Beginner', desc: '< 1 year lifting, learning form & cues' },
  { level: 'intermediate', label: 'Intermediate', desc: '1–3 years consistent progressive overload' },
  { level: 'advanced', label: 'Advanced', desc: '3+ years structured periodization & heavy loads' },
];

const LOCATION_OPTIONS: Array<{ loc: UserMetrics['trainingLocation']; label: string; desc: string }> = [
  { loc: 'gym', label: 'Commercial Gym', desc: 'Barbells, dumbbells, cable stacks, machines' },
  { loc: 'home', label: 'Home Gym', desc: 'Dumbbells, pull-up bar, resistance bands' },
  { loc: 'hybrid', label: 'Hybrid / Calisthenics', desc: 'Mix of bodyweight and free weights' },
];

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  isOpen,
  onClose,
  userId,
  onCompletedOnboarding,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedGoals, setSelectedGoals] = useState<string[]>(['Build Muscle (Hypertrophy)']);
  const [fitnessLevel, setFitnessLevel] = useState<UserMetrics['fitnessLevel']>('intermediate');
  const [trainingLocation, setTrainingLocation] = useState<UserMetrics['trainingLocation']>('gym');
  const [somatotype, setSomatotype] = useState<Somatotype>('mesomorph');
  const [weightKg, setWeightKg] = useState<string>('80');
  const [heightCm, setHeightCm] = useState<string>('180');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const toggleGoal = (goal: string) => {
    if (selectedGoals.includes(goal)) {
      if (selectedGoals.length > 1) {
        setSelectedGoals(selectedGoals.filter((g) => g !== goal));
      }
    } else {
      setSelectedGoals([...selectedGoals, goal]);
    }
  };

  const handleFinish = async () => {
    setIsSaving(true);
    const parsedWeight = parseFloat(weightKg);
    const parsedHeight = parseFloat(heightCm);

    const metricsPayload: UserMetrics = {
      fitnessLevel,
      trainingLocation,
      somatotype,
      goals: selectedGoals,
      weight: !isNaN(parsedWeight) && parsedWeight > 0 ? parsedWeight : 80,
      height: !isNaN(parsedHeight) && parsedHeight > 0 ? parsedHeight : 180,
      updatedAt: new Date().toISOString(),
    };

    if (userId) {
      try {
        await saveUserMetrics(userId, metricsPayload);
      } catch (err) {
        console.warn('Failed saving initial onboarding metrics:', err);
      }
    }

    if (onCompletedOnboarding) {
      onCompletedOnboarding(metricsPayload);
    }
    setIsSaving(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome & Onboarding Setup"
    >
      <div className="bg-[#111] border border-[#222] rounded-[28px] max-w-lg w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden text-left flex flex-col justify-between max-h-[90vh]">
        {/* Glow header background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[#C0FF00]/10 blur-3xl pointer-events-none rounded-full" />

        {/* Top Header: Step Indicator & Skip CTA */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all ${
                    s === step
                      ? 'w-6 bg-[#C0FF00]'
                      : s < step
                      ? 'w-3 bg-[#C0FF00]/50'
                      : 'w-3 bg-[#262626]'
                  }`}
                />
              ))}
              <span className="text-[10px] font-mono font-bold text-gray-500 uppercase ml-2">
                Step {step} of 4
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-[11px] font-mono font-bold text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              Skip for Now & Explore
            </button>
          </div>

          {/* STEP 1: TRAINING GOALS */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#C0FF00] block mb-1">
                  Primary Objective
                </span>
                <h3 className="font-display font-black text-xl sm:text-2xl text-white uppercase tracking-tight">
                  What is your main focus?
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  We use this to tailor progression recommendations and volume targets.
                </p>
              </div>

              <div className="space-y-2 pt-1">
                {GOAL_OPTIONS.map((goal) => {
                  const isSelected = selectedGoals.includes(goal);
                  return (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => toggleGoal(goal)}
                      className={`w-full p-3 rounded-2xl border text-left text-xs font-sans font-bold flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#181818] border-[#C0FF00] text-white shadow-[0_0_15px_rgba(192,255,0,0.1)]'
                          : 'bg-[#141414] border-[#222] text-gray-400 hover:border-[#333]'
                      }`}
                    >
                      <span>{goal}</span>
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-lg bg-[#C0FF00] text-black flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-lg border border-[#333] shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: EXPERIENCE LEVEL */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#C0FF00] block mb-1">
                  Lifting History
                </span>
                <h3 className="font-display font-black text-xl sm:text-2xl text-white uppercase tracking-tight">
                  Your Experience Level
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Helps calibrate progressive overload increments (+2.5kg vs +1.25kg).
                </p>
              </div>

              <div className="space-y-2 pt-1">
                {EXPERIENCE_OPTIONS.map((opt) => {
                  const isSelected = fitnessLevel === opt.level;
                  return (
                    <button
                      key={opt.level}
                      type="button"
                      onClick={() => setFitnessLevel(opt.level)}
                      className={`w-full p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#181818] border-[#C0FF00] text-white shadow-[0_0_15px_rgba(192,255,0,0.1)]'
                          : 'bg-[#141414] border-[#222] text-gray-400 hover:border-[#333]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-display font-bold text-sm uppercase text-white">
                          {opt.label}
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-[#C0FF00] stroke-[3]" />}
                      </div>
                      <p className="text-xs text-gray-400 mt-1 font-sans">{opt.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: EQUIPMENT & LOCATION */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#C0FF00] block mb-1">
                  Training Environment
                </span>
                <h3 className="font-display font-black text-xl sm:text-2xl text-white uppercase tracking-tight">
                  Where do you train?
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  We filter exercise picker templates to match your available gear.
                </p>
              </div>

              <div className="space-y-2 pt-1">
                {LOCATION_OPTIONS.map((opt) => {
                  const isSelected = trainingLocation === opt.loc;
                  return (
                    <button
                      key={opt.loc}
                      type="button"
                      onClick={() => setTrainingLocation(opt.loc)}
                      className={`w-full p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#181818] border-[#C0FF00] text-white shadow-[0_0_15px_rgba(192,255,0,0.1)]'
                          : 'bg-[#141414] border-[#222] text-gray-400 hover:border-[#333]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-display font-bold text-sm uppercase text-white">
                          {opt.label}
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-[#C0FF00] stroke-[3]" />}
                      </div>
                      <p className="text-xs text-gray-400 mt-1 font-sans">{opt.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: STARTING BIOMETRICS */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#C0FF00] block mb-1">
                  Starting Biometrics
                </span>
                <h3 className="font-display font-black text-xl sm:text-2xl text-white uppercase tracking-tight">
                  Weight & Height
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Used for bodyweight volume multipliers and daily weigh-in charts.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-[#141414] border border-[#262626] rounded-2xl p-3.5">
                  <label className="block text-[10px] font-mono uppercase text-gray-400 font-bold mb-1">
                    Bodyweight (KG)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="30"
                    max="300"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    className="w-full bg-[#1c1c1c] border border-[#333] focus:border-[#C0FF00] rounded-xl py-2 px-3 text-white font-mono font-bold text-lg outline-none"
                    placeholder="80"
                  />
                </div>

                <div className="bg-[#141414] border border-[#262626] rounded-2xl p-3.5">
                  <label className="block text-[10px] font-mono uppercase text-gray-400 font-bold mb-1">
                    Height (CM)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="100"
                    max="250"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    className="w-full bg-[#1c1c1c] border border-[#333] focus:border-[#C0FF00] rounded-xl py-2 px-3 text-white font-mono font-bold text-lg outline-none"
                    placeholder="180"
                  />
                </div>
              </div>

              {/* Somatotype / Body Type Selector */}
              <div className="bg-[#141414] border border-[#262626] rounded-2xl p-3.5 space-y-2">
                <label className="text-[10px] uppercase font-bold text-gray-400 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 text-[#C0FF00]" /> Body Type (Somatotype)
                  </span>
                  <span className="text-[#C0FF00] font-mono font-bold uppercase text-[9px] bg-[#C0FF00]/10 border border-[#C0FF00]/25 px-2 py-0.5 rounded">
                    {somatotype}
                  </span>
                </label>

                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'ectomorph' as Somatotype, label: 'Ectomorph', sub: 'Lean / Fast' },
                    { id: 'mesomorph' as Somatotype, label: 'Mesomorph', sub: 'Athletic' },
                    { id: 'endomorph' as Somatotype, label: 'Endomorph', sub: 'Solid / Power' },
                  ].map((st) => {
                    const isSelected = somatotype === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setSomatotype(st.id)}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#C0FF00]/15 border-[#C0FF00] text-white'
                            : 'bg-[#181818] border-[#2e2e2e] text-gray-400 hover:border-gray-500'
                        }`}
                      >
                        <div className={`font-display font-bold text-xs uppercase ${isSelected ? 'text-[#C0FF00]' : 'text-white'}`}>
                          {st.label}
                        </div>
                        <div className="text-[9px] font-mono text-gray-500 mt-0.5">
                          {st.sub}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Action Footer */}
        <div className="pt-6 border-t border-[#1f1f1f] flex items-center justify-between gap-3 mt-6">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as any)}
              className="px-4 py-3 rounded-2xl bg-[#181818] border border-[#333] text-gray-300 font-mono text-xs font-bold uppercase tracking-wider hover:text-white transition-colors cursor-pointer"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s + 1) as any)}
              className="py-3 px-6 rounded-2xl bg-[#C0FF00] hover:bg-[#a6dc00] text-black font-display font-black text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all shadow-[0_0_20px_rgba(192,255,0,0.2)] cursor-pointer"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSaving}
              onClick={handleFinish}
              className="py-3 px-6 rounded-2xl bg-[#C0FF00] hover:bg-[#a6dc00] text-black font-display font-black text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all shadow-[0_0_20px_rgba(192,255,0,0.2)] cursor-pointer"
            >
              <span>{isSaving ? 'Saving...' : 'Start Training'}</span>
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
