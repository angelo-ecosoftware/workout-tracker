import React, { useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface DietaryDateNavigatorProps {
  selectedDate: string;
  todayStr: string;
  isToday: boolean;
  onDateShift: (days: number) => void;
  onDateSelect: (dateStr: string) => void;
  formatDateTitle: (dateStr: string) => string;
}

export const DietaryDateNavigator: React.FC<DietaryDateNavigatorProps> = ({
  selectedDate,
  todayStr,
  isToday,
  onDateShift,
  onDateSelect,
  formatDateTitle,
}) => {
  const dateInputRef = useRef<HTMLInputElement>(null);

  const handleOpenDatePicker = () => {
    if (dateInputRef.current) {
      if ('showPicker' in HTMLInputElement.prototype) {
        try {
          dateInputRef.current.showPicker();
          return;
        } catch {}
      }
      dateInputRef.current.focus();
      dateInputRef.current.click();
    }
  };

  return (
    <div className="flex items-center justify-between bg-[#111] border border-[#222] rounded-2xl p-2 sm:p-3">
      <button
        onClick={() => onDateShift(-1)}
        className="p-2 hover:bg-[#1f1f1f] rounded-xl text-gray-400 hover:text-white transition-colors cursor-pointer"
        aria-label="Previous day"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Date Picker Button & Input */}
      <div className="relative">
        <button
          type="button"
          onClick={handleOpenDatePicker}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-[#1a1a1a] border border-transparent hover:border-[#2a2a2a] transition-all cursor-pointer group"
        >
          <Calendar className="w-4 h-4 text-[#C0FF00] group-hover:scale-110 transition-transform shrink-0" />
          <span className="font-display text-sm sm:text-base font-black uppercase tracking-tight text-white group-hover:text-[#C0FF00] transition-colors">
            {formatDateTitle(selectedDate)}
          </span>
          {isToday && (
            <span className="text-[10px] font-mono font-bold uppercase bg-[#C0FF00]/15 text-[#C0FF00] border border-[#C0FF00]/30 px-2 py-0.5 rounded-full">
              Today
            </span>
          )}
        </button>

        <input
          ref={dateInputRef}
          type="date"
          max={todayStr}
          value={selectedDate}
          onChange={(e) => {
            if (e.target.value) {
              if (e.target.value <= todayStr) {
                onDateSelect(e.target.value);
              } else {
                onDateSelect(todayStr);
              }
            }
          }}
          className="absolute top-0 left-0 opacity-0 pointer-events-none w-0 h-0 [color-scheme:dark]"
          tabIndex={-1}
          aria-label="Select date"
        />
      </div>

      <button
        onClick={() => onDateShift(1)}
        disabled={isToday}
        className={`p-2 rounded-xl transition-colors ${
          isToday
            ? 'text-gray-700 opacity-40 cursor-not-allowed'
            : 'text-gray-400 hover:text-white hover:bg-[#1f1f1f] cursor-pointer'
        }`}
        aria-label="Next day"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};
