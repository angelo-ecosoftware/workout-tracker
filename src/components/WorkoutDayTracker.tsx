import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useWorkoutSession } from '../hooks/useWorkoutSession.ts';
import { saveWorkoutsAndExercises } from '../lib/supabaseData.ts';
import {
  Dumbbell,
  Calendar,
  Zap,
  ChevronRight,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
  Timer,
  FileText,
  Settings,
  Plus,
  Camera,
  Image,
  Trash2,
  FolderOpen,
  Scale,
} from 'lucide-react';
import { AssistedTimedTracker } from './AssistedTimedTracker.tsx';
import { WgerExerciseInfo } from './WgerExerciseInfo.tsx';
import { RoutineEditorModal } from './RoutineEditorModal.tsx';
import { WelcomeModal } from './WelcomeModal.tsx';

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
      <div className="bg-[#111] border border-[#222] rounded-[24px] p-8 text-center shadow-xl space-y-4 relative">
        <WelcomeModal
          isOpen={showWelcomeModal}
          onClose={() => {
            if (user) {
              localStorage.setItem(`welcome_shown_${user.uid}`, 'true');
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

        {/* Routine Editor Modal when 0 routines */}
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
            localStorage.setItem(`welcome_shown_${user.uid}`, 'true');
          }
          setShowWelcomeModal(false);
        }}
      />
      
      {/* Routine split selector - only visible in standard mode or after assisted sets are done */}
      {(!isAssistedMode || assistedFinished) && (
        <div className="bg-[#111] border border-[#222] rounded-[24px] p-5 shadow-xl relative overflow-hidden">
          <label className="block text-[10px] font-bold text-[#C0FF00] uppercase tracking-widest mb-3 font-mono">
            Select Routine
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {workouts.map((w) => {
              const isSuggested = suggestedDay === w.order;
              const isActive = activeWorkout?.id === w.id;

              return (
                <button
                  key={w.id}
                  onClick={() => {
                    setActiveWorkout(w);
                  }}
                  className={`py-3 px-3 rounded-xl text-left transition-all border relative cursor-pointer ${
                    isActive 
                      ? 'border-none bg-[#C0FF00] text-black font-black shadow-[0_0_25px_rgba(192,255,0,0.25)]' 
                      : 'border-[#222] bg-[#1a1a1a] hover:bg-[#252525] text-gray-300 hover:text-white'
                  }`}
                >
                  <div className="font-display font-black text-[11px] tracking-tight uppercase">
                    {w.name.split(' (')[0]}
                  </div>
                  <div className={`text-[9px] truncate font-sans font-semibold mt-0.5 uppercase tracking-wide ${isActive ? 'text-black/70' : 'text-gray-500'}`}>
                    {w.name.includes('(') ? `(${w.name.split('(')[1]}` : ''}
                  </div>

                  {isSuggested && !isActive && (
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C0FF00] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C0FF00]"></span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#C0FF00]/10 text-[#C0FF00] border border-[#C0FF00]/20">
                  DAY {activeWorkout.order}
                </span>
                <h2 className="text-xl sm:text-2xl font-black font-display text-white tracking-tight uppercase">
                  {activeWorkout.name}
                </h2>
              </div>
              <p className="text-gray-400 text-xs mt-1">
                {activeWorkout.exercises.length} Exercises Scheduled
              </p>
            </div>

            {/* Quick Action: Routine Customizer */}
            <button
              type="button"
              onClick={() => setIsRoutineEditorOpen(true)}
              className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#333] hover:border-[#C0FF00]/50 bg-[#161616] text-gray-300 hover:text-white text-xs font-mono transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-[#C0FF00]" />
              <span>Customize Routine</span>
            </button>
          </div>

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
              <div className="bg-[#161616] border border-[#262626] rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Session Date */}
                  <div>
                    <label className="text-[11px] font-mono text-gray-400 flex items-center gap-1.5 mb-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#C0FF00]" />
                      Session Date
                    </label>
                    <input
                      type="date"
                      value={sessionDate}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSessionDate(val);
                        saveDraftCheckpoint(inputs, activeWorkout.id, val);
                      }}
                      className="w-full px-3 py-2 bg-[#111] border border-[#333] rounded-xl text-white text-xs font-mono focus:outline-none focus:border-[#C0FF00]"
                    />
                  </div>

                  {/* Sleep Score */}
                  <div>
                    <label className="text-[11px] font-mono text-gray-400 flex items-center gap-1.5 mb-1.5">
                      <Timer className="w-3.5 h-3.5 text-blue-400" />
                      Sleep Hours ({sleepHours}h)
                    </label>
                    <input
                      type="range"
                      min="3"
                      max="12"
                      step="0.5"
                      value={sleepHours}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setSleepHours(val);
                        saveDraftCheckpoint(inputs, activeWorkout.id, undefined, val);
                      }}
                      className="w-full accent-[#C0FF00] cursor-pointer"
                    />
                  </div>

                  {/* Energy Score */}
                  <div>
                    <label className="text-[11px] font-mono text-gray-400 flex items-center gap-1.5 mb-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      Energy Level ({energyScore}/10)
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="1"
                      value={energyScore}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setEnergyScore(val);
                        saveDraftCheckpoint(inputs, activeWorkout.id, undefined, undefined, val);
                      }}
                      className="w-full accent-[#C0FF00] cursor-pointer"
                    />
                  </div>
                </div>

                {/* Bodyweight Check-in & Session Notes */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-[#222]">
                  <div>
                    <label className="text-[11px] font-mono text-gray-400 flex items-center gap-1.5 mb-1.5">
                      <Scale className="w-3.5 h-3.5 text-[#C0FF00]" />
                      Bodyweight Today (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 84.5"
                      value={bodyWeightKg}
                      onChange={(e) => {
                        const val = e.target.value;
                        setBodyWeightKg(val);
                        saveDraftCheckpoint(inputs, activeWorkout.id, undefined, undefined, undefined, undefined, val);
                      }}
                      className="w-full px-3 py-2 bg-[#111] border border-[#333] rounded-xl text-white text-xs font-mono focus:outline-none focus:border-[#C0FF00]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-mono text-gray-400 flex items-center gap-1.5 mb-1.5">
                      <FileText className="w-3.5 h-3.5 text-purple-400" />
                      Session Notes & Performance Feelings
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Felt great on bench, left shoulder slightly tight..."
                      value={sessionNotes}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSessionNotes(val);
                        saveDraftCheckpoint(inputs, activeWorkout.id, undefined, undefined, undefined, val);
                      }}
                      className="w-full px-3 py-2 bg-[#111] border border-[#333] rounded-xl text-white text-xs font-sans focus:outline-none focus:border-[#C0FF00]"
                    />
                  </div>
                </div>

                {/* Progress Photos Upload & Preview */}
                <div className="pt-2 border-t border-[#222]">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-mono text-gray-400 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-[#C0FF00]" />
                      Physique Check-in Photos ({selectedPhotos.length}/5)
                    </label>
                    {lastAutoSavedTime && (
                      <span className="text-[10px] font-mono text-gray-500">
                        Draft saved at {lastAutoSavedTime}
                      </span>
                    )}
                  </div>

                  {/* Photo Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {/* Native Camera Capture Button */}
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      disabled={selectedPhotos.length >= 5}
                      className="flex items-center gap-1.5 px-3 py-2 bg-[#1f1f1f] hover:bg-[#2a2a2a] disabled:opacity-40 disabled:cursor-not-allowed border border-[#333] rounded-xl text-xs font-mono text-white transition-colors cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5 text-[#C0FF00]" />
                      <span>Take Photo</span>
                    </button>
                    {/* Hidden Camera Input */}
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />

                    {/* Choose from Library Button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={selectedPhotos.length >= 5}
                      className="flex items-center gap-1.5 px-3 py-2 bg-[#1f1f1f] hover:bg-[#2a2a2a] disabled:opacity-40 disabled:cursor-not-allowed border border-[#333] rounded-xl text-xs font-mono text-white transition-colors cursor-pointer"
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-blue-400" />
                      <span>Browse Files</span>
                    </button>
                    {/* Hidden File Input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                  </div>

                  {/* Previews Grid */}
                  {photoPreviews.length > 0 && (
                    <div className="flex flex-wrap gap-2.5">
                      {photoPreviews.map((src, index) => (
                        <div key={index} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-[#333]">
                          <img
                            src={src}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(index)}
                            className="absolute top-1 right-1 p-1 bg-black/80 hover:bg-red-600 rounded-full text-white transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Exercise Logs Accordion List */}
              {activeWorkout.exercises.map((ex, exIndex) => {
                const isExpanded = expandedExerciseId === ex.id;
                const advice = getProgressionAdvice(ex);

                return (
                  <div
                    key={ex.id}
                    className="bg-[#141414] border border-[#242424] rounded-2xl overflow-hidden transition-all duration-200"
                  >
                    {/* Accordion Exercise Header */}
                    <div
                      onClick={() => setExpandedExerciseId(isExpanded ? null : ex.id)}
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#1a1a1a] select-none"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-[#222] border border-[#333] text-[10px] font-mono font-black text-gray-300 flex items-center justify-center">
                          {exIndex + 1}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-white uppercase tracking-tight">
                            {ex.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-mono text-gray-400">
                              {ex.targetSets} Sets × {ex.type === 'timed' ? `${ex.targetRepMin}-${ex.targetRepMax}s` : `${ex.targetRepMin}-${ex.targetRepMax} Reps`}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <EyeOff className="w-4 h-4 text-gray-500" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-500" />
                        )}
                      </div>
                    </div>

                    {/* Expanded Exercise Content */}
                    {isExpanded && (
                      <div className="p-4 pt-0 border-t border-[#1f1f1f] space-y-4">
                        {/* Wger Muscle & Demonstration Details */}
                        <WgerExerciseInfo exerciseName={ex.name} />

                        {/* Smart Auto-Progression Banner */}
                        <div className={`p-3 rounded-xl border text-xs font-mono flex items-center gap-2 ${
                          advice.action === 'increase'
                            ? 'bg-[#C0FF00]/10 border-[#C0FF00]/30 text-[#C0FF00]'
                            : 'bg-[#1c1c1c] border-[#2c2c2c] text-gray-300'
                        }`}>
                          <Zap className="w-4 h-4 shrink-0 text-[#C0FF00]" />
                          <span>{advice.details}</span>
                        </div>

                        {/* Sets Input Grid */}
                        <div className="space-y-2.5">
                          {Array.from({ length: ex.targetSets }).map((_, setIdx) => {
                            const setNumber = setIdx + 1;
                            const inputKey = `${ex.id}-${setNumber}`;
                            const values = inputs[inputKey] || {
                              weight: '20',
                              reps: '10',
                              durationSeconds: '30',
                              difficulty: '7',
                            };

                            return (
                              <div
                                key={setNumber}
                                className="grid grid-cols-12 items-center gap-2 bg-[#181818] p-2.5 rounded-xl border border-[#262626]"
                              >
                                <span className="col-span-3 text-[11px] font-mono font-bold text-gray-400 uppercase">
                                  Set {setNumber}
                                </span>

                                {ex.type === 'timed' ? (
                                  <>
                                    {/* Duration Seconds Input */}
                                    <div className="col-span-5 flex items-center justify-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => updateInputValue(inputKey, 'durationSeconds', -5)}
                                        className="p-1 px-2 border border-[#333] bg-[#222] rounded-lg hover:border-[#C0FF00]/40 text-gray-300 text-xs font-mono cursor-pointer select-none"
                                      >
                                        -5s
                                      </button>
                                      <input
                                        type="text"
                                        value={values.durationSeconds || ''}
                                        onChange={(e) => handleTextChange(inputKey, 'durationSeconds', e.target.value)}
                                        className="w-16 px-1 py-1 bg-[#111] border border-[#333] rounded-lg text-center text-xs font-mono font-black text-white focus:outline-none focus:ring-1 focus:ring-[#C0FF00]"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => updateInputValue(inputKey, 'durationSeconds', 5)}
                                        className="p-1 px-2 border border-[#333] bg-[#222] rounded-lg hover:border-[#C0FF00]/40 text-gray-300 text-xs font-mono cursor-pointer select-none"
                                      >
                                        +5s
                                      </button>
                                    </div>

                                    {/* Difficulty (RPE/Rating) */}
                                    <div className="col-span-4 flex items-center justify-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => updateInputValue(inputKey, 'difficulty', -1)}
                                        className="p-1 px-2 border border-[#333] bg-[#222] rounded-lg hover:border-[#C0FF00]/40 text-gray-300 text-xs cursor-pointer select-none"
                                      >
                                        -1
                                      </button>
                                      <input
                                        type="text"
                                        value={values.difficulty || ''}
                                        onChange={(e) => handleTextChange(inputKey, 'difficulty', e.target.value)}
                                        className="w-12 px-1 py-1 bg-[#111] border border-[#333] rounded-lg text-center text-xs font-mono font-black text-[#C0FF00] focus:outline-none focus:ring-1 focus:ring-[#C0FF00]"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => updateInputValue(inputKey, 'difficulty', 1)}
                                        className="p-1 px-2 border border-[#333] bg-[#222] rounded-lg hover:border-[#C0FF00]/40 text-gray-300 text-xs cursor-pointer select-none"
                                      >
                                        +1
                                      </button>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    {/* Weight inputs Quick Adjust */}
                                    <div className="col-span-5 flex items-center justify-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => updateInputValue(inputKey, 'weight', -2.5)}
                                        className="p-1 px-1.5 border border-[#333] bg-[#222] rounded-lg hover:border-[#C0FF00]/40 text-gray-300 text-[10px] font-mono cursor-pointer select-none"
                                      >
                                        -2.5
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => updateInputValue(inputKey, 'weight', -0.5)}
                                        className="p-1 px-1.5 border border-[#333] bg-[#222] rounded-lg hover:border-[#C0FF00]/40 text-gray-300 text-[10px] font-mono cursor-pointer select-none"
                                      >
                                        -0.5
                                      </button>
                                      
                                      <input
                                        type="text"
                                        value={values.weight || ''}
                                        onChange={(e) => handleTextChange(inputKey, 'weight', e.target.value)}
                                        className="w-18 px-1 py-1 bg-[#111] border border-[#333] rounded-lg text-center text-xs font-mono font-black text-white focus:outline-none focus:ring-1 focus:ring-[#C0FF00]"
                                      />
                                      
                                      <button
                                        type="button"
                                        onClick={() => updateInputValue(inputKey, 'weight', 0.5)}
                                        className="p-1 px-1.5 border border-[#333] bg-[#222] rounded-lg hover:border-[#C0FF00]/40 text-gray-300 text-[10px] font-mono cursor-pointer select-none"
                                      >
                                        +0.5
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => updateInputValue(inputKey, 'weight', 2.5)}
                                        className="p-1 px-1.5 border border-[#333] bg-[#222] rounded-lg hover:border-[#C0FF00]/40 text-gray-300 text-[10px] font-mono cursor-pointer select-none"
                                      >
                                        +2.5
                                      </button>
                                    </div>

                                    {/* Reps selector */}
                                    <div className="col-span-4 flex items-center justify-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => updateInputValue(inputKey, 'reps', -1)}
                                        className="p-1 px-2 border border-[#333] bg-[#222] rounded-lg hover:border-[#C0FF00]/40 text-gray-300 text-xs cursor-pointer select-none"
                                      >
                                        -1
                                      </button>
                                      <input
                                        type="text"
                                        value={values.reps || ''}
                                        onChange={(e) => handleTextChange(inputKey, 'reps', e.target.value)}
                                        className="w-14 px-1 py-1 bg-[#111] border border-[#333] rounded-lg text-center text-xs font-mono font-black text-[#C0FF00] focus:outline-none focus:ring-1 focus:ring-[#C0FF00]"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => updateInputValue(inputKey, 'reps', 1)}
                                        className="p-1 px-2 border border-[#333] bg-[#222] rounded-lg hover:border-[#C0FF00]/40 text-gray-300 text-xs cursor-pointer select-none"
                                      >
                                        +1
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
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
