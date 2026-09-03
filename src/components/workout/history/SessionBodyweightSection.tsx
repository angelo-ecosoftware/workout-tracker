import React from 'react';
import { Scale, Edit2, Save, Loader2 } from 'lucide-react';
import { BodyMeasurementLog } from '../../../models.ts';

interface SessionBodyweightSectionProps {
  sessionDateStr: string;
  sessionBodyLog: BodyMeasurementLog | undefined;
  isEditingWeight: boolean;
  editingWeightValue: string;
  isSavingWeight: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onChangeWeightValue: (val: string) => void;
  onSaveWeight: () => void;
}

export const SessionBodyweightSection: React.FC<SessionBodyweightSectionProps> = ({
  sessionDateStr,
  sessionBodyLog,
  isEditingWeight,
  editingWeightValue,
  isSavingWeight,
  onStartEdit,
  onCancelEdit,
  onChangeWeightValue,
  onSaveWeight,
}) => {
  return (
    <div className="mb-5 p-3.5 bg-[#161616] border border-[#2a2a2a] rounded-xl text-xs text-gray-300">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-[#C0FF00] shrink-0" />
          <span className="font-mono text-[10px] uppercase font-bold text-[#C0FF00]">
            Bodyweight on {sessionDateStr}
          </span>
        </div>
        {!isEditingWeight && (
          <button
            onClick={onStartEdit}
            className="p-1 text-gray-400 hover:text-[#C0FF00] transition-colors rounded hover:bg-[#222] flex items-center gap-1 text-[11px] font-mono"
            title="Edit Bodyweight"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Edit kg</span>
          </button>
        )}
      </div>

      {isEditingWeight ? (
        <div className="space-y-2 mt-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-[180px]">
              <input
                type="text"
                inputMode="decimal"
                value={editingWeightValue}
                onChange={(e) => {
                  const sanitized = e.target.value.replace(/[^0-9.]/g, '');
                  const parts = sanitized.split('.');
                  onChangeWeightValue(parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : sanitized);
                }}
                placeholder="e.g. 75.5"
                className="w-full bg-[#111] border border-[#333] focus:border-[#C0FF00] rounded-lg px-3 py-1.5 text-sm text-white font-mono font-bold placeholder-gray-600 focus:outline-none transition-colors"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-gray-500 pointer-events-none">
                kg
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={onCancelEdit}
                disabled={isSavingWeight}
                className="px-2.5 py-1.5 text-[11px] font-sans font-bold text-gray-400 hover:text-white rounded bg-[#222] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onSaveWeight}
                disabled={isSavingWeight}
                className="px-3 py-1.5 text-[11px] font-sans font-bold bg-[#C0FF00] hover:bg-[#b0f000] text-black rounded transition-colors flex items-center gap-1.5"
              >
                {isSavingWeight ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                Save kg
              </button>
            </div>
          </div>
          <p className="text-[10px] font-mono text-gray-500">
            Updates your daily time-series bodyweight history for {sessionDateStr}.
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-between mt-1 pt-0.5">
          <div className="flex items-baseline gap-2">
            {sessionBodyLog?.weightKg != null ? (
              <>
                <span className="text-base font-display font-black text-white">
                  {sessionBodyLog.weightKg} kg
                </span>
                {sessionBodyLog.calculatedBmi && (
                  <span className="text-[10px] font-mono text-gray-400">
                    (BMI {sessionBodyLog.calculatedBmi})
                  </span>
                )}
              </>
            ) : (
              <span className="text-gray-500 italic text-xs">
                No bodyweight logged for this workout date.
              </span>
            )}
          </div>
          {sessionBodyLog?.source && (
            <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#222] text-gray-500">
              {sessionBodyLog.source}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
