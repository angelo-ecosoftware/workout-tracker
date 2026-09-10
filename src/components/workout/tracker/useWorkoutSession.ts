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
import { WorkoutSummaryCelebration } from './WorkoutCompletionModal.tsx';
import { getRandomPraise } from './SetPraiseToast.tsx';
import {
  buildWorkoutSetPayload,
  calculateWorkoutCelebrationSummary,
  getWorkoutProgressionAdvice,
  sanitizeWorkoutInputValue,
  WorkoutSessionInputs,
} from './workoutSessionCalculations.ts';
import {
  createWorkoutDraftPayload,
  getSelectedWorkoutKey,
  getWorkoutDraftKey,
  getWorkoutSessionTimerKey,
  parseWorkoutDraft,
} from './workoutSessionDraft.ts';

export function useWorkoutSession(user: AuthUser | null) {
  const [workouts, setWorkouts] = useState<(Workout & { exercises: Exercise[] })[]>([]);
  const [activeWorkout, setActiveWorkoutState] = useState<(Workout & { exercises: Exercise[] }) | null>(null);
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
    try {
      const val = localStorage.getItem('setting_rest_duration_seconds');
      return val ? parseInt(val, 10) : 5;
    } catch {
      return 5;
    }
  });

  // Sequential Set Mode (Guided 1 set at a time)
  const [isSequentialSetMode, setIsSequentialSetMode] = useState<boolean>(() => {
    try {
      const val = localStorage.getItem('setting_sequential_set_mode');
      return val ? val === 'true' : false;
    } catch {
      return false;
    }
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
  const hydrationGenerationRef = useRef(0);
  const currentUserIdRef = useRef<string | null>(user?.uid ?? null);
  const activeWorkoutIdRef = useRef<string | null>(activeWorkout?.id ?? null);
  const photoOperationGenerationRef = useRef(0);
  currentUserIdRef.current = user?.uid ?? null;
  activeWorkoutIdRef.current = activeWorkout?.id ?? null;

  const setActiveWorkout = (workout: (Workout & { exercises: Exercise[] }) | null) => {
    setActiveWorkoutState(workout);
    if (!workout || !user?.uid) return;

    const selectedWorkoutKey = getSelectedWorkoutKey(user.uid);
    if (!selectedWorkoutKey) return;
    try {
      localStorage.setItem(selectedWorkoutKey, workout.id);
    } catch {}
  };

  const getTimerKey = (workoutId: string, kind: 'active' | 'start_time') =>
    getWorkoutSessionTimerKey(user?.uid, workoutId, kind);

  const clearPhotoState = () => {
    photoOperationGenerationRef.current += 1;
    setSelectedPhotos([]);
    setPhotoPreviews((prev) => {
      prev.forEach((url) => URL.revokeObjectURL(url));
      return [];
    });
  };

  // Load session timer state when activeWorkout changes
  useEffect(() => {
    if (!activeWorkout) {
      setIsSessionActive(false);
      setSessionStartTime(null);
      setElapsedSeconds(0);
      return;
    }

    try {
      const activeKey = getTimerKey(activeWorkout.id, 'active');
      const startTimeKey = getTimerKey(activeWorkout.id, 'start_time');
      const activeStored = activeKey ? localStorage.getItem(activeKey) : null;
      const startTimeStored = startTimeKey ? localStorage.getItem(startTimeKey) : null;

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
  }, [activeWorkout?.id, user?.uid]);

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
      const activeKey = getTimerKey(activeWorkout.id, 'active');
      const startTimeKey = getTimerKey(activeWorkout.id, 'start_time');
      if (activeKey && startTimeKey) {
        localStorage.setItem(activeKey, 'true');
        localStorage.setItem(startTimeKey, String(now));
      }
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
      const activeKey = getTimerKey(activeWorkout.id, 'active');
      const startTimeKey = getTimerKey(activeWorkout.id, 'start_time');
      if (activeKey) localStorage.removeItem(activeKey);
      if (startTimeKey) localStorage.removeItem(startTimeKey);
    } catch {}
  };

  // Sync settings when modified from SettingsModal
  useEffect(() => {
    const handleSettingsUpdate = () => {
      try {
        const restVal = localStorage.getItem('setting_rest_duration_seconds');
        if (restVal) setRestDurationSeconds(parseInt(restVal, 10));
      } catch {}
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
  const [inputs, setInputs] = useState<WorkoutSessionInputs>({});

  const getDraftKey = (workoutId?: string) => {
    return getWorkoutDraftKey(user?.uid, workoutId, activeWorkout?.id);
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remainingSlots = 5 - selectedPhotos.length;
    if (remainingSlots <= 0) {
      setErrorMsg('You can upload a maximum of 5 photos per session.');
      return;
    }

    const photoUserId = user?.uid;
    const photoWorkoutId = activeWorkout?.id;
    const operationGeneration = ++photoOperationGenerationRef.current;
    const newRawFiles = files.slice(0, remainingSlots);
    const newFiles = await Promise.all(newRawFiles.map((f) => compressWorkoutImage(f)));
    if (
      photoOperationGenerationRef.current !== operationGeneration ||
      currentUserIdRef.current !== photoUserId ||
      activeWorkoutIdRef.current !== photoWorkoutId
    ) {
      return;
    }

    const updatedFiles = [...selectedPhotos, ...newFiles];
    setSelectedPhotos(updatedFiles);

    const newPreviews = newFiles.map((f) => URL.createObjectURL(f));
    setPhotoPreviews((prev) => [...prev, ...newPreviews]);

    if (photoUserId && photoWorkoutId) {
      await saveDraftPhotosToStorage(photoUserId, photoWorkoutId, updatedFiles);
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
      const payload = createWorkoutDraftPayload(
        workoutId,
        activeWorkout?.id,
        newInputs,
        curDate ?? sessionDate,
        curSleep ?? sleepHours,
        curEnergy ?? energyScore,
        curNotes ?? sessionNotes,
        curWeight ?? bodyWeightKg,
        curSkippedIds ?? Array.from(skippedExerciseIds)
      );
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
    const hydrationGeneration = ++hydrationGenerationRef.current;
    const hydrationUserId = user?.uid ?? null;
    const isCurrentHydration = () =>
      hydrationGenerationRef.current === hydrationGeneration &&
      currentUserIdRef.current === hydrationUserId;

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

      if (!isCurrentHydration()) return;

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

      let selectedWorkoutId: string | null = null;
      try {
        const selectedWorkoutKey = getSelectedWorkoutKey(user.uid);
        selectedWorkoutId = selectedWorkoutKey ? localStorage.getItem(selectedWorkoutKey) : null;
      } catch {}

      const selectedWorkout = selectedWorkoutId
        ? wData.combinedWorkouts.find((workout) => workout.id === selectedWorkoutId)
        : undefined;
      if (!selectedWorkout && selectedWorkoutId) {
        try {
          const selectedWorkoutKey = getSelectedWorkoutKey(user.uid);
          if (selectedWorkoutKey) localStorage.removeItem(selectedWorkoutKey);
        } catch {}
      }

      const targetW =
        selectedWorkout ||
        wData.combinedWorkouts.find((w) => w.order === computedNextDay) ||
        wData.combinedWorkouts[0];
      setActiveWorkoutState(targetW || null);
    } catch (err: unknown) {
      if (!isCurrentHydration()) return;
      console.error('loadWorkflowState ERROR:', err);
      setErrorMsg(`Failed to synchronize active workout progression. ERROR: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      if (isCurrentHydration()) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    ++hydrationGenerationRef.current;
    if (user) {
      clearPhotoState();
      loadWorkflowState();
    } else {
      clearPhotoState();
      setWorkouts([]);
      setActiveWorkoutState(null);
      setUserProfile(null);
      setHistorySessions([]);
      setLoading(false);
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

    const photoUserId = user.uid;
    const photoWorkoutId = activeWorkout.id;
    const operationGeneration = ++photoOperationGenerationRef.current;
    let cancelled = false;

    loadDraftPhotosFromStorage(photoUserId, photoWorkoutId).then((restoredFiles) => {
      if (
        cancelled ||
        photoOperationGenerationRef.current !== operationGeneration ||
        currentUserIdRef.current !== photoUserId ||
        activeWorkoutIdRef.current !== photoWorkoutId
      ) {
        return;
      }

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
      let restoredDraft = false;
      if (draftKey) {
        try {
          const rawDraft = localStorage.getItem(draftKey);
          if (rawDraft) {
            const parsedDraft = parseWorkoutDraft(rawDraft);
            const matchingDraft =
              parsedDraft &&
              (!parsedDraft.workoutId || parsedDraft.workoutId === activeWorkout.id)
                ? parsedDraft
                : null;
            if (matchingDraft?.skippedExerciseIds && Array.isArray(matchingDraft.skippedExerciseIds)) {
              setSkippedExerciseIds(new Set(matchingDraft.skippedExerciseIds));
            }
            if (matchingDraft?.inputs && Object.keys(matchingDraft.inputs).length > 0) {
              setInputs(matchingDraft.inputs);
              restoredDraft = true;
              if (matchingDraft.sessionDate) setSessionDate(matchingDraft.sessionDate);
              if (matchingDraft.sleepHours != null) setSleepHours(matchingDraft.sleepHours);
              if (matchingDraft.energyScore != null) setEnergyScore(matchingDraft.energyScore);
              if (matchingDraft.notes != null) setSessionNotes(matchingDraft.notes);
              if (matchingDraft.bodyWeightKg != null) setBodyWeightKg(String(matchingDraft.bodyWeightKg));
              if (matchingDraft.savedAt) {
                const dateObj = new Date(matchingDraft.savedAt);
                setLastAutoSavedTime(
                  dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                );
              }
            }
          }
        } catch (e) {
          console.warn('Failed to parse draft from localStorage', e);
        }
      }

      if (restoredDraft) return;

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
    return () => {
      cancelled = true;
    };
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
    const sanitized = sanitizeWorkoutInputValue(field, value);

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
    return getWorkoutProgressionAdvice(ex, userProfile);
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

      const celebrationData = calculateWorkoutCelebrationSummary(
        activeWorkout,
        finalSetsPayload,
        skippedExerciseIds,
        userProfile
      );

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
          const activeKey = getTimerKey(activeWorkout.id, 'active');
          const startTimeKey = getTimerKey(activeWorkout.id, 'start_time');
          if (activeKey) localStorage.removeItem(activeKey);
          if (startTimeKey) localStorage.removeItem(startTimeKey);
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
      const { finalSetsPayload, warnings } = buildWorkoutSetPayload(
        activeWorkout,
        skippedExerciseIds,
        inputs,
        userProfile,
        isSequentialSetMode
      );

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
