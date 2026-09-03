import React from 'react';
import { Workout, Exercise, UserProfile } from '../../../models.ts';
import { useAssistedTracker, SetTimingRecord } from '../../../hooks/useAssistedTracker.ts';
import { AssistedRestTimerCard } from './AssistedRestTimerCard.tsx';
import { AssistedSetCard } from './AssistedSetCard.tsx';
import { AssistedCompletedCard } from './AssistedCompletedCard.tsx';

export type { SetTimingRecord };

interface AssistedTimedTrackerProps {
  workout: Workout & { exercises: Exercise[] };
  userProfile: UserProfile | null;
  inputs: Record<string, { weight: string; reps: string; durationSeconds?: string; difficulty?: string }>;
  onUpdateInput: (key: string, field: 'weight' | 'reps' | 'durationSeconds' | 'difficulty', step: number) => void;
  onSetTextInput: (key: string, field: 'weight' | 'reps' | 'durationSeconds' | 'difficulty', value: string) => void;
  onFinishAllSets: (sessionTiming?: { startedAt?: Date; completedAt?: Date; setTimings?: Record<string, SetTimingRecord> }) => void;
  onExitAssistedMode?: () => void;
  restDurationSeconds?: number;
}

export const AssistedTimedTracker: React.FC<AssistedTimedTrackerProps> = ({
  workout,
  inputs,
  onUpdateInput,
  onSetTextInput,
  onFinishAllSets,
  restDurationSeconds = 5,
}) => {
  const {
    totalExercises,
    exerciseIndex,
    setNumber,
    phase,
    restTimeLeft,
    currentExercise,
    currentSetKey,
    currentValues,
    showWgerInfo,
    setShowWgerInfo,
    circleRadius,
    circleCircumference,
    strokeDashoffset,
    handleStartSet,
    handleFinishSet,
    handleSkipSet,
    handleSkipRest,
  } = useAssistedTracker({
    workout,
    inputs,
    onSetTextInput,
    onFinishAllSets,
    restDurationSeconds,
  });

  if (totalExercises === 0) {
    return (
      <div className="bg-[#111] border border-[#222] rounded-[24px] p-8 text-center text-gray-500 font-mono text-xs">
        No exercises found in this routine.
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-lg mx-auto w-full">
      {/* REST COUNTDOWN OVERLAY - Circular Timer Only */}
      {phase === 'resting' && (
        <AssistedRestTimerCard
          restTimeLeft={restTimeLeft}
          circleRadius={circleRadius}
          circleCircumference={circleCircumference}
          strokeDashoffset={strokeDashoffset}
          onSkipRest={handleSkipRest}
        />
      )}

      {/* ACTIVE FOCUSED SET CARD */}
      {(phase === 'ready' || phase === 'in_progress') && currentExercise && currentValues && (
        <AssistedSetCard
          exerciseIndex={exerciseIndex}
          currentExercise={currentExercise}
          setNumber={setNumber}
          phase={phase}
          currentSetKey={currentSetKey}
          currentValues={currentValues}
          showWgerInfo={showWgerInfo}
          setShowWgerInfo={setShowWgerInfo}
          onUpdateInput={onUpdateInput}
          onSetTextInput={onSetTextInput}
          onSkipSet={handleSkipSet}
          onStartSet={handleStartSet}
          onFinishSet={handleFinishSet}
        />
      )}

      {/* ALL COMPLETED CONGRATS BANNER */}
      {phase === 'completed_all' && <AssistedCompletedCard />}
    </div>
  );
};
