import React, { useState } from 'react';
import { Workout, Exercise, ExerciseType } from '../models.ts';
import { 
  X, Plus, Trash2, Edit3, Save, Dumbbell, Calendar, 
  ChevronDown, ChevronUp, Layers, Check, AlertCircle, RefreshCw, Search
} from 'lucide-react';
import { ExerciseSearchPicker } from './ExerciseSearchPicker.tsx';
import { ConfirmModal } from './ConfirmModal.tsx';

interface RoutineEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  workouts: (Workout & { exercises: Exercise[] })[];
  onSaveWorkouts: (updatedWorkouts: (Workout & { exercises: Exercise[] })[]) => Promise<void>;
}

export const RoutineEditorModal: React.FC<RoutineEditorModalProps> = ({
  isOpen,
  onClose,
  userId,
  workouts: initialWorkouts,
  onSaveWorkouts,
}) => {
  const [workouts, setWorkouts] = useState<(Workout & { exercises: Exercise[] })[]>(() => 
    JSON.parse(JSON.stringify(initialWorkouts || []))
  );
  const [selectedWorkoutIndex, setSelectedWorkoutIndex] = useState<number>(0);
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [isSearchPickerOpen, setIsSearchPickerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [workoutToDeleteIndex, setWorkoutToDeleteIndex] = useState<number | null>(null);

  // Sync state whenever initialWorkouts changes or modal opens
  React.useEffect(() => {
    if (isOpen && initialWorkouts) {
      setWorkouts(JSON.parse(JSON.stringify(initialWorkouts)));
      setSelectedWorkoutIndex(0);
      setEditingExerciseId(null);
      setStatusMsg(null);
      setWorkoutToDeleteIndex(null);
    }
  }, [isOpen, initialWorkouts]);

  if (!isOpen) return null;

  const currentWorkout = workouts[selectedWorkoutIndex];

  // Routine management
  const handleAddWorkoutDay = () => {
    const nextOrder = workouts.length > 0 ? Math.max(...workouts.map(w => w.order)) + 1 : 1;
    const newWorkout: Workout & { exercises: Exercise[] } = {
      id: `custom_w_${Date.now()}`,
      name: `Day ${nextOrder} - Custom Routine`,
      order: nextOrder,
      exerciseIds: [],
      exercises: []
    };
    setWorkouts(prev => [...prev, newWorkout]);
    setSelectedWorkoutIndex(workouts.length);
  };

  const handleDeleteWorkoutDay = (index: number) => {
    setWorkoutToDeleteIndex(index);
  };

  const confirmDeleteWorkoutDay = () => {
    if (workoutToDeleteIndex === null) return;
    const index = workoutToDeleteIndex;
    const filtered = workouts.filter((_, i) => i !== index);
    // Re-index orders cleanly
    const reindexed = filtered.map((w, i) => ({ ...w, order: i + 1 }));
    setWorkouts(reindexed);
    setSelectedWorkoutIndex(Math.max(0, Math.min(index, reindexed.length - 1)));
    setWorkoutToDeleteIndex(null);
  };

  const handleUpdateWorkoutName = (newName: string) => {
    if (!currentWorkout) return;
    setWorkouts(prev => prev.map((w, idx) => idx === selectedWorkoutIndex ? { ...w, name: newName } : w));
  };

  // Exercise management within current routine
  const handleAddExerciseFromPicker = (pickedEx: Partial<Exercise>) => {
    if (!currentWorkout) return;
    const newExId = pickedEx.id || `ex_${Date.now()}`;
    const newEx: Exercise = {
      id: newExId,
      name: pickedEx.name || 'New Exercise',
      type: pickedEx.type || 'strength',
      targetSets: pickedEx.targetSets || 3,
      targetRepMin: pickedEx.targetRepMin || 8,
      targetRepMax: pickedEx.targetRepMax || 12
    };

    const updatedExercises = [...currentWorkout.exercises, newEx];
    const updatedIds = [...(currentWorkout.exerciseIds || []), newExId];

    setWorkouts(prev => prev.map((w, idx) => 
      idx === selectedWorkoutIndex 
        ? { ...w, exercises: updatedExercises, exerciseIds: updatedIds }
        : w
    ));
    setIsSearchPickerOpen(false);
    setEditingExerciseId(newExId);
  };

  const handleAddExercise = () => {
    setIsSearchPickerOpen(true);
  };

  const handleDeleteExercise = (exId: string) => {
    if (!currentWorkout) return;
    const updatedExercises = currentWorkout.exercises.filter(e => e.id !== exId);
    const updatedIds = (currentWorkout.exerciseIds || []).filter(id => id !== exId);

    setWorkouts(prev => prev.map((w, idx) => 
      idx === selectedWorkoutIndex 
        ? { ...w, exercises: updatedExercises, exerciseIds: updatedIds }
        : w
    ));
    if (editingExerciseId === exId) setEditingExerciseId(null);
  };

  const handleMoveExercise = (index: number, direction: 'up' | 'down') => {
    if (!currentWorkout) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= currentWorkout.exercises.length) return;

    const list = [...currentWorkout.exercises];
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    const idList = list.map(e => e.id);

    setWorkouts(prev => prev.map((w, idx) => 
      idx === selectedWorkoutIndex 
        ? { ...w, exercises: list, exerciseIds: idList }
        : w
    ));
  };

  const handleUpdateExercise = (exId: string, updates: Partial<Exercise>) => {
    if (!currentWorkout) return;
    const updatedExercises = currentWorkout.exercises.map(e => 
      e.id === exId ? { ...e, ...updates } : e
    );

    setWorkouts(prev => prev.map((w, idx) => 
      idx === selectedWorkoutIndex 
        ? { ...w, exercises: updatedExercises }
        : w
    ));
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    setStatusMsg(null);
    try {
      await onSaveWorkouts(workouts);
      setStatusMsg({ type: 'success', text: 'Routines and exercises updated successfully!' });
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Error saving routine config:', err);
      setStatusMsg({ type: 'error', text: err.message || 'Failed to save changes' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-[#111111] border border-[#222222] rounded-[24px] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#222] bg-[#141414]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#C0FF00]/10 border border-[#C0FF00]/20 flex items-center justify-center text-[#C0FF00]">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-black uppercase italic tracking-tight text-white text-base sm:text-lg">
                Edit Routines & Exercises
              </h2>
              <p className="text-[10px] font-mono text-gray-400">Configure split days, exercise order, and rep/set targets</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-[#222] rounded-xl text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          
          {/* Status Message */}
          {statusMsg && (
            <div className={`p-3 rounded-xl flex items-center gap-2 text-xs font-mono font-bold ${
              statusMsg.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'
            }`}>
              {statusMsg.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Routine Tabs / Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-[#C0FF00] uppercase tracking-widest font-mono">
                Routine Days ({workouts.length})
              </label>
              <button
                type="button"
                onClick={handleAddWorkoutDay}
                className="flex items-center gap-1 text-[10px] font-mono font-bold text-black bg-[#C0FF00] hover:bg-[#a6dc00] px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Add Routine Day
              </button>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {workouts.map((w, idx) => {
                const isActive = selectedWorkoutIndex === idx;
                return (
                  <button
                    key={w.id || idx}
                    type="button"
                    onClick={() => setSelectedWorkoutIndex(idx)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold font-mono shrink-0 transition-all cursor-pointer border ${
                      isActive 
                        ? 'bg-[#C0FF00] text-black border-[#C0FF00] shadow-[0_0_15px_rgba(192,255,0,0.2)]'
                        : 'bg-[#181818] text-gray-300 border-[#262626] hover:border-[#383838]'
                    }`}
                  >
                    Day {w.order || idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Workout Details */}
          {currentWorkout ? (
            <div className="bg-[#161616] border border-[#262626] rounded-2xl p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#262626] pb-3">
                <div className="flex-1">
                  <label className="block text-[9px] font-mono text-gray-500 uppercase tracking-wider mb-1">
                    Routine Day Name
                  </label>
                  <input
                    type="text"
                    value={currentWorkout.name}
                    onChange={(e) => handleUpdateWorkoutName(e.target.value)}
                    className="w-full bg-[#111] border border-[#333] focus:border-[#C0FF00] rounded-xl px-3 py-1.5 text-sm font-display font-bold text-white focus:outline-none"
                    placeholder="e.g. Day 1 - Upper Body A"
                  />
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => handleDeleteWorkoutDay(selectedWorkoutIndex)}
                    className="flex items-center gap-1 text-[10px] font-mono text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Routine
                  </button>
                </div>
              </div>

              {/* Exercises in Routine */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">
                    Exercises in this routine ({currentWorkout.exercises.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddExercise}
                    className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-black bg-[#C0FF00] hover:bg-[#a6dc00] px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-[0_0_15px_rgba(192,255,0,0.15)]"
                  >
                    <Search className="w-3.5 h-3.5" /> Find & Add Exercise
                  </button>
                </div>

                {/* Exercise Search & Autocomplete Picker */}
                {isSearchPickerOpen && (
                  <ExerciseSearchPicker
                    onSelectExercise={handleAddExerciseFromPicker}
                    onClose={() => setIsSearchPickerOpen(false)}
                  />
                )}

                {currentWorkout.exercises.length === 0 && !isSearchPickerOpen ? (
                  <div className="text-center py-6 text-xs text-gray-500 font-mono border border-dashed border-[#262626] rounded-xl">
                    No exercises in this routine yet. Click "Find & Add Exercise" above.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {currentWorkout.exercises.map((ex, exIdx) => {
                      const isEditing = editingExerciseId === ex.id;
                      return (
                        <div 
                          key={ex.id || exIdx}
                          className="bg-[#111111] border border-[#222222] rounded-xl p-3 space-y-2.5 transition-all"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="w-5 h-5 rounded bg-[#1a1a1a] text-[10px] font-mono font-bold text-gray-400 flex items-center justify-center shrink-0">
                                {exIdx + 1}
                              </span>
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={ex.name}
                                  onChange={(e) => handleUpdateExercise(ex.id, { name: e.target.value })}
                                  className="w-full bg-[#181818] border border-[#383838] focus:border-[#C0FF00] rounded-lg px-2.5 py-1 text-xs font-bold text-white focus:outline-none"
                                />
                              ) : (
                                <div className="truncate font-display font-bold text-xs text-white">
                                  {ex.name}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                disabled={exIdx === 0}
                                onClick={() => handleMoveExercise(exIdx, 'up')}
                                className="p-1 hover:bg-[#222] text-gray-400 hover:text-white disabled:opacity-30 rounded cursor-pointer"
                                title="Move up"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={exIdx === currentWorkout.exercises.length - 1}
                                onClick={() => handleMoveExercise(exIdx, 'down')}
                                className="p-1 hover:bg-[#222] text-gray-400 hover:text-white disabled:opacity-30 rounded cursor-pointer"
                                title="Move down"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingExerciseId(isEditing ? null : ex.id)}
                                className="p-1 hover:bg-[#222] text-gray-400 hover:text-[#C0FF00] rounded cursor-pointer"
                                title="Edit specs"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteExercise(ex.id)}
                                className="p-1 hover:bg-red-500/10 text-gray-500 hover:text-red-400 rounded cursor-pointer"
                                title="Delete exercise"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Exercise Specs (Sets, Reps, Type) */}
                          {isEditing && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#1e1e1e] text-[10px] font-mono">
                              <div>
                                <label className="text-gray-500 block mb-0.5">Type</label>
                                <select
                                  value={ex.type}
                                  onChange={(e) => handleUpdateExercise(ex.id, { type: e.target.value as ExerciseType })}
                                  className="w-full bg-[#181818] border border-[#333] rounded-lg px-2 py-1 text-gray-200 focus:outline-none focus:border-[#C0FF00]"
                                >
                                  <option value="strength">Strength (Weight/Reps)</option>
                                  <option value="timed">Timed (Seconds)</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-gray-500 block mb-0.5">Target Sets</label>
                                <input
                                  type="number"
                                  min="1"
                                  max="10"
                                  value={ex.targetSets}
                                  onChange={(e) => handleUpdateExercise(ex.id, { targetSets: parseInt(e.target.value, 10) || 1 })}
                                  className="w-full bg-[#181818] border border-[#333] rounded-lg px-2 py-1 text-gray-200 focus:outline-none focus:border-[#C0FF00]"
                                />
                              </div>
                              <div>
                                <label className="text-gray-500 block mb-0.5">
                                  {ex.type === 'timed' ? 'Target Sec (Min)' : 'Rep Min'}
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  max="300"
                                  value={ex.targetRepMin}
                                  onChange={(e) => handleUpdateExercise(ex.id, { targetRepMin: parseInt(e.target.value, 10) || 1 })}
                                  className="w-full bg-[#181818] border border-[#333] rounded-lg px-2 py-1 text-gray-200 focus:outline-none focus:border-[#C0FF00]"
                                />
                              </div>
                              <div>
                                <label className="text-gray-500 block mb-0.5">
                                  {ex.type === 'timed' ? 'Target Sec (Max)' : 'Rep Max'}
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  max="300"
                                  value={ex.targetRepMax}
                                  onChange={(e) => handleUpdateExercise(ex.id, { targetRepMax: parseInt(e.target.value, 10) || 1 })}
                                  className="w-full bg-[#181818] border border-[#333] rounded-lg px-2 py-1 text-gray-200 focus:outline-none focus:border-[#C0FF00]"
                                />
                              </div>
                            </div>
                          )}

                          {!isEditing && (
                            <div className="flex items-center gap-3 text-[10px] font-mono text-gray-400">
                              <span className="bg-[#181818] px-2 py-0.5 rounded border border-[#222]">
                                {ex.targetSets} sets
                              </span>
                              <span className="bg-[#181818] px-2 py-0.5 rounded border border-[#222]">
                                {ex.type === 'timed' ? `${ex.targetRepMin}-${ex.targetRepMax} sec` : `${ex.targetRepMin}-${ex.targetRepMax} reps`}
                              </span>
                              <span className="text-gray-500 uppercase">
                                {ex.type}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500 font-mono text-xs">
              Select or add a routine day to begin editing.
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-[#222] bg-[#141414] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2.5 rounded-xl border border-[#333] text-gray-400 hover:text-white font-mono text-xs font-bold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C0FF00] hover:bg-[#a6dc00] text-black font-display font-black italic uppercase text-xs tracking-wider transition-all shadow-[0_0_20px_rgba(192,255,0,0.2)] disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" /> Save Changes
              </>
            )}
          </button>
        </div>

      </div>

      {/* Delete Routine Confirmation Modal */}
      <ConfirmModal
        isOpen={workoutToDeleteIndex !== null}
        title="Delete Routine Day"
        description={`Are you sure you want to delete "${workoutToDeleteIndex !== null ? (workouts[workoutToDeleteIndex]?.name || `Day ${workoutToDeleteIndex + 1}`) : ''}"? This will remove all exercises assigned to this day.`}
        confirmText="Delete Routine"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={confirmDeleteWorkoutDay}
        onCancel={() => setWorkoutToDeleteIndex(null)}
      />
    </div>
  );
};
