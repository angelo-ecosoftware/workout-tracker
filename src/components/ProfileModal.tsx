import React, { useState, useEffect } from 'react';
import { User, X, Calendar, Ruler, Weight, Target, Dumbbell, MapPin, Sparkles, Check, FileText } from 'lucide-react';
import { AuthUser } from '../context/AuthContext.tsx';
import { UserMetrics, Workout } from '../models.ts';
import { saveUserMetrics } from '../lib/supabaseData.ts';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser;
  metrics?: UserMetrics;
  routines?: Workout[];
  onMetricsUpdated?: (newMetrics: UserMetrics) => void;
}

const STANDARD_GOALS = [
  'Build Muscle (Hypertrophy)',
  'Increase Strength (Powerlifting)',
  'Fat Loss & Cutting',
  'Endurance & Conditioning',
  'Athletic Performance',
  'Health & Longevity',
  'Rehabilitation & Mobility',
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  metrics: initialMetrics,
  routines = [],
  onMetricsUpdated,
}) => {
  const [dob, setDob] = useState(initialMetrics?.dateOfBirth || '');
  const [height, setHeight] = useState<string>(initialMetrics?.height ? initialMetrics.height.toString() : '');
  const [weight, setWeight] = useState<string>(initialMetrics?.weight ? initialMetrics.weight.toString() : '');
  const [gender, setGender] = useState<UserMetrics['gender']>(initialMetrics?.gender || 'prefer_not_to_say');
  const [fitnessLevel, setFitnessLevel] = useState<UserMetrics['fitnessLevel']>(initialMetrics?.fitnessLevel || 'intermediate');
  const [selectedGoals, setSelectedGoals] = useState<string[]>(initialMetrics?.goals || ['Build Muscle (Hypertrophy)']);
  const [location, setLocation] = useState<UserMetrics['trainingLocation']>(initialMetrics?.trainingLocation || 'gym');
  const [bodyNotes, setBodyNotes] = useState(initialMetrics?.bodyMeasurementsNotes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Re-hydrate state when opened
      const storedMetricsRaw = localStorage.getItem(`user_metrics_${user.id}`);
      const effectiveMetrics = initialMetrics || (storedMetricsRaw ? JSON.parse(storedMetricsRaw) : null);
      if (effectiveMetrics) {
        setDob(effectiveMetrics.dateOfBirth || '');
        setHeight(effectiveMetrics.height ? effectiveMetrics.height.toString() : '');
        setWeight(effectiveMetrics.weight ? effectiveMetrics.weight.toString() : '');
        setGender(effectiveMetrics.gender || 'prefer_not_to_say');
        setFitnessLevel(effectiveMetrics.fitnessLevel || 'intermediate');
        setSelectedGoals(effectiveMetrics.goals || ['Build Muscle (Hypertrophy)']);
        setLocation(effectiveMetrics.trainingLocation || 'gym');
        setBodyNotes(effectiveMetrics.bodyMeasurementsNotes || '');
      }
      setSavedSuccess(false);
    }
  }, [isOpen, initialMetrics, user.id]);

  if (!isOpen) return null;

  // Calculate dynamic age from Date of Birth
  const calculateAge = (birthDateStr: string): number | null => {
    if (!birthDateStr) return null;
    const birthDate = new Date(birthDateStr);
    if (isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? age : null;
  };

  const calculatedAge = calculateAge(dob);

  const toggleGoal = (goal: string) => {
    if (selectedGoals.includes(goal)) {
      setSelectedGoals(selectedGoals.filter((g) => g !== goal));
    } else {
      setSelectedGoals([...selectedGoals, goal]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const updatedMetrics: UserMetrics = {
      dateOfBirth: dob || undefined,
      height: height ? parseFloat(height) : undefined,
      weight: weight ? parseFloat(weight) : undefined,
      gender,
      fitnessLevel,
      goals: selectedGoals,
      trainingLocation: location,
      bodyMeasurementsNotes: bodyNotes || undefined,
      updatedAt: new Date().toISOString(),
    };

    await saveUserMetrics(user.id, updatedMetrics);
    if (onMetricsUpdated) {
      onMetricsUpdated(updatedMetrics);
    }
    setIsSaving(false);
    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-lg bg-[#111] border border-[#222] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#222] bg-[#161616]">
          <div className="flex items-center gap-3">
            <div className="relative">
              {user.photoURL ? (
                <img 
                  referrerPolicy="no-referrer"
                  src={user.photoURL} 
                  alt={user.displayName || 'Profile'} 
                  className="w-12 h-12 rounded-2xl object-cover border border-[#333] shadow-md"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-[#C0FF00] flex items-center justify-center text-black font-black text-lg shadow-[0_0_20px_rgba(192,255,0,0.2)]">
                  <User className="w-6 h-6 stroke-[2.2]" />
                </div>
              )}
            </div>
            <div>
              <h2 className="text-lg font-black italic uppercase tracking-wider text-white">
                Athlete <span className="text-[#C0FF00]">Profile</span>
              </h2>
              <p className="text-[11px] font-mono text-gray-400">
                {user.displayName || user.email || 'Configure your metrics'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-[#222] border border-[#333] text-gray-400 hover:text-white hover:border-[#555] transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          
          {/* Section: Core Biometrics */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#C0FF00] flex items-center gap-1.5">
              <Ruler className="w-3.5 h-3.5" /> Biometrics & Body
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Date of Birth & Age */}
              <div className="bg-[#181818] border border-[#2a2a2a] rounded-xl p-3 focus-within:border-[#C0FF00]/60 transition-colors">
                <label className="text-[10px] uppercase font-bold text-gray-400 flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-[#C0FF00]" /> Date of Birth</span>
                  {calculatedAge !== null && (
                    <span className="text-[#C0FF00] font-mono font-black">{calculatedAge} yrs</span>
                  )}
                </label>
                <input 
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full bg-[#111] border border-[#333] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#C0FF00]"
                />
              </div>

              {/* Gender */}
              <div className="bg-[#181818] border border-[#2a2a2a] rounded-xl p-3 focus-within:border-[#C0FF00]/60 transition-colors">
                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                  Gender
                </label>
                <select 
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full bg-[#111] border border-[#333] rounded-lg px-2.5 py-1.5 text-xs text-white font-sans focus:outline-none focus:border-[#C0FF00]"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>

              {/* Height */}
              <div className="bg-[#181818] border border-[#2a2a2a] rounded-xl p-3 focus-within:border-[#C0FF00]/60 transition-colors">
                <label className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1 mb-1">
                  <Ruler className="w-3 h-3 text-[#C0FF00]" /> Height (cm)
                </label>
                <input 
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  min="50"
                  max="280"
                  placeholder="e.g. 182"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full bg-[#111] border border-[#333] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#C0FF00]"
                />
              </div>

              {/* Weight */}
              <div className="bg-[#181818] border border-[#2a2a2a] rounded-xl p-3 focus-within:border-[#C0FF00]/60 transition-colors">
                <label className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1 mb-1">
                  <Weight className="w-3 h-3 text-[#C0FF00]" /> Current Weight (kg)
                </label>
                <input 
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="20"
                  max="400"
                  placeholder="e.g. 78.5"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full bg-[#111] border border-[#333] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#C0FF00]"
                />
              </div>
            </div>
          </div>

          {/* Section: Training & Experience */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#C0FF00] flex items-center gap-1.5">
              <Dumbbell className="w-3.5 h-3.5" /> Experience & Environment
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Fitness Level */}
              <div className="bg-[#181818] border border-[#2a2a2a] rounded-xl p-3">
                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                  Fitness Level
                </label>
                <div className="grid grid-cols-3 gap-1 mt-1">
                  {(['beginner', 'intermediate', 'advanced'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setFitnessLevel(lvl)}
                      className={`py-1 px-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        fitnessLevel === lvl
                          ? 'bg-[#C0FF00] text-black shadow-[0_0_10px_rgba(192,255,0,0.3)]'
                          : 'bg-[#111] text-gray-400 border border-[#333] hover:border-gray-500'
                      }`}
                    >
                      {lvl.slice(0, 5)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Training Location */}
              <div className="bg-[#181818] border border-[#2a2a2a] rounded-xl p-3">
                <label className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1 mb-1">
                  <MapPin className="w-3 h-3 text-[#C0FF00]" /> Training Location
                </label>
                <div className="grid grid-cols-3 gap-1 mt-1">
                  {(['gym', 'home', 'hybrid'] as const).map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setLocation(loc)}
                      className={`py-1 px-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        location === loc
                          ? 'bg-[#C0FF00] text-black shadow-[0_0_10px_rgba(192,255,0,0.3)]'
                          : 'bg-[#111] text-gray-400 border border-[#333] hover:border-gray-500'
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Workout Frequency (Calculated from routines) */}
            <div className="bg-[#181818] border border-[#2a2a2a] rounded-xl p-3 flex items-center justify-between">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#C0FF00]" /> Workout Frequency
                </label>
                <p className="text-[11px] text-gray-300 font-sans mt-0.5">
                  Calculated automatically from your active split
                </p>
              </div>
              <div className="px-3 py-1 rounded-lg bg-[#111] border border-[#333] text-[#C0FF00] font-mono text-xs font-black">
                {routines.length > 0 ? `${routines.length} days / split` : 'Dynamic'}
              </div>
            </div>
          </div>

          {/* Section: Fitness Goals */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#C0FF00] flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5" /> Fitness Goals
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {STANDARD_GOALS.map((goal) => {
                const isSelected = selectedGoals.includes(goal);
                return (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => toggleGoal(goal)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#C0FF00]/10 border-[#C0FF00] text-white'
                        : 'bg-[#181818] border-[#2a2a2a] text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <span>{goal}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#C0FF00] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Optional Body Measurements */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-gray-400" /> Body Measurements & Notes <span className="text-[10px] text-gray-500 font-normal lowercase">(optional)</span>
            </h3>
            <textarea
              value={bodyNotes}
              onChange={(e) => setBodyNotes(e.target.value)}
              placeholder="e.g. Arms: 38cm, Chest: 104cm, Waist: 82cm, Thighs: 58cm, or any personal notes..."
              rows={3}
              className="w-full bg-[#181818] border border-[#2a2a2a] focus:border-[#C0FF00] rounded-xl p-3 text-xs text-white placeholder-gray-600 focus:outline-none transition-colors resize-y font-mono"
            />
          </div>

          {/* Save Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3 px-4 bg-[#C0FF00] hover:bg-[#a6de00] active:scale-[0.99] text-black font-black uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(192,255,0,0.25)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" /> Saved Profile!
                </>
              ) : isSaving ? (
                'Saving...'
              ) : (
                'Save Profile'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
