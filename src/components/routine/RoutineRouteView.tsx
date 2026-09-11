import React, { useEffect, useState } from 'react';
import { Loader2, Pencil, Bookmark } from 'lucide-react';
import { SavedRoutineProgram } from '../../models.ts';
import { fetchSavedRoutineProgramById, fetchSavedRoutinePrograms, updateSavedRoutineProgram } from '../../lib/db/routineLibrary.ts';
import { RoutineEditorModal } from '../modals/RoutineEditorModal.tsx';
import { CanonicalRoute, serializeRoute } from '../../appRouting.ts';

interface RoutineRouteViewProps {
  userId: string;
  route: Extract<CanonicalRoute, { kind: 'collection' }> | Extract<CanonicalRoute, { kind: 'routine' }>;
  onNavigate: (path: string) => void;
}

export const RoutineRouteView: React.FC<RoutineRouteViewProps> = ({ userId, route, onNavigate }) => {
  const [programs, setPrograms] = useState<SavedRoutineProgram[]>([]);
  const [program, setProgram] = useState<SavedRoutineProgram | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const load = route.kind === 'routine'
      ? fetchSavedRoutineProgramById(userId, route.routineId).then((value) => value ? [value] : [])
      : fetchSavedRoutinePrograms(userId);
    load
      .then((values) => {
        if (cancelled) return;
        setPrograms(values);
        setProgram(route.kind === 'routine' ? values[0] || null : null);
        if (route.kind === 'routine' && !values[0]) setError('Routine not found or unavailable.');
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : 'Failed to load routine.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, route]);

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-[#C0FF00]" /></div>;
  }
  if (error || (route.kind === 'routine' && !program)) {
    return (
      <div className="bg-[#111] border border-red-900/50 rounded-[24px] p-8 text-center">
        <p className="text-red-400 font-mono text-sm">{error || 'Routine not found or unavailable.'}</p>
        <button type="button" onClick={() => onNavigate('/routines')} className="mt-4 text-[#C0FF00] font-mono text-xs uppercase">
          Back to routines
        </button>
      </div>
    );
  }

  if (route.kind === 'routine' && program) {
    const isEditor = route.mode === 'editor';
    return (
      <div className="space-y-4">
        <button type="button" onClick={() => onNavigate('/routines')} className="text-[#C0FF00] font-mono text-xs uppercase">
          ← All routines
        </button>
        <div className="bg-[#111] border border-[#222] rounded-[24px] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] text-[#C0FF00] font-mono uppercase tracking-widest">Saved routine program</p>
              <h2 className="text-xl font-display font-black text-white mt-1">{program.title}</h2>
              {program.description && <p className="text-sm text-gray-400 mt-2">{program.description}</p>}
              <p className="text-xs text-gray-500 font-mono mt-3">{program.programData.workouts.length} workout day(s)</p>
            </div>
            {!isEditor && (
              <button
                type="button"
                onClick={() => onNavigate(serializeRoute({ kind: 'routine', routineId: program.id, mode: 'editor' }))}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#C0FF00] text-black text-xs font-bold"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit
              </button>
            )}
          </div>
        </div>
        <RoutineEditorModal
          isOpen={isEditor}
          onClose={() => onNavigate(serializeRoute({ kind: 'routine', routineId: program.id, mode: 'view' }))}
          userId={userId}
          workouts={program.programData.workouts}
          presentation="page"
          onSaveWorkouts={async (updatedWorkouts) => {
            await updateSavedRoutineProgram(userId, program.id, { workouts: updatedWorkouts });
            setProgram((current) => current ? { ...current, programData: { workouts: updatedWorkouts } } : current);
            onNavigate(serializeRoute({ kind: 'routine', routineId: program.id, mode: 'view' }));
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Bookmark className="text-[#C0FF00]" />
        <div>
          <h2 className="text-xl font-display font-black text-white uppercase">Saved Routines</h2>
          <p className="text-xs text-gray-400">Saved program snapshots are separate from today’s active workout split.</p>
        </div>
      </div>
      {programs.length === 0 ? (
        <div className="bg-[#111] border border-[#222] rounded-[24px] p-8 text-center text-gray-400 text-sm">No saved routines yet.</div>
      ) : (
        <div className="grid gap-3">
          {programs.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => onNavigate(serializeRoute({ kind: 'routine', routineId: item.id, mode: 'view' }))}
              className="text-left bg-[#111] border border-[#222] hover:border-[#C0FF00]/50 rounded-2xl p-4"
            >
              <span className="font-bold text-white">{item.title}</span>
              <span className="block text-xs text-gray-500 mt-1">{item.programData.workouts.length} workout day(s)</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
