import React from 'react';
import { Target, Check, FileText } from 'lucide-react';

export const STANDARD_GOALS = [
  'Build Muscle (Hypertrophy)',
  'Increase Strength (Powerlifting)',
  'Fat Loss & Cutting',
  'Endurance & Conditioning',
  'Athletic Performance',
  'Health & Longevity',
  'Rehabilitation & Mobility',
];

interface ProfileGoalsSectionProps {
  selectedGoals: string[];
  toggleGoal: (goal: string) => void;
  bodyNotes: string;
  setBodyNotes: (val: string) => void;
}

export const ProfileGoalsSection: React.FC<ProfileGoalsSectionProps> = ({
  selectedGoals,
  toggleGoal,
  bodyNotes,
  setBodyNotes,
}) => {
  return (
    <>
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
          <FileText className="w-3.5 h-3.5 text-gray-400" /> Body Measurements & Notes{' '}
          <span className="text-[10px] text-gray-500 font-normal lowercase">(optional)</span>
        </h3>
        <textarea
          value={bodyNotes}
          onChange={(e) => setBodyNotes(e.target.value)}
          placeholder="e.g. Arms: 38cm, Chest: 104cm, Waist: 82cm, Thighs: 58cm, or any personal notes..."
          rows={3}
          className="w-full bg-[#181818] border border-[#2a2a2a] focus:border-[#C0FF00] rounded-xl p-3 text-xs text-white placeholder-gray-600 focus:outline-none transition-colors resize-y font-mono"
        />
      </div>
    </>
  );
};
