import React from 'react';
import { Plus, Settings } from 'lucide-react';
import { WelcomeModal } from '../WelcomeModal.tsx';
import { RoutineEditorModal } from '../RoutineEditorModal.tsx';
import { Workout } from '../../models.ts';

interface EmptyRoutinesCardProps {
  showWelcomeModal: boolean;
  onCloseWelcomeModal: () => void;
  isRoutineEditorOpen: boolean;
  onOpenRoutineEditor: () => void;
  onCloseRoutineEditor: () => void;
  userId: string;
  workouts: (Workout & { exercises?: any[] })[];
  onSaveWorkouts: (updated: any[]) => Promise<void>;
}

export const EmptyRoutinesCard: React.FC<EmptyRoutinesCardProps> = ({
  showWelcomeModal,
  onCloseWelcomeModal,
  isRoutineEditorOpen,
  onOpenRoutineEditor,
  onCloseRoutineEditor,
  userId,
  workouts,
  onSaveWorkouts,
}) => {
  return (
    <div className="bg-[#111] border border-[#222] rounded-[24px] p-8 text-center shadow-xl space-y-4 relative">
      <WelcomeModal
        isOpen={showWelcomeModal}
        onClose={onCloseWelcomeModal}
      />

      <div className="w-12 h-12 mx-auto rounded-2xl bg-[#C0FF00]/10 border border-[#C0FF00]/20 flex items-center justify-center text-[#C0FF00]">
        <Plus className="w-6 h-6" />
      </div>
      <div>
        <h3 className="font-display font-black italic text-lg text-white uppercase tracking-tight">
          No Routines Configured
        </h3>
        <p className="text-gray-400 text-xs font-sans max-w-sm mx-auto mt-1">
          You currently have no routines or exercises assigned to your account.
        </p>
      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={onOpenRoutineEditor}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#C0FF00] hover:bg-[#a6dc00] text-black font-display font-black italic uppercase text-xs tracking-wider transition-all shadow-[0_0_20px_rgba(192,255,0,0.2)] cursor-pointer"
        >
          <Settings className="w-4 h-4" /> Configure your routine now
        </button>
      </div>

      {userId && (
        <RoutineEditorModal
          isOpen={isRoutineEditorOpen}
          onClose={onCloseRoutineEditor}
          userId={userId}
          workouts={workouts as any}
          onSaveWorkouts={onSaveWorkouts}
        />
      )}
    </div>
  );
};
