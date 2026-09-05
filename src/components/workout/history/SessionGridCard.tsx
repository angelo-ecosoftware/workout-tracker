import React from 'react';
import { CheckCircle2, Circle, CheckCheck } from 'lucide-react';
import { PopulatedSession } from './SessionDetailCard.tsx';

interface SessionGridCardProps {
  session: PopulatedSession;
  isDeleteMode: boolean;
  isSelected: boolean;
  onClick: () => void;
}

export const SessionGridCard: React.FC<SessionGridCardProps> = ({
  session,
  isDeleteMode,
  isSelected,
  onClick,
}) => {
  return (
    <div 
      className={`relative bg-[#111] border ${isDeleteMode && isSelected ? 'border-red-500 bg-red-500/[0.05]' : 'border-[#222]'} ${!isDeleteMode ? 'hover:border-[#C0FF00] hover:bg-[#161616]' : ''} rounded-[20px] p-4 flex flex-col justify-between cursor-pointer transition-all shadow-sm min-h-[110px] aspect-square group`}
      onClick={onClick}
    >
      {isDeleteMode && (
        <div className="absolute top-2 right-2 pointer-events-none">
          {isSelected ? <CheckCircle2 className="w-4 h-4 text-red-500" /> : <Circle className="w-4 h-4 text-gray-500" />}
        </div>
      )}
      <div>
        <div className="flex items-start justify-between gap-1">
          <h3 className={`font-display font-black text-xs sm:text-sm ${isDeleteMode && isSelected ? 'text-white' : 'text-[#C0FF00]'} uppercase tracking-tight leading-snug line-clamp-2 text-left w-full pr-1 group-hover:text-white transition-colors`}>
            {session.workoutName}
          </h3>
          {session.reviewedAt && !isDeleteMode && (
            <span title={`Seen by ${session.reviewedByCoachName || 'Coach'}`} className="shrink-0 p-0.5 text-sky-400 bg-sky-950/60 rounded border border-sky-800/40">
              <CheckCheck className="w-3 h-3 stroke-[2.5]" />
            </span>
          )}
        </div>
        <span className="inline-block mt-2 text-[10px] font-mono text-gray-400 bg-[#1c1c1c] px-2 py-0.5 rounded">
          {session.sets.length} sets
        </span>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-[#1f1f1f] mt-2">
        <span className="text-[10px] font-mono text-gray-500 uppercase">
          {session.completedAt ? session.completedAt.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }) : 'N/A'}
        </span>
        <span className="text-[9px] font-mono text-gray-600">
          {session.completedAt ? session.completedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
        </span>
      </div>
    </div>
  );
};
