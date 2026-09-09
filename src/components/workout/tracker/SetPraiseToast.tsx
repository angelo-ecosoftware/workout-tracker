import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

export const MOTIVATIONAL_PRAISES = [
  "Good job!",
  "You are killing it!",
  "Keep pushing!",
  "You got this!",
  "Unstoppable power!",
  "Rep by rep, day by day!",
  "Solid work, beast mode!",
  "Crushed that set!",
  "Pure dedication!",
  "Stay focused, finish strong!",
];

export function getRandomPraise(): string {
  const index = Math.floor(Math.random() * MOTIVATIONAL_PRAISES.length);
  return MOTIVATIONAL_PRAISES[index];
}

interface SetPraiseToastProps {
  message: string | null;
  exerciseName?: string;
  setNumber?: number;
  onDismiss: () => void;
}

export const SetPraiseToast: React.FC<SetPraiseToastProps> = ({
  message,
  exerciseName,
  setNumber,
  onDismiss,
}) => {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    if (!message) {
      setIsFadingOut(false);
      return;
    }

    setIsFadingOut(false);

    // After 4.5 seconds start fade out, at 5.0 seconds dismiss completely
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 4500);

    const dismissTimer = setTimeout(() => {
      onDismiss();
    }, 5000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(dismissTimer);
    };
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm pointer-events-none transition-all duration-500 ease-in-out ${
        isFadingOut ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0 animate-in fade-in zoom-in-95 duration-200'
      }`}
    >
      <div className="bg-[#121212]/95 backdrop-blur-xl border border-[#C0FF00]/60 rounded-2xl p-3.5 shadow-[0_10px_35px_rgba(192,255,0,0.25)] flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#C0FF00] text-black flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(192,255,0,0.4)]">
          <Sparkles className="w-5 h-5 stroke-[2.5]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display font-black text-sm uppercase tracking-tight text-[#C0FF00] truncate">
            {message}
          </p>
          {(exerciseName || setNumber) && (
            <p className="font-mono text-[10px] text-gray-400 truncate mt-0.5">
              {exerciseName ? exerciseName : ''}{setNumber ? ` • Set ${setNumber} Complete` : ' • Set Complete'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
