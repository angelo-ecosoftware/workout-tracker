import React from 'react';
import { Calendar, Clock, Edit2, Save, X, Share2, Check } from 'lucide-react';
import { Session, BodyMeasurementLog } from '../../../models.ts';
import { PopulatedSet, SessionSetTable } from './SessionSetTable.tsx';
import { SessionNotesSection } from './SessionNotesSection.tsx';
import { SessionBodyweightSection } from './SessionBodyweightSection.tsx';
import { SessionPhotosSection } from './SessionPhotosSection.tsx';

export interface PopulatedSession extends Session {
  workoutName: string;
  order: number;
  sets: PopulatedSet[];
}

interface SessionDetailCardProps {
  session: PopulatedSession;
  // Date editing
  isEditingDate: boolean;
  editingDateValue: string;
  onChangeDateValue: (val: string) => void;
  onStartDateEdit: (session: PopulatedSession) => void;
  onSaveDateEdit: (session: PopulatedSession) => void;
  onCancelDateEdit: () => void;
  // Share
  copiedSessionId: string | null;
  onShareSession: (session: PopulatedSession) => void;
  // Notes
  isEditingNotes: boolean;
  editingNotesValue: string;
  isSavingNotes: boolean;
  onStartNotesEdit: (session: PopulatedSession) => void;
  onSaveNotesEdit: (sessionId: string) => void;
  onCancelNotesEdit: () => void;
  onChangeNotesValue: (val: string) => void;
  // Bodyweight
  sessionDateStr: string;
  sessionBodyLog: BodyMeasurementLog | undefined;
  isEditingWeight: boolean;
  editingWeightValue: string;
  isSavingWeight: boolean;
  onStartWeightEdit: (session: PopulatedSession) => void;
  onSaveWeightEdit: (session: PopulatedSession) => void;
  onCancelWeightEdit: () => void;
  onChangeWeightValue: (val: string) => void;
  // Photos
  uploadingPhotoSessionId: string | null;
  onTriggerAddPhoto: (sessionId: string, source: 'camera' | 'files') => void;
  onDeletePhoto: (sessionId: string, photoIndex: number) => void;
  // Coach Context
  athleteId?: string;
  coachId?: string;
  coachName?: string;
  isCoach?: boolean;
}

export const SessionDetailCard: React.FC<SessionDetailCardProps> = ({
  session,
  isEditingDate,
  editingDateValue,
  onChangeDateValue,
  onStartDateEdit,
  onSaveDateEdit,
  onCancelDateEdit,
  copiedSessionId,
  onShareSession,
  isEditingNotes,
  editingNotesValue,
  isSavingNotes,
  onStartNotesEdit,
  onSaveNotesEdit,
  onCancelNotesEdit,
  onChangeNotesValue,
  sessionDateStr,
  sessionBodyLog,
  isEditingWeight,
  editingWeightValue,
  isSavingWeight,
  onStartWeightEdit,
  onSaveWeightEdit,
  onCancelWeightEdit,
  onChangeWeightValue,
  uploadingPhotoSessionId,
  onTriggerAddPhoto,
  onDeletePhoto,
  athleteId,
  coachId,
  coachName,
  isCoach,
}) => {
  return (
    <div className="bg-[#111] border border-[#222] rounded-[24px] p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-4 border-b border-[#222] gap-3">
        <div>
          <h3 className="font-display font-black text-xl text-[#C0FF00] uppercase tracking-tight">
            {session.workoutName}
          </h3>
          {isEditingDate ? (
            <div className="mt-2 flex flex-wrap items-center gap-2 bg-[#1a1a1a] p-1.5 rounded-lg border border-[#333]">
              <input
                type="datetime-local"
                value={editingDateValue}
                onChange={(e) => onChangeDateValue(e.target.value)}
                className="bg-transparent text-white focus:outline-none focus:ring-1 focus:ring-[#C0FF00] rounded px-2 py-1 text-xs"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); onSaveDateEdit(session); }}
                  className="p-1.5 text-green-500 hover:bg-green-500/20 rounded bg-[#222]"
                >
                  <Save className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onCancelDateEdit(); }}
                  className="p-1.5 text-red-500 hover:bg-red-500/20 rounded bg-[#222]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-gray-500 mt-2">
              <span className="flex items-center gap-1.5 bg-[#1a1a1a] px-2.5 py-1 rounded-lg">
                <Calendar className="w-3.5 h-3.5" />
                {session.completedAt ? session.completedAt.toLocaleDateString() : 'N/A'}
              </span>
              <span className="flex items-center gap-1.5 bg-[#1a1a1a] px-2.5 py-1 rounded-lg">
                <Clock className="w-3.5 h-3.5" />
                {session.completedAt ? session.completedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
              </span>              {session.sleepHours != null && (
                <span className="flex items-center gap-1.5 bg-[#1a1a1a] px-2.5 py-1 rounded-lg text-gray-300 border border-[#262626]">
                  <span className="text-[#C0FF00] font-bold">💤 {session.sleepHours}h</span>
                  <span className="text-[10px] text-gray-500">sleep</span>
                </span>
              )}
              {session.energyScore != null && (
                <span className="flex items-center gap-1.5 bg-[#1a1a1a] px-2.5 py-1 rounded-lg text-gray-300 border border-[#262626]">
                  <span className="text-amber-400 font-bold">⚡ {session.energyScore}/10</span>
                  <span className="text-[10px] text-gray-500">energy</span>
                </span>
              )}              <button 
                onClick={(e) => { e.stopPropagation(); onStartDateEdit(session); }}
                className="p-1 hover:text-[#C0FF00] transition-colors rounded-lg hover:bg-[#1a1a1a]"
                title="Edit Date"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Public Share Workout Button */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => onShareSession(session)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
              copiedSessionId === session.id
                ? 'bg-[#C0FF00] text-black shadow-md shadow-[#C0FF00]/30'
                : 'bg-[#1a1a1a] hover:bg-[#252525] text-gray-300 hover:text-white border border-[#333] hover:border-[#C0FF00]'
            }`}
            title="Share public read-only link with non-users"
          >
            {copiedSessionId === session.id ? (
              <>
                <Check className="w-3.5 h-3.5 text-black stroke-[3]" />
                <span>Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-[#C0FF00]" />
                <span>Share Workout</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Session Notes */}
      <SessionNotesSection
        sessionId={session.id}
        notes={session.notes ?? null}
        isEditing={isEditingNotes}
        editingValue={editingNotesValue}
        isSaving={isSavingNotes}
        onStartEdit={() => onStartNotesEdit(session)}
        onCancelEdit={onCancelNotesEdit}
        onChangeValue={onChangeNotesValue}
        onSaveEdit={onSaveNotesEdit}
      />

      {/* Editable Daily Bodyweight (kg) */}
      <SessionBodyweightSection
        sessionDateStr={sessionDateStr}
        sessionBodyLog={sessionBodyLog}
        isEditingWeight={isEditingWeight}
        editingWeightValue={editingWeightValue}
        isSavingWeight={isSavingWeight}
        onStartEdit={() => onStartWeightEdit(session)}
        onCancelEdit={onCancelWeightEdit}
        onChangeWeightValue={onChangeWeightValue}
        onSaveWeight={() => onSaveWeightEdit(session)}
      />

      {/* Progress Photos */}
      <SessionPhotosSection
        sessionId={session.id}
        photos={session.photos}
        uploadingSessionId={uploadingPhotoSessionId}
        onTriggerAddPhoto={onTriggerAddPhoto}
        onDeletePhoto={onDeletePhoto}
      />

      {/* Sets Table / Groups */}
      <SessionSetTable
        sets={session.sets}
        sessionId={session.id}
        athleteId={athleteId}
        coachId={coachId}
        coachName={coachName}
        isCoach={isCoach}
      />
    </div>
  );
};
