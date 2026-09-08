import React, { useState } from 'react';
import { Eye, EyeOff, Zap, Dumbbell, Clock, Info, Ban } from 'lucide-react';
import { Exercise, UserProfile } from '../../../models.ts';
import { WgerExerciseInfo } from '../WgerExerciseInfo.tsx';
import { ExerciseSetRow } from './ExerciseSetRow.tsx';
import { ExerciseGuideDrawer } from '../ExerciseGuideDrawer.tsx';
import { formatSingleExerciseName } from '../../../lib/exerciseSearch.ts';

interface ExerciseCardProps {
  exercise: Exercise;
  userProfile: UserProfile | null;
  inputs: Record<
    string,
    {
      weight?: string;
      reps?: string;
      durationSeconds?: string;
      difficulty?: string;
      completed?: boolean;
      completedAt?: string;
    }
  >;
  isExpanded: boolean;
  isSkipped?: boolean;
  advice: { action: 'increase' | 'keep' | 'deload'; details: string };
  onToggleExpand: () => void;
  onToggleSkip?: (exerciseId: string) => void;
  onUpdateInput: (
    key: string,
    field: 'weight' | 'reps' | 'durationSeconds' | 'difficulty',
    delta: number
  ) => void;
  onTextInput: (
    key: string,
    field: 'weight' | 'reps' | 'durationSeconds' | 'difficulty',
    value: string
  ) => void;
  onToggleCompleted?: (key: string) => void;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  userProfile,
  inputs,
  isExpanded,
  isSkipped = false,
  advice,
  onToggleExpand,
  onToggleSkip,
  onUpdateInput,
  onTextInput,
  onToggleCompleted,
}) => {
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const cachedEx = userProfile?.lastSetSummaryPerExercise?.[exercise.id];
  const displayName = formatSingleExerciseName(exercise.name);

  return (
    <div
      className={`rounded-[24px] shadow-xl transition-all ${
        isSkipped
          ? 'bg-[#0d0d0d] border border-dashed border-[#262626] p-4 opacity-75'
          : isExpanded
          ? 'bg-[#111] border border-[#333] p-5 space-y-4'
          : 'bg-[#111] border border-[#222] hover:border-[#333] p-4'
      }`}
    >
      {/* Exercise metadata details header */}
      <div
        role="button"
        tabIndex={0}
        className={`w-full flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 cursor-pointer text-left ${
          isExpanded && !isSkipped ? 'border-b border-[#1f1f1f] pb-3' : ''
        }`}
        onClick={onToggleExpand}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggleExpand();
          }
        }}
        aria-expanded={isExpanded}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
              <h4
                className={`font-display font-black text-base tracking-tight uppercase transition-colors ${
                  isSkipped
                    ? 'text-gray-500 line-through'
                    : isExpanded
                    ? 'text-white'
                    : 'text-gray-300 hover:text-[#C0FF00]'
                }`}
              >
                {displayName}
              </h4>
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsGuideOpen(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation();
                    setIsGuideOpen(true);
                  }
                }}
                title={`View guide & muscle anatomy for ${displayName}`}
                aria-label={`View guide & muscle anatomy for ${displayName}`}
                className="p-1 rounded-md text-gray-400 hover:text-[#C0FF00] hover:bg-[#1a1a1a] transition-colors cursor-pointer shrink-0 mt-0.5"
              >
                <Info className="w-3.5 h-3.5" />
              </span>
            </div>

            <div className="shrink-0 self-start ml-2">
              {isExpanded ? (
                <div className="p-2 sm:p-1.5 text-[#C0FF00] bg-[#1a1a1a] rounded-lg border border-[#333] transition-colors pointer-events-none">
                  <EyeOff className="w-5 h-5 sm:w-4 sm:h-4" aria-hidden="true" />
                </div>
              ) : (
                <div className="p-2 sm:p-1.5 text-gray-500 bg-[#1a1a1a] rounded-lg border border-[#333] transition-colors pointer-events-none">
                  <Eye className="w-5 h-5 sm:w-4 sm:h-4" aria-hidden="true" />
                </div>
              )}
            </div>
          </div>

          {/* Subline: Target volume on the left, Skip button cleanly on the right */}
          <div className="flex items-center justify-between gap-2 mt-2 flex-wrap">
            <p className="font-sans text-[11px] text-gray-400 uppercase tracking-wider font-semibold">
              {isSkipped ? (
                <span className="text-amber-400/90 font-mono text-[10px] font-bold">
                  ⊘ Skipped for this session • No sets will be logged
                </span>
              ) : (
                <>
                  Target Volume:{' '}
                  <span className="text-[#C0FF00] font-mono">
                    {exercise.targetSets} sets × {exercise.targetRepMin}-{exercise.targetRepMax}{' '}
                    {exercise.type === 'timed' ? 'seconds' : 'reps'}
                  </span>
                </>
              )}
            </p>

            {/* Slim Minimal Smart "Skip / Didn't Do" Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSkip && onToggleSkip(exercise.id);
              }}
              title={isSkipped ? 'Restore exercise to current session' : "Didn't do this exercise? Skip for this session"}
              aria-label={isSkipped ? `Restore ${displayName}` : `Skip ${displayName}`}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                isSkipped
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/40 hover:bg-amber-500/25'
                  : 'bg-[#181818] hover:bg-neutral-800 text-gray-400 hover:text-white border border-[#2a2a2a]'
              }`}
            >
              <Ban className="w-3 h-3" />
              <span>{isSkipped ? 'Skipped (Undo)' : 'Skip'}</span>
            </button>
          </div>
        </div>

        {/* Dynamic Auto-progression coach recommendation badge */}
        {!isSkipped && advice.action === 'increase' && (
          <div className="flex items-center gap-3">
            <div className="bg-[#C0FF00] text-black rounded-xl px-3 py-1 flex items-center gap-1.5 shrink-0 shadow-[0_0_15px_rgba(192,255,0,0.15)]">
              <Zap className="w-3.5 h-3.5 fill-black text-black" />
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-tight font-sans">
                {advice.details}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Expanded Section for Skipped Exercise */}
      {isExpanded && isSkipped && (
        <div className="bg-[#141414] border border-[#222] rounded-xl p-3.5 text-center text-xs font-mono text-gray-400 flex items-center justify-between gap-3">
          <span>Exercise marked as skipped for this workout session.</span>
          <button
            type="button"
            onClick={() => onToggleSkip && onToggleSkip(exercise.id)}
            className="text-[#C0FF00] hover:underline font-bold text-xs cursor-pointer shrink-0"
          >
            Restore Exercise
          </button>
        </div>
      )}

      {isExpanded && !isSkipped && (
        <>
          <WgerExerciseInfo exerciseName={displayName} />

          {/* Coach Advice (Keep weight) */}
          {advice.action === 'keep' && cachedEx && (
            <div className="bg-[#1a1a1a] border border-[#333] text-gray-300 rounded-xl px-3 py-1.5 flex items-center gap-1.5 self-start">
              <span className="text-[10px] sm:text-xs font-mono uppercase tracking-wide text-gray-400">
                {advice.details}
              </span>
            </div>
          )}

          {/* Previous Historical Reference sub-line */}
          {cachedEx && (
            <div className="bg-[#1a1a1a] rounded-xl border border-[#222] p-3 flex flex-col gap-2 text-[10px] font-mono text-gray-400">
              <div className="flex items-center gap-1.5">
                <span className="font-sans font-extrabold text-[8px] uppercase tracking-widest text-[#C0FF00] border border-[#C0FF00]/40 px-1.5 py-0.5 rounded">
                  LAST LOG
                </span>
              </div>
              <div className="flex items-center gap-4">
                {exercise.type === 'timed' ? (
                  <div className="bg-[#222] border border-[#333] px-2 py-1.5 rounded-lg">
                    <span className="text-white font-bold">{cachedEx.lastDurationSeconds}s</span>
                  </div>
                ) : (
                  <div className="bg-[#222] border border-[#333] px-2 py-1.5 rounded-lg">
                    <span className="text-white font-bold">{cachedEx.lastWeight}kg</span>
                    <span className="mx-1 text-gray-600">x</span>
                    <span className="text-[#C0FF00] font-bold">{cachedEx.lastReps}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Active Entry fields grid */}
          <div className="space-y-1.5">
            {/* Minimal Clean Header */}
            <div className="grid grid-cols-12 gap-1 sm:gap-2 text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider px-1.5 sm:px-2.5 pb-1 border-b border-[#222]">
              <div className="col-span-2 sm:col-span-2 flex items-center">
                <span>SET</span>
              </div>
              <div className="col-span-5 sm:col-span-5 text-center">
                {exercise.type === 'timed' ? 'DURATION (S)' : 'WEIGHT (KG)'}
              </div>
              <div className="col-span-5 sm:col-span-5 text-center">
                {exercise.type === 'timed' ? 'DIFF (1-10)' : 'REPS'}
              </div>
            </div>

            {/* Entry sets lines with active/next set detection */}
            {(() => {
              // Find the first uncompleted set to mark as 'isCurrent'
              let firstUncompletedIndex = -1;
              for (let i = 1; i <= exercise.targetSets; i++) {
                const k = `${exercise.id}-${i}`;
                if (!inputs[k]?.completed) {
                  firstUncompletedIndex = i;
                  break;
                }
              }

              return Array.from({ length: exercise.targetSets }).map((_, index) => {
                const setNum = index + 1;
                const inputKey = `${exercise.id}-${setNum}`;
                const values = inputs[inputKey] || {
                  weight: '20',
                  reps: '10',
                  durationSeconds: '30',
                  difficulty: '7',
                };
                const isCurrent = setNum === firstUncompletedIndex;

                return (
                  <ExerciseSetRow
                    key={setNum}
                    exercise={exercise}
                    setNum={setNum}
                    inputKey={inputKey}
                    values={values}
                    isCurrent={isCurrent}
                    onUpdateInput={onUpdateInput}
                    onTextInput={onTextInput}
                    onToggleCompleted={onToggleCompleted}
                  />
                );
              });
            })()}
          </div>
        </>
      )}

      {/* P2.1 & P2.2 & P2.4: Minimalist Exercise Guide Drawer */}
      <ExerciseGuideDrawer
        isOpen={isGuideOpen}
        exerciseName={displayName}
        exerciseId={exercise.id}
        userId={userProfile?.userId}
        initialCustomCues={exercise.customCues}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
};
