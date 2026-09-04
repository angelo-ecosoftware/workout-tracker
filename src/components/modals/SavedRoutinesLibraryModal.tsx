import React, { useState, useEffect } from 'react';
import {
  Bookmark,
  Check,
  Plus,
  Trash2,
  X,
  Play,
  Copy,
  Loader2,
  Calendar,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { SavedRoutineProgram, Workout, Exercise } from '../../models.ts';
import {
  fetchSavedRoutinePrograms,
  saveRoutineProgramToLibrary,
  setActiveRoutineProgram,
  deleteSavedRoutineProgram,
  saveWorkoutsAndExercises,
} from '../../lib/supabaseData.ts';

interface SavedRoutinesLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  currentWorkouts?: (Workout & { exercises: Exercise[] })[];
  onProgramActivated?: (activatedWorkouts: (Workout & { exercises: Exercise[] })[]) => void;
}

export const SavedRoutinesLibraryModal: React.FC<SavedRoutinesLibraryModalProps> = ({
  isOpen,
  onClose,
  userId,
  currentWorkouts = [],
  onProgramActivated,
}) => {
  const [programs, setPrograms] = useState<SavedRoutineProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSavingCurrent, setIsSavingCurrent] = useState(false);
  const [newProgramTitle, setNewProgramTitle] = useState('');
  const [newProgramDescription, setNewProgramDescription] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadPrograms = async () => {
    try {
      setLoading(true);
      const data = await fetchSavedRoutinePrograms(userId);
      setPrograms(data);
    } catch (err: any) {
      console.error('Failed to load saved programs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && userId) {
      loadPrograms();
      setIsSavingCurrent(false);
      setNewProgramTitle('');
      setNewProgramDescription('');
      setStatusMsg(null);
    }
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const handleSaveCurrentSplit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProgramTitle.trim()) {
      setStatusMsg({ type: 'error', text: 'Please enter a program title.' });
      return;
    }

    try {
      setLoading(true);
      const saved = await saveRoutineProgramToLibrary(
        userId,
        newProgramTitle.trim(),
        { workouts: currentWorkouts },
        newProgramDescription.trim() || undefined
      );

      setPrograms((prev) => [saved, ...prev]);
      setIsSavingCurrent(false);
      setNewProgramTitle('');
      setNewProgramDescription('');
      setStatusMsg({ type: 'success', text: `Saved "${saved.title}" to library!` });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to save program.' });
    } finally {
      setLoading(false);
    }
  };

  const handleActivateProgram = async (program: SavedRoutineProgram) => {
    try {
      setLoading(true);
      await setActiveRoutineProgram(userId, program.id);

      // If program has workouts, sync them to active workouts table
      if (program.programData?.workouts && Array.isArray(program.programData.workouts)) {
        await saveWorkoutsAndExercises(userId, program.programData.workouts);
        if (onProgramActivated) {
          onProgramActivated(program.programData.workouts);
        }
      }

      setPrograms((prev) =>
        prev.map((p) => ({
          ...p,
          isActive: p.id === program.id,
        }))
      );

      setStatusMsg({ type: 'success', text: `Activated "${program.title}" as current split!` });
    } catch (err: any) {
      console.error('Failed to activate program:', err);
      setStatusMsg({ type: 'error', text: 'Failed to activate program.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProgram = async (programId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}" from your library?`)) {
      return;
    }

    try {
      await deleteSavedRoutineProgram(userId, programId);
      setPrograms((prev) => prev.filter((p) => p.id !== programId));
      setStatusMsg({ type: 'success', text: `Removed "${title}" from library.` });
    } catch (err: any) {
      console.error('Failed to delete program:', err);
      setStatusMsg({ type: 'error', text: 'Failed to delete program.' });
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
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#222] bg-[#141414]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#C0FF00]/10 border border-[#C0FF00]/20 flex items-center justify-center text-[#C0FF00]">
              <Bookmark className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-black uppercase italic tracking-tight text-white text-base sm:text-lg">
                Saved Routines Library
              </h2>
              <p className="text-[10px] font-mono text-gray-400">
                Switch between training blocks, save snapshots, and manage programs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#222] rounded-xl text-gray-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close library"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Message */}
        {statusMsg && (
          <div
            className={`mx-4 mt-4 p-3 rounded-xl flex items-center gap-2 text-xs font-mono font-bold ${
              statusMsg.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                : 'bg-red-500/10 border border-red-500/30 text-red-400'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <Check className="w-4 h-4 shrink-0" />
            ) : (
              <X className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Action: Save Current Split Header */}
          {!isSavingCurrent ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#161616] border border-[#282828]">
              <div>
                <h4 className="font-bold text-white text-xs sm:text-sm uppercase tracking-wide">
                  Active Routine Split Snapshot
                </h4>
                <p className="text-[11px] text-gray-400 font-sans mt-0.5">
                  Save your current {currentWorkouts.length}-day routine to your permanent library.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSavingCurrent(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#C0FF00] hover:bg-[#a6dc00] text-black font-display font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md shrink-0 self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                Save Current Split
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSaveCurrentSplit}
              className="p-4 rounded-2xl bg-[#161616] border border-[#C0FF00]/30 space-y-3"
            >
              <div className="flex items-center justify-between border-b border-[#282828] pb-2">
                <span className="text-xs font-display font-black text-[#C0FF00] uppercase tracking-wider">
                  Save New Program Snapshot
                </span>
                <button
                  type="button"
                  onClick={() => setIsSavingCurrent(false)}
                  className="text-gray-400 hover:text-white text-xs font-mono"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono text-gray-400 font-bold block mb-1">
                  Program Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g., 4-Day Upper/Lower Strength Block"
                  value={newProgramTitle}
                  onChange={(e) => setNewProgramTitle(e.target.value)}
                  className="w-full bg-[#111] border border-[#333] focus:border-[#C0FF00] rounded-xl px-3 py-2 text-xs text-white outline-none font-sans"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono text-gray-400 font-bold block mb-1">
                  Description / Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., 8-week progressive hypertrophy cycle"
                  value={newProgramDescription}
                  onChange={(e) => setNewProgramDescription(e.target.value)}
                  className="w-full bg-[#111] border border-[#333] focus:border-[#C0FF00] rounded-xl px-3 py-2 text-xs text-white outline-none font-sans"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsSavingCurrent(false)}
                  className="px-3 py-1.5 rounded-lg border border-[#333] text-gray-400 hover:text-white text-xs font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 rounded-lg bg-[#C0FF00] hover:bg-[#a6dc00] text-black font-display font-black text-xs uppercase tracking-wider"
                >
                  {loading ? 'Saving...' : 'Save to Library'}
                </button>
              </div>
            </form>
          )}

          {/* Program List */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-mono uppercase tracking-widest text-gray-400 font-bold">
              Archived Programs ({programs.length})
            </h3>

            {loading && programs.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin text-[#C0FF00]" />
                <span className="text-xs font-mono">Loading library programs...</span>
              </div>
            ) : programs.length === 0 ? (
              <div className="p-8 text-center bg-[#141414] border border-[#222] rounded-2xl space-y-2">
                <Sparkles className="w-6 h-6 text-[#C0FF00] mx-auto opacity-60" />
                <h4 className="text-sm font-bold text-white">No Saved Programs Yet</h4>
                <p className="text-xs text-gray-400 font-sans max-w-sm mx-auto">
                  Click "Save Current Split" to create your first reusable routine program snapshot.
                </p>
              </div>
            ) : (
              programs.map((prog) => {
                const daysCount = prog.programData?.workouts?.length || 0;
                return (
                  <div
                    key={prog.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      prog.isActive
                        ? 'bg-[#181818] border-[#C0FF00]/50 shadow-[0_0_15px_rgba(192,255,0,0.1)]'
                        : 'bg-[#141414] border-[#252525] hover:border-[#333]'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-display font-black text-white text-sm uppercase tracking-tight">
                            {prog.title}
                          </span>
                          {prog.isActive && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold uppercase tracking-wider bg-[#C0FF00]/15 text-[#C0FF00] border border-[#C0FF00]/30 px-2 py-0.5 rounded-full">
                              <Check className="w-2.5 h-2.5" /> Active Program
                            </span>
                          )}
                          {prog.sourceCoachName && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-mono text-sky-400 bg-sky-500/10 border border-sky-500/30 px-2 py-0.5 rounded-full">
                              <UserCheck className="w-2.5 h-2.5" /> Proposed by {prog.sourceCoachName}
                            </span>
                          )}
                        </div>

                        {prog.description && (
                          <p className="text-xs text-gray-400 font-sans">{prog.description}</p>
                        )}

                        <div className="flex items-center gap-3 text-[10px] font-mono text-gray-500 pt-1">
                          <span>{daysCount} workout day(s)</span>
                          <span>•</span>
                          <span>
                            Added {new Date(prog.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {!prog.isActive && (
                          <button
                            type="button"
                            onClick={() => handleActivateProgram(prog)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#C0FF00] hover:bg-[#a6dc00] text-black font-display font-black text-[11px] uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                          >
                            <Play className="w-3 h-3 fill-black" />
                            Activate
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteProgram(prog.id, prog.title)}
                          className="p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                          aria-label={`Delete ${prog.title}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
