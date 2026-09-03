import React from 'react';
import { Calendar, ChevronLeft, ChevronRight, Plus, Database, Sparkles } from 'lucide-react';

interface DietaryHeaderProps {
  selectedDate: string;
  catalogCount: number;
  onPrevDay: () => void;
  onNextDay: () => void;
  onDateChange: (date: string) => void;
  onOpenAddModal: () => void;
}

export const DietaryHeader: React.FC<DietaryHeaderProps> = ({
  selectedDate,
  catalogCount,
  onPrevDay,
  onNextDay,
  onDateChange,
  onOpenAddModal,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#222222]">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-[#C0FF00]/10 border border-[#C0FF00]/20 flex items-center justify-center text-[#C0FF00]">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-display font-black uppercase italic tracking-tight text-white text-xl sm:text-2xl flex items-center gap-2">
            Nutrition & Macro Tracker
          </h2>
          <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
            <Database className="w-3.5 h-3.5 text-[#C0FF00]" />
            <span>{catalogCount} Supermarket Products & Custom Items</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Date Selector Navigation */}
        <div className="flex items-center bg-[#111111] border border-[#222222] rounded-xl p-1">
          <button
            onClick={onPrevDay}
            className="p-1.5 hover:bg-[#222] rounded-lg text-gray-400 hover:text-white transition-colors"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 px-2 text-xs font-mono font-bold text-white">
            <Calendar className="w-3.5 h-3.5 text-[#C0FF00]" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="bg-transparent text-white text-xs font-mono focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={onNextDay}
            className="p-1.5 hover:bg-[#222] rounded-lg text-gray-400 hover:text-white transition-colors"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Add Food Button */}
        <button
          onClick={onOpenAddModal}
          className="px-4 py-2.5 rounded-xl bg-[#C0FF00] text-black font-black uppercase text-xs tracking-wider flex items-center gap-2 hover:bg-[#b0eb00] transition-transform active:scale-95 shadow-lg shadow-[#C0FF00]/10"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Food</span>
        </button>
      </div>
    </div>
  );
};
