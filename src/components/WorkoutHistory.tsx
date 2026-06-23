import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { fetchWorkoutHistory, fetchSetsForSession, deleteSessions } from '../lib/firebaseData.ts';
import { Session, WorkoutSet, Workout, Exercise } from '../models.ts';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase.ts';
import { Activity, Calendar, Clock, Loader2, ChevronLeft, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal.tsx';

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
        
        // Fetch workout details and sets for each session in parallel
        const populated: PopulatedSession[] = [];
        
        const promises = historySessions.map(async (session) => {
          if (!session.completedAt) return null;
          
          let workoutName = 'Unknown Workout';
          let order = 0;
          try {
            const wDoc = await getDoc(doc(db, 'workouts', session.workoutId));
            if (wDoc.exists()) {
              workoutName = wDoc.data().name;
              order = wDoc.data().order;
            }
          } catch (e) {
            console.warn(e);
          }
          
          const rawSets = await fetchSetsForSession(session.id);
          
          // Fetch exercise names
          const exerciseCache: Record<string, Exercise> = {};
          const populatedSets = [];
          
          const exIds = Array.from(new Set(rawSets.map(s => s.exerciseId)));
          const exPromises = exIds.map(async (id) => {
            const eDoc = await getDoc(doc(db, 'exercises', id));
            if (eDoc.exists()) {
              exerciseCache[id] = { id: eDoc.id, ...eDoc.data() } as Exercise;
            }
          });
          
          await Promise.all(exPromises);
          
          for (const s of rawSets) {
            const ex = exerciseCache[s.exerciseId];
            populatedSets.push({
              ...s,
              exerciseName: ex ? ex.name : 'Unknown Exercise',
              type: ex ? ex.type : 'strength'
            });
          }
          
          return {
            ...session,
            workoutName,
            order,
            sets: populatedSets
          } as PopulatedSession;
        });
        
        const results = await Promise.all(promises);
        results.forEach(res => {
          if (res) populated.push(res);
        });
        
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
      
      <div className="space-y-6 hidden sm:block">
        {sessions.map(session => (
          <div 
            key={session.id} 
            className={`bg-[#111] border ${isDeleteMode && selectedIds.has(session.id) ? 'border-red-500' : 'border-[#222]'} ${isDeleteMode ? 'cursor-pointer hover:border-red-500/50' : ''} rounded-[24px] p-6 shadow-xl relative transition-colors`}
            onClick={() => {
              if (isDeleteMode) {
                toggleSelection(session.id);
              }
            }}
          >
            {isDeleteMode && (
              <div className="absolute top-6 right-6">
                {selectedIds.has(session.id) ? <CheckCircle2 className="w-5 h-5 text-red-500" /> : <Circle className="w-5 h-5 text-gray-500" />}
              </div>
            )}
            <div className="flex items-center justify-between xl:mr-10 mb-6 pb-4 border-b border-[#222]">
              <div>
                <h3 className="font-display font-black text-lg text-[#C0FF00] uppercase tracking-tight">
                  {session.workoutName}
                </h3>
                <div className="flex items-center gap-4 text-xs font-mono text-gray-500 mt-2">
                  <span className="flex items-center gap-1.5 bg-[#1a1a1a] px-2.5 py-1 rounded-lg">
                    <Calendar className="w-3.5 h-3.5" />
                    {session.completedAt ? session.completedAt.toDate().toLocaleDateString() : 'N/A'}
                  </span>
                  <span className="flex items-center gap-1.5 bg-[#1a1a1a] px-2.5 py-1 rounded-lg">
                    <Clock className="w-3.5 h-3.5" />
                    {session.completedAt ? session.completedAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-sm border-collapse">
                <thead>
                  <tr className="border-b border-[#333] text-gray-400">
                    <th className="pb-3 font-semibold uppercase tracking-wider text-xs">Exercise</th>
                    <th className="pb-3 text-center font-semibold uppercase tracking-wider text-xs">Set</th>
                    <th className="pb-3 text-center font-semibold uppercase tracking-wider text-xs">Volume</th>
                    <th className="pb-3 text-center font-semibold uppercase tracking-wider text-xs">RIR / Diff</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222]">
                  {session.sets.map((set, i) => (
                    <tr key={i} className="hover:bg-[#1a1a1a] transition-colors">
                      <td className="py-3 pr-4 text-white font-medium">{set.exerciseName}</td>
                      <td className="py-3 text-center text-gray-400 font-mono">{set.setNumber}</td>
                      <td className="py-3 text-center text-white font-mono font-bold">
                        {set.type === 'strength' 
                          ? `${set.weight} kg × ${set.reps}`
                          : `${set.durationSeconds}s`}
                      </td>
                      <td className="py-3 text-center text-gray-400 font-mono">
                        {set.type === 'strength' ? `RIR: ${set.rir ?? '-'}` : `Diff: ${set.painScore ?? '-'}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      <div className="sm:hidden">
        {expandedSessionId ? (
          <div>
            <button 
              onClick={() => setExpandedSessionId(null)}
              className="mb-4 text-[#C0FF00] font-sans font-bold text-sm flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <ChevronLeft className="w-5 h-5" />
              BACK TO LOGS
            </button>
            {sessions.filter(s => s.id === expandedSessionId).map(session => (
              <div key={session.id} className="bg-[#111] border border-[#222] rounded-[24px] p-5 shadow-xl">
                <div className="mb-4 pb-4 border-b border-[#222]">
                  <h3 className="font-display font-black text-base text-[#C0FF00] uppercase tracking-tight">
                    {session.workoutName}
                  </h3>
                  <p className="text-[11px] font-mono text-gray-500 mt-1.5 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" />
                    {session.completedAt ? session.completedAt.toDate().toLocaleDateString() : 'N/A'} at {session.completedAt ? session.completedAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                  </p>
                </div>
                
                <div className="space-y-3">
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
                             <span className="text-gray-500 min-w-[50px] text-right ml-3">
                               {set.type === 'strength' ? `RIR: ${set.rir ?? '-'}` : `Df: ${set.painScore ?? '-'}`}
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
        <div className="grid grid-cols-4 gap-2">
          {sessions.map(session => (
            <div 
              key={session.id} 
              className={`relative bg-[#111] border ${isDeleteMode && selectedIds.has(session.id) ? 'border-red-500 bg-red-500/[0.05]' : 'border-[#222]'} ${!isDeleteMode ? 'hover:border-[#C0FF00]' : ''} rounded-[16px] p-2.5 flex flex-col justify-between cursor-pointer transition-colors shadow-sm min-h-[85px] aspect-square`}
              onClick={() => {
                if (isDeleteMode) {
                  toggleSelection(session.id);
                } else {
                  setExpandedSessionId(session.id);
                }
              }}
            >
              {isDeleteMode && (
                <div className="absolute top-1 right-1 pointer-events-none">
                  {selectedIds.has(session.id) ? <CheckCircle2 className="w-4 h-4 text-red-500" /> : <Circle className="w-4 h-4 text-gray-500" />}
                </div>
              )}
              <h3 className={`font-display font-black text-[10px] sm:text-[11px] ${isDeleteMode && selectedIds.has(session.id) ? 'text-white' : 'text-[#C0FF00]'} uppercase tracking-tight leading-tight line-clamp-3 text-left w-full pr-4`}>
                {session.workoutName}
              </h3>
              <p className="text-[9px] font-mono text-gray-500 uppercase text-right mt-1 w-full flex-shrink-0">
                {session.completedAt ? session.completedAt.toDate().toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }) : 'N/A'}
              </p>
            </div>
          ))}
        </div>
        )}
      </div>
      
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
