import { useEffect, useState } from 'react';

export function useWorkoutTimer(workoutId?: string | null) {
  const [isActive, setIsActive] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!workoutId) {
      setIsActive(false);
      setStartTime(null);
      setElapsedSeconds(0);
      return;
    }

    try {
      const activeStored = localStorage.getItem(`workout_session_active_${workoutId}`);
      const startTimeStored = localStorage.getItem(`workout_session_start_time_${workoutId}`);
      const storedStartTime = startTimeStored ? Number.parseInt(startTimeStored, 10) : NaN;

      if (activeStored === 'true' && Number.isFinite(storedStartTime) && storedStartTime > 0) {
        setIsActive(true);
        setStartTime(storedStartTime);
        setElapsedSeconds(Math.max(0, Math.floor((Date.now() - storedStartTime) / 1000)));
        return;
      }
    } catch {}

    setIsActive(false);
    setStartTime(null);
    setElapsedSeconds(0);
  }, [workoutId]);

  useEffect(() => {
    if (!isActive || !startTime) return;

    const tick = () => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startTime) / 1000)));
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isActive, startTime]);

  const start = () => {
    if (!workoutId) return null;
    const now = Date.now();
    setIsActive(true);
    setStartTime(now);
    setElapsedSeconds(0);
    try {
      localStorage.setItem(`workout_session_active_${workoutId}`, 'true');
      localStorage.setItem(`workout_session_start_time_${workoutId}`, String(now));
    } catch {}
    return now;
  };

  const reset = () => {
    setIsActive(false);
    setStartTime(null);
    setElapsedSeconds(0);
    if (workoutId) {
      try {
        localStorage.removeItem(`workout_session_active_${workoutId}`);
        localStorage.removeItem(`workout_session_start_time_${workoutId}`);
      } catch {}
    }
  };

  return {
    isActive,
    startTime,
    elapsedSeconds,
    start,
    reset,
  };
}
