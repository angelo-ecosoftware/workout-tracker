import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  X,
  Check,
  Send,
  Sparkles,
  Dumbbell,
  Loader2,
} from 'lucide-react';
import { Workout, Exercise } from '../../models.ts';
import { createRoutineProposal } from '../../lib/supabaseData.ts';
import { ExerciseSearchPicker } from '../workout/ExerciseSearchPicker.tsx';

interface RoutineProposalComposerProps {
  isOpen: boolean;
  onClose: () => void;
  coachId: string;
  coachName?: string;
  athleteId: string;
  athleteName: string;
  onProposalSent?: () => void;
}

export const RoutineProposalComposer: React.FC<RoutineProposalComposerProps> = ({
  isOpen,
  onClose,
  coachId,
  coachName,
  athleteId,
  athleteName,
  onProposalSent,
}) => {
  const [title, setTitle] = useState('4-Day Upper/Lower Strength Split');
  const [description, setDescription] = useState('Personalized progressive overload training split');
  const [workouts, setWorkouts] = useState<(Workout & { exercises: Exercise[] })[]>([
    {
      id: 'prop_w_1',
      name: 'Day 1: Upper Body Strength',
      order: 1,
      exercises: [
        { id: 'ex_bench', name: 'Barbell Bench Press', type: 'strength', targetSets: 4, targetRepMin: 6, targetRepMax: 8 },
        { id: 'ex_row', name: 'Barbell Bent Over Row', type: 'strength', targetSets: 4, targetRepMin: 8, targetRepMax: 10 },
      ],
    },
    {
      id: 'prop_w_2',
      name: 'Day 2: Lower Body Hypertrophy',
      order: 2,
      exercises: [
        { id: 'ex_squat', name: 'Barbell Back Squat', type: 'strength', targetSets: 4, targetRepMin: 8, targetRepMax: 10 },
        { id: 'ex_rdl', name: 'Romanian Deadlift', type: 'strength', targetSets: 3, targetRepMin: 10, targetRepMax: 12 },
      ],
    },
  ]);

  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const currentWorkout = workouts[selectedDayIdx];

  const handleAddDay = () => {
    const nextOrder = workouts.length + 1;
    const newDay: Workout & { exercises: Exercise[] } = {
      id: `prop_w_${Date.now()}`,
      name: `Day ${nextOrder} - Custom Split`,
      order: nextOrder,
      exercises: [],
    };
    setWorkouts([...workouts, newDay]);
    setSelectedDayIdx(workouts.length);
  };

  const handleAddExercise = (picked: Partial<Exercise>) => {
    if (!currentWorkout) return;
    const newEx: Exercise = {
      id: picked.id || `ex_${Date.now()}`,
      name: picked.name || 'New Exercise',
      type: picked.type || 'strength',
      targetSets: picked.targetSets || 3,
      targetRepMin: picked.targetRepMin || 8,
      targetRepMax: picked.targetRepMax || 12,
    };

    const updated = [...workouts];
    updated[selectedDayIdx] = {
      ...currentWorkout,
      exercises: [...currentWorkout.exercises, newEx],
    };
    setWorkouts(updated);
    setIsPickerOpen(false);
  };

  const handleDeleteExercise = (exId: string) => {
    if (!currentWorkout) return;
    const updated = [...workouts];
    updated[selectedDayIdx] = {
      ...currentWorkout,
      exercises: currentWorkout.exercises.filter((e) => e.id !== exId),
    };
    setWorkouts(updated);
  };

  const handleSendProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || workouts.length === 0) {
      setStatusMsg({ type: 'error', text: 'Please enter a title and configure at least 1 workout day.' });
      return;
    }

    try {
      setLoading(true);
      await createRoutineProposal(
        coachId,
        athleteId,
        title.trim(),
        { workouts },
        description.trim() || undefined,
        coachName
      );

      setStatusMsg({ type: 'success', text: `Proposal sent to ${athleteName}!` });
      setTimeout(() => {
        if (onProposalSent) onProposalSent();
        onClose();
      }, 800);
    } catch (err: any) {
      console.error('Failed to send routine proposal:', err);
      setStatusMsg({ type: 'error', text: 'Failed to send proposal.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#111111] border border-[#222222] rounded-[24px] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#222] bg-[#141414]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#C0FF00]/10 border border-[#C0FF00]/20 flex items-center justify-center text-[#C0FF00]">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-black uppercase italic tracking-tight text-white text-base sm:text-lg">
                Propose Routine for {athleteName}
              </h2>
              <p className="text-[10px] font-mono text-gray-400">
                Compose a multi-day program split for client review
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#222] rounded-xl text-gray-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close composer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          <div>
            <label className="text-[10px] uppercase font-mono text-gray-400 font-bold block mb-1">
              Program Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#161616] border border-[#333] focus:border-[#C0FF00] rounded-xl px-3 py-2 text-xs text-white outline-none"
              required
            />
          </div>

          <div>
            <label className="text-[10px] uppercase font-mono text-gray-400 font-bold block mb-1">
              Coach Notes / Strategy
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#161616] border border-[#333] focus:border-[#C0FF00] rounded-xl px-3 py-2 text-xs text-white outline-none"
            />
          </div>

          {/* Days Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {workouts.map((w, idx) => (
              <button
                key={w.id || idx}
                type="button"
                onClick={() => setSelectedDayIdx(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all ${
                  selectedDayIdx === idx
                    ? 'bg-[#C0FF00] text-black shadow-md'
                    : 'bg-[#181818] text-gray-400 hover:text-white border border-[#282828]'
                }`}
              >
                Day {idx + 1}
              </button>
            ))}
            <button
              type="button"
              onClick={handleAddDay}
              className="px-2.5 py-1.5 rounded-xl bg-[#222] text-[#C0FF00] text-xs font-mono font-bold hover:bg-[#333] transition-colors flex items-center gap-1 shrink-0"
            >
              <Plus className="w-3 h-3" /> Add Day
            </button>
          </div>

          {/* Current Day Exercises */}
          {currentWorkout && (
            <div className="p-4 rounded-2xl bg-[#141414] border border-[#222] space-y-3">
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  value={currentWorkout.name}
                  onChange={(e) => {
                    const updated = [...workouts];
                    updated[selectedDayIdx] = { ...currentWorkout, name: e.target.value };
                    setWorkouts(updated);
                  }}
                  className="bg-transparent border-b border-[#333] focus:border-[#C0FF00] text-sm font-bold text-white outline-none pb-1"
                />
                <button
                  type="button"
                  onClick={() => setIsPickerOpen(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#C0FF00]/10 border border-[#C0FF00]/30 text-[#C0FF00] text-xs font-mono font-bold cursor-pointer hover:bg-[#C0FF00] hover:text-black transition-colors"
                >
                  <Plus className="w-3 h-3" /> Add Exercise
                </button>
              </div>

              <div className="space-y-2">
                {currentWorkout.exercises.length === 0 ? (
                  <p className="text-xs text-gray-500 font-mono py-2">
                    No exercises added to this routine day yet.
                  </p>
                ) : (
                  currentWorkout.exercises.map((ex) => (
                    <div
                      key={ex.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[#181818] border border-[#282828]"
                    >
                      <span className="text-xs font-medium text-white truncate">{ex.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-[#C0FF00]">
                          {ex.targetSets} sets × {ex.targetRepMin}-{ex.targetRepMax} reps
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteExercise(ex.id)}
                          className="text-gray-500 hover:text-red-400 p-1 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-[#222] bg-[#141414] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-[#333] text-gray-400 hover:text-white font-mono text-xs font-bold"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSendProposal}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C0FF00] hover:bg-[#a6dc00] text-black font-display font-black text-xs uppercase tracking-wider shadow-md"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Send Proposal
          </button>
        </div>
      </div>

      {isPickerOpen && (
        <ExerciseSearchPicker
          isOpen={isPickerOpen}
          onClose={() => setIsPickerOpen(false)}
          onSelectExercise={handleAddExercise}
        />
      )}
    </div>
  );
};
