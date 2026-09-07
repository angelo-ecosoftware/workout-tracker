import React, { useState, useEffect, useRef } from 'react';
import { X, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { playOneSecondVibrateAlarm } from '../../../utils/sound.ts';

interface RestTimerDrawerProps {
  isOpen: boolean;
  initialSeconds?: number;
  exerciseName?: string;
  setNumber?: number;
  onClose: () => void;
}

export const RestTimerDrawer: React.FC<RestTimerDrawerProps> = ({
  isOpen,
  initialSeconds = 90,
  exerciseName,
  setNumber,
  onClose,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [totalSeconds, setTotalSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const targetEndRef = useRef<number | null>(null);

  // Restart timer whenever modal opens or initialSeconds changes
  useEffect(() => {
    if (isOpen) {
      const duration = initialSeconds > 0 ? initialSeconds : 90;
      setTotalSeconds(duration);
      setSecondsLeft(duration);
      setIsRunning(true);
      targetEndRef.current = Date.now() + duration * 1000;
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      targetEndRef.current = null;
    }
  }, [isOpen, initialSeconds]);

  // Wall-clock resilient timer loop
  useEffect(() => {
    if (!isOpen || !isRunning) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const updateTimer = () => {
      if (!targetEndRef.current) return;
      const msLeft = targetEndRef.current - Date.now();
      const secLeft = Math.max(0, Math.ceil(msLeft / 1000));
      setSecondsLeft(secLeft);

      if (msLeft <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        setIsRunning(false);
        if (soundEnabled) {
          playOneSecondVibrateAlarm();
        }
      }
    };

    updateTimer();
    timerRef.current = setInterval(updateTimer, 100);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        updateTimer();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isOpen, isRunning, soundEnabled]);

  if (!isOpen) return null;

  const circleRadius = 60;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const progressRatio = totalSeconds > 0 ? (totalSeconds - secondsLeft) / totalSeconds : 0;
  const strokeDashoffset = circleCircumference * (1 - Math.min(1, Math.max(0, progressRatio)));

  const handleAdjustSeconds = (delta: number) => {
    const nextVal = Math.max(5, secondsLeft + delta);
    setSecondsLeft(nextVal);
    setTotalSeconds(Math.max(totalSeconds, nextVal));
    targetEndRef.current = Date.now() + nextVal * 1000;
    if (!isRunning) setIsRunning(true);
  };

  const handleReset = () => {
    setSecondsLeft(totalSeconds);
    targetEndRef.current = Date.now() + totalSeconds * 1000;
    setIsRunning(true);
  };

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-md bg-[#0f0f0f]/95 backdrop-blur-xl border border-[#2a2a2a] rounded-3xl p-4 shadow-[0_10px_40px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Rest Countdown Timer"
    >
      <div className="flex items-center justify-between pb-2 border-b border-[#202020]">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#C0FF00] animate-pulse" />
          <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
            Rest Interval
          </span>
          {exerciseName && (
            <span className="text-[10px] font-sans text-gray-400 truncate max-w-[140px]">
              • {exerciseName} {setNumber ? `(Set ${setNumber})` : ''}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSoundEnabled((prev) => !prev)}
            aria-label={soundEnabled ? 'Mute buzzer sound' : 'Enable buzzer sound'}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#C0FF00]" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close rest timer"
            className="p-1.5 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 px-2">
        {/* Circular Countdown Gauge */}
        <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
            <circle
              cx="70"
              cy="70"
              r={circleRadius}
              fill="none"
              stroke="#1c1c1c"
              strokeWidth="8"
            />
            <circle
              cx="70"
              cy="70"
              r={circleRadius}
              fill="none"
              stroke="#C0FF00"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circleCircumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-[stroke-dashoffset] duration-100 ease-linear"
              style={{
                filter: 'drop-shadow(0 0 8px rgba(192, 255, 0, 0.45))',
              }}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display font-black text-2xl text-[#C0FF00] font-mono tracking-tight drop-shadow-[0_0_10px_rgba(192,255,0,0.3)]">
              {secondsLeft}s
            </span>
            <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest font-bold">
              {secondsLeft === 0 ? 'GO!' : 'REST'}
            </span>
            <div role="timer" aria-live="polite" aria-atomic="true" className="sr-only">
              Rest time remaining: {secondsLeft} seconds
            </div>
          </div>
        </div>

        {/* Quick adjustment controls */}
        <div className="flex flex-col gap-2 flex-1 pl-4">
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => handleAdjustSeconds(-15)}
              className="py-1.5 px-2 rounded-xl bg-[#1c1c1c] hover:bg-[#252525] border border-[#2a2a2a] text-gray-300 font-mono text-[11px] font-bold cursor-pointer active:scale-95 transition-all text-center"
            >
              -15s
            </button>
            <button
              type="button"
              onClick={() => handleAdjustSeconds(15)}
              className="py-1.5 px-2 rounded-xl bg-[#1c1c1c] hover:bg-[#252525] border border-[#2a2a2a] text-gray-300 hover:text-[#C0FF00] font-mono text-[11px] font-bold cursor-pointer active:scale-95 transition-all text-center"
            >
              +15s
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleReset}
              title="Reset Timer"
              aria-label="Reset timer to beginning"
              className="p-2 rounded-xl bg-[#1c1c1c] hover:bg-[#252525] border border-[#2a2a2a] text-gray-300 hover:text-white cursor-pointer transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-3 rounded-xl bg-[#C0FF00] hover:bg-[#b0eb00] text-black font-mono font-bold text-xs uppercase tracking-wider cursor-pointer active:scale-95 transition-all shadow-[0_0_15px_rgba(192,255,0,0.2)] text-center flex items-center justify-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-black" />
              <span>Next Set</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
