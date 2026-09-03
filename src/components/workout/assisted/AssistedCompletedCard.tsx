import React from 'react';
import { Check } from 'lucide-react';

export const AssistedCompletedCard: React.FC = () => {
  return (
    <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-2xl p-5 text-center space-y-2 animate-in zoom-in-95">
      <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
        <Check className="w-5 h-5 stroke-[3]" />
      </div>
      <h4 className="font-display font-black uppercase italic text-sm text-white">
        All Sets Completed!
      </h4>
      <p className="text-xs font-mono text-emerald-400/80">
        Review your workout sheet below and click "Complete & Log Workout" to record your progress.
      </p>
    </div>
  );
};
