import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.tsx";
import { Exercise } from "../../models.ts";
import { saveWorkoutsAndExercises } from "../../lib/supabaseData.ts";
import { Loader2, Plus, Settings } from "lucide-react";
import { RoutineEditorModal } from "../modals/RoutineEditorModal.tsx";
import { WelcomeModal } from "../modals/WelcomeModal.tsx";
import { RoutineSplitSelector } from "./tracker/RoutineSplitSelector.tsx";
import { RecoveryAndReadinessCard } from "./tracker/RecoveryAndReadinessCard.tsx";
import { ExerciseCard } from "./tracker/ExerciseCard.tsx";
import { WorkoutSubmitButton } from "./tracker/WorkoutSubmitButton.tsx";
import { useWorkoutSession } from "./tracker/useWorkoutSession.ts";
import { ConfirmModal } from "../ui/ConfirmModal.tsx";
import { WorkoutCompletionModal } from "./tracker/WorkoutCompletionModal.tsx";
import { RestTimerDrawer } from "./tracker/RestTimerDrawer.tsx";
import { ActiveWorkoutHeaderBar } from "./tracker/ActiveWorkoutHeaderBar.tsx";
import { FinishWorkoutModal } from "./tracker/FinishWorkoutModal.tsx";
import { SetPraiseToast } from "./tracker/SetPraiseToast.tsx";

interface WorkoutDayTrackerProps {
  routeWorkoutId?: string | null;
  routeExerciseId?: string | null;
  routeExerciseMode?: 'info' | 'edit' | null;
  routeMode?: 'view' | 'info' | 'edit';
  onResourceRouteChange?: (path: string) => void;
}

export const WorkoutDayTracker: React.FC<WorkoutDayTrackerProps> = ({
  routeWorkoutId = null,
  routeExerciseId = null,
  routeExerciseMode = null,
  routeMode = 'view',
  onResourceRouteChange,
}) => {
  const { user } = useAuth();
  const {
    workouts,
    setWorkouts,
    activeWorkout,
    setActiveWorkout,
    expandedExerciseId,
    setExpandedExerciseId,
    userProfile,
    lastSessionDay,
    suggestedDay,
    loading,
    loggingWorkout,
    errorMsg,
    setErrorMsg,
    successMsg,
    isRoutineEditorOpen,
    setIsRoutineEditorOpen,
    showWelcomeModal,
    setShowWelcomeModal,
    sleepHours,
    setSleepHours,
    energyScore,
    setEnergyScore,
    sessionNotes,
    setSessionNotes,
    bodyWeightKg,
    setBodyWeightKg,
    selectedPhotos,
    photoPreviews,
    isUploadingPhotos,
    fileInputRef,
    cameraInputRef,
    sessionDate,
    setSessionDate,
    inputs,
    isSessionActive,
    elapsedSeconds,
    isSequentialSetMode,
    toggleSequentialSetMode,
    setPraiseToast,
    setSetPraiseToast,
    isFinishModalOpen,
    setIsFinishModalOpen,
    totalTargetSets,
    completedSetsCount,
    completedExercisesCount,
    handleStartWorkout,
    handleCancelSession,
    toggleSetCompleted,
    unrealisticWarningConfig,
    setUnrealisticWarningConfig,
    celebrationSummary,
    setCelebrationSummary,
    autoRestTimer,
    setAutoRestTimer,
    historySessions,
    skippedExerciseIds,
    toggleSkipExercise,
    handlePhotoSelect,
    handleRemovePhoto,
    saveDraftCheckpoint,
    loadWorkflowState,
    updateInputValue,
    handleTextChange,
    getProgressionAdvice,
    handleLogWorkout,
  } = useWorkoutSession(user, routeWorkoutId);
  const [routeError, setRouteError] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !routeWorkoutId) return;
    const routedWorkout = workouts.find((workout) => workout.id === routeWorkoutId);
    if (!routedWorkout) {
      setRouteError('Workout not found or unavailable.');
      return;
    }
    if (routeExerciseId && !routedWorkout.exercises.some((exercise) => exercise.id === routeExerciseId)) {
      setRouteError('Exercise not found or unavailable.');
      return;
    }
    setRouteError(null);
    if (activeWorkout?.id !== routedWorkout.id) setActiveWorkout(routedWorkout);
  }, [
    loading,
    routeWorkoutId,
    routeExerciseId,
    routeMode,
    workouts,
    activeWorkout?.id,
    setActiveWorkout,
  ]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#C0FF00]" />
        <span className="font-mono text-xs text-gray-400 uppercase tracking-widest font-semibold">
          Hydrating session metrics...
        </span>
      </div>
    );
  }

  if (routeError) {
    return (
      <div className="bg-[#111] border border-red-900/50 rounded-[24px] p-8 text-center">
        <p className="text-red-400 font-mono text-sm">{routeError}</p>
        <button
          type="button"
          onClick={() => onResourceRouteChange?.('/workouts')}
          className="mt-4 text-[#C0FF00] font-mono text-xs uppercase"
        >
          Back to workouts
        </button>
      </div>
    );
  }

  if (routeMode === 'edit' && user) {
    return (
      <RoutineEditorModal
        isOpen={true}
        presentation="page"
        onClose={() => {
          setIsRoutineEditorOpen(false);
          onResourceRouteChange?.(activeWorkout ? `/workout/${encodeURIComponent(activeWorkout.id)}` : '/workouts');
        }}
        userId={user.uid}
        workouts={workouts}
        onSaveWorkouts={async (updatedWorkouts) => {
          await saveWorkoutsAndExercises(user.uid, updatedWorkouts);
          setWorkouts(updatedWorkouts);
          await loadWorkflowState();
          onResourceRouteChange?.(activeWorkout ? `/workout/${encodeURIComponent(activeWorkout.id)}` : '/workouts');
        }}
      />
    );
  }

  if (workouts.length === 0) {
    return (
      <div className="bg-[#111] border border-[#222] rounded-[24px] p-8 text-center shadow-xl space-y-4 relative">
        <WelcomeModal
          isOpen={showWelcomeModal}
          onClose={() => {
            if (user) {
              localStorage.setItem(`welcome_shown_${user.uid}`, "true");
            }
            setShowWelcomeModal(false);
          }}
        />

        <div className="w-12 h-12 mx-auto rounded-2xl bg-[#C0FF00]/10 border border-[#C0FF00]/20 flex items-center justify-center text-[#C0FF00]">
          <Plus className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-display font-black italic text-lg text-white uppercase tracking-tight">
            No Routines Configured
          </h3>
          <p className="text-gray-400 text-xs font-sans max-w-sm mx-auto mt-1">
            You currently have no routines or exercises assigned to your account.
          </p>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => setIsRoutineEditorOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#C0FF00] hover:bg-[#a6dc00] text-black font-display font-black italic uppercase text-xs tracking-wider transition-all shadow-[0_0_20px_rgba(192,255,0,0.2)] cursor-pointer"
          >
            <Settings className="w-4 h-4" /> Configure your routine now
          </button>
        </div>

        {user && (
          <RoutineEditorModal
            isOpen={isRoutineEditorOpen}
            onClose={() => {
              setIsRoutineEditorOpen(false);
              onResourceRouteChange?.(activeWorkout ? `/workout/${encodeURIComponent(activeWorkout.id)}` : '/workouts');
            }}
            userId={user.uid}
            workouts={workouts}
            onSaveWorkouts={async (updatedWorkouts) => {
              await saveWorkoutsAndExercises(user.uid, updatedWorkouts);
              setWorkouts(updatedWorkouts);
              setIsRoutineEditorOpen(false);
              await loadWorkflowState();
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div
      className="space-y-6"
      data-resource-type={routeWorkoutId ? 'workout' : undefined}
      data-resource-id={routeWorkoutId || undefined}
    >
      {routeWorkoutId && (
        <div>
          <button
            type="button"
            onClick={() => onResourceRouteChange?.('/workouts')}
            className="text-[#C0FF00] font-mono text-xs uppercase"
          >
            ← All workouts
          </button>
        </div>
      )}
      <WelcomeModal
        isOpen={showWelcomeModal}
        userId={user?.uid}
        onClose={() => {
          if (user) {
            localStorage.setItem(`welcome_shown_${user.uid}`, "true");
          }
          setShowWelcomeModal(false);
        }}
        onCompletedOnboarding={() => {
          if (user) {
            localStorage.setItem(`welcome_shown_${user.uid}`, "true");
          }
          setShowWelcomeModal(false);
          loadWorkflowState();
        }}
      />

      {/* Routine split selector */}
      <RoutineSplitSelector
        workouts={workouts}
        activeWorkout={activeWorkout}
        suggestedDay={suggestedDay}
        lastSessionDay={lastSessionDay}
        sessions={historySessions}
        onSelectWorkout={(w) => {
          setActiveWorkout(w);
          setErrorMsg(null);
          onResourceRouteChange?.(`/workout/${encodeURIComponent(w.id)}`);
        }}
        onOpenRoutineEditor={() => {
          setIsRoutineEditorOpen(true);
          if (activeWorkout) {
            onResourceRouteChange?.(`/workout/${encodeURIComponent(activeWorkout.id)}/edit`);
          }
        }}
      />

      {activeWorkout && (
        <div className="space-y-6">
          {/* Section 1: Recovery Metrics Header block (Placed on Top) */}
          <div className="space-y-4">
            <RecoveryAndReadinessCard
              sessionDate={sessionDate}
              onSessionDateChange={(val) => {
                setSessionDate(val);
                saveDraftCheckpoint(
                  inputs,
                  activeWorkout.id,
                  val,
                  sleepHours,
                  energyScore,
                  sessionNotes,
                  bodyWeightKg
                );
              }}
              sleepHours={sleepHours}
              onSleepHoursChange={(val) => {
                setSleepHours(val);
                saveDraftCheckpoint(
                  inputs,
                  activeWorkout.id,
                  sessionDate,
                  val,
                  energyScore,
                  sessionNotes,
                  bodyWeightKg
                );
              }}
              energyScore={energyScore}
              onEnergyScoreChange={(val) => {
                setEnergyScore(val);
                saveDraftCheckpoint(
                  inputs,
                  activeWorkout.id,
                  sessionDate,
                  sleepHours,
                  val,
                  sessionNotes,
                  bodyWeightKg
                );
              }}
              sessionNotes={sessionNotes}
              onSessionNotesChange={(val) => {
                setSessionNotes(val);
                saveDraftCheckpoint(
                  inputs,
                  activeWorkout.id,
                  sessionDate,
                  sleepHours,
                  energyScore,
                  val,
                  bodyWeightKg
                );
              }}
              bodyWeightKg={bodyWeightKg}
              onBodyWeightKgChange={(val) => {
                setBodyWeightKg(val);
                saveDraftCheckpoint(
                  inputs,
                  activeWorkout.id,
                  sessionDate,
                  sleepHours,
                  energyScore,
                  sessionNotes,
                  val
                );
              }}
              selectedPhotos={selectedPhotos}
              photoPreviews={photoPreviews}
              onRemovePhoto={handleRemovePhoto}
              onPhotoSelect={handlePhotoSelect}
              cameraInputRef={cameraInputRef}
              fileInputRef={fileInputRef}
            />
          </div>

          {/* Section 2: Active Workout Overview & Start Timer Header */}
          <ActiveWorkoutHeaderBar
            workoutName={activeWorkout.name}
            workoutOrder={activeWorkout.order}
            exerciseCount={activeWorkout.exercises.length}
            totalSets={totalTargetSets}
            completedSetsCount={completedSetsCount}
            isSessionActive={isSessionActive}
            elapsedSeconds={elapsedSeconds}
            isSequentialSetMode={isSequentialSetMode}
            onToggleSequentialSetMode={toggleSequentialSetMode}
            onStartWorkout={handleStartWorkout}
            onFinishWorkout={() => setIsFinishModalOpen(true)}
            onCancelSession={handleCancelSession}
          />

          {/* Section 3: Exercises List */}
          <div className="space-y-5">
            {(() => {
              // In sequential set mode, only show 1 exercise: the current active exercise in order
              let exercisesToDisplay = activeWorkout.exercises;
              if (routeExerciseId) {
                exercisesToDisplay = activeWorkout.exercises.filter((ex) => ex.id === routeExerciseId);
              } else if (isSequentialSetMode) {
                // Find first non-skipped exercise that has at least one uncompleted set
                const activeEx = activeWorkout.exercises.find((ex) => {
                  if (skippedExerciseIds.has(ex.id)) return false;
                  for (let i = 1; i <= (ex.targetSets || 3); i++) {
                    if (!inputs[`${ex.id}-${i}`]?.completed) return true;
                  }
                  return false;
                });

                // If all exercises are completed, show the last non-skipped exercise so the user can review
                const fallbackEx = activeWorkout.exercises.filter((ex) => !skippedExerciseIds.has(ex.id)).slice(-1)[0] || activeWorkout.exercises[0];
                exercisesToDisplay = activeEx ? [activeEx] : (fallbackEx ? [fallbackEx] : activeWorkout.exercises);
              }

              return exercisesToDisplay.map((ex: Exercise) => {
                const advice = getProgressionAdvice(ex);
                // In sequential set mode, the single active exercise is always expanded
                const isExpanded = isSequentialSetMode ? true : expandedExerciseId === ex.id;
                const guideRouteWorkoutId = routeWorkoutId || activeWorkout.id;

                return (
                  <ExerciseCard
                    key={ex.id}
                    exercise={ex}
                    userProfile={userProfile}
                    inputs={inputs}
                    isExpanded={isExpanded}
                    isSkipped={skippedExerciseIds.has(ex.id)}
                    isSequentialSetMode={isSequentialSetMode}
                    routeExerciseId={routeExerciseId}
                    routeExerciseMode={routeExerciseMode}
                    advice={advice}
                    onOpenGuide={
                      guideRouteWorkoutId
                        ? (exerciseId) => {
                            onResourceRouteChange?.(
                              `/workout/${encodeURIComponent(guideRouteWorkoutId)}/exercise/${encodeURIComponent(exerciseId)}/info`
                            );
                          }
                        : undefined
                    }
                    onCloseGuide={
                      guideRouteWorkoutId
                        ? () => onResourceRouteChange?.(`/workout/${encodeURIComponent(guideRouteWorkoutId)}`)
                        : undefined
                    }
                    onEditGuide={
                      guideRouteWorkoutId
                        ? (editing) => {
                            onResourceRouteChange?.(
                              editing
                                ? `/workout/${encodeURIComponent(guideRouteWorkoutId)}/exercise/${encodeURIComponent(ex.id)}/edit`
                                : `/workout/${encodeURIComponent(guideRouteWorkoutId)}/exercise/${encodeURIComponent(ex.id)}/info`
                            );
                          }
                        : undefined
                    }
                    onToggleExpand={() => {
                      const nextId = isExpanded ? null : ex.id;
                      setExpandedExerciseId(nextId);
                      if (user && activeWorkout) {
                        try {
                          if (nextId) {
                            localStorage.setItem(`workout_expanded_ex_${user.uid}_${activeWorkout.id}`, nextId);
                          } else {
                            localStorage.removeItem(`workout_expanded_ex_${user.uid}_${activeWorkout.id}`);
                          }
                        } catch {}
                      }
                    }}
                    onToggleSkip={toggleSkipExercise}
                    onUpdateInput={updateInputValue}
                    onTextInput={handleTextChange}
                    onToggleCompleted={toggleSetCompleted}
                  />
                );
              });
            })()}
          </div>

          {/* Direct log submit button */}
          <WorkoutSubmitButton
            errorMsg={errorMsg}
            successMsg={successMsg}
            loggingWorkout={loggingWorkout}
            isUploadingPhotos={isUploadingPhotos}
            isSessionActive={isSessionActive}
            onSubmit={() => setIsFinishModalOpen(true)}
          />

          {/* Fitness Online Style: Finish Workout Summary Modal */}
          <FinishWorkoutModal
            isOpen={isFinishModalOpen}
            onClose={() => setIsFinishModalOpen(false)}
            workoutName={activeWorkout.name}
            workoutOrder={activeWorkout.order}
            elapsedSeconds={elapsedSeconds}
            completedSetsCount={completedSetsCount}
            totalSets={totalTargetSets}
            completedExercisesCount={completedExercisesCount}
            totalExercisesCount={activeWorkout.exercises.length}
            sessionDate={sessionDate}
            onSessionDateChange={setSessionDate}
            sleepHours={sleepHours}
            onSleepHoursChange={setSleepHours}
            energyScore={energyScore}
            onEnergyScoreChange={setEnergyScore}
            bodyWeightKg={bodyWeightKg}
            onBodyWeightKgChange={setBodyWeightKg}
            sessionNotes={sessionNotes}
            onSessionNotesChange={setSessionNotes}
            selectedPhotos={selectedPhotos}
            photoPreviews={photoPreviews}
            onRemovePhoto={handleRemovePhoto}
            onPhotoSelect={handlePhotoSelect}
            cameraInputRef={cameraInputRef}
            fileInputRef={fileInputRef}
            loggingWorkout={loggingWorkout}
            isUploadingPhotos={isUploadingPhotos}
            errorMsg={errorMsg}
            onConfirmSave={handleLogWorkout}
          />

          {/* Outlier / Unrealistic Value Confirmation Guard */}
          <ConfirmModal
            isOpen={unrealisticWarningConfig.isOpen}
            title="Confirm Workout Log"
            description={`Please review the following outlier entries:\n\n• ${unrealisticWarningConfig.warnings.join("\n• ")}\n\nAre you sure you want to proceed and save this workout?`}
            confirmText="Yes, Save Anyway"
            cancelText="Review Inputs"
            confirmVariant="primary"
            onConfirm={unrealisticWarningConfig.onConfirm}
            onCancel={() => setUnrealisticWarningConfig((prev) => ({ ...prev, isOpen: false }))}
          />

          {/* P1.1: Workout Completion "PR Celebration" Modal */}
          <WorkoutCompletionModal
            isOpen={Boolean(celebrationSummary)}
            summary={celebrationSummary}
            onClose={() => setCelebrationSummary(null)}
          />

          {/* P1.3: Rest Timer Auto-Start & Vibration Buzz Drawer */}
          <RestTimerDrawer
            isOpen={autoRestTimer.isOpen}
            initialSeconds={autoRestTimer.durationSeconds}
            exerciseName={autoRestTimer.exerciseName}
            setNumber={autoRestTimer.setNumber}
            onClose={() => setAutoRestTimer((prev) => ({ ...prev, isOpen: false }))}
          />

          {/* Motivational Praise Toast on Set Completion */}
          <SetPraiseToast
            message={setPraiseToast.message}
            exerciseName={setPraiseToast.exerciseName}
            setNumber={setPraiseToast.setNumber}
            onDismiss={() => setSetPraiseToast({ message: null })}
          />
        </div>
      )}

    </div>
  );
};
