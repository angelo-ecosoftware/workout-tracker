import { useState, useEffect, useRef, useMemo } from 'react';
import { AuthUser } from '../../../context/AuthContext.tsx';
import { Workout, Exercise, UserProfile } from '../../../models.ts';
import {
  fetchWorkoutsData,
  getUserProgressState,
  fetchWorkoutHistory,
  logSessionCompletion,
  seedTemplatesIfMissing,
  logDailyBodyWeight,
} from '../../../lib/supabaseData.ts';
import { uploadWorkoutPhotos } from '../../../lib/storage.ts';
import { compressWorkoutImage } from '../../../utils/imageCompressor.ts';
import { SessionEngine, ProgressionEngine } from '../../../engine.ts';
import {
  saveDraftPhotosToStorage,
  loadDraftPhotosFromStorage,
  clearDraftPhotosFromStorage,
} from '../../../utils/draftPhotoStorage.ts';
import { WorkoutSummaryCelebration, ExercisePR } from './WorkoutCompletionModal.tsx';
import { getRandomPraise } from './SetPraiseToast.tsx';

export function useWorkoutSession(user: AuthUser | null) {
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
  const [isRoutineEditorOpen, setIsRoutineEditorOpen] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [celebrationSummary, setCelebrationSummary] = useState<WorkoutSummaryCelebration | null>(null);
  const [historySessions, setHistorySessions] = useState<{ id?: string; completedAt?: Date | null; startedAt?: Date; status?: string }[]>([]);
  const [skippedExerciseIds, setSkippedExerciseIds] = useState<Set<string>>(new Set());

  // P1.3: Auto-start rest timer state when a set row is checked off
  const [autoRestTimer, setAutoRestTimer] = useState<{
    isOpen: boolean;
    durationSeconds: number;
    exerciseName: string;
    setNumber: number;
  }>({
    isOpen: false,
    durationSeconds: 90,
    exerciseName: '',
    setNumber: 1,
  });

  // Recovery & Note States
  const [sleepHours, setSleepHours] = useState(8);
  const [energyScore, setEnergyScore] = useState(7);
  const [sessionNotes, setSessionNotes] = useState('');
  const [bodyWeightKg, setBodyWeightKg] = useState<string>('');
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [sessionDate, setSessionDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [lastAutoSavedTime, setLastAutoSavedTime] = useState<string | null>(null);

  // Rest Timer settings
  const [restDurationSeconds, setRestDurationSeconds] = useState<number>(() => {
    const val = localStorage.getItem('setting_rest_duration_seconds');
    return val ? parseInt(val, 10) : 5;
  });

  // Sequential Set Mode (Guided 1 set at a time)
  const [isSequentialSetMode, setIsSequentialSetMode] = useState<boolean>(() => {
    const val = localStorage.getItem('setting_sequential_set_mode');
    return val ? val === 'true' : false;
  });

  // Motivational Praise Popup Toast for set completions
  const [setPraiseToast, setSetPraiseToast] = useState<{
    message: string | null;
    exerciseName?: string;
    setNumber?: number;
  }>({
    message: null,
  });

  const toggleSequentialSetMode = () => {
    setIsSequentialSetMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('setting_sequential_set_mode', String(next));
      } catch {}
      return next;
    });
  };

  // Active Workout Session State (Fitness Online hybrid start & timer model)
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isFinishModalOpen, setIsFinishModalOpen] = useState<boolean>(false);

  // Load session timer state when activeWorkout changes
  useEffect(() => {
    if (!activeWorkout) {
      setIsSessionActive(false);
      setSessionStartTime(null);
      setElapsedSeconds(0);
      return;
    }

    try {
      const activeStored = localStorage.getItem(`workout_session_active_${activeWorkout.id}`);
      const startTimeStored = localStorage.getItem(`workout_session_start_time_${activeWorkout.id}`);

      if (activeStored === 'true' && startTimeStored) {
        const startMs = parseInt(startTimeStored, 10);
        if (!isNaN(startMs) && startMs > 0) {
          setIsSessionActive(true);
          setSessionStartTime(startMs);
          setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
          return;
        }
      }
    } catch {}

    setIsSessionActive(false);
    setSessionStartTime(null);
    setElapsedSeconds(0);
  }, [activeWorkout?.id]);

  // Wall-clock resilient elapsed timer ticker
  useEffect(() => {
    if (!isSessionActive || !sessionStartTime) {
      return;
    }

    const tick = () => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - sessionStartTime) / 1000)));
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isSessionActive, sessionStartTime]);

  const handleStartWorkout = () => {
    if (!activeWorkout) return;
    const now = Date.now();
    setIsSessionActive(true);
    setSessionStartTime(now);
    setElapsedSeconds(0);
    try {
      localStorage.setItem(`workout_session_active_${activeWorkout.id}`, 'true');
      localStorage.setItem(`workout_session_start_time_${activeWorkout.id}`, String(now));
    } catch {}

    // Track start timestamp on the first uncompleted set of the first non-skipped exercise
    const firstActiveExercise = activeWorkout.exercises.find((ex) => !skippedExerciseIds.has(ex.id));
    if (firstActiveExercise) {
      setExpandedExerciseId(firstActiveExercise.id);
      const firstSetKey = `${firstActiveExercise.id}-1`;
      setInputs((prev) => {
        const cur = prev[firstSetKey] || { weight: '20', reps: '10', durationSeconds: '30', difficulty: '7' };
        if (!cur.startedAt) {
          const updated = {
            ...prev,
            [firstSetKey]: {
              ...cur,
              startedAt: new Date(now).toISOString(),
            },
          };
          saveDraftCheckpoint(updated);
          return updated;
        }
        return prev;
      });
    }
  };

  const handleCancelSession = () => {
    if (!activeWorkout) return;
    setIsSessionActive(false);
    setSessionStartTime(null);
    setElapsedSeconds(0);
    try {
      localStorage.removeItem(`workout_session_active_${activeWorkout.id}`);
      localStorage.removeItem(`workout_session_start_time_${activeWorkout.id}`);
    } catch {}
  };

  // Sync settings when modified from SettingsModal
  useEffect(() => {
    const handleSettingsUpdate = () => {
      const restVal = localStorage.getItem('setting_rest_duration_seconds');
      if (restVal) setRestDurationSeconds(parseInt(restVal, 10));
    };

    window.addEventListener('workout_settings_updated', handleSettingsUpdate);
    return () => window.removeEventListener('workout_settings_updated', handleSettingsUpdate);
  }, []);

  // Re-synchronize workflow state and suggested day when a session is deleted or user profile updates
  useEffect(() => {
    const handleSync = () => {
      loadWorkflowState();
    };

    window.addEventListener('workout_session_deleted', handleSync);
    window.addEventListener('user_profile_updated', handleSync);
    return () => {
      window.removeEventListener('workout_session_deleted', handleSync);
      window.removeEventListener('user_profile_updated', handleSync);
    };
  }, [user]);

  // Screen Wake Lock API to keep the screen active during workouts
  useEffect(() => {
    if (!activeWorkout) return;

    let wakeLockSentinel: WakeLockSentinel | null = null;

    const requestWakeLock = async () => {
      if ('wakeLock' in navigator && navigator.wakeLock && document.visibilityState === 'visible') {
        try {
          wakeLockSentinel = await navigator.wakeLock.request('screen');
        } catch (err) {
          console.warn('Screen wake lock request failed:', err);
        }
      }
    };

    requestWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockSentinel) {
        wakeLockSentinel.release().catch(() => {});
        wakeLockSentinel = null;
      }
    };
  }, [activeWorkout]);

  // Active workout entry inputs state
  const [inputs, setInputs] = useState<
    Record<
      string,
      {
        weight: string;
        reps: string;
        durationSeconds?: string;
        difficulty?: string;
        completed?: boolean;
        completedAt?: string;
        startedAt?: string;
        restSeconds?: number;
      }
    >
  >({});

  const getDraftKey = (workoutId?: string) => {
    if (!user) return null;
    return `workout_draft_${user.uid}_${workoutId || activeWorkout?.id || 'default'}`;
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remainingSlots = 5 - selectedPhotos.length;
    if (remainingSlots <= 0) {
      setErrorMsg('You can upload a maximum of 5 photos per session.');
      return;
    }

    const newRawFiles = files.slice(0, remainingSlots);
    const newFiles = await Promise.all(newRawFiles.map((f) => compressWorkoutImage(f)));
    const updatedFiles = [...selectedPhotos, ...newFiles];
    setSelectedPhotos(updatedFiles);

    const newPreviews = newFiles.map((f) => URL.createObjectURL(f));
    setPhotoPreviews((prev) => [...prev, ...newPreviews]);

    if (user && activeWorkout) {
      await saveDraftPhotosToStorage(user.uid, activeWorkout.id, updatedFiles);
    }

    if (e.target) e.target.value = '';
  };

  const handleRemovePhoto = async (index: number) => {
    const updatedFiles = selectedPhotos.filter((_, i) => i !== index);
    setSelectedPhotos(updatedFiles);
    setPhotoPreviews((prev) => {
      const targetUrl = prev[index];
      if (targetUrl) URL.revokeObjectURL(targetUrl);
      return prev.filter((_, i) => i !== index);
    });

    if (user && activeWorkout) {
      await saveDraftPhotosToStorage(user.uid, activeWorkout.id, updatedFiles);
    }
  };

  const saveDraftCheckpoint = (
    newInputs: Record<string, any>,
    workoutId?: string,
    curDate?: string,
    curSleep?: number,
    curEnergy?: number,
    curNotes?: string,
    curWeight?: string,
    curSkippedIds?: string[]
  ) => {
    const key = getDraftKey(workoutId);
    if (!key) return;
    try {
      const payload = {
        workoutId: workoutId || activeWorkout?.id,
        inputs: newInputs,
        sessionDate: curDate ?? sessionDate,
        sleepHours: curSleep ?? sleepHours,
        energyScore: curEnergy ?? energyScore,
        notes: curNotes ?? sessionNotes,
        bodyWeightKg: curWeight ?? bodyWeightKg,
        skippedExerciseIds: curSkippedIds ?? Array.from(skippedExerciseIds),
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(key, JSON.stringify(payload));
      setLastAutoSavedTime(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    } catch (e) {
      console.warn('Could not save draft checkpoint to localStorage', e);
    }
  };

  const toggleSkipExercise = (exerciseId: string) => {
    setSkippedExerciseIds((prev) => {
      const next = new Set(prev);
      if (next.has(exerciseId)) {
        next.delete(exerciseId);
      } else {
        next.add(exerciseId);
      }
      saveDraftCheckpoint(
        inputs,
        activeWorkout?.id,
        sessionDate,
        sleepHours,
        energyScore,
        sessionNotes,
        bodyWeightKg,
        Array.from(next)
      );
      return next;
    });
  };

  const clearDraftCheckpoint = async (workoutId?: string) => {
    const targetWkId = workoutId || activeWorkout?.id;
    const key = getDraftKey(targetWkId);
    if (key) {
      try {
        localStorage.removeItem(key);
        setLastAutoSavedTime(null);
      } catch (e) {
        console.warn('Could not remove draft checkpoint', e);
      }
    }
    if (user && targetWkId) {
      await clearDraftPhotosFromStorage(user.uid, targetWkId);
    }
  };

  const loadWorkflowState = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      if (!user) return;

      await seedTemplatesIfMissing(user.uid);

      const [wData, userProgress, historyLogs] = await Promise.all([
        fetchWorkoutsData(user.uid),
        getUserProgressState(user.uid),
        fetchWorkoutHistory(user.uid).catch(() => []),
      ]);

      const progressState = userProgress.profile;
      setWorkouts(wData.combinedWorkouts);
      setUserProfile(progressState);
      setHistorySessions(historyLogs || []);

      const welcomeKey = `welcome_shown_${user.uid}`;
      if (userProgress.isNewUser && !localStorage.getItem(welcomeKey)) {
        setShowWelcomeModal(true);
      }

      const computedNextDay = SessionEngine.calculateNextWorkoutOrder(
        progressState,
        wData.combinedWorkouts
      );
      setSuggestedDay(computedNextDay);

      // Verify that lastCompletedWorkoutOrder is positive and matches an actual existing workout in the split
      if (
        progressState.lastCompletedWorkoutOrder &&
        progressState.lastCompletedWorkoutOrder > 0 &&
        wData.combinedWorkouts.some((w) => w.order === progressState.lastCompletedWorkoutOrder)
      ) {
        setLastSessionDay(progressState.lastCompletedWorkoutOrder);
      } else {
        setLastSessionDay(null);
      }

      const targetW =
        wData.combinedWorkouts.find((w) => w.order === computedNextDay) || wData.combinedWorkouts[0];
      setActiveWorkout(targetW || null);
    } catch (err: unknown) {
      console.error('loadWorkflowState ERROR:', err);
      setErrorMsg(`Failed to synchronize active workout progression. ERROR: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadWorkflowState();
    }
  }, [user]);

  useEffect(() => {
    if (!activeWorkout || !userProfile || !user) return;

    // Collapsed by default; restore previous exercise expand state if explicitly saved by user
    try {
      const storedExpanded = localStorage.getItem(`workout_expanded_ex_${user.uid}_${activeWorkout.id}`);
      if (storedExpanded && activeWorkout.exercises.some((e) => e.id === storedExpanded)) {
        setExpandedExerciseId(storedExpanded);
      } else {
        setExpandedExerciseId(null);
      }
    } catch {
      setExpandedExerciseId(null);
    }

    loadDraftPhotosFromStorage(user.uid, activeWorkout.id).then((restoredFiles) => {
      if (restoredFiles && restoredFiles.length > 0) {
        setSelectedPhotos(restoredFiles);
        setPhotoPreviews((prev) => {
          prev.forEach((url) => URL.revokeObjectURL(url));
          return restoredFiles.map((f) => URL.createObjectURL(f));
        });
      }
    });

    const prepopulateInputs = () => {
      const cachedProfileWeight = userProfile.weightKg || userProfile.metrics?.weight;
      if (cachedProfileWeight && !bodyWeightKg) {
        setBodyWeightKg(String(cachedProfileWeight));
      }

      setSkippedExerciseIds(new Set());

      const draftKey = getDraftKey(activeWorkout.id);
      if (draftKey) {
        try {
          const rawDraft = localStorage.getItem(draftKey);
          if (rawDraft) {
            const parsedDraft = JSON.parse(rawDraft);
            if (parsedDraft.skippedExerciseIds && Array.isArray(parsedDraft.skippedExerciseIds)) {
              setSkippedExerciseIds(new Set(parsedDraft.skippedExerciseIds));
            }
            if (parsedDraft && parsedDraft.inputs && Object.keys(parsedDraft.inputs).length > 0) {
              setInputs(parsedDraft.inputs);
              if (parsedDraft.sessionDate) setSessionDate(parsedDraft.sessionDate);
              if (parsedDraft.sleepHours != null) setSleepHours(parsedDraft.sleepHours);
              if (parsedDraft.energyScore != null) setEnergyScore(parsedDraft.energyScore);
              if (parsedDraft.notes != null) setSessionNotes(parsedDraft.notes);
              if (parsedDraft.bodyWeightKg != null) setBodyWeightKg(String(parsedDraft.bodyWeightKg));
              if (parsedDraft.savedAt) {
                const dateObj = new Date(parsedDraft.savedAt);
                setLastAutoSavedTime(
                  dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                );
              }
              return;
            }
          }
        } catch (e) {
          console.warn('Failed to parse draft from localStorage', e);
        }
      }

      const newInputs: Record<
        string,
        { weight: string; reps: string; durationSeconds: string; difficulty: string }
      > = {};

      activeWorkout.exercises.forEach((ex) => {
        const cachedEx = ProgressionEngine.evaluateProgression(
          ex.id,
          userProfile.lastSetSummaryPerExercise
        );

        for (let i = 1; i <= ex.targetSets; i++) {
          if (ex.type === 'timed') {
            const dsVal =
              cachedEx && cachedEx.lastDurationSeconds != null
                ? cachedEx.lastDurationSeconds.toString()
                : ex.targetRepMin?.toString() || '60';

            newInputs[`${ex.id}-${i}`] = {
              weight: '',
              reps: '',
              durationSeconds: dsVal,
              difficulty: '7',
            };
          } else {
            const wtVal =
              cachedEx && cachedEx.lastWeight != null ? cachedEx.lastWeight.toString() : '20';
            const rpVal =
              cachedEx && cachedEx.lastReps != null
                ? cachedEx.lastReps.toString()
                : ex.targetRepMin?.toString() || '10';

            newInputs[`${ex.id}-${i}`] = {
              weight: wtVal,
              reps: rpVal,
              durationSeconds: '',
              difficulty: '',
            };
          }
        }
      });

      setInputs(newInputs);
    };

    prepopulateInputs();
  }, [activeWorkout, userProfile]);

  const updateInputValue = (
    key: string,
    field: 'weight' | 'reps' | 'durationSeconds' | 'difficulty',
    step: number
  ) => {
    setInputs((prev) => {
      const current = prev[key] || { weight: '20', reps: '10', durationSeconds: '30', difficulty: '7' };
      const baseNum = parseFloat(current[field] || '0');
      if (isNaN(baseNum)) return prev;

      let nextVal = baseNum + step;
      if (field === 'difficulty') {
        if (nextVal < 1) nextVal = 1;
        if (nextVal > 10) nextVal = 10;
      } else {
        if (nextVal < 0) nextVal = 0;
      }

      const formatted =
        field === 'weight'
          ? nextVal % 1 === 0
            ? nextVal.toString()
            : (Math.round(nextVal * 10) / 10).toString()
          : Math.round(nextVal).toString();

      const updated = {
        ...prev,
        [key]: {
          ...current,
          [field]: formatted,
        },
      };

      saveDraftCheckpoint(updated);
      return updated;
    });
  };

  const handleTextChange = (
    key: string,
    field: 'weight' | 'reps' | 'durationSeconds' | 'difficulty',
    value: string
  ) => {
    let sanitized = value;
    if (field === 'weight') {
      sanitized = value.replace(/[^0-9.]/g, '');
      const parts = sanitized.split('.');
      if (parts.length > 2) {
        sanitized = parts[0] + '.' + parts.slice(1).join('');
      }
    } else if (field === 'difficulty') {
      sanitized = value.replace(/[^0-9]/g, '');
      if (sanitized !== '') {
        const num = parseInt(sanitized, 10);
        if (num > 10) sanitized = '10';
        else if (num < 1 && sanitized !== '0') sanitized = '1';
      }
    } else {
      sanitized = value.replace(/[^0-9]/g, '');
    }

    setInputs((prev) => {
      const current = prev[key] || { weight: '20', reps: '10', durationSeconds: '30', difficulty: '7' };
      const updated = {
        ...prev,
        [key]: {
          ...current,
          [field]: sanitized,
        },
      };

      saveDraftCheckpoint(updated);
      return updated;
    });
  };

  const getProgressionAdvice = (
    ex: Exercise
  ): { action: 'increase' | 'keep' | 'deload'; details: string } => {
    if (!userProfile) return { action: 'keep', details: 'Checking history...' };

    const cachedEx = ProgressionEngine.evaluateProgression(
      ex.id,
      userProfile.lastSetSummaryPerExercise
    );

    if (!cachedEx) {
      return { action: 'keep', details: 'First log. Start focused.' };
    }

    if (ex.type === 'timed') {
      const hitMaxDuration = (cachedEx.lastDurationSeconds || 0) >= ex.targetRepMax;

      if (hitMaxDuration) {
        return {
          action: 'increase',
          details: `Time Target Cleared! Increase time (+5s) or add lever difficulty.`,
        };
      } else {
        const lastDuration = cachedEx.lastDurationSeconds || 30;
        return {
          action: 'keep',
          details: `Hold clean form. Target ${ex.targetRepMax}s (last: ${lastDuration}s).`,
        };
      }
    }

    const maxRepsConstraint = ex.targetRepMax;
    const hitMaxReps = (cachedEx.lastReps || 0) >= maxRepsConstraint;

    if (hitMaxReps) {
      const lastAvgWeight = Number(cachedEx.lastWeight || 0);
      const proposedNewWeight = lastAvgWeight + 2.5;
      return {
        action: 'increase',
        details: `Progression Hit! Try ${proposedNewWeight.toFixed(1)}kg (+2.5kg)`,
      };
    } else {
      return {
        action: 'keep',
        details: `Keep weight at current ${Number(cachedEx.lastWeight || 20)}kg to master reps.`,
      };
    }
  };

  const [unrealisticWarningConfig, setUnrealisticWarningConfig] = useState<{
    isOpen: boolean;
    warnings: string[];
    onConfirm: () => void;
  }>({
    isOpen: false,
    warnings: [],
    onConfirm: () => {},
  });

  const executeSaveWorkout = async (
    finalSetsPayload: Array<{
      exerciseId: string;
      setNumber: number;
      weight?: number | null;
      reps?: number | null;
      durationSeconds?: number | null;
      difficulty?: number | null;
      startedAt?: Date | null;
      completedAt?: Date | null;
      restSeconds?: number | null;
    }>
  ) => {
    if (!activeWorkout || !user) return;

    setLoggingWorkout(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      let completedAtDate: Date | undefined;
      const sessionStartedAtDate: Date | undefined = sessionStartTime
        ? new Date(sessionStartTime)
        : undefined;

      if (sessionDate) {
        const baseTime = new Date();
        const [y, m, d] = sessionDate.split('-');
        completedAtDate = new Date(
          parseInt(y),
          parseInt(m) - 1,
          parseInt(d),
          baseTime.getHours(),
          baseTime.getMinutes(),
          baseTime.getSeconds()
        );
      }

      let uploadedPhotoUrls: string[] = [];
      if (selectedPhotos.length > 0 && user) {
        setIsUploadingPhotos(true);
        try {
          uploadedPhotoUrls = await uploadWorkoutPhotos(user.uid, selectedPhotos);
        } catch (uploadErr: unknown) {
          console.warn('Photos upload error, continuing session save:', uploadErr);
        } finally {
          setIsUploadingPhotos(false);
        }
      }

      try {
        await logSessionCompletion(
          user.uid,
          activeWorkout.id,
          finalSetsPayload,
          activeWorkout.exercises,
          completedAtDate,
          sessionNotes,
          uploadedPhotoUrls,
          sessionStartedAtDate,
          undefined,
          sleepHours,
          energyScore
        );

        const parsedWeight = parseFloat(bodyWeightKg);
        if (!isNaN(parsedWeight) && parsedWeight > 0) {
          const userHeight = userProfile?.heightCm || userProfile?.metrics?.height;
          await logDailyBodyWeight(user.uid, {
            date: sessionDate,
            weightKg: parsedWeight,
            heightCm: userHeight,
            source: 'workout_session',
            notes: sessionNotes || undefined,
          });
        }
      } catch (networkErr: unknown) {
        console.error('Failed saving workout session:', networkErr);
        throw networkErr;
      }

      // Calculate Celebration Summary (Tonnage, Reps, PR Milestones) for P1.1
      let totalVolume = 0;
      let totalRepsCount = 0;
      const prsAchieved: ExercisePR[] = [];

      for (const ex of activeWorkout.exercises) {
        if (skippedExerciseIds.has(ex.id)) continue;
        const exSets = finalSetsPayload.filter((s) => s.exerciseId === ex.id);
        const cachedEx = userProfile?.lastSetSummaryPerExercise?.[ex.id];
        const previous1RM = cachedEx
          ? ProgressionEngine.calculate1RM(cachedEx.lastWeight, cachedEx.lastReps)
          : undefined;

        let bestSet1RM = 0;
        let bestWeight = 0;
        let bestReps = 0;

        for (const s of exSets) {
          const w = s.weight || 0;
          const r = s.reps || 0;
          totalVolume += w * r;
          totalRepsCount += r;

          if (w > 0 && r > 0) {
            const set1RM = ProgressionEngine.calculate1RM(w, r);
            if (set1RM > bestSet1RM) {
              bestSet1RM = set1RM;
              bestWeight = w;
              bestReps = r;
            }
          }
        }

        if (bestSet1RM > 0) {
          if (!previous1RM || bestSet1RM > previous1RM) {
            prsAchieved.push({
              exerciseName: ex.name,
              weight: bestWeight,
              reps: bestReps,
              estimated1RM: bestSet1RM,
              previous1RM,
              improvementKg: previous1RM ? Math.round((bestSet1RM - previous1RM) * 10) / 10 : undefined,
              isNew1RMRecord: true,
            });
          }
        }
      }

      const celebrationData: WorkoutSummaryCelebration = {
        workoutName: activeWorkout.name,
        totalVolumeKg: Math.round(totalVolume),
        totalReps: totalRepsCount,
        completedSetsCount: finalSetsPayload.length,
        prsAchieved,
      };

      clearDraftCheckpoint(activeWorkout.id);
      setSessionNotes('');
      setSkippedExerciseIds(new Set());
      setSelectedPhotos([]);
      photoPreviews.forEach((url) => URL.revokeObjectURL(url));
      setPhotoPreviews([]);

      if (activeWorkout) {
        setIsSessionActive(false);
        setSessionStartTime(null);
        setElapsedSeconds(0);
        try {
          localStorage.removeItem(`workout_session_active_${activeWorkout.id}`);
          localStorage.removeItem(`workout_session_start_time_${activeWorkout.id}`);
        } catch {}
      }
      setIsFinishModalOpen(false);

      // Trigger Celebration Modal
      setCelebrationSummary(celebrationData);
      setSuccessMsg(`Workout successfully saved! Next workout Day updated.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      await loadWorkflowState();

      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to log workout session details.');
    } finally {
      setLoggingWorkout(false);
    }
  };

  const handleLogWorkout = async () => {
    if (!activeWorkout) return;

    if (!isSessionActive) {
      setErrorMsg('Please start the workout before submitting.');
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const finalSetsPayload: Array<{
        exerciseId: string;
        setNumber: number;
        weight?: number | null;
        reps?: number | null;
        durationSeconds?: number | null;
        difficulty?: number | null;
        startedAt?: Date | null;
        completedAt?: Date | null;
        restSeconds?: number | null;
      }> = [];

      const warnings: string[] = [];

      for (const ex of activeWorkout.exercises) {
        if (skippedExerciseIds.has(ex.id)) {
          continue;
        }

        const cachedEx = userProfile
          ? ProgressionEngine.evaluateProgression(ex.id, userProfile.lastSetSummaryPerExercise)
          : null;

        for (let i = 1; i <= ex.targetSets; i++) {
          const key = `${ex.id}-${i}`;
          const isTimed = ex.type === 'timed';
          const defaultInput = isTimed
            ? {
                weight: '',
                reps: '',
                durationSeconds: ex.targetRepMin?.toString() || '30',
                difficulty: '7',
              }
            : { weight: '20', reps: '10', durationSeconds: '', difficulty: '' };

          const rawInputValues = inputs[key] || defaultInput;
          // In sequential set mode, if item/set is not checked it should be put on 0 (kg/reps or sec)
          const isSetChecked = Boolean(rawInputValues.completed);
          const inputValues =
            isSequentialSetMode && !isSetChecked
              ? {
                  ...rawInputValues,
                  weight: '0',
                  reps: '0',
                  durationSeconds: '0',
                }
              : rawInputValues;

          if (isTimed) {
            let secNum = parseInt(inputValues.durationSeconds || '', 10);
            let diffNum: number | null = parseInt(inputValues.difficulty || '', 10);
            if (isNaN(diffNum)) {
              diffNum = null;
            } else {
              if (diffNum < 1) diffNum = 1;
              if (diffNum > 10) diffNum = 10;
            }

            if (isNaN(secNum)) {
              secNum = 0;
              warnings.push(`${ex.name} (Set ${i}): Duration is empty or non-numeric (will record as 0s).`);
            } else if (secNum > 3600) {
              warnings.push(`${ex.name} (Set ${i}): Duration (${secNum}s) exceeds 1 hour.`);
            } else if (secNum <= 0) {
              warnings.push(`${ex.name} (Set ${i}): Duration is 0s.`);
            }

            finalSetsPayload.push({
              exerciseId: ex.id,
              setNumber: i,
              weight: null,
              reps: null,
              durationSeconds: secNum,
              difficulty: diffNum,
              startedAt: inputValues.startedAt ? new Date(inputValues.startedAt) : null,
              completedAt: inputValues.completedAt ? new Date(inputValues.completedAt) : null,
            });
          } else {
            let weightNum = parseFloat(inputValues.weight || '');
            let repsNum = parseInt(inputValues.reps || '', 10);

            if (isNaN(weightNum)) {
              weightNum = 0;
              warnings.push(`${ex.name} (Set ${i}): Weight is empty or non-numeric (will record as 0 kg).`);
            } else if (weightNum > 350) {
              warnings.push(`${ex.name} (Set ${i}): Weight (${weightNum} kg) is unusually high (>350 kg).`);
            } else if (weightNum < 0) {
              warnings.push(`${ex.name} (Set ${i}): Weight (${weightNum} kg) is negative.`);
            }

            if (isNaN(repsNum)) {
              repsNum = 0;
              warnings.push(`${ex.name} (Set ${i}): Rep count is empty or non-numeric (will record as 0 reps).`);
            } else if (repsNum > 100) {
              warnings.push(`${ex.name} (Set ${i}): Rep count (${repsNum} reps) is unusually high (>100 reps).`);
            } else if (repsNum <= 0 && isSetChecked) {
              warnings.push(`${ex.name} (Set ${i}): Rep count is 0.`);
            }

            if (cachedEx?.lastWeight && cachedEx.lastWeight >= 20 && weightNum >= cachedEx.lastWeight * 3) {
              warnings.push(`${ex.name} (Set ${i}): Weight (${weightNum} kg) is more than 3x your previous benchmark (${cachedEx.lastWeight} kg).`);
            }

            finalSetsPayload.push({
              exerciseId: ex.id,
              setNumber: i,
              weight: weightNum,
              reps: repsNum,
              durationSeconds: null,
              difficulty: null,
              startedAt: inputValues.startedAt ? new Date(inputValues.startedAt) : null,
              completedAt: inputValues.completedAt ? new Date(inputValues.completedAt) : null,
            });
          }
        }
      }

      if (finalSetsPayload.length === 0) {
        setErrorMsg('All exercises are skipped. Please complete or un-skip at least one exercise to submit.');
        return;
      }

      if (bodyWeightKg) {
        const bw = parseFloat(bodyWeightKg);
        if (!isNaN(bw) && (bw < 20 || bw > 350)) {
          warnings.push(`Session bodyweight (${bw} kg) is outside typical range (20–350 kg).`);
        }
      }

      if (warnings.length > 0) {
        setUnrealisticWarningConfig({
          isOpen: true,
          warnings,
          onConfirm: () => {
            setUnrealisticWarningConfig((prev) => ({ ...prev, isOpen: false }));
            executeSaveWorkout(finalSetsPayload);
          },
        });
        return;
      }

      await executeSaveWorkout(finalSetsPayload);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to validate workout inputs.');
    }
  };

  const toggleSetCompleted = (key: string) => {
    const nowDate = new Date();
    const nowIso = nowDate.toISOString();

    setInputs((prev) => {
      const current = prev[key] || { weight: '20', reps: '10', durationSeconds: '30', difficulty: '7' };
      const isNowCompleted = !current.completed;
      const nowTime = isNowCompleted
        ? nowDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : undefined;

      const lastDashIdx = key.lastIndexOf('-');
      const currentExId = lastDashIdx !== -1 ? key.substring(0, lastDashIdx) : key;
      const currentSetNum = lastDashIdx !== -1 ? parseInt(key.substring(lastDashIdx + 1), 10) : 1;

      // Determine startedAt if not already tracked
      let effectiveStartedAt = current.startedAt;
      if (isNowCompleted && !effectiveStartedAt) {
        if (sessionStartTime) {
          effectiveStartedAt = new Date(sessionStartTime).toISOString();
        } else {
          effectiveStartedAt = nowIso;
        }
      }

      const updated = {
        ...prev,
        [key]: {
          ...current,
          // If set is unchecked, both values (weight/reps for strength or durationSeconds for timed) are put to '0'
          ...(isNowCompleted
            ? {
                completed: true,
                completedAt: nowIso,
                startedAt: effectiveStartedAt,
              }
            : {
                completed: false,
                completedAt: undefined,
                startedAt: undefined,
                weight: '0',
                reps: '0',
                durationSeconds: '0',
              }),
        },
      };

      // If completed and in sequential mode or active session, prepare next set's start time and handle auto-advance
      if (isNowCompleted && activeWorkout) {
        const targetExercise = activeWorkout.exercises.find((e) => e.id === currentExId);
        const targetSets = targetExercise?.targetSets || 3;

        let nextKey: string | null = null;
        let nextExId: string | null = null;

        if (currentSetNum < targetSets) {
          nextKey = `${currentExId}-${currentSetNum + 1}`;
          nextExId = currentExId;
        } else {
          // Current exercise sets all finished! Advance to next non-skipped exercise
          const exIndex = activeWorkout.exercises.findIndex((e) => e.id === currentExId);
          for (let i = exIndex + 1; i < activeWorkout.exercises.length; i++) {
            const nextCandidate = activeWorkout.exercises[i];
            if (!skippedExerciseIds.has(nextCandidate.id)) {
              nextExId = nextCandidate.id;
              nextKey = `${nextCandidate.id}-1`;
              break;
            }
          }
        }

        if (nextKey) {
          const nextSetVal = updated[nextKey] || { weight: '20', reps: '10', durationSeconds: '30', difficulty: '7' };
          updated[nextKey] = {
            ...nextSetVal,
            startedAt: nowIso,
          };
        }

        if (isSequentialSetMode && nextExId) {
          setExpandedExerciseId(nextExId);
          if (user && activeWorkout) {
            try {
              localStorage.setItem(`workout_expanded_ex_${user.uid}_${activeWorkout.id}`, nextExId);
            } catch {}
          }
        }
      }

      saveDraftCheckpoint(updated);

      // P1.3: Trigger rest timer auto-start and haptic vibration when set is checked off
      if (isNowCompleted && activeWorkout) {
        const targetExercise = activeWorkout.exercises.find((e) => e.id === currentExId);

        // Light haptic pulse confirming checkoff
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate(50);
          } catch {}
        }

        // Trigger smart motivational praise toast if sequential set mode is enabled
        if (isSequentialSetMode) {
          setSetPraiseToast({
            message: getRandomPraise(),
            exerciseName: targetExercise?.name,
            setNumber: currentSetNum,
          });
        }

        const configuredRest = restDurationSeconds > 0 ? restDurationSeconds : 90;
        setAutoRestTimer({
          isOpen: true,
          durationSeconds: configuredRest,
          exerciseName: targetExercise?.name || '',
          setNumber: currentSetNum,
        });
      } else if (!isNowCompleted) {
        // Dismiss rest timer if set was unchecked
        setAutoRestTimer((prev) => ({ ...prev, isOpen: false }));
      }

      return updated;
    });
  };

  const totalTargetSets = useMemo(() => {
    if (!activeWorkout) return 0;
    return activeWorkout.exercises.reduce((sum, ex) => {
      if (skippedExerciseIds.has(ex.id)) return sum;
      return sum + (ex.targetSets || 3);
    }, 0);
  }, [activeWorkout, skippedExerciseIds]);

  const completedSetsCount = useMemo(() => {
    if (!activeWorkout) return 0;
    return Object.entries(inputs).filter(([, val]) => val?.completed).length;
  }, [activeWorkout, inputs]);

  const completedExercisesCount = useMemo(() => {
    if (!activeWorkout) return 0;
    return activeWorkout.exercises.filter((ex) => {
      if (skippedExerciseIds.has(ex.id)) return true;
      const target = ex.targetSets || 3;
      let allDone = true;
      for (let i = 1; i <= target; i++) {
        if (!inputs[`${ex.id}-${i}`]?.completed) {
          allDone = false;
          break;
        }
      }
      return allDone;
    }).length;
  }, [activeWorkout, inputs, skippedExerciseIds]);

  return {
    workouts,
    setWorkouts,
    activeWorkout,
    setActiveWorkout,
    expandedExerciseId,
    setExpandedExerciseId,
    userProfile,
    lastSessionDay,
    suggestedDay,
    loading,
    loggingWorkout,
    errorMsg,
    setErrorMsg,
    successMsg,
    isRoutineEditorOpen,
    setIsRoutineEditorOpen,
    showWelcomeModal,
    setShowWelcomeModal,
    sleepHours,
    setSleepHours,
    energyScore,
    setEnergyScore,
    sessionNotes,
    setSessionNotes,
    bodyWeightKg,
    setBodyWeightKg,
    selectedPhotos,
    photoPreviews,
    isUploadingPhotos,
    fileInputRef,
    cameraInputRef,
    sessionDate,
    setSessionDate,
    lastAutoSavedTime,
    restDurationSeconds,
    setRestDurationSeconds,
    isSequentialSetMode,
    toggleSequentialSetMode,
    setPraiseToast,
    setSetPraiseToast,
    inputs,
    isSessionActive,
    setIsSessionActive,
    sessionStartTime,
    elapsedSeconds,
    isFinishModalOpen,
    setIsFinishModalOpen,
    totalTargetSets,
    completedSetsCount,
    completedExercisesCount,
    handleStartWorkout,
    handleCancelSession,
    handlePhotoSelect,
    handleRemovePhoto,
    saveDraftCheckpoint,
    loadWorkflowState,
    updateInputValue,
    handleTextChange,
    toggleSetCompleted,
    unrealisticWarningConfig,
    setUnrealisticWarningConfig,
    celebrationSummary,
    setCelebrationSummary,
    autoRestTimer,
    setAutoRestTimer,
    historySessions,
    skippedExerciseIds,
    toggleSkipExercise,
    getProgressionAdvice,
    handleLogWorkout,
  };
}
