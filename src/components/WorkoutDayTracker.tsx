import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Workout, Exercise, UserProfile, WorkoutSet } from '../models.ts';
import { fetchWorkoutsData, getUserProgressState, logSessionCompletion, seedTemplatesIfMissing } from '../lib/firebaseData.ts';
import { SessionEngine, ProgressionEngine } from '../engine.ts';
import { Dumbbell, Calendar, Zap, AlertTriangle, ChevronRight, CheckCircle2, ChevronLeft, Plus, Minus, Loader2, Eye, EyeOff } from 'lucide-react';

const WGER_EXACT_MATCHES: Record<string, number> = {
  "Lat Pulldown": 158,
  "Bench Press": 163,
  "Romanian Deadlift": 1700,
  "Plank": 1911,
};

const WgerExerciseInfo: React.FC<{ exerciseName: string }> = ({ exerciseName }) => {
  const [description, setDescription] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchDescription = async () => {
      setLoading(true);
      try {
        let exerciseId = WGER_EXACT_MATCHES[exerciseName];

        if (!exerciseId) {
          // Attempt an autocomplete from the web endpoint using search
          try {
            const searchRes = await fetch(`https://wger.de/api/v2/exercise/?name=${encodeURIComponent(exerciseName)}&language=2`);
            if (searchRes.ok) {
              const searchData = await searchRes.json();
              if (searchData.results && searchData.results.length > 0) {
                const exactMatch = searchData.results.find((r: any) => r.name?.toLowerCase() === exerciseName?.toLowerCase());
                if (exactMatch) {
                  exerciseId = exactMatch.id;
                } else {
                  // Only use exact string match from search endpoint
                }
              }
            }
          } catch (e) {
            console.warn("Wger search failed, falling back", e);
          }
        }
        
        if (exerciseId) {
          try {
            const infoRes = await fetch(`https://wger.de/api/v2/exerciseinfo/${exerciseId}/`);
            if (!infoRes.ok) {
              setDescription("No detailed description available for this exercise.");
              setLoading(false);
              return;
            }
            const infoData = await infoRes.json();
            
            const translations = infoData.translations || [];
            const englishTranslation = translations.find((t: any) => t.language === 2);
            const anyTranslation = translations[0];
            
            if (englishTranslation && englishTranslation.description) {
              setDescription(englishTranslation.description);
            } else if (anyTranslation && anyTranslation.description) {
              setDescription(anyTranslation.description);
            } else {
              setDescription("No detailed description available for this exercise.");
            }
          } catch (e) {
            setDescription("No detailed description available for this exercise.");
          }
        } else {
          setDescription("No detailed description available for this exercise.");
        }
      } catch (e) {
        setDescription("No detailed description available for this exercise.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchDescription();
  }, [exerciseName]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono animate-pulse p-3 bg-[#161616] rounded-xl border border-[#222] mb-3">
        <Loader2 className="w-3 h-3 animate-spin" />
        Loading instructions...
      </div>
    );
  }

  if (!description) return null;

  return (
    <div className="bg-[#161616] border border-[#2d2d2d] rounded-xl text-xs text-gray-300 font-sans shadow-none mb-3 overflow-hidden transition-all duration-200">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 text-[10px] font-black font-mono text-gray-400 uppercase tracking-widest hover:bg-[#1a1a1a] transition-colors"
      >
        <span className="flex items-center gap-2">
          <Eye className="w-3 h-3" />
          How to perform
        </span>
        <ChevronRight className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
      </button>
      
      {isOpen && (
        <div 
          className="wger-content p-4 pt-0 border-t border-[#2d2d2d] mt-2 text-gray-400 [&>p]:mb-2 [&>ul]:list-disc [&>ul]:ml-4 [&>ul]:mb-2 [&>ol]:list-decimal [&>ol]:ml-4" 
          dangerouslySetInnerHTML={{ __html: description }} 
        />
      )}
    </div>
  );
};

export const WorkoutDayTracker: React.FC = () => {
  const { getAuthHeaders, user } = useAuth();
  
  // App/workflow state
  const [workouts, setWorkouts] = useState<(Workout & { exercises: Exercise[] })[]>([]);
  const [activeWorkout, setActiveWorkout] = useState<(Workout & { exercises: Exercise[] }) | null>(null);
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [lastSessionDay, setLastSessionDay] = useState<number | null>(null);
  const [suggestedDay, setSuggestedDay] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [loggingWorkout, setLoggingWorkout] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Recovery States
  const [sleepHours, setSleepHours] = useState(8);
  const [energyScore, setEnergyScore] = useState(7);
  const [sessionDate, setSessionDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // Active workout entry inputs state
  // Key format: `${exerciseId}-${setNumber}` (setNumber starts from 1)
  const [inputs, setInputs] = useState<Record<string, {
    weight: string;
    reps: string;
    rir: string;
    durationSeconds?: string;
    difficulty?: string;
    painScore: string;
  }>>({});

  // 1. Initial configuration load
  const loadWorkflowState = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      
      if (!user) {
        console.log("No user, aborting loadWorkflowState");
        return;
      }

      console.log("Starting seedTemplatesIfMissing...");
      await seedTemplatesIfMissing();
      console.log("Finished seedTemplatesIfMissing.");

      console.log("Starting Promise.all for fetching data...");
      const [wData, progressState] = await Promise.all([
        fetchWorkoutsData(),
        getUserProgressState(user.uid)
      ]);
      console.log("Finished Promise.all.", wData, progressState);

      setWorkouts(wData.combinedWorkouts);
      setUserProfile(progressState);

      const computedNextDay = SessionEngine.calculateNextWorkoutOrder(progressState);
      setSuggestedDay(computedNextDay);
      
      if (progressState.lastCompletedWorkoutOrder) {
        setLastSessionDay(progressState.lastCompletedWorkoutOrder);
      } else {
        setLastSessionDay(null);
      }

      // Auto-set workout to the suggested day
      const targetW = wData.combinedWorkouts.find(w => w.order === computedNextDay) || wData.combinedWorkouts[0];
      setActiveWorkout(targetW || null);

    } catch (err: any) {
      console.error("loadWorkflowState ERROR:", err);
      setErrorMsg(`Failed to synchronize active workout progression. ERROR: ${err.message}`);
    } finally {
      console.log("loadWorkflowState FINALLY reached - setting loading to false");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadWorkflowState();
  }, [user]);

  // 2. Load previous sets cache whenever active workout switches
  useEffect(() => {
    if (!activeWorkout || !userProfile) return;

    if (activeWorkout.exercises && activeWorkout.exercises.length > 0) {
      setExpandedExerciseId(activeWorkout.exercises[0].id);
    } else {
      setExpandedExerciseId(null);
    }

    const prepopulateInputs = () => {
      const newInputs: Record<string, { weight: string; reps: string; rir: string; durationSeconds: string; difficulty: string; painScore: string }> = {};

      activeWorkout.exercises.forEach((ex) => {
        const cachedEx = ProgressionEngine.evaluateProgression(ex.id, userProfile.lastSetSummaryPerExercise);
        
        // Prepopulate sets inputs using the previous set specs (or defaults)
        for (let i = 1; i <= ex.targetSets; i++) {
          if (ex.type === 'timed') {
            const dsVal = cachedEx && cachedEx.lastDurationSeconds != null
              ? cachedEx.lastDurationSeconds.toString()
              : (ex.targetRepMin?.toString() || '60');

            newInputs[`${ex.id}-${i}`] = {
              weight: '',
              reps: '',
              rir: '',
              durationSeconds: dsVal,
              difficulty: '7',
              painScore: '0',
            };
          } else {
            const wtVal = cachedEx && cachedEx.lastWeight != null
              ? cachedEx.lastWeight.toString()
              : '20';
            const rpVal = cachedEx && cachedEx.lastReps != null
              ? cachedEx.lastReps.toString()
              : (ex.targetRepMin?.toString() || '10');

            newInputs[`${ex.id}-${i}`] = {
              weight: wtVal,
              reps: rpVal,
              rir: '2',
              durationSeconds: '',
              difficulty: '',
              painScore: '0',
            };
          }
        }
      });

      setInputs(newInputs);
    };

    prepopulateInputs();
  }, [activeWorkout, userProfile]);

  // Utility to handle incrementing/decrementing numeric inputs easily
  const updateInputValue = (key: string, field: 'weight' | 'reps' | 'durationSeconds' | 'difficulty', step: number) => {
    setInputs(prev => {
      const current = prev[key] || { weight: '20', reps: '10', rir: '2', durationSeconds: '30', difficulty: '7', painScore: '0' };
      const baseNum = parseFloat(current[field] || '0');
      if (isNaN(baseNum)) return prev;

      let nextVal = baseNum + step;
      if (nextVal < 0) nextVal = 0;

      // Format weights to 1 decimal point if float, clean reps
      const formatted = field === 'weight' ? (Math.round(nextVal * 10) / 10).toString() : Math.round(nextVal).toString();

      return {
        ...prev,
        [key]: {
          ...current,
          [field]: formatted
        }
      };
    });
  };

  const handleTextChange = (key: string, field: 'weight' | 'reps' | 'rir' | 'painScore' | 'durationSeconds' | 'difficulty', value: string) => {
    setInputs(prev => {
      const current = prev[key] || { weight: '20', reps: '10', rir: '2', durationSeconds: '30', difficulty: '7', painScore: '0' };
      return {
        ...prev,
        [key]: {
          ...current,
          [field]: value
        }
      };
    });
  };

  // 3. Compute Auto Progression triggers based on user's previous logged history
  const getProgressionAdvice = (ex: Exercise): { action: 'increase' | 'keep' | 'loading'; details: string } => {
    if (!userProfile) return { action: 'loading', details: 'Checking history...' };
    
    const cachedEx = ProgressionEngine.evaluateProgression(ex.id, userProfile.lastSetSummaryPerExercise);
    
    if (!cachedEx) {
      return { action: 'keep', details: 'First log. Start focused.' };
    }

    if (ex.type === 'timed') {
      const hitMaxDuration = (cachedEx.lastDurationSeconds || 0) >= ex.targetRepMax;

      if (hitMaxDuration) {
        return {
          action: 'increase',
          details: `Time Target Cleared! Increase time (+5s) or add lever difficulty.`
        };
      } else {
        const lastDuration = cachedEx.lastDurationSeconds || 30;
        return {
          action: 'keep',
          details: `Hold clean form. Target ${ex.targetRepMax}s (last: ${lastDuration}s).`
        };
      }
    }

    const maxRepsConstraint = ex.targetRepMax;
    const hitMaxReps = (cachedEx.lastReps || 0) >= maxRepsConstraint;

    if (hitMaxReps) {
      // Suggest increase weight
      const lastAvgWeight = Number(cachedEx.lastWeight || 0);
      const proposedNewWeight = lastAvgWeight + 2.5;
      return {
        action: 'increase',
        details: `Progression Hit! Try ${proposedNewWeight.toFixed(1)}kg (+2.5kg)`
      };
    } else {
      // Keep weight
      return {
        action: 'keep',
        details: `Keep weight at current ${Number(cachedEx.lastWeight || 20)}kg to master reps.`
      };
    }
  };

  // 4. Submit logs handler
  const handleLogWorkout = async () => {
    if (!activeWorkout) return;

    setLoggingWorkout(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // Consolidate sets values from input map
      const finalSetsPayload: Array<{
        exerciseId: number;
        setNumber: number;
        weight?: number | null;
        reps?: number | null;
        rir?: number | null;
        durationSeconds?: number | null;
        difficulty?: number | null;
        painScore: number;
      }> = [];

      for (const ex of activeWorkout.exercises) {
        for (let i = 1; i <= ex.targetSets; i++) {
          const key = `${ex.id}-${i}`;
          const isTimed = ex.type === 'timed';
          const defaultInput = isTimed
            ? { weight: '', reps: '', rir: '', durationSeconds: (ex.targetRepMin?.toString() || '30'), difficulty: '7', painScore: '0' }
            : { weight: '20', reps: '10', rir: '2', durationSeconds: '', difficulty: '', painScore: '0' };

          const inputValues = inputs[key] || defaultInput;
          const painNum = parseInt(inputValues.painScore || '0', 10);

          if (isTimed) {
            const secNum = parseInt(inputValues.durationSeconds || '', 10);
            const diffNum = parseInt(inputValues.difficulty || '', 10);

            if (isNaN(secNum)) {
              throw new Error(`Invalid duration seconds detected on "${ex.name}" Set #${i}. Please correct.`);
            }

            finalSetsPayload.push({
              exerciseId: ex.id,
              setNumber: i,
              weight: null,
              reps: null,
              rir: null,
              durationSeconds: secNum,
              difficulty: isNaN(diffNum) ? null : diffNum,
              painScore: painNum
            });
          } else {
            const weightNum = parseFloat(inputValues.weight || '');
            const repsNum = parseInt(inputValues.reps || '', 10);
            const rirNum = parseInt(inputValues.rir || '', 10);

            if (isNaN(weightNum) || isNaN(repsNum)) {
              throw new Error(`Invalid weight or reps detected on "${ex.name}" Set #${i}. Please correct.`);
            }

            finalSetsPayload.push({
              exerciseId: ex.id,
              setNumber: i,
              weight: weightNum,
              reps: repsNum,
              rir: isNaN(rirNum) ? 0 : rirNum,
              durationSeconds: null,
              difficulty: null,
              painScore: painNum
            });
          }
        }
      }

      let completedAtDate = undefined;
      if (sessionDate) {
         // Create a date in local time using the provided date, but current time to keep it accurate
         const now = new Date();
         const [y, m, d] = sessionDate.split('-');
         completedAtDate = new Date(parseInt(y), parseInt(m)-1, parseInt(d), now.getHours(), now.getMinutes(), now.getSeconds());
      }

      await logSessionCompletion(user!.uid, activeWorkout.id, finalSetsPayload, activeWorkout.exercises, completedAtDate);

      setSuccessMsg(`Workout successfully saved! Next workout Day updated.`);
      
      // Fast refresh and scroll up
      window.scrollTo({ top: 0, behavior: 'smooth' });
      await loadWorkflowState();
      
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to log workout session details.');
    } finally {
      setLoggingWorkout(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#C0FF00]" />
        <span className="font-mono text-xs text-gray-400 uppercase tracking-widest font-semibold">Hydrating session metrics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 3-Day split selector */}
      <div className="bg-[#111] border border-[#222] rounded-[24px] p-5 shadow-xl relative overflow-hidden">
        <label className="block text-[10px] font-bold text-[#C0FF00] uppercase tracking-widest mb-3 font-mono">
          Select Routine
        </label>
        <div className="grid grid-cols-3 gap-2.5">
          {workouts.map((w) => {
            const isSuggested = suggestedDay === w.order;
            const isActive = activeWorkout?.id === w.id;

            return (
              <button
                key={w.id}
                onClick={() => {
                  setActiveWorkout(w);
                  setErrorMsg(null);
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
        
        {lastSessionDay && (
          <div className="mt-4 text-[10px] text-gray-500 font-sans flex items-center justify-between border-t border-[#222] pt-3">
            <span className="font-mono">LAST COMPLETED ROUTINE: <strong className="text-gray-200">{workouts.find(w => w.order === lastSessionDay)?.name || lastSessionDay}</strong></span>
            <span className="flex items-center gap-1.5 text-[#C0FF00] font-bold font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-[#C0FF00] inline-block animate-pulse"></span>
              SUGGESTED: {workouts.find(w => w.order === suggestedDay)?.name.split(' (')[0] || suggestedDay}
            </span>
          </div>
        )}
      </div>

      {activeWorkout && (
        <div className="space-y-6">
          
          {/* Section 2: Recovery Metrics Header block */}
          <div className="bg-[#111111] border border-[#222] rounded-[24px] p-5 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#222] pb-4 gap-3">
              <div className="min-w-0">
                <h3 className="font-display font-black italic text-lg text-white uppercase tracking-tight">
                  {activeWorkout.name}
                </h3>
                <div className="h-[2px] bg-gradient-to-r from-[#C0FF00] to-transparent w-36 mt-1 opacity-50"></div>
              </div>

              <div className="relative shrink-0 w-full sm:w-auto">
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="w-full sm:w-auto pl-8 pr-3 py-1.5 text-xs border border-[#333] rounded-xl bg-[#1a1a1a] text-white font-mono focus:outline-none focus:border-[#C0FF00]"
                />
                <Calendar className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2.5" />
              </div>
            </div>

            {/* Recovery Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-gray-400">
                  <span className="uppercase tracking-wider font-mono">Sleep (Hrs)</span>
                  <span className="font-mono text-[#C0FF00] bg-[#1a1a1a] px-2 py-0.5 rounded border border-[#222]">
                    {sleepHours} hrs
                  </span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="12"
                  step="0.5"
                  value={sleepHours}
                  onChange={(e) => setSleepHours(parseFloat(e.target.value))}
                  className="w-full h-1 bg-[#222] rounded-lg appearance-none cursor-pointer accent-[#C0FF00]"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-gray-400">
                  <span className="uppercase tracking-wider font-mono">Energy (1-10)</span>
                  <span className="font-mono text-[#C0FF00] bg-[#1a1a1a] px-2 py-0.5 rounded border border-[#222]">
                    {energyScore} / 10
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={energyScore}
                  onChange={(e) => setEnergyScore(parseInt(e.target.value, 10))}
                  className="w-full h-1 bg-[#222] rounded-lg appearance-none cursor-pointer accent-[#C0FF00]"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Exercises Logging block list */}
          <div className="space-y-5">
            {activeWorkout.exercises.map((ex) => {
              const cachedEx = userProfile?.lastSetSummaryPerExercise?.[ex.id];
              const advice = getProgressionAdvice(ex);
              const isExpanded = expandedExerciseId === ex.id;

              return (
                <div key={ex.id} className={`bg-[#111] border rounded-[24px] shadow-xl transition-all ${isExpanded ? 'border-[#333] p-5 space-y-4' : 'border-[#222] hover:border-[#333] p-4'}`}>
                  {/* Exercise metadata details header */}
                  <div 
                    className={`flex flex-col sm:flex-row sm:items-start justify-between gap-3 cursor-pointer ${isExpanded ? 'border-b border-[#1f1f1f] pb-3' : ''}`}
                    onClick={() => setExpandedExerciseId(isExpanded ? null : ex.id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className={`font-display font-black text-base tracking-tight uppercase hover:text-[#C0FF00] transition-colors ${isExpanded ? 'text-white' : 'text-gray-300'}`}>
                          {ex.name}
                        </h4>
                        {!isExpanded && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setExpandedExerciseId(ex.id); }}
                            className="p-1.5 text-gray-500 hover:text-white bg-[#1a1a1a] rounded-lg border border-[#333] transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        {isExpanded && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setExpandedExerciseId(null); }}
                            className="p-1.5 text-[#C0FF00] bg-[#1a1a1a] rounded-lg border border-[#333] transition-colors self-start ml-3 sm:hidden"
                          >
                            <EyeOff className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <p className="font-sans text-[11px] text-gray-400 mt-0.5 uppercase tracking-wider font-semibold">
                        Target Volume: <span className="text-[#C0FF00] font-mono">{ex.targetSets} sets × {ex.targetRepMin}-{ex.targetRepMax} {ex.type === 'timed' ? 'seconds' : 'reps'}</span>
                      </p>
                    </div>

                    {/* Dynamic Auto-progression coach recommendation badge */}
                    <div className="flex items-center gap-3">
                      {advice.action === 'increase' ? (
                        <div className="bg-[#C0FF00] text-black rounded-xl px-3 py-1 flex items-center gap-1.5 shrink-0 shadow-[0_0_15px_rgba(192,255,0,0.15)]">
                          <Zap className="w-3.5 h-3.5 fill-black text-black" />
                          <span className="text-[10px] sm:text-xs font-black uppercase tracking-tight font-sans">
                            {advice.details}
                          </span>
                        </div>
                      ) : advice.action === 'keep' && cachedEx && isExpanded ? (
                        <div className="bg-[#1a1a1a] border border-[#333] text-gray-300 rounded-xl px-2.5 py-1 flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] sm:text-xs font-mono uppercase tracking-wide text-gray-400">
                            {advice.details}
                          </span>
                        </div>
                      ) : null}
                      
                      {isExpanded && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setExpandedExerciseId(null); }}
                          className="hidden sm:block p-1.5 text-[#C0FF00] bg-[#1a1a1a] rounded-lg border border-[#333] transition-colors hover:bg-[#222]"
                        >
                          <EyeOff className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <>
                      <WgerExerciseInfo exerciseName={ex.name} />
                      {/* Previous Historical Reference sub-line */}
                  {cachedEx && (
                    <div className="bg-[#1a1a1a] rounded-xl border border-[#222] p-3 flex flex-col gap-2 text-[10px] font-mono text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <span className="font-sans font-extrabold text-[8px] uppercase tracking-widest text-[#C0FF00] border border-[#C0FF00]/40 px-1.5 py-0.5 rounded">
                          LAST LOG
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        {ex.type === 'timed' ? (
                          <div className="bg-[#222] border border-[#333] px-2 py-1.5 rounded-lg">
                            <span className="text-white font-bold">{cachedEx.lastDurationSeconds}s</span>
                          </div>
                        ) : (
                          <div className="bg-[#222] border border-[#333] px-2 py-1.5 rounded-lg">
                            <span className="text-white font-bold">{cachedEx.lastWeight}kg</span>
                            <span className="mx-1 text-gray-600">x</span>
                            <span className="text-[#C0FF00] font-bold">{cachedEx.lastReps}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Active Entry fields grid */}
                  <div className="space-y-3">
                    {/* Rows header */}
                    <div className="hidden sm:grid grid-cols-12 gap-3 text-[9px] font-black text-gray-500 uppercase tracking-widest px-2 pb-1.5 font-mono">
                      <div className="col-span-2">SET</div>
                      <div className="col-span-5 text-center">{ex.type === 'timed' ? 'DURATION (SECONDS)' : 'WEIGHT (KG)'}</div>
                      <div className="col-span-3 text-center">{ex.type === 'timed' ? 'DIFFICULTY (1-10)' : 'REPS'}</div>
                      <div className="col-span-1 text-center">{ex.type === 'timed' ? '' : 'RIR'}</div>
                      <div className="col-span-1 text-right">PAIN</div>
                    </div>

                    {/* Entry sets lines */}
                    {Array.from({ length: ex.targetSets }).map((_, index) => {
                      const setNum = index + 1;
                      const inputKey = `${ex.id}-${setNum}`;
                      const values = inputs[inputKey] || { weight: '20', reps: '10', rir: '2', durationSeconds: '30', difficulty: '7', painScore: '0' };

                      return (
                        <div 
                          key={setNum}
                          className="flex flex-col sm:grid sm:grid-cols-12 gap-3 items-stretch sm:items-center bg-[#1a1a1a] border border-[#222] p-4 sm:p-2 rounded-xl hover:border-[#333] transition-colors"
                        >
                          {/* Label set number */}
                          <div className="col-span-2 flex items-center justify-between sm:justify-start gap-1 font-mono text-xs font-bold text-gray-300 border-b border-[#2d2d2d] sm:border-0 pb-1.5 sm:pb-0 mb-1.5 sm:mb-0">
                            <span className="uppercase tracking-wider text-[#C0FF00]">SET {setNum}</span>
                            <span className="sm:hidden font-sans font-semibold text-[10px] text-gray-500">
                              TARGET: {ex.targetRepMin}-{ex.targetRepMax} {ex.type === 'timed' ? 's' : 'reps'}
                            </span>
                          </div>

                          {ex.type === 'timed' ? (
                            <>
                              {/* Duration seconds quick adjust */}
                              <div className="col-span-5 flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => updateInputValue(inputKey, 'durationSeconds', -10)}
                                  className="p-1 px-1.5 border border-[#333] bg-[#222] rounded-lg hover:border-[#C0FF00]/40 text-gray-300 text-[10px] font-mono cursor-pointer select-none"
                                >
                                  -10s
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateInputValue(inputKey, 'durationSeconds', -5)}
                                  className="p-1 px-1.5 border border-[#333] bg-[#222] rounded-lg hover:border-[#C0FF00]/40 text-gray-300 text-[10px] font-mono cursor-pointer select-none"
                                >
                                  -5s
                                </button>
                                
                                <input
                                  type="text"
                                  value={values.durationSeconds || ''}
                                  onChange={(e) => handleTextChange(inputKey, 'durationSeconds', e.target.value)}
                                  className="w-18 px-1 py-1 bg-[#111] border border-[#333] rounded-lg text-center text-xs font-mono font-black text-white focus:outline-none focus:ring-1 focus:ring-[#C0FF00]"
                                  placeholder="Secs"
                                />
                                
                                <button
                                  type="button"
                                  onClick={() => updateInputValue(inputKey, 'durationSeconds', 5)}
                                  className="p-1 px-1.5 border border-[#333] bg-[#222] rounded-lg hover:border-[#C0FF00]/40 text-gray-300 text-[10px] font-mono cursor-pointer select-none"
                                >
                                  +5s
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateInputValue(inputKey, 'durationSeconds', 10)}
                                  className="p-1 px-1.5 border border-[#333] bg-[#222] rounded-lg hover:border-[#C0FF00]/40 text-gray-300 text-[10px] font-mono cursor-pointer select-none"
                                >
                                  +10s
                                </button>
                              </div>

                              {/* Difficulty Rating */}
                              <div className="col-span-3 flex items-center justify-center gap-1.5 mt-2 sm:mt-0">
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
                                  className="w-14 px-1 py-1 bg-[#111] border border-[#333] rounded-lg text-center text-xs font-mono font-black text-[#C0FF00] focus:outline-none focus:ring-1 focus:ring-[#C0FF00]"
                                  placeholder="1-10"
                                />
                                <button
                                  type="button"
                                  onClick={() => updateInputValue(inputKey, 'difficulty', 1)}
                                  className="p-1 px-2 border border-[#333] bg-[#222] rounded-lg hover:border-[#C0FF00]/40 text-gray-300 text-xs cursor-pointer select-none"
                                >
                                  +1
                                </button>
                              </div>

                              {/* Invisible spacer for RIR column alignment on desktop */}
                              <div className="col-span-1 hidden sm:block"></div>
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
                              <div className="col-span-3 flex items-center justify-center gap-1.5 mt-2 sm:mt-0">
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

                              {/* RIR Selection */}
                              <div className="col-span-1 flex items-center justify-between sm:justify-center gap-1.5 mt-2 sm:mt-0">
                                <label className="sm:hidden text-[10px] font-bold text-gray-500 uppercase font-mono">RIR</label>
                                <select
                                  value={values.rir}
                                  onChange={(e) => handleTextChange(inputKey, 'rir', e.target.value)}
                                  className="px-1 py-1 border border-[#333] bg-[#111] text-white rounded-lg text-xs font-mono focus:outline-none"
                                >
                                  <option value="0">0 (Limit)</option>
                                  <option value="1">1 RIR</option>
                                  <option value="2">2 RIR</option>
                                  <option value="3">3 RIR</option>
                                  <option value="4">4 RIR</option>
                                  <option value="5">5+ RIR</option>
                                </select>
                              </div>
                            </>
                          )}

                          {/* Pain Score Selection */}
                          <div className="col-span-1 flex items-center justify-between sm:justify-end gap-1.5 mt-2 sm:mt-0">
                            <label className="sm:hidden text-[10px] font-bold text-gray-500 uppercase font-mono">PAIN</label>
                            <select
                              value={values.painScore}
                              onChange={(e) => handleTextChange(inputKey, 'painScore', e.target.value)}
                              className="px-1 py-1 border border-[#333] bg-[#111] text-white rounded-lg text-xs font-mono cursor-pointer"
                            >
                              {Array.from({ length: 11 }).map((_, p) => (
                                <option key={p} value={p}>{p}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

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
          <button
            onClick={handleLogWorkout}
            disabled={loggingWorkout}
            className="w-full flex items-center justify-center gap-2.5 py-4 bg-white hover:bg-gray-100 disabled:bg-[#1a1a1a] disabled:text-gray-600 disabled:border-[#222] text-black rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-200 shadow-[0_0_25px_rgba(255,255,255,0.06)] cursor-pointer"
          >
            {loggingWorkout ? (
              <Loader2 className="w-4 h-4 animate-spin text-black" />
            ) : (
              <Dumbbell className="w-4.5 h-4.5 fill-black" />
            )}
            SUBMIT WORKOUT
          </button>
        </div>
      )}
    </div>
  );
};
