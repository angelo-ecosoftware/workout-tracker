import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useWorkoutSession } from '../hooks/useWorkoutSession.ts';
import { saveWorkoutsAndExercises } from '../lib/supabaseData.ts';
import { Dumbbell, Loader2, CheckCircle2 } from 'lucide-react';
import { AssistedTimedTracker } from './AssistedTimedTracker.tsx';
import { RoutineEditorModal } from './RoutineEditorModal.tsx';
import { WelcomeModal } from './WelcomeModal.tsx';
import { RoutineSelectorGrid } from './workout/RoutineSelectorGrid.tsx';
import { WorkoutHeader } from './workout/WorkoutHeader.tsx';
import { SessionBiomarkersForm } from './workout/SessionBiomarkersForm.tsx';
import { ExerciseAccordionItem } from './workout/ExerciseAccordionItem.tsx';
import { EmptyRoutinesCard } from './workout/EmptyRoutinesCard.tsx';

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
    suggestedDay,
    loading,
    loggingWorkout,
    errorMsg,
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
      <EmptyRoutinesCard
        showWelcomeModal={showWelcomeModal}
        onCloseWelcomeModal={() => {
          if (user) {
            localStorage.setItem(`welcome_shown_${user.uid}`, 'true');
          }
          setShowWelcomeModal(false);
        }}
        isRoutineEditorOpen={isRoutineEditorOpen}
        onOpenRoutineEditor={() => setIsRoutineEditorOpen(true)}
        onCloseRoutineEditor={() => setIsRoutineEditorOpen(false)}
        userId={user?.uid || ''}
        workouts={workouts}
        onSaveWorkouts={async (updatedWorkouts) => {
          if (!user) return;
          await saveWorkoutsAndExercises(user.uid, updatedWorkouts);
          setWorkouts(updatedWorkouts);
          setIsRoutineEditorOpen(false);
          await loadWorkflowState();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <WelcomeModal
        isOpen={showWelcomeModal}
        onClose={() => {
          if (user) {
            localStorage.setItem(`welcome_shown_${user.uid}`, 'true');
          }
          setShowWelcomeModal(false);
        }}
      />

      {/* Routine split selector */}
      {(!isAssistedMode || assistedFinished) && (
        <RoutineSelectorGrid
          workouts={workouts}
          activeWorkout={activeWorkout}
          suggestedDay={suggestedDay}
          onSelectWorkout={setActiveWorkout}
        />
      )}

      {/* Routine Editor Modal */}
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

      {/* Active Workout Session Details & Set Logging */}
      {activeWorkout && (
        <div className="space-y-6">
          {/* Header with Title & Stats / Day overview */}
          <WorkoutHeader
            workout={activeWorkout}
            onOpenRoutineEditor={() => setIsRoutineEditorOpen(true)}
          />

          {/* Assisted Mode Flow vs Standard Form View */}
          {isAssistedMode && !assistedFinished ? (
            <AssistedTimedTracker
              workout={activeWorkout}
              userProfile={userProfile}
              restDurationSeconds={restDurationSeconds}
              inputs={inputs}
              onUpdateInput={updateInputValue}
              onSetTextInput={handleTextChange}
              onFinishAllSets={(timings) => {
                setAssistedSessionTimings(timings || null);
                setAssistedFinished(true);
              }}
            />
          ) : (
            /* Standard Full-List Form Workout View */
            <div className="space-y-4">
              {/* Date & Recovery / Biomarker Inputs */}
              <SessionBiomarkersForm
                sessionDate={sessionDate}
                onSessionDateChange={(val) => {
                  setSessionDate(val);
                  saveDraftCheckpoint(inputs, activeWorkout.id, val);
                }}
                sleepHours={sleepHours}
                onSleepHoursChange={(val) => {
                  setSleepHours(val);
                  saveDraftCheckpoint(inputs, activeWorkout.id, undefined, val);
                }}
                energyScore={energyScore}
                onEnergyScoreChange={(val) => {
                  setEnergyScore(val);
                  saveDraftCheckpoint(inputs, activeWorkout.id, undefined, undefined, val);
                }}
                bodyWeightKg={bodyWeightKg}
                onBodyWeightChange={(val) => {
                  setBodyWeightKg(val);
                  saveDraftCheckpoint(inputs, activeWorkout.id, undefined, undefined, undefined, undefined, val);
                }}
                sessionNotes={sessionNotes}
                onSessionNotesChange={(val) => {
                  setSessionNotes(val);
                  saveDraftCheckpoint(inputs, activeWorkout.id, undefined, undefined, undefined, val);
                }}
                selectedPhotos={selectedPhotos}
                photoPreviews={photoPreviews}
                fileInputRef={fileInputRef}
                cameraInputRef={cameraInputRef}
                onPhotoSelect={handlePhotoSelect}
                onRemovePhoto={handleRemovePhoto}
                lastAutoSavedTime={lastAutoSavedTime}
              />

              {/* Exercise Logs Accordion List */}
              {activeWorkout.exercises.map((ex, exIndex) => (
                <ExerciseAccordionItem
                  key={ex.id}
                  exercise={ex}
                  exerciseIndex={exIndex}
                  isExpanded={expandedExerciseId === ex.id}
                  onToggleExpand={() => setExpandedExerciseId(expandedExerciseId === ex.id ? null : ex.id)}
                  advice={getProgressionAdvice(ex)}
                  inputs={inputs}
                  onUpdateInputValue={updateInputValue}
                  onTextChange={handleTextChange}
                />
              ))}
            </div>
          )}

          {errorMsg && (
            <div className="p-4 bg-red-950/40 border border-red-900/40 text-red-300 text-xs rounded-xl font-mono">
              <span className="font-bold uppercase tracking-widest text-red-400">ERROR:</span> {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-4 bg-emerald-950/40 border border-emerald-900/60 text-[#C0FF00] text-xs rounded-xl font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#C0FF00]" />
              <span className="uppercase tracking-wide font-black">{successMsg}</span>
            </div>
          )}

          {/* Direct log submit button */}
          {(!isAssistedMode || assistedFinished) && (
            <button
              onClick={handleLogWorkout}
              disabled={loggingWorkout || isUploadingPhotos}
              className="w-full flex items-center justify-center gap-2.5 py-4 bg-white hover:bg-gray-100 disabled:bg-[#1a1a1a] disabled:text-gray-600 disabled:border-[#222] text-black rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-200 shadow-[0_0_25px_rgba(255,255,255,0.06)] cursor-pointer"
            >
              {loggingWorkout || isUploadingPhotos ? (
                <Loader2 className="w-4 h-4 animate-spin text-black" />
              ) : (
                <Dumbbell className="w-4.5 h-4.5 fill-black" />
              )}
              {isUploadingPhotos ? 'UPLOADING PHOTOS...' : 'SUBMIT WORKOUT'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
