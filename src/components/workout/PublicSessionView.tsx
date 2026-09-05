import React, { useEffect, useState } from 'react';
import { fetchPublicWorkoutSession } from '../../lib/supabaseData.ts';
import { Session, WorkoutSet } from '../../models.ts';
import { Activity, Calendar, Clock, Loader2, Dumbbell, Flame, Scale, FileText, Camera, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

interface PublicWorkoutData {
  session: Session;
  workoutName: string;
  athleteName?: string;
  bodyWeightKg?: number | null;
  calculatedBmi?: number | null;
  sets: (WorkoutSet & { exerciseName: string; type: 'strength' | 'timed' })[];
}

interface PublicSessionViewProps {
  sessionId: string;
  onGoToApp?: () => void;
}

export const PublicSessionView: React.FC<PublicSessionViewProps> = ({ sessionId, onGoToApp }) => {
  const [data, setData] = useState<PublicWorkoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadSharedSession() {
      try {
        setLoading(true);
        setErrorMsg(null);
        const result = await fetchPublicWorkoutSession(sessionId);
        if (!result) {
          setErrorMsg("Workout session not found or link has expired.");
        } else {
          setData(result);
        }
      } catch (err: unknown) {
        console.error("Failed to load public session:", err);
        setErrorMsg(err instanceof Error ? err.message : "Could not load shared workout session.");
      } finally {
        setLoading(false);
      }
    }

    if (sessionId) {
      loadSharedSession();
    }
  }, [sessionId]);

  const handleStartApp = () => {
    if (onGoToApp) {
      onGoToApp();
    } else {
      // Clear URL params and reload/redirect to main app root
      window.location.href = window.location.origin + window.location.pathname;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin text-[#C0FF00] mb-4" />
        <p className="font-mono text-xs tracking-widest uppercase text-gray-300">Loading Shared Workout...</p>
      </div>
    );
  }

  if (errorMsg || !data) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-[#111] border border-red-900/40 rounded-[24px] p-8 max-w-md w-full shadow-2xl space-y-4">
          <Activity className="w-10 h-10 text-red-500 mx-auto" />
          <h2 className="text-white font-display font-bold text-lg uppercase tracking-tight">
            Workout Not Available
          </h2>
          <p className="text-gray-400 font-sans text-xs">
            {errorMsg || "The shared workout session could not be found."}
          </p>
          <button
            onClick={handleStartApp}
            className="w-full mt-4 bg-[#C0FF00] text-black font-mono font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider hover:bg-[#b0f000] transition-colors flex items-center justify-center gap-2"
          >
            Go to Workout Tracker <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const { session, workoutName, athleteName, bodyWeightKg, calculatedBmi, sets } = data;

  // Calculate volume stats
  const totalVolumeKg = sets.reduce((sum, s) => sum + ((s.weight || 0) * (s.reps || 0)), 0);
  const totalReps = sets.reduce((sum, s) => sum + (s.reps || 0), 0);
  const totalDurationSec = sets.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);

  // Group sets by exercise
  const exerciseGroups = sets.reduce((acc, set) => {
    const existing = acc.find(g => g.exerciseName === set.exerciseName);
    if (existing) {
      existing.sets.push(set);
    } else {
      acc.push({ exerciseName: set.exerciseName, sets: [set] });
    }
    return acc;
  }, [] as Array<{ exerciseName: string; sets: typeof sets }>);

  return (
    <div className="min-h-screen bg-[#050505] text-[#f3f4f6] px-4 py-8 flex flex-col items-center justify-between">
      {/* Top Banner / Public Badge */}
      <div className="w-full max-w-xl mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#C0FF00]/10 border border-[#C0FF00]/30 flex items-center justify-center text-[#C0FF00]">
            <Dumbbell className="w-4 h-4" />
          </div>
          <div>
            <span className="font-display font-black text-sm text-white tracking-wider uppercase block">
              WORKOUT LOG
            </span>
            <span className="text-[10px] font-mono text-gray-400">
              Shared by {athleteName}
            </span>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#181818] border border-[#282828] text-[10px] font-mono font-bold text-[#C0FF00]">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Read-Only Log
        </div>
      </div>

      {/* Main Clean Workout Card */}
      <div className="w-full max-w-xl bg-[#111] border border-[#222] rounded-[24px] p-6 shadow-2xl space-y-6">
        {/* Workout Title & Date/Time */}
        <div className="border-b border-[#222] pb-4 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <h1 className="font-display font-black text-2xl text-[#C0FF00] uppercase tracking-tight">
              {workoutName}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-gray-400 pt-1">
            <span className="flex items-center gap-1.5 bg-[#181818] px-2.5 py-1 rounded-lg border border-[#222]">
              <Calendar className="w-3.5 h-3.5 text-[#C0FF00]" />
              {session.completedAt ? session.completedAt.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : 'Logged Session'}
            </span>
            {session.completedAt && (
              <span className="flex items-center gap-1.5 bg-[#181818] px-2.5 py-1 rounded-lg border border-[#222]">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                {session.completedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            {session.sleepHours != null && (
              <span className="flex items-center gap-1.5 bg-[#181818] px-2.5 py-1 rounded-lg border border-[#222]">
                <span className="text-[#C0FF00] font-bold">💤 {session.sleepHours}h</span>
                <span className="text-[10px] text-gray-500">sleep</span>
              </span>
            )}
            {session.energyScore != null && (
              <span className="flex items-center gap-1.5 bg-[#181818] px-2.5 py-1 rounded-lg border border-[#222]">
                <span className="text-amber-400 font-bold">⚡ {session.energyScore}/10</span>
                <span className="text-[10px] text-gray-500">energy</span>
              </span>
            )}
          </div>
        </div>

        {/* Quick Summary Stats Grid */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-[#161616] border border-[#262626] rounded-xl p-3 text-center space-y-0.5">
            <span className="text-[9px] font-mono uppercase font-bold text-gray-400 block">Total Volume</span>
            <span className="text-lg font-display font-black text-white block">
              {totalVolumeKg > 0 ? `${totalVolumeKg.toLocaleString()} kg` : `${totalDurationSec}s`}
            </span>
            <span className="text-[9px] font-mono text-gray-500">Tonnage moved</span>
          </div>

          <div className="bg-[#161616] border border-[#262626] rounded-xl p-3 text-center space-y-0.5">
            <span className="text-[9px] font-mono uppercase font-bold text-gray-400 block">Sets Completed</span>
            <span className="text-lg font-display font-black text-white block">
              {sets.length}
            </span>
            <span className="text-[9px] font-mono text-gray-500">{totalReps > 0 ? `${totalReps} total reps` : 'Active sets'}</span>
          </div>

          <div className="bg-[#161616] border border-[#262626] rounded-xl p-3 text-center space-y-0.5">
            <span className="text-[9px] font-mono uppercase font-bold text-gray-400 block">Bodyweight</span>
            <span className="text-lg font-display font-black text-white block">
              {bodyWeightKg ? `${bodyWeightKg} kg` : '—'}
            </span>
            <span className="text-[9px] font-mono text-gray-500">{calculatedBmi ? `BMI ${calculatedBmi}` : 'Session weight'}</span>
          </div>
        </div>

        {/* Workout Notes */}
        {session.notes && (
          <div className="p-4 bg-[#161616] border border-[#2a2a2a] rounded-xl text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 text-[#C0FF00] font-mono text-[10px] font-bold uppercase">
              <FileText className="w-3.5 h-3.5" />
              <span>Workout Notes</span>
            </div>
            <p className="text-gray-300 font-sans leading-relaxed whitespace-pre-wrap">
              {session.notes}
            </p>
          </div>
        )}

        {/* Progress Photos */}
        {session.photos && session.photos.length > 0 && (
          <div className="p-4 bg-[#161616] border border-[#2a2a2a] rounded-xl space-y-3">
            <div className="flex items-center gap-1.5 text-[#C0FF00] font-mono text-[10px] font-bold uppercase">
              <Camera className="w-3.5 h-3.5" />
              <span>Session Photos ({session.photos.length})</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {session.photos.map((url, idx) => (
                <a
                  key={idx}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="aspect-square rounded-xl overflow-hidden border border-[#333] bg-[#1a1a1a] block group"
                >
                  <img
                    src={url}
                    alt={`Workout photo ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Exercises & Set Breakdown */}
        <div className="space-y-3">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-[#C0FF00]" />
            Exercise Log ({exerciseGroups.length})
          </h2>

          <div className="space-y-3">
            {exerciseGroups.map((group, gIdx) => (
              <div key={gIdx} className="bg-[#161616] border border-[#282828] rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between border-b border-[#242424] pb-2">
                  <h3 className="font-display font-black text-sm text-white uppercase tracking-wide">
                    {group.exerciseName}
                  </h3>
                  <span className="text-[10px] font-mono text-gray-400 bg-[#202020] px-2 py-0.5 rounded">
                    {group.sets.length} {group.sets.length === 1 ? 'set' : 'sets'}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {group.sets.map((set, sIdx) => (
                    <div
                      key={sIdx}
                      className="flex items-center justify-between text-xs font-mono bg-[#1a1a1a]/60 px-3 py-2 rounded-lg"
                    >
                      <span className="text-gray-400 font-sans font-bold text-[11px] uppercase">
                        Set {set.setNumber}
                      </span>
                      <span className="text-white font-black text-sm">
                        {set.type === 'strength'
                          ? `${set.weight ?? 0} kg × ${set.reps ?? 0} reps`
                          : `${set.durationSeconds ?? 0}s`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Call to Action Footer: "Start using this app" */}
      <div className="w-full max-w-xl mt-8 pt-6 border-t border-[#222] text-center space-y-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-display font-black text-[#C0FF00] uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            Track Your Workouts & Progressive Overload
          </div>
          <p className="text-xs text-gray-400 font-sans max-w-sm mx-auto">
            Log your lifting volume, measure progressive overload, and track daily consistency with our minimalist log book.
          </p>
        </div>

        <button
          onClick={handleStartApp}
          className="w-full bg-[#C0FF00] hover:bg-[#b0f000] text-black font-display font-black py-3.5 px-6 rounded-2xl text-sm uppercase tracking-wider transition-all shadow-lg shadow-[#C0FF00]/10 flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
        >
          <span>Start Using This App</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <p className="text-[10px] font-mono text-gray-600">
          Free • Offline-First PWA • Instant Cloud Sync
        </p>
      </div>
    </div>
  );
};
