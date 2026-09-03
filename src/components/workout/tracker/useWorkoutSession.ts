import { useState, useEffect, useRef } from 'react';
import { AuthUser } from '../../../context/AuthContext.tsx';
import { Workout, Exercise, UserProfile } from '../../../models.ts';
import {
  fetchWorkoutsData,
  getUserProgressState,
  logSessionCompletion,
  seedTemplatesIfMissing,
  logDailyBodyWeight,
} from '../../../lib/supabaseData.ts';
import { uploadWorkoutPhotos } from '../../../lib/storage.ts';
import { SessionEngine, ProgressionEngine } from '../../../engine.ts';
import { SetTimingRecord } from '../assisted/AssistedTimedTracker.tsx';
import {
  saveDraftPhotosToStorage,
  loadDraftPhotosFromStorage,
  clearDraftPhotosFromStorage,
} from '../../../utils/draftPhotoStorage.ts';

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

  // Assisted Timed Workout Mode state
  const [isAssistedMode, setIsAssistedMode] = useState<boolean>(() => {
    return localStorage.getItem('setting_assisted_timed_workout') === 'true';
  });
  const [restDurationSeconds, setRestDurationSeconds] = useState<number>(() => {
    const val = localStorage.getItem('setting_rest_duration_seconds');
    return val ? parseInt(val, 10) : 5;
  });
  const [assistedFinished, setAssistedFinished] = useState(false);
  const [assistedSessionTimings, setAssistedSessionTimings] = useState<{
    startedAt?: Date;
    completedAt?: Date;
    setTimings?: Record<string, SetTimingRecord>;
  } | null>(null);

  // Sync settings when modified from SettingsModal
  useEffect(() => {
    const handleSettingsUpdate = () => {
      setIsAssistedMode(localStorage.getItem('setting_assisted_timed_workout') === 'true');
      const restVal = localStorage.getItem('setting_rest_duration_seconds');
      if (restVal) setRestDurationSeconds(parseInt(restVal, 10));
    };

    window.addEventListener('workout_settings_updated', handleSettingsUpdate);
    return () => window.removeEventListener('workout_settings_updated', handleSettingsUpdate);
  }, []);

  // Screen Wake Lock API to keep the screen active during workouts
  useEffect(() => {
    if (!activeWorkout) return;

    let wakeLockSentinel: any = null;

    const requestWakeLock = async () => {
      if ('wakeLock' in navigator && document.visibilityState === 'visible') {
        try {
          wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
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

    const newFiles = files.slice(0, remainingSlots);
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
    curWeight?: string
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
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(key, JSON.stringify(payload));
      if (user) {
        localStorage.setItem(`workout_draft_latest_${user.uid}`, JSON.stringify(payload));
      }
      setLastAutoSavedTime(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    } catch (e) {
      console.warn('Could not save draft checkpoint to localStorage', e);
    }
  };

  const clearDraftCheckpoint = async (workoutId?: string) => {
    const targetWkId = workoutId || activeWorkout?.id;
    const key = getDraftKey(targetWkId);
    if (key) {
      try {
        localStorage.removeItem(key);
        if (user) {
          localStorage.removeItem(`workout_draft_latest_${user.uid}`);
        }
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

      const [wData, userProgress] = await Promise.all([
        fetchWorkoutsData(user.uid),
        getUserProgressState(user.uid),
      ]);

      const progressState = userProgress.profile;
      setWorkouts(wData.combinedWorkouts);
      setUserProfile(progressState);

      const welcomeKey = `welcome_shown_${user.uid}`;
      if (userProgress.isNewUser && !localStorage.getItem(welcomeKey)) {
        setShowWelcomeModal(true);
      }

      const computedNextDay = SessionEngine.calculateNextWorkoutOrder(
        progressState,
        wData.combinedWorkouts
      );
      setSuggestedDay(computedNextDay);

      if (progressState.lastCompletedWorkoutOrder) {
        setLastSessionDay(progressState.lastCompletedWorkoutOrder);
      } else {
        setLastSessionDay(null);
      }

      const targetW =
        wData.combinedWorkouts.find((w) => w.order === computedNextDay) || wData.combinedWorkouts[0];
      setActiveWorkout(targetW || null);
    } catch (err: any) {
      console.error('loadWorkflowState ERROR:', err);
      setErrorMsg(`Failed to synchronize active workout progression. ERROR: ${err.message}`);
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

    if (activeWorkout.exercises && activeWorkout.exercises.length > 0) {
      setExpandedExerciseId(activeWorkout.exercises[0].id);
    } else {
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

      const draftKey = getDraftKey(activeWorkout.id);
      if (draftKey) {
        try {
          let rawDraft = localStorage.getItem(draftKey);
          if (!rawDraft && user) {
            rawDraft = localStorage.getItem(`workout_draft_latest_${user.uid}`);
          }
          if (rawDraft) {
            const parsedDraft = JSON.parse(rawDraft);
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
      if (nextVal < 0) nextVal = 0;

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

  const handleLogWorkout = async () => {
    if (!activeWorkout) return;

    setLoggingWorkout(true);
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

      for (const ex of activeWorkout.exercises) {
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

          const inputValues = inputs[key] || defaultInput;
          const setTimingKey = `${ex.id}-${i}`;
          const recordedSetTiming = assistedSessionTimings?.setTimings?.[setTimingKey];

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
              durationSeconds: secNum,
              difficulty: isNaN(diffNum) ? null : diffNum,
              startedAt: recordedSetTiming?.startedAt,
              completedAt: recordedSetTiming?.completedAt,
              restSeconds: recordedSetTiming?.restSeconds,
            });
          } else {
            const weightNum = parseFloat(inputValues.weight || '');
            const repsNum = parseInt(inputValues.reps || '', 10);

            if (isNaN(weightNum) || isNaN(repsNum)) {
              throw new Error(`Invalid weight or reps detected on "${ex.name}" Set #${i}. Please correct.`);
            }

            finalSetsPayload.push({
              exerciseId: ex.id,
              setNumber: i,
              weight: weightNum,
              reps: repsNum,
              durationSeconds: recordedSetTiming?.durationSeconds || null,
              difficulty: null,
              startedAt: recordedSetTiming?.startedAt,
              completedAt: recordedSetTiming?.completedAt,
              restSeconds: recordedSetTiming?.restSeconds,
            });
          }
        }
      }

      let completedAtDate = assistedSessionTimings?.completedAt || undefined;
      let sessionStartedAtDate = assistedSessionTimings?.startedAt || undefined;

      if (sessionDate) {
        const baseTime = completedAtDate || new Date();
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
        } catch (uploadErr: any) {
          console.warn('Photos upload error, continuing session save:', uploadErr);
        } finally {
          setIsUploadingPhotos(false);
        }
      }

      try {
        await logSessionCompletion(
          user!.uid,
          activeWorkout.id,
          finalSetsPayload,
          activeWorkout.exercises,
          completedAtDate,
          sessionNotes,
          uploadedPhotoUrls,
          sessionStartedAtDate
        );

        const parsedWeight = parseFloat(bodyWeightKg);
        if (!isNaN(parsedWeight) && parsedWeight > 0) {
          const userHeight = userProfile?.heightCm || userProfile?.metrics?.height;
          await logDailyBodyWeight(user!.uid, {
            date: sessionDate,
            weightKg: parsedWeight,
            heightCm: userHeight,
            source: 'workout_session',
            notes: sessionNotes || undefined,
          });
        }
      } catch (networkErr: any) {
        console.error('Failed saving workout session:', networkErr);
        throw networkErr;
      }

      clearDraftCheckpoint(activeWorkout.id);
      setSessionNotes('');
      setSelectedPhotos([]);
      photoPreviews.forEach((url) => URL.revokeObjectURL(url));
      setPhotoPreviews([]);
      setAssistedSessionTimings(null);

      setSuccessMsg(`Workout successfully saved! Next workout Day updated.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      await loadWorkflowState();

      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to log workout session details.');
    } finally {
      setLoggingWorkout(false);
    }
  };

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
    isAssistedMode,
    setIsAssistedMode,
    restDurationSeconds,
    assistedFinished,
    setAssistedFinished,
    assistedSessionTimings,
    setAssistedSessionTimings,
    inputs,
    handlePhotoSelect,
    handleRemovePhoto,
    saveDraftCheckpoint,
    loadWorkflowState,
    updateInputValue,
    handleTextChange,
    getProgressionAdvice,
    handleLogWorkout,
  };
}
