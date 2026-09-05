import React from 'react';
import { WorkoutSet } from '../../../models.ts';

export interface PopulatedSet extends WorkoutSet {
  exerciseName: string;
  type: 'strength' | 'timed';
}

interface SessionSetTableProps {
  sets: PopulatedSet[];
  sessionId?: string;
  athleteId?: string;
  coachId?: string;
  coachName?: string;
  isCoach?: boolean;
}

export const SessionSetTable: React.FC<SessionSetTableProps> = ({
  sets,
}) => {
  return (
    <>
      {/* Desktop Table view for Detail */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left font-sans text-sm border-collapse">
          <thead>
            <tr className="border-b border-[#333] text-gray-400">
              <th className="pb-3 font-semibold uppercase tracking-wider text-xs">Exercise</th>
              <th className="pb-3 text-center font-semibold uppercase tracking-wider text-xs">Set</th>
              <th className="pb-3 text-center font-semibold uppercase tracking-wider text-xs">Volume</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#222]">
            {sets.map((set, i) => {
              const prevSet = i > 0 ? sets[i - 1] : null;
              const isNewExerciseGroup = prevSet && prevSet.exerciseId !== set.exerciseId;

              return (
                <tr 
                  key={set.id || i}
                  className={`hover:bg-[#1a1a1a] transition-colors ${isNewExerciseGroup ? 'border-t-2 border-[#333]' : ''}`}
                >
                  <td className="py-3 pr-4 text-white font-medium">
                    {isNewExerciseGroup || i === 0 ? (
                      <span className="text-white font-bold">{set.exerciseName}</span>
                    ) : (
                      <span className="text-gray-500 text-xs pl-2">↳ {set.exerciseName}</span>
                    )}
                  </td>
                  <td className="py-3 text-center text-gray-400 font-mono">{set.setNumber}</td>
                  <td className="py-3 text-center text-white font-mono font-bold">
                    {set.type === 'strength' 
                      ? `${set.weight} kg × ${set.reps}`
                      : `${set.durationSeconds}s`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Groups view for Detail */}
      <div className="sm:hidden space-y-3">
        {sets.reduce((acc, set) => {
          const exIdx = acc.findIndex(g => g.exerciseName === set.exerciseName);
          if (exIdx > -1) {
            acc[exIdx].sets.push(set);
          } else {
            acc.push({ exerciseName: set.exerciseName, sets: [set] });
          }
          return acc;
        }, [] as { exerciseName: string; sets: PopulatedSet[] }[]).map((group, idx) => (
          <div key={idx} className="bg-[#1a1a1a] rounded-xl p-3 border border-[#2a2a2a]">
            <h4 className="text-white text-[13px] font-bold mb-2 uppercase tracking-wide">{group.exerciseName}</h4>
            <div className="space-y-2">
              {group.sets.map((set, sIdx) => (
                <div key={sIdx} className="border-b border-[#222] pb-2 last:border-b-0 space-y-1">
                  <div className="flex justify-between items-center text-[12px] font-mono">
                    <span className="text-gray-500 font-sans font-medium text-[11px] uppercase w-12">Set {set.setNumber}</span>
                    <span className="text-white font-bold flex-1 text-right">
                      {set.type === 'strength' ? `${set.weight}kg × ${set.reps}` : `${set.durationSeconds}s`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};
