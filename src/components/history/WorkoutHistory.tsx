import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { fetchWorkoutHistory, fetchSetsForSession, deleteSessions, updateSessionDate, fetchWorkoutsData } from '../../services/workoutService.ts';
import { Session, WorkoutSet, Exercise } from '../../types/index.ts';
import { Activity, Calendar, Clock, Loader2, ChevronLeft, Trash2, CheckCircle2, Circle, Edit2, Save, X, FileText } from 'lucide-react';
import { ConfirmModal } from '../common/ConfirmModal.tsx';

interface PopulatedSession extends Session {
  workoutName: string;
  order: number;
  sets: (WorkoutSet & { exerciseName: string; type: 'strength' | 'timed' })[];
}

export const WorkoutHistory: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sessions, setSessions] = useState<PopulatedSession[]>([]);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [editingDateSessionId, setEditingDateSessionId] = useState<string | null>(null);
  const [editingDateValue, setEditingDateValue] = useState<string>("");

  const startEditingDate = (session: PopulatedSession) => {
    setEditingDateSessionId(session.id);
    if (session.completedAt) {
      // Format to YYYY-MM-DDTHH:mm for datetime-local input
      const d = session.completedAt;
      const pad = (n: number) => n.toString().padStart(2, '0');
      const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      setEditingDateValue(formatted);
    } else {
      setEditingDateValue("");
    }
  };

  const saveDateEdit = async (session: PopulatedSession) => {
    if (!editingDateValue) {
      setEditingDateSessionId(null);
      return;
    }
    
    try {
      const newDate = new Date(editingDateValue);
      await updateSessionDate(session.id, newDate);
      
      // Update local state
      setSessions(prev => 
        prev.map(s => 
          s.id === session.id 
            ? { ...s, completedAt: newDate } 
            : s
        ).sort((a, b) => (a.completedAt?.getTime() || 0) - (b.completedAt?.getTime() || 0))
      );
      
      setEditingDateSessionId(null);
    } catch (err) {
      console.error("Failed to update date:", err);
      alert("Failed to update date.");
    }
  };

  const cancelDateEdit = () => {
    setEditingDateSessionId(null);
    setEditingDateValue("");
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const requestDelete = () => {
    setIsConfirmOpen(true);
  };

  const executeDelete = async () => {
    setIsConfirmOpen(false);
    setIsDeleteMode(false);
    setLoading(true);
    try {
      await deleteSessions(Array.from(selectedIds));
      setSessions(s => s.filter(x => !selectedIds.has(x.id)));
      setSelectedIds(new Set());
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to delete sessions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function loadHistory() {
      if (authLoading) return;
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setErrorMsg(null);
        const historySessions = await fetchWorkoutHistory(user.uid);
        
        // Fetch workout details and sets for each session in parallel, passing user.uid for custom routines
        const { workoutsList, exercisesList } = await fetchWorkoutsData(user.uid);
        const workoutMap = new Map(workoutsList.map(w => [w.id, w]));
        const exerciseMap = new Map(exercisesList.map(e => [e.id, e]));

        const promises = historySessions.map(async (session) => {
          if (!session.completedAt) return null;
          
          const workout = workoutMap.get(session.workoutId);
          const workoutName = workout?.name || 'Unknown Workout';
          const order = workout?.order || 0;
          
          const rawSets = await fetchSetsForSession(session.id);
          
          const populatedSets = rawSets.map((s) => {
            const ex = exerciseMap.get(s.exerciseId);
            return {
              ...s,
              exerciseName: ex ? ex.name : 'Unknown Exercise',
              type: ex ? ex.type : 'strength'
            };
          });

          // Sort sets by exercise appearance (in workout template or first logged order), then by setNumber
          const exerciseOrderMap = new Map<string, number>();
          if (workout?.exerciseIds) {
            workout.exerciseIds.forEach((id, idx) => exerciseOrderMap.set(id, idx));
          }

          populatedSets.sort((a, b) => {
            const orderA = exerciseOrderMap.has(a.exerciseId) ? exerciseOrderMap.get(a.exerciseId)! : 999;
            const orderB = exerciseOrderMap.has(b.exerciseId) ? exerciseOrderMap.get(b.exerciseId)! : 999;
            if (orderA !== orderB) {
              return orderA - orderB;
            }
            return a.setNumber - b.setNumber;
          });
          
          return {
            ...session,
            workoutName,
            order,
            sets: populatedSets
          } as PopulatedSession;
        });
        
        const results = await Promise.all(promises);
        const populated = results.filter((res): res is PopulatedSession => res !== null);
        
        setSessions(populated);
      } catch (err: any) {
        console.error('Error loading history:', err.code, err.message, err);
        setErrorMsg(err.message || 'Failed to load history.');
      } finally {
        setLoading(false);
      }
    }
    
    loadHistory();
  }, [user, authLoading]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin text-[#C0FF00] mb-4" />
        <p className="font-mono text-sm tracking-widest uppercase">Loading History...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="bg-[#111] border border-red-900/50 rounded-[24px] p-6 text-center">
        <Activity className="w-8 h-8 text-red-500 mx-auto mb-3" />
        <h3 className="text-red-500 font-display font-medium text-lg mb-2">Error Loading History</h3>
        <p className="text-red-400 font-sans text-sm">{errorMsg}</p>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center p-10 bg-[#111] border border-[#222] rounded-[24px]">
        <Activity className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <h3 className="text-white font-display font-medium text-lg mb-2">No Workouts Yet</h3>
        <p className="text-gray-400 font-sans text-sm">Complete your first workout to see it logged here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between min-h-[32px]">
        <h2 className="text-xl font-display font-black text-white uppercase tracking-tight">
          Training History
        </h2>
        
        {!isDeleteMode ? (
          <button 
            onClick={() => setIsDeleteMode(true)} 
            className="text-[#C0FF00] p-2 rounded-full hover:bg-[#1a1a1a] transition-colors"
            title="Delete Sessions"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex items-center space-x-3 transition-opacity">
            <button 
              onClick={() => { setIsDeleteMode(false); setSelectedIds(new Set()); }} 
              className="text-[11px] font-sans font-bold uppercase tracking-wider text-gray-500 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={requestDelete} 
              disabled={selectedIds.size === 0} 
              className="text-[11px] font-sans font-bold uppercase tracking-wider text-red-500 disabled:opacity-30 hover:bg-red-500/[0.1] px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete ({selectedIds.size})
            </button>
          </div>
        )}
      </div>
      
      {expandedSessionId ? (
        <div>
          <button 
            onClick={() => setExpandedSessionId(null)}
            className="mb-4 text-[#C0FF00] font-sans font-bold text-sm flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5" />
            BACK TO ALL SESSIONS
          </button>
          {sessions.filter(s => s.id === expandedSessionId).map(session => (
            <div key={session.id} className="bg-[#111] border border-[#222] rounded-[24px] p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-4 border-b border-[#222] gap-3">
                <div>
                  <h3 className="font-display font-black text-xl text-[#C0FF00] uppercase tracking-tight">
                    {session.workoutName}
                  </h3>
                  {editingDateSessionId === session.id ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2 bg-[#1a1a1a] p-1.5 rounded-lg border border-[#333]">
                      <input
                        type="datetime-local"
                        value={editingDateValue}
                        onChange={(e) => setEditingDateValue(e.target.value)}
                        className="bg-transparent text-white focus:outline-none focus:ring-1 focus:ring-[#C0FF00] rounded px-2 py-1 text-xs"
                      />
                      <div className="flex items-center gap-2">
                        <button onClick={(e) => { e.stopPropagation(); saveDateEdit(session); }} className="p-1.5 text-green-500 hover:bg-green-500/20 rounded bg-[#222]">
                          <Save className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); cancelDateEdit(); }} className="p-1.5 text-red-500 hover:bg-red-500/20 rounded bg-[#222]">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-gray-500 mt-2">
                      <span className="flex items-center gap-1.5 bg-[#1a1a1a] px-2.5 py-1 rounded-lg">
                        <Calendar className="w-3.5 h-3.5" />
                        {session.completedAt ? session.completedAt.toLocaleDateString() : 'N/A'}
                      </span>
                      <span className="flex items-center gap-1.5 bg-[#1a1a1a] px-2.5 py-1 rounded-lg">
                        <Clock className="w-3.5 h-3.5" />
                        {session.completedAt ? session.completedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                      </span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); startEditingDate(session); }}
                        className="p-1 hover:text-[#C0FF00] transition-colors rounded-lg hover:bg-[#1a1a1a]"
                        title="Edit Date"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Session Notes if logged */}
              {session.notes && (
                <div className="mb-6 p-3.5 bg-[#161616] border border-[#2a2a2a] rounded-xl flex items-start gap-2.5 text-xs text-gray-300">
                  <FileText className="w-4 h-4 text-[#C0FF00] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-mono text-[10px] uppercase font-bold text-[#C0FF00] block mb-0.5">Workout Notes</span>
                    <p className="whitespace-pre-wrap text-gray-300 font-sans">{session.notes}</p>
                  </div>
                </div>
              )}

              {/* Desktop Table view for Detail */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left font-sans text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-[#333] text-gray-400">
                      <th className="pb-3 font-semibold uppercase tracking-wider text-xs">Exercise</th>
                      <th className="pb-3 text-center font-semibold uppercase tracking-wider text-xs">Set</th>
                      <th className="pb-3 text-center font-semibold uppercase tracking-wider text-xs">Volume</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222]">
                    {session.sets.map((set, i) => {
                      const prevSet = i > 0 ? session.sets[i - 1] : null;
                      const isNewExerciseGroup = prevSet && prevSet.exerciseId !== set.exerciseId;

                      return (
                        <tr 
                          key={i} 
                          className={`hover:bg-[#1a1a1a] transition-colors ${isNewExerciseGroup ? 'border-t-2 border-[#333]' : ''}`}
                        >
                          <td className="py-3 pr-4 text-white font-medium">
                            {isNewExerciseGroup || i === 0 ? (
                              <span className="text-white font-bold">{set.exerciseName}</span>
                            ) : (
                              <span className="text-gray-500 text-xs pl-2">↳ {set.exerciseName}</span>
                            )}
                          </td>
                          <td className="py-3 text-center text-gray-400 font-mono">{set.setNumber}</td>
                          <td className="py-3 text-center text-white font-mono font-bold">
                            {set.type === 'strength' 
                              ? `${set.weight} kg × ${set.reps}`
                              : `${set.durationSeconds}s`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card Groups view for Detail */}
              <div className="sm:hidden space-y-3">
                {session.sets.reduce((acc, set) => {
                  const exIdx = acc.findIndex(g => g.exerciseName === set.exerciseName);
                  if (exIdx > -1) {
                    acc[exIdx].sets.push(set);
                  } else {
                    acc.push({ exerciseName: set.exerciseName, sets: [set] });
                  }
                  return acc;
                }, [] as any[]).map((group, idx) => (
                  <div key={idx} className="bg-[#1a1a1a] rounded-xl p-3 border border-[#2a2a2a]">
                    <h4 className="text-white text-[13px] font-bold mb-2 uppercase tracking-wide">{group.exerciseName}</h4>
                    <div className="space-y-2">
                      {group.sets.map((set: any, sIdx: number) => (
                         <div key={sIdx} className="flex justify-between items-center text-[12px] font-mono">
                           <span className="text-gray-500 font-sans font-medium text-[11px] uppercase w-12">Set {set.setNumber}</span>
                           <span className="text-white font-bold flex-1 text-right">
                             {set.type === 'strength' ? `${set.weight}kg × ${set.reps}` : `${set.durationSeconds}s`}
                           </span>
                         </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Global Grid Master View (Responsive: 4 cols mobile/tablet, 6 cols desktop) */
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {sessions.map(session => (
            <div 
              key={session.id} 
              className={`relative bg-[#111] border ${isDeleteMode && selectedIds.has(session.id) ? 'border-red-500 bg-red-500/[0.05]' : 'border-[#222]'} ${!isDeleteMode ? 'hover:border-[#C0FF00] hover:bg-[#161616]' : ''} rounded-[20px] p-4 flex flex-col justify-between cursor-pointer transition-all shadow-sm min-h-[110px] aspect-square group`}
              onClick={() => {
                if (isDeleteMode) {
                  toggleSelection(session.id);
                } else {
                  setExpandedSessionId(session.id);
                }
              }}
            >
              {isDeleteMode && (
                <div className="absolute top-2 right-2 pointer-events-none">
                  {selectedIds.has(session.id) ? <CheckCircle2 className="w-4 h-4 text-red-500" /> : <Circle className="w-4 h-4 text-gray-500" />}
                </div>
              )}
              <div>
                <h3 className={`font-display font-black text-xs sm:text-sm ${isDeleteMode && selectedIds.has(session.id) ? 'text-white' : 'text-[#C0FF00]'} uppercase tracking-tight leading-snug line-clamp-2 text-left w-full pr-3 group-hover:text-white transition-colors`}>
                  {session.workoutName}
                </h3>
                <span className="inline-block mt-2 text-[10px] font-mono text-gray-400 bg-[#1c1c1c] px-2 py-0.5 rounded">
                  {session.sets.length} sets
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[#1f1f1f] mt-2">
                <span className="text-[10px] font-mono text-gray-500 uppercase">
                  {session.completedAt ? session.completedAt.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }) : 'N/A'}
                </span>
                <span className="text-[9px] font-mono text-gray-600">
                  {session.completedAt ? session.completedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <ConfirmModal 
        isOpen={isConfirmOpen}
        title="Delete Workout Sessions"
        description={`Are you sure you want to delete ${selectedIds.size} session(s)? This action cannot be undone.`}
        onConfirm={executeDelete}
        onCancel={() => setIsConfirmOpen(false)}
        confirmText="Delete"
        confirmVariant="danger"
      />
    </div>
  );
};
