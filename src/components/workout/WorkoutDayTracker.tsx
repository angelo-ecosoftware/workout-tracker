import React from "react";
import { useAuth } from "../../context/AuthContext.tsx";
import { Exercise } from "../../models.ts";
import { saveWorkoutsAndExercises } from "../../lib/supabaseData.ts";
import { Loader2, Plus, Settings, Timer } from "lucide-react";
import { AssistedTimedTracker } from "./assisted/AssistedTimedTracker.tsx";
import { RoutineEditorModal } from "../modals/RoutineEditorModal.tsx";
import { WelcomeModal } from "../modals/WelcomeModal.tsx";
import { RoutineSplitSelector } from "./tracker/RoutineSplitSelector.tsx";
import { RecoveryAndReadinessCard } from "./tracker/RecoveryAndReadinessCard.tsx";
import { ExerciseCard } from "./tracker/ExerciseCard.tsx";
import { WorkoutSubmitButton } from "./tracker/WorkoutSubmitButton.tsx";
import { useWorkoutSession } from "./tracker/useWorkoutSession.ts";

export const WorkoutDayTracker: React.FC = () => {
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
    lastAutoSavedTime,
    isAssistedMode,
    setIsAssistedMode,
    restDurationSeconds,
    assistedFinished,
    setAssistedFinished,
    setAssistedSessionTimings,
    inputs,
    handlePhotoSelect,
    handleRemovePhoto,
    saveDraftCheckpoint,
    loadWorkflowState,
    updateInputValue,
    handleTextChange,
    getProgressionAdvice,
    handleLogWorkout,
  } = useWorkoutSession(user);

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
            onClose={() => setIsRoutineEditorOpen(false)}
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
    <div className="space-y-6">
      <WelcomeModal
        isOpen={showWelcomeModal}
        onClose={() => {
          if (user) {
            localStorage.setItem(`welcome_shown_${user.uid}`, "true");
          }
          setShowWelcomeModal(false);
        }}
      />

      {/* Routine split selector - only visible in standard mode or after assisted sets are done */}
      {(!isAssistedMode || assistedFinished) && (
        <RoutineSplitSelector
          workouts={workouts}
          activeWorkout={activeWorkout}
          suggestedDay={suggestedDay}
          lastSessionDay={lastSessionDay}
          onSelectWorkout={(w) => {
            setActiveWorkout(w);
            setErrorMsg(null);
          }}
        />
      )}

      {activeWorkout && (
        <div className="space-y-6">
          {/* Section 2: Recovery Metrics Header block - only in standard mode or after assisted sets finish */}
          {(!isAssistedMode || assistedFinished) && (
            <div className="space-y-4">
              <div className="bg-[#111111] border border-[#222] rounded-[24px] p-5 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#222] pb-4 gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-black italic text-lg text-white uppercase tracking-tight">
                        {activeWorkout.name}
                      </h3>
                      {lastAutoSavedTime && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold bg-[#C0FF00]/10 text-[#C0FF00] border border-[#C0FF00]/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#C0FF00] animate-pulse"></span>
                          Auto-saved ({lastAutoSavedTime})
                        </span>
                      )}
                    </div>
                    <div className="h-[2px] bg-gradient-to-r from-[#C0FF00] to-transparent w-36 mt-1 opacity-50"></div>
                  </div>
                </div>
              </div>

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
          )}

          {/* Section 3: Assisted Timed Mode vs Standard Full Exercise List */}
          {isAssistedMode && !assistedFinished ? (
            <AssistedTimedTracker
              workout={activeWorkout}
              userProfile={userProfile}
              inputs={inputs}
              onUpdateInput={updateInputValue}
              onSetTextInput={handleTextChange}
              onFinishAllSets={(timings) => {
                if (timings) setAssistedSessionTimings(timings);
                setAssistedFinished(true);
              }}
              onExitAssistedMode={() => {
                setIsAssistedMode(false);
                localStorage.setItem("setting_assisted_timed_workout", "false");
                window.dispatchEvent(new Event("workout_settings_updated"));
              }}
              restDurationSeconds={restDurationSeconds}
            />
          ) : (
            <div className="space-y-5">
              {isAssistedMode && assistedFinished && (
                <div className="bg-[#141414] border border-[#C0FF00]/40 rounded-2xl p-4 flex items-center justify-between shadow-lg">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#C0FF00]/10 flex items-center justify-center text-[#C0FF00]">
                      <Timer className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-display font-black text-xs uppercase tracking-wider text-white">
                        Workout Sheet (All Sets Completed)
                      </span>
                      <p className="text-[10px] font-mono text-gray-400">
                        Review weights and timings before logging
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAssistedFinished(false)}
                    className="text-[10px] font-mono font-bold text-[#C0FF00] hover:underline cursor-pointer"
                  >
                    Re-open Assisted Flow
                  </button>
                </div>
              )}

              {activeWorkout.exercises.map((ex: Exercise) => {
                const advice = getProgressionAdvice(ex);
                const isExpanded = expandedExerciseId === ex.id;

                return (
                  <ExerciseCard
                    key={ex.id}
                    exercise={ex}
                    userProfile={userProfile}
                    inputs={inputs}
                    isExpanded={isExpanded}
                    advice={advice}
                    onToggleExpand={() => setExpandedExerciseId(isExpanded ? null : ex.id)}
                    onUpdateInput={updateInputValue}
                    onTextInput={handleTextChange}
                  />
                );
              })}
            </div>
          )}

          {/* Direct log submit button - only visible in standard mode or after assisted sets finish */}
          {(!isAssistedMode || assistedFinished) && (
            <WorkoutSubmitButton
              errorMsg={errorMsg}
              successMsg={successMsg}
              loggingWorkout={loggingWorkout}
              isUploadingPhotos={isUploadingPhotos}
              onSubmit={handleLogWorkout}
            />
          )}
        </div>
      )}
    </div>
  );
};
