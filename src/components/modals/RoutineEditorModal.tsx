import React, { useState } from 'react';
import { Workout, Exercise } from '../../models.ts';
import { 
  X, Trash2, Save, Layers, Check, AlertCircle, RefreshCw, Search, Bookmark
} from 'lucide-react';
import { ExerciseSearchPicker } from '../workout/ExerciseSearchPicker.tsx';
import { ConfirmModal } from '../ui/ConfirmModal.tsx';
import { RoutineDaySelector } from './RoutineDaySelector.tsx';
import { RoutineExerciseItem } from './RoutineExerciseItem.tsx';
import { SavedRoutinesLibraryModal } from './SavedRoutinesLibraryModal.tsx';

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
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
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
    } catch (err: unknown) {
      console.error('Error saving routine config:', err);
      setStatusMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save changes' });
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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsLibraryOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1f1f1f] hover:bg-[#2a2a2a] border border-[#333] text-gray-200 text-xs font-mono font-bold transition-all cursor-pointer"
            >
              <Bookmark className="w-3.5 h-3.5 text-[#C0FF00]" />
              <span className="hidden sm:inline">Saved Library</span>
            </button>
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-[#222] rounded-xl text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
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
          <RoutineDaySelector
            workouts={workouts}
            selectedWorkoutIndex={selectedWorkoutIndex}
            onSelectIndex={setSelectedWorkoutIndex}
            onAddWorkoutDay={handleAddWorkoutDay}
          />

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
                    {currentWorkout.exercises.map((ex, exIdx) => (
                      <RoutineExerciseItem
                        key={ex.id || exIdx}
                        exercise={ex}
                        index={exIdx}
                        isEditing={editingExerciseId === ex.id}
                        totalExercises={currentWorkout.exercises.length}
                        onToggleEdit={() => setEditingExerciseId(editingExerciseId === ex.id ? null : ex.id)}
                        onMove={(dir) => handleMoveExercise(exIdx, dir)}
                        onUpdate={(updates) => handleUpdateExercise(ex.id, updates)}
                        onDelete={() => handleDeleteExercise(ex.id)}
                      />
                    ))}
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

      {/* Saved Routines Library Modal */}
      {isLibraryOpen && (
        <SavedRoutinesLibraryModal
          isOpen={isLibraryOpen}
          onClose={() => setIsLibraryOpen(false)}
          userId={userId}
          currentWorkouts={workouts}
          onProgramActivated={async (activatedWorkouts) => {
            setWorkouts(activatedWorkouts);
            setSelectedWorkoutIndex(0);
            setIsLibraryOpen(false);
            await onSaveWorkouts(activatedWorkouts);
          }}
        />
      )}
    </div>
  );
};
