import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  fetchWorkoutHistory,
  fetchAllSetsForUser,
  fetchWorkoutsData,
  initializeUser,
  fetchBodyMeasurementLogs,
} from '../lib/supabaseData.ts';
import {
  calculateInsights,
  calculateExerciseProgression,
  InsightsMetrics,
  ExerciseProgressionReport,
} from '../lib/insightsEngine.ts';
import { Session, WorkoutSet, Exercise, UserMetrics, BodyMeasurementLog } from '../models.ts';

export function useInsightsData() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<InsightsMetrics | null>(null);
  const [userMetrics, setUserMetrics] = useState<UserMetrics | null>(null);
  const [bodyLogs, setBodyLogs] = useState<BodyMeasurementLog[]>([]);
  const [activeTab, setActiveTab] = useState<'heatmap' | 'bmi'>('heatmap');

  // Per-exercise progression state
  const [exercisesList, setExercisesList] = useState<Exercise[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [exerciseReport, setExerciseReport] = useState<ExerciseProgressionReport | null>(null);
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [allSetsData, setAllSetsData] = useState<WorkoutSet[]>([]);

  useEffect(() => {
    async function loadData() {
      if (authLoading) return;
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErrorMsg(null);

        const [historySessions, allSets, workoutsData, userProfile, historicalBodyLogs] =
          await Promise.all([
            fetchWorkoutHistory(user.uid),
            fetchAllSetsForUser(user.uid),
            fetchWorkoutsData(user.uid),
            initializeUser(user.uid, user.email, user.displayName),
            fetchBodyMeasurementLogs(user.uid),
          ]);

        if (userProfile?.metrics) {
          setUserMetrics(userProfile.metrics);
        } else {
          const localMetricsRaw = localStorage.getItem(`user_metrics_${user.uid}`);
          if (localMetricsRaw) {
            try {
              setUserMetrics(JSON.parse(localMetricsRaw));
            } catch {
              // ignore
            }
          }
        }

        setBodyLogs(historicalBodyLogs || []);

        const workoutMap = new Map(
          workoutsData.combinedWorkouts.map((w) => [w.id, w.name])
        );

        const calculated = calculateInsights(
          historySessions,
          allSets,
          workoutsData.exercisesList,
          workoutMap
        );

        setMetrics(calculated);
        setExercisesList(workoutsData.exercisesList);
        setAllSessions(historySessions);
        setAllSetsData(allSets);

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

  const handleSelectExercise = useCallback(
    (exId: string) => {
      setSelectedExerciseId(exId);
      if (!exId) {
        setExerciseReport(null);
        return;
      }
      const rep = calculateExerciseProgression(exId, allSessions, allSetsData, exercisesList);
      setExerciseReport(rep);
    },
    [allSessions, allSetsData, exercisesList]
  );

  return {
    loading,
    errorMsg,
    metrics,
    userMetrics,
    bodyLogs,
    activeTab,
    setActiveTab,
    exercisesList,
    selectedExerciseId,
    exerciseReport,
    handleSelectExercise,
  };
}
