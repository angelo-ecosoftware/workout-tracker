import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  fetchWorkoutHistory,
  fetchAllSetsForUser,
  fetchWorkoutsData,
  initializeUser,
  fetchBodyMeasurementLogs,
  fetchSavedRoutinePrograms,
} from '../../lib/supabaseData.ts';
import {
  calculateInsights,
  calculateExerciseProgression,
  InsightsMetrics,
  ExerciseProgressionReport,
} from '../../lib/insightsEngine.ts';
import { Session, WorkoutSet, Exercise, UserMetrics, BodyMeasurementLog, SavedRoutineProgram } from '../../models.ts';
import { ExerciseProgressionCard } from '../workout/ExerciseProgressionCard.tsx';
import {
  Calendar,
  Activity,
  Sparkles,
  Loader2,
  ChevronDown,
  Scale,
  Dumbbell,
} from 'lucide-react';
import { InsightsHeroMetrics } from './InsightsHeroMetrics.tsx';
import { InsightsHeatmapCard } from './InsightsHeatmapCard.tsx';
import { InsightsBmiCard, BmiCategoryInfo, HoveredBmiDay } from './InsightsBmiCard.tsx';
import { WeeklyVolumeChart } from './WeeklyVolumeChart.tsx';
import { RestPacingCard } from './RestPacingCard.tsx';
import { ProgramScopeSelector } from './ProgramScopeSelector.tsx';
import { HeatmapDay } from '../../lib/insightsEngine.ts';
import { Workout } from '../../models.ts';

interface WorkoutsDataPayload {
  combinedWorkouts: (Workout & { exercises: Exercise[] })[];
  workoutsList: Workout[];
  exercisesList: Exercise[];
  workoutExercisesList?: { workout_id: string; exercise_id: string; position: number }[];
}

interface InsightsViewProps {
  userId?: string;
}

export const InsightsView: React.FC<InsightsViewProps> = ({ userId: propUserId }) => {
  const { user, loading: authLoading } = useAuth();
  const activeUserId = propUserId || user?.uid;
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [userMetrics, setUserMetrics] = useState<UserMetrics | null>(null);
  const [bodyLogs, setBodyLogs] = useState<BodyMeasurementLog[]>([]);
  const [savedPrograms, setSavedPrograms] = useState<SavedRoutineProgram[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string>('all');
  const [hoveredDay, setHoveredDay] = useState<HeatmapDay | null>(null);
  const [hoveredBmiDay, setHoveredBmiDay] = useState<HoveredBmiDay | null>(null);
  const [activeInfoKey, setActiveInfoKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'heatmap' | 'bmi'>('heatmap');

  // Raw data from DB
  const [rawSessions, setRawSessions] = useState<Session[]>([]);
  const [rawSets, setRawSets] = useState<WorkoutSet[]>([]);
  const [rawWorkoutsData, setRawWorkoutsData] = useState<WorkoutsDataPayload | null>(null);

  // Per-exercise progression state
  const [exercisesList, setExercisesList] = useState<Exercise[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [exerciseReport, setExerciseReport] = useState<ExerciseProgressionReport | null>(null);

  useEffect(() => {
    async function loadData() {
      if (authLoading) return;
      if (!activeUserId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErrorMsg(null);

        const [historySessions, allSets, workoutsData, userProfile, historicalBodyLogs, progs] = await Promise.all([
          fetchWorkoutHistory(activeUserId),
          fetchAllSetsForUser(activeUserId),
          fetchWorkoutsData(activeUserId),
          initializeUser(activeUserId, user?.email, user?.displayName),
          fetchBodyMeasurementLogs(activeUserId),
          fetchSavedRoutinePrograms(activeUserId),
        ]);

        if (userProfile?.metrics) {
          setUserMetrics(userProfile.metrics);
        } else {
          // Check local storage fallback
          const localMetricsRaw = localStorage.getItem(`user_metrics_${activeUserId}`);
          if (localMetricsRaw) {
            try {
              setUserMetrics(JSON.parse(localMetricsRaw));
            } catch {
              // ignore
            }
          }
        }

        setBodyLogs(historicalBodyLogs || []);
        setSavedPrograms(progs || []);
        setRawSessions(historySessions);
        setRawSets(allSets);
        setRawWorkoutsData(workoutsData);
        setExercisesList(workoutsData.exercisesList);

        // Find exercises that actually have logged sets
        const loggedExIds = new Set(allSets.map((s) => s.exerciseId));
        const activeExercises = workoutsData.exercisesList.filter((e) => loggedExIds.has(e.id));

        if (activeExercises.length > 0) {
          const firstEx = activeExercises[0];
          setSelectedExerciseId(firstEx.id);
          const rep = calculateExerciseProgression(
            firstEx.id,
            historySessions,
            allSets,
            workoutsData.exercisesList
          );
          setExerciseReport(rep);
        }
      } catch (err: any) {
        console.error('Failed to load insights metrics:', err);
        setErrorMsg(err.message || 'Failed to aggregate insights.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, authLoading]);

  // Scoped calculation based on selectedProgramId
  const { filteredSessions, filteredSets, workoutMap } = useMemo(() => {
    if (!rawWorkoutsData) {
      return { filteredSessions: rawSessions, filteredSets: rawSets, workoutMap: new Map<string, string>() };
    }

    const map = new Map<string, string>(rawWorkoutsData.combinedWorkouts.map((w) => [w.id, w.name]));

    if (selectedProgramId === 'all') {
      return { filteredSessions: rawSessions, filteredSets: rawSets, workoutMap: map };
    }

    const selectedProg = savedPrograms.find((p) => p.id === selectedProgramId);
    if (!selectedProg || !selectedProg.programData?.workouts) {
      return { filteredSessions: rawSessions, filteredSets: rawSets, workoutMap: map };
    }

    const progWorkoutIds = new Set(selectedProg.programData.workouts.map((w) => w.id));
    const progSessions = rawSessions.filter((s) => progWorkoutIds.has(s.workoutId));
    const progSessionIds = new Set(progSessions.map((s) => s.id));
    const progSets = rawSets.filter((st) => progSessionIds.has(st.sessionId));

    return { filteredSessions: progSessions, filteredSets: progSets, workoutMap: map };
  }, [selectedProgramId, savedPrograms, rawSessions, rawSets, rawWorkoutsData]);

  const metrics = useMemo(() => {
    if (!rawWorkoutsData) return null;
    return calculateInsights(
      filteredSessions,
      filteredSets,
      rawWorkoutsData.exercisesList,
      workoutMap
    );
  }, [filteredSessions, filteredSets, rawWorkoutsData, workoutMap]);

  // Handle exercise select change
  const handleSelectExercise = (exId: string) => {
    setSelectedExerciseId(exId);
    if (!exId) {
      setExerciseReport(null);
      return;
    }
    const rep = calculateExerciseProgression(exId, filteredSessions, filteredSets, exercisesList);
    setExerciseReport(rep);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#C0FF00]" />
        <span className="font-mono text-xs text-gray-400 uppercase tracking-widest font-semibold">
          Aggregating 90-Day Progression...
        </span>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="p-4 bg-red-950/40 border border-red-900/40 text-red-300 text-xs rounded-xl font-mono">
        <span className="font-bold uppercase tracking-widest text-red-400">ERROR:</span> {errorMsg}
      </div>
    );
  }

  if (!metrics || metrics.totalCompletedSessions === 0) {
    return (
      <div className="bg-[#111] border border-[#222] rounded-[24px] p-8 text-center shadow-xl space-y-4">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-[#C0FF00]/10 border border-[#C0FF00]/20 flex items-center justify-center text-[#C0FF00]">
          <Activity className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-display font-black text-lg text-white uppercase tracking-tight">
            No Insights Yet
          </h3>
          <p className="text-gray-400 text-xs font-sans max-w-sm mx-auto mt-1">
            Log your first workouts to uncover your 90-day volume tonnage, consistency heatmap, and time under tension.
          </p>
        </div>
      </div>
    );
  }

  const formatKg = (kg: number) => {
    return `${kg.toLocaleString()} kg`;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) {
      return `${hrs}h ${mins % 60}m`;
    }
    return `${mins}m ${seconds % 60}s`;
  };

  // Find maximum volume in weekly tonnage for bar chart scaling
  const maxWeeklyVol = Math.max(1, ...metrics.weeklyTonnage.map((w) => w.volumeKg));

  // Calculate Body Mass Index (BMI) if height and weight exist
  const heightM = userMetrics?.height ? userMetrics.height / 100 : null;
  const weightKg = userMetrics?.weight || null;
  const bmiValue = heightM && weightKg && heightM > 0 ? Number((weightKg / (heightM * heightM)).toFixed(1)) : null;

  const getBmiCategory = (bmi: number): BmiCategoryInfo => {
    if (bmi < 18.5) {
      return {
        label: 'Underweight',
        color: 'text-sky-400',
        badgeBg: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
        markerPos: Math.min(Math.max(((bmi - 14) / (35 - 14)) * 100, 4), 96),
        advice: 'Consider a caloric surplus and progressive strength training to build lean muscle mass.',
      };
    }
    if (bmi < 25) {
      return {
        label: 'Normal Weight',
        color: 'text-[#C0FF00]',
        badgeBg: 'bg-[#C0FF00]/10 border-[#C0FF00]/30 text-[#C0FF00]',
        markerPos: Math.min(Math.max(((bmi - 14) / (35 - 14)) * 100, 4), 96),
        advice: 'Optimal health range. Focus on progressive overload and body recomposition.',
      };
    }
    if (bmi < 30) {
      return {
        label: 'Overweight',
        color: 'text-amber-400',
        badgeBg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
        markerPos: Math.min(Math.max(((bmi - 14) / (35 - 14)) * 100, 4), 96),
        advice: 'Maintain training volume with a moderate calorie deficit or high-protein recomposition.',
      };
    }
    return {
      label: 'Obese',
      color: 'text-rose-400',
      badgeBg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
      markerPos: Math.min(Math.max(((bmi - 14) / (35 - 14)) * 100, 4), 96),
      advice: 'Prioritize consistent low-impact movement, clean nutrition, and structured resistance training.',
    };
  };

  const bmiCategory = bmiValue ? getBmiCategory(bmiValue) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-display font-black text-white uppercase tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#C0FF00]" />
            90-Day Training Insights
          </h2>
          <p className="text-gray-400 font-sans text-xs mt-0.5">
            Making the invisible visible: effort, consistency, and volume trajectory.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1a1a1a] border border-[#333] text-[11px] font-mono text-gray-300 self-start sm:self-auto">
          <Calendar className="w-3.5 h-3.5 text-[#C0FF00]" />
          Last 90 Days
        </div>
      </div>

      {/* Program Scope Selector (Global vs Specific Saved Program) */}
      {savedPrograms.length > 0 && (
        <ProgramScopeSelector
          programs={savedPrograms}
          selectedProgramId={selectedProgramId}
          onSelectProgram={setSelectedProgramId}
        />
      )}

      {/* Hero Metrics Row */}
      <InsightsHeroMetrics
        metrics={metrics}
        activeInfoKey={activeInfoKey}
        onToggleInfoKey={(key) => setActiveInfoKey(activeInfoKey === key ? null : key)}
        onCloseInfoKey={() => setActiveInfoKey(null)}
        formatKg={formatKg}
        formatDuration={formatDuration}
      />

      {/* View Mode Toggle: 90-Day Heatmap vs 90-Day BMI Biometrics */}
      <div className="flex items-center justify-between gap-3 bg-[#111] border border-[#222] p-2 rounded-2xl">
        <div className="flex items-center gap-1.5 p-1 bg-[#181818] rounded-xl border border-[#282828] w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('heatmap')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === 'heatmap'
                ? 'bg-[#C0FF00] text-black shadow-md shadow-[#C0FF00]/20'
                : 'text-gray-400 hover:text-white hover:bg-[#222]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>90-Day Activity & Consistency Heatmap</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bmi')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === 'bmi'
                ? 'bg-[#C0FF00] text-black shadow-md shadow-[#C0FF00]/20'
                : 'text-gray-400 hover:text-white hover:bg-[#222]'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>90-Day Body Mass Index (BMI) & Biometrics</span>
            {bmiValue && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === 'bmi' ? 'bg-black/20 text-black' : 'bg-[#252525] text-gray-300'}`}>
                {bmiValue}
              </span>
            )}
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono text-gray-400 pr-2">
          {activeTab === 'heatmap' ? (
            <span>90-Day Activity Matrix</span>
          ) : (
            <span>WHO Standard Metric</span>
          )}
        </div>
      </div>

      {/* Conditionally Rendered: Heatmap or BMI Card */}
      {activeTab === 'bmi' ? (
        <InsightsBmiCard
          userMetrics={userMetrics}
          bmiValue={bmiValue}
          bmiCategory={bmiCategory}
          bodyLogs={bodyLogs}
          heatmapDays={metrics.heatmapDays}
          hoveredBmiDay={hoveredBmiDay}
          onHoverBmiDay={setHoveredBmiDay}
          getBmiCategory={getBmiCategory}
        />
      ) : (
        <InsightsHeatmapCard
          sessionsLast90Days={metrics.sessionsLast90Days}
          heatmapDays={metrics.heatmapDays}
          hoveredDay={hoveredDay}
          onHoverDay={setHoveredDay}
        />
      )}

      {/* Per-Exercise Progressive Overload & 1RM Trajectory */}
      <div className="bg-[#111] border border-[#222] rounded-[24px] p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222] pb-3">
          <div>
            <h3 className="font-display font-black text-base text-white uppercase tracking-tight flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-[#C0FF00]" />
              Exercise Progressive Overload Curves
            </h3>
            <p className="text-[11px] font-sans text-gray-400 mt-0.5">
              Individual lift benchmark trajectory, 1RM progression, and workout volume.
            </p>
          </div>

          {/* Exercise Dropdown Selector */}
          {exercisesList.length > 0 && (
            <div className="relative self-start sm:self-auto min-w-[200px]">
              <select
                value={selectedExerciseId || ''}
                onChange={(e) => handleSelectExercise(e.target.value)}
                className="w-full bg-[#181818] border border-[#333] hover:border-[#C0FF00] text-white text-xs font-mono font-bold px-3 py-2 rounded-xl appearance-none cursor-pointer pr-8 focus:outline-none focus:border-[#C0FF00] transition-colors"
              >
                {exercisesList.map((ex) => {
                  const hasSets = filteredSets.some((s) => s.exerciseId === ex.id);
                  return (
                    <option key={ex.id} value={ex.id}>
                      {ex.name} {hasSets ? '' : '(No sets logged)'}
                    </option>
                  );
                })}
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          )}
        </div>

        {exerciseReport ? (
          <ExerciseProgressionCard report={exerciseReport} />
        ) : (
          <div className="text-center py-6 text-gray-500 font-mono text-xs">
            Select an exercise above to visualize its strength trajectory.
          </div>
        )}
      </div>

      {/* Weekly Volume Trajectory Chart (Last 8 Weeks) */}
      <WeeklyVolumeChart
        weeklyTonnage={metrics.weeklyTonnage}
        maxWeeklyVol={maxWeeklyVol}
      />

      {/* Rest Interval Discipline & Pacing Analysis */}
      <RestPacingCard restDiscipline={metrics.restDiscipline} />
    </div>
  );
};
