import React, { useEffect, useState } from 'react';
import { Check, Loader2, Sparkles, X } from 'lucide-react';
import { Exercise, Workout } from '../../models.ts';
import { supabase } from '../../lib/supabase.ts';
import { saveRoutineProgramToLibrary } from '../../lib/db/routineLibrary.ts';

type GeneratedProgram = {
  title?: string;
  description?: string;
  workouts: (Workout & { exercises: Exercise[] })[];
};

interface RoutineGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  profile?: {
    fitnessLevel?: string;
    goals?: string[];
    trainingDays?: string[];
    sessionDurationMinutes?: number;
    trainingLocation?: string;
    injuriesNotes?: string;
  } | null;
}

export const RoutineGeneratorModal: React.FC<RoutineGeneratorModalProps> = ({
  isOpen,
  onClose,
  userId,
  profile,
}) => {
  const [used, setUsed] = useState(0);
  const [program, setProgram] = useState<GeneratedProgram | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (!isOpen || !userId) return;
    let cancelled = false;
    const loadQuota = async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return;
      const response = await fetch('/api/generate-routine', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok || cancelled) return;
      const result = await response.json() as { quota?: { used?: number; limit?: number | string } };
      setUsed(Number(result.quota?.used || 0));
    };
    void loadQuota();
    return () => {
      cancelled = true;
    };
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsLoading(true);
    setError('');
    setProgram(null);
    setIsSaved(false);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error('Please sign in again before generating a routine.');
      // #region agent log
      fetch('http://127.0.0.1:7357/ingest/5e455412-bd18-4aca-bdcb-15049feb542f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'13ed83'},body:JSON.stringify({sessionId:'13ed83',runId:'pre-fix',hypothesisId:'H2-H3',location:'RoutineGeneratorModal.tsx:74',message:'routine generation request inputs',data:{hasToken:Boolean(token),hasProfile:Boolean(profile),goalsCount:profile?.goals?.length||0,trainingDaysCount:profile?.trainingDays?.length||0},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      const response = await fetch('/api/generate-routine', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profile }),
      });
      const result = await response.json() as {
        program?: GeneratedProgram;
        error?: string;
        quota?: { used?: number; limit?: number | string };
      };
      // #region agent log
      fetch('http://127.0.0.1:7357/ingest/5e455412-bd18-4aca-bdcb-15049feb542f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'13ed83'},body:JSON.stringify({sessionId:'13ed83',runId:'pre-fix',hypothesisId:'H1-H2-H4',location:'RoutineGeneratorModal.tsx:91',message:'routine generation response',data:{status:response.status,ok:response.ok,error:result.error||null,hasProgram:Boolean(result.program),used:result.quota?.used??null},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      setUsed(Number(result.quota?.used || used));
      if (!response.ok || !result.program) throw new Error(result.error || 'Could not generate a routine.');
      setProgram(result.program);
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : 'Could not generate a routine.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!program || !userId) return;
    setIsSaving(true);
    setError('');
    try {
      await saveRoutineProgramToLibrary(
        userId,
        program.title || 'AI-generated routine',
        { workouts: program.workouts },
        program.description || 'Generated from your saved profile preferences.',
      );
      setIsSaved(true);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save this routine.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="routine-generator-title"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[24px] border border-[#2b2b2b] bg-[#111] p-5 text-left shadow-2xl sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#C0FF00]">
              <Sparkles className="h-3.5 w-3.5" /> AI routine
            </p>
            <h2 id="routine-generator-title" className="font-display text-xl font-black italic uppercase text-white">
              Build your routine
            </h2>
            <p className="mt-1 text-xs text-gray-400">
              Uses your saved profile preferences. Your routine will be previewed before it is saved.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close routine generator"
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-5 flex items-center justify-between rounded-xl border border-[#2b2b2b] bg-[#181818] px-4 py-3">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Daily generations</span>
          <span className="font-mono text-sm font-bold text-[#C0FF00]">
            Unlimited testing
          </span>
        </div>

        {!program && (
          <button
            type="button"
            onClick={() => void handleGenerate()}
            disabled={isLoading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#C0FF00] px-4 py-3 text-xs font-black uppercase tracking-wider text-black transition-colors hover:bg-[#a6dc00] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {isLoading ? 'Generating…' : 'Generate routine'}
          </button>
        )}

        {program && (
          <div className="space-y-4">
            <div>
              <h3 className="font-display text-lg font-black uppercase text-white">{program.title || 'Generated routine'}</h3>
              {program.description && <p className="mt-1 text-sm text-gray-400">{program.description}</p>}
            </div>
            {program.workouts.map((workout) => (
              <div key={workout.id} className="rounded-xl border border-[#2b2b2b] bg-[#181818] p-4">
                <h4 className="font-display text-sm font-black uppercase tracking-wide text-[#C0FF00]">{workout.name}</h4>
                <ul className="mt-2 space-y-1 text-sm text-gray-300">
                  {workout.exercises.map((exercise) => (
                    <li key={`${workout.id}-${exercise.id}`}>
                      {exercise.name} <span className="text-gray-500">· {exercise.targetSets} × {exercise.targetRepMin}-{exercise.targetRepMax}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={isSaving || isSaved}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#C0FF00] px-4 py-3 text-xs font-black uppercase tracking-wider text-black transition-colors hover:bg-[#a6dc00] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaved ? <Check className="h-4 w-4" /> : isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {isSaved ? 'Saved to library' : isSaving ? 'Saving…' : 'Save routine'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setProgram(null);
                  setIsSaved(false);
                  setError('');
                }}
                className="rounded-xl border border-[#333] bg-[#181818] px-4 py-3 text-xs font-black uppercase tracking-wider text-gray-300 transition-colors hover:border-[#555] hover:text-white"
              >
                Generate another
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};
