import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { fetchWorkoutHistory, fetchSetsForSession, deleteSessions, updateSessionDate, updateSessionNotes, updateSessionPhotos, fetchWorkoutsData, fetchBodyMeasurementLogs, logDailyBodyWeight, initializeUser } from '../lib/supabaseData.ts';
import { uploadWorkoutPhoto, deleteWorkoutPhoto } from '../lib/storage.ts';
import { Session, WorkoutSet, Exercise, BodyMeasurementLog, UserProfile } from '../models.ts';
import { Activity, Calendar, Clock, Loader2, ChevronLeft, Trash2, CheckCircle2, Circle, Edit2, Save, X, FileText, Camera, Plus, FolderOpen, Scale, Sparkles, Share2, Check } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal.tsx';

interface PopulatedSession extends Session {
  workoutName: string;
  order: number;
  sets: (WorkoutSet & { exerciseName: string; type: 'strength' | 'timed' })[];
}

export const WorkoutHistory: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sessions, setSessions] = useState<PopulatedSession[]>([]);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [editingDateSessionId, setEditingDateSessionId] = useState<string | null>(null);
  const [editingDateValue, setEditingDateValue] = useState<string>("");

  // Notes editing state
  const [editingNotesSessionId, setEditingNotesSessionId] = useState<string | null>(null);
  const [editingNotesValue, setEditingNotesValue] = useState<string>("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Daily Bodyweight (kg) state
  const [bodyLogs, setBodyLogs] = useState<BodyMeasurementLog[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [editingWeightSessionId, setEditingWeightSessionId] = useState<string | null>(null);
  const [editingWeightValue, setEditingWeightValue] = useState<string>("");
  const [isSavingWeight, setIsSavingWeight] = useState(false);

  // Share session state
  const [copiedSessionId, setCopiedSessionId] = useState<string | null>(null);

  const handleShareSession = async (session: PopulatedSession) => {
    // Generate public shareable link
    const shareUrl = `${window.location.origin}${window.location.pathname}?session=${session.id}`;
    
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        // Fallback for non-https or older browsers
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }

      setCopiedSessionId(session.id);
      setTimeout(() => setCopiedSessionId(null), 3000);
    } catch (err) {
      console.warn("Clipboard copy failed, using prompt fallback", err);
      window.prompt("Copy this public workout link:", shareUrl);
    }
  };

  // Photo uploading / deleting state
  const [uploadingPhotoSessionId, setUploadingPhotoSessionId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [activePhotoUploadSessionId, setActivePhotoUploadSessionId] = useState<string | null>(null);

  const startEditingNotes = (session: PopulatedSession) => {
    setEditingNotesSessionId(session.id);
    setEditingNotesValue(session.notes || "");
  };

  const saveNotesEdit = async (sessionId: string) => {
    try {
      setIsSavingNotes(true);
      const cleanNotes = editingNotesValue.trim() || null;
      await updateSessionNotes(sessionId, cleanNotes);

      setSessions(prev =>
        prev.map(s => (s.id === sessionId ? { ...s, notes: cleanNotes } : s))
      );
      setEditingNotesSessionId(null);
    } catch (err) {
      console.error("Failed to update notes:", err);
      alert("Failed to update notes.");
    } finally {
      setIsSavingNotes(false);
    }
  };

  const cancelNotesEdit = () => {
    setEditingNotesSessionId(null);
    setEditingNotesValue("");
  };

  // Helper to extract session's local date string YYYY-MM-DD
  const getSessionDateString = (session: PopulatedSession): string => {
    if (!session.completedAt) {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    const d = session.completedAt;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // Find logged bodyweight for the session's date
  const getSessionBodyLog = (session: PopulatedSession): BodyMeasurementLog | undefined => {
    const dateStr = getSessionDateString(session);
    return bodyLogs.find(log => log.logDate === dateStr);
  };

  const startEditingWeight = (session: PopulatedSession) => {
    const existingLog = getSessionBodyLog(session);
    const fallbackWeight = userProfile?.weightKg || userProfile?.metrics?.weight;
    setEditingWeightSessionId(session.id);
    setEditingWeightValue(existingLog?.weightKg != null ? String(existingLog.weightKg) : (fallbackWeight ? String(fallbackWeight) : ""));
  };

  const cancelWeightEdit = () => {
    setEditingWeightSessionId(null);
    setEditingWeightValue("");
  };

  const saveWeightEdit = async (session: PopulatedSession) => {
    if (!user) return;
    const parsedWeight = parseFloat(editingWeightValue);
    if (isNaN(parsedWeight) || parsedWeight <= 0) {
      alert("Please enter a valid positive bodyweight in kg.");
      return;
    }

    try {
      setIsSavingWeight(true);
      const sessionDateStr = getSessionDateString(session);
      const userHeight = userProfile?.heightCm || userProfile?.metrics?.height;

      const updatedLog = await logDailyBodyWeight(user.uid, {
        date: sessionDateStr,
        weightKg: parsedWeight,
        heightCm: userHeight,
        source: 'workout_session',
        notes: session.notes || undefined,
      });

      // Update bodyLogs in state
      setBodyLogs(prev => {
        const idx = prev.findIndex(l => l.logDate === sessionDateStr);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = updatedLog;
          return updated;
        }
        return [...prev, updatedLog].sort((a, b) => a.logDate.localeCompare(b.logDate));
      });

      setEditingWeightSessionId(null);
    } catch (err: any) {
      console.error("Failed to save body weight:", err);
      alert(err.message || "Failed to save body weight.");
    } finally {
      setIsSavingWeight(false);
    }
  };

  const triggerAddPhoto = (sessionId: string, source: 'camera' | 'files' = 'files') => {
    setActivePhotoUploadSessionId(sessionId);
    if (source === 'camera') {
      cameraInputRef.current?.click();
    } else {
      fileInputRef.current?.click();
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length || !activePhotoUploadSessionId || !user) {
      return;
    }

    const targetSession = sessions.find(s => s.id === activePhotoUploadSessionId);
    const existingPhotos = targetSession?.photos || [];

    if (existingPhotos.length >= 5) {
      alert("Maximum of 5 photos per session reached.");
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const availableSlots = 5 - existingPhotos.length;
    const filesToUpload = Array.from(files).slice(0, availableSlots);

    try {
      setUploadingPhotoSessionId(activePhotoUploadSessionId);
      const uploadedUrls: string[] = [];
      for (const file of filesToUpload) {
        const url = await uploadWorkoutPhoto(user.uid, file);
        uploadedUrls.push(url);
      }

      const updatedPhotos = [...existingPhotos, ...uploadedUrls];
      await updateSessionPhotos(activePhotoUploadSessionId, updatedPhotos);

      setSessions(prev =>
        prev.map(s => (s.id === activePhotoUploadSessionId ? { ...s, photos: updatedPhotos } : s))
      );
    } catch (err: any) {
      console.error("Photo upload error:", err);
      alert(err.message || "Failed to upload photo.");
    } finally {
      setUploadingPhotoSessionId(null);
      setActivePhotoUploadSessionId(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeletePhoto = async (sessionId: string, photoIndexToRemove: number) => {
    const targetSession = sessions.find(s => s.id === sessionId);
    if (!targetSession || !targetSession.photos) return;

    if (!confirm("Are you sure you want to remove this photo?")) return;

    const photoUrlToDelete = targetSession.photos[photoIndexToRemove];

    try {
      // 1. Delete the physical asset from Supabase / S3 storage
      if (photoUrlToDelete) {
        await deleteWorkoutPhoto(photoUrlToDelete);
      }

      // 2. Update session record in DB
      const updatedPhotos = targetSession.photos.filter((_, idx) => idx !== photoIndexToRemove);
      await updateSessionPhotos(sessionId, updatedPhotos);

      setSessions(prev =>
        prev.map(s => (s.id === sessionId ? { ...s, photos: updatedPhotos.length ? updatedPhotos : null } : s))
      );
    } catch (err) {
      console.error("Failed to remove photo:", err);
      alert("Failed to delete photo.");
    }
  };

  const startEditingDate = (session: PopulatedSession) => {
    setEditingDateSessionId(session.id);
    if (session.completedAt) {
      // Format to YYYY-MM-DDTHH:mm for datetime-local input
      const d = session.completedAt;
      const pad = (n: number) => n.toString().padStart(2, '0');
      const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      setEditingDateValue(formatted);
    } else {
      setEditingDateValue("");
    }
  };

  const saveDateEdit = async (session: PopulatedSession) => {
    if (!editingDateValue) {
      setEditingDateSessionId(null);
      return;
    }
    
    try {
      const newDate = new Date(editingDateValue);
      await updateSessionDate(session.id, newDate);
      
      // Update local state
      setSessions(prev => 
        prev.map(s => 
          s.id === session.id 
            ? { ...s, completedAt: newDate } 
            : s
        ).sort((a, b) => (a.completedAt?.getTime() || 0) - (b.completedAt?.getTime() || 0))
      );
      
      setEditingDateSessionId(null);
    } catch (err) {
      console.error("Failed to update date:", err);
      alert("Failed to update date.");
    }
  };

  const cancelDateEdit = () => {
    setEditingDateSessionId(null);
    setEditingDateValue("");
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const requestDelete = () => {
    setIsConfirmOpen(true);
  };

  const executeDelete = async () => {
    setIsConfirmOpen(false);
    setIsDeleteMode(false);
    setLoading(true);
    try {
      await deleteSessions(Array.from(selectedIds));
      setSessions(s => s.filter(x => !selectedIds.has(x.id)));
      setSelectedIds(new Set());
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to delete sessions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function loadHistory() {
      if (authLoading) return;
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setErrorMsg(null);
        
        const [historySessions, workoutsData, userProfileData, historicalBodyLogs] = await Promise.all([
          fetchWorkoutHistory(user.uid),
          fetchWorkoutsData(user.uid),
          initializeUser(user.uid, user.email, user.displayName),
          fetchBodyMeasurementLogs(user.uid),
        ]);

        if (userProfileData) {
          setUserProfile(userProfileData);
        }
        if (historicalBodyLogs) {
          setBodyLogs(historicalBodyLogs);
        }

        const { workoutsList, exercisesList } = workoutsData;
        const workoutMap = new Map(workoutsList.map(w => [w.id, w]));
        const exerciseMap = new Map(exercisesList.map(e => [e.id, e]));

        const promises = historySessions.map(async (session) => {
          if (!session.completedAt) return null;
          
          const workout = workoutMap.get(session.workoutId);
          const workoutName = workout?.name || 'Unknown Workout';
          const order = workout?.order || 0;
          
          const rawSets = await fetchSetsForSession(session.id);
          
          const populatedSets = rawSets.map((s) => {
            const ex = exerciseMap.get(s.exerciseId);
            return {
              ...s,
              exerciseName: ex ? ex.name : 'Unknown Exercise',
              type: ex ? ex.type : 'strength'
            };
          });

          // Sort sets by exercise appearance (in workout template or first logged order), then by setNumber
          const exerciseOrderMap = new Map<string, number>();
          if (workout?.exerciseIds) {
            workout.exerciseIds.forEach((id, idx) => exerciseOrderMap.set(id, idx));
          }

          populatedSets.sort((a, b) => {
            const orderA = exerciseOrderMap.has(a.exerciseId) ? exerciseOrderMap.get(a.exerciseId)! : 999;
            const orderB = exerciseOrderMap.has(b.exerciseId) ? exerciseOrderMap.get(b.exerciseId)! : 999;
            if (orderA !== orderB) {
              return orderA - orderB;
            }
            return a.setNumber - b.setNumber;
          });
          
          return {
            ...session,
            workoutName,
            order,
            sets: populatedSets
          } as PopulatedSession;
        });
        
        const results = await Promise.all(promises);
        const populated = results.filter((res): res is PopulatedSession => res !== null);
        
        setSessions(populated);
      } catch (err: any) {
        console.error('Error loading history:', err.code, err.message, err);
        setErrorMsg(err.message || 'Failed to load history.');
      } finally {
        setLoading(false);
      }
    }
    
    loadHistory();
  }, [user, authLoading]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin text-[#C0FF00] mb-4" />
        <p className="font-mono text-sm tracking-widest uppercase">Loading History...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="bg-[#111] border border-red-900/50 rounded-[24px] p-6 text-center">
        <Activity className="w-8 h-8 text-red-500 mx-auto mb-3" />
        <h3 className="text-red-500 font-display font-medium text-lg mb-2">Error Loading History</h3>
        <p className="text-red-400 font-sans text-sm">{errorMsg}</p>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center p-10 bg-[#111] border border-[#222] rounded-[24px]">
        <Activity className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <h3 className="text-white font-display font-medium text-lg mb-2">No Workouts Yet</h3>
        <p className="text-gray-400 font-sans text-sm">Complete your first workout to see it logged here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between min-h-[32px]">
        <h2 className="text-xl font-display font-black text-white uppercase tracking-tight">
          Training History
        </h2>
        
        {!expandedSessionId && (
          !isDeleteMode ? (
            <button 
              onClick={() => setIsDeleteMode(true)} 
              className="text-[#C0FF00] p-2 rounded-full hover:bg-[#1a1a1a] transition-colors"
              title="Delete Sessions"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center space-x-3 transition-opacity">
              <button 
                onClick={() => { setIsDeleteMode(false); setSelectedIds(new Set()); }} 
                className="text-[11px] font-sans font-bold uppercase tracking-wider text-gray-500 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={requestDelete} 
                disabled={selectedIds.size === 0} 
                className="text-[11px] font-sans font-bold uppercase tracking-wider text-red-500 disabled:opacity-30 hover:bg-red-500/[0.1] px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete ({selectedIds.size})
              </button>
            </div>
          )
        )}
      </div>
      
      {expandedSessionId ? (
        <div>
          <button 
            onClick={() => setExpandedSessionId(null)}
            className="mb-4 text-[#C0FF00] font-sans font-bold text-sm flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5" />
            BACK TO ALL SESSIONS
          </button>
          {sessions.filter(s => s.id === expandedSessionId).map(session => (
            <div key={session.id} className="bg-[#111] border border-[#222] rounded-[24px] p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-4 border-b border-[#222] gap-3">
                <div>
                  <h3 className="font-display font-black text-xl text-[#C0FF00] uppercase tracking-tight">
                    {session.workoutName}
                  </h3>
                  {editingDateSessionId === session.id ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2 bg-[#1a1a1a] p-1.5 rounded-lg border border-[#333]">
                      <input
                        type="datetime-local"
                        value={editingDateValue}
                        onChange={(e) => setEditingDateValue(e.target.value)}
                        className="bg-transparent text-white focus:outline-none focus:ring-1 focus:ring-[#C0FF00] rounded px-2 py-1 text-xs"
                      />
                      <div className="flex items-center gap-2">
                        <button onClick={(e) => { e.stopPropagation(); saveDateEdit(session); }} className="p-1.5 text-green-500 hover:bg-green-500/20 rounded bg-[#222]">
                          <Save className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); cancelDateEdit(); }} className="p-1.5 text-red-500 hover:bg-red-500/20 rounded bg-[#222]">
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
                      </span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); startEditingDate(session); }}
                        className="p-1 hover:text-[#C0FF00] transition-colors rounded-lg hover:bg-[#1a1a1a]"
                        title="Edit Date"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Red outline spot: Public Share Workout Button */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={() => handleShareSession(session)}
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

              {/* Direct Camera Shutter Capture Input */}
              <input
                type="file"
                ref={cameraInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                capture="environment"
                className="hidden"
              />

              {/* File / Gallery / File Manager Picker Input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                multiple
                className="hidden"
              />

              {/* Session Notes */}
              <div className="mb-5 p-3.5 bg-[#161616] border border-[#2a2a2a] rounded-xl text-xs text-gray-300">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#C0FF00] shrink-0" />
                    <span className="font-mono text-[10px] uppercase font-bold text-[#C0FF00]">
                      Workout Notes
                    </span>
                  </div>
                  {editingNotesSessionId !== session.id ? (
                    <button
                      onClick={() => startEditingNotes(session)}
                      className="p-1 text-gray-400 hover:text-[#C0FF00] transition-colors rounded hover:bg-[#222]"
                      title="Edit Notes"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  ) : null}
                </div>

                {editingNotesSessionId === session.id ? (
                  <div className="space-y-2 mt-2">
                    <textarea
                      value={editingNotesValue}
                      onChange={(e) => setEditingNotesValue(e.target.value)}
                      placeholder="Add or update session notes..."
                      rows={3}
                      className="w-full bg-[#111] border border-[#333] focus:border-[#C0FF00] rounded-lg p-2.5 text-xs text-white placeholder-gray-600 focus:outline-none transition-colors resize-y font-sans"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={cancelNotesEdit}
                        disabled={isSavingNotes}
                        className="px-2.5 py-1 text-[11px] font-sans font-bold text-gray-400 hover:text-white rounded bg-[#222] transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => saveNotesEdit(session.id)}
                        disabled={isSavingNotes}
                        className="px-3 py-1 text-[11px] font-sans font-bold bg-[#C0FF00] hover:bg-[#b0f000] text-black rounded transition-colors flex items-center gap-1.5"
                      >
                        {isSavingNotes ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap text-gray-300 font-sans mt-1">
                    {session.notes || <span className="text-gray-500 italic">No notes added for this workout.</span>}
                  </p>
                )}
              </div>

              {/* Editable Daily Bodyweight (kg) for this Workout Date */}
              {(() => {
                const sessionDateStr = getSessionDateString(session);
                const sessionBodyLog = getSessionBodyLog(session);
                const isEditingWeight = editingWeightSessionId === session.id;

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
                          onClick={() => startEditingWeight(session)}
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
                                setEditingWeightValue(parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : sanitized);
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
                              onClick={cancelWeightEdit}
                              disabled={isSavingWeight}
                              className="px-2.5 py-1.5 text-[11px] font-sans font-bold text-gray-400 hover:text-white rounded bg-[#222] transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => saveWeightEdit(session)}
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
              })()}

              {/* Session Progress Photos */}
              <div className="mb-6 p-3.5 bg-[#161616] border border-[#2a2a2a] rounded-xl text-xs">
                <div className="flex items-center justify-between mb-3 text-gray-300">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-[#C0FF00]" />
                    <span className="font-mono text-[10px] uppercase font-bold text-[#C0FF00]">
                      Progress Photos ({session.photos?.length || 0}/5)
                    </span>
                  </div>
                  {(!session.photos || session.photos.length < 5) && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => triggerAddPhoto(session.id, 'camera')}
                        disabled={uploadingPhotoSessionId === session.id}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#222] hover:bg-[#2c2c2c] text-[#C0FF00] text-[10px] font-mono font-bold uppercase transition-colors"
                        title="Take Photo with Camera"
                      >
                        {uploadingPhotoSessionId === session.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Camera className="w-3 h-3" />
                        )}
                        Camera
                      </button>
                      <button
                        onClick={() => triggerAddPhoto(session.id, 'files')}
                        disabled={uploadingPhotoSessionId === session.id}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#222] hover:bg-[#2c2c2c] text-white hover:text-[#C0FF00] text-[10px] font-mono font-bold uppercase transition-colors"
                        title="Upload from File Manager or Gallery"
                      >
                        <FolderOpen className="w-3 h-3" />
                        Files
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {(session.photos || []).map((photoUrl, idx) => (
                    <div
                      key={idx}
                      className="relative group aspect-square rounded-xl overflow-hidden border border-[#333] bg-[#1a1a1a]"
                    >
                      <a
                        href={photoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full h-full block"
                        title="View photo full size"
                      >
                        <img
                          src={photoUrl}
                          alt={`Progress photo ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </a>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePhoto(session.id, idx);
                        }}
                        className="absolute top-1 right-1 p-1 rounded-lg bg-black/80 hover:bg-red-600 text-white transition-colors cursor-pointer opacity-85"
                        title="Remove photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {(!session.photos || session.photos.length < 5) && (
                    <div className="flex gap-2 aspect-square">
                      <button
                        type="button"
                        onClick={() => triggerAddPhoto(session.id, 'camera')}
                        disabled={uploadingPhotoSessionId === session.id}
                        className="flex-1 flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-[#333] hover:border-[#C0FF00] bg-[#141414] hover:bg-[#1a1a1a] text-gray-400 hover:text-[#C0FF00] transition-all cursor-pointer p-1.5"
                        title="Take Photo with Camera"
                      >
                        {uploadingPhotoSessionId === session.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-[#C0FF00]" />
                        ) : (
                          <Camera className="w-4 h-4" />
                        )}
                        <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-center">
                          Camera
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => triggerAddPhoto(session.id, 'files')}
                        disabled={uploadingPhotoSessionId === session.id}
                        className="flex-1 flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-[#333] hover:border-[#C0FF00] bg-[#141414] hover:bg-[#1a1a1a] text-gray-400 hover:text-[#C0FF00] transition-all cursor-pointer p-1.5"
                        title="Choose from Gallery or Files"
                      >
                        <FolderOpen className="w-4 h-4" />
                        <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-center">
                          Files
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Desktop Table view for Detail */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left font-sans text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-[#333] text-gray-400">
                      <th className="pb-3 font-semibold uppercase tracking-wider text-xs">Exercise</th>
                      <th className="pb-3 text-center font-semibold uppercase tracking-wider text-xs">Set</th>
                      <th className="pb-3 text-center font-semibold uppercase tracking-wider text-xs">Volume</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222]">
                    {session.sets.map((set, i) => {
                      const prevSet = i > 0 ? session.sets[i - 1] : null;
                      const isNewExerciseGroup = prevSet && prevSet.exerciseId !== set.exerciseId;

                      return (
                        <tr 
                          key={i} 
                          className={`hover:bg-[#1a1a1a] transition-colors ${isNewExerciseGroup ? 'border-t-2 border-[#333]' : ''}`}
                        >
                          <td className="py-3 pr-4 text-white font-medium">
                            {isNewExerciseGroup || i === 0 ? (
                              <span className="text-white font-bold">{set.exerciseName}</span>
                            ) : (
                              <span className="text-gray-500 text-xs pl-2">↳ {set.exerciseName}</span>
                            )}
                          </td>
                          <td className="py-3 text-center text-gray-400 font-mono">{set.setNumber}</td>
                          <td className="py-3 text-center text-white font-mono font-bold">
                            {set.type === 'strength' 
                              ? `${set.weight} kg × ${set.reps}`
                              : `${set.durationSeconds}s`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card Groups view for Detail */}
              <div className="sm:hidden space-y-3">
                {session.sets.reduce((acc, set) => {
                  const exIdx = acc.findIndex(g => g.exerciseName === set.exerciseName);
                  if (exIdx > -1) {
                    acc[exIdx].sets.push(set);
                  } else {
                    acc.push({ exerciseName: set.exerciseName, sets: [set] });
                  }
                  return acc;
                }, [] as any[]).map((group, idx) => (
                  <div key={idx} className="bg-[#1a1a1a] rounded-xl p-3 border border-[#2a2a2a]">
                    <h4 className="text-white text-[13px] font-bold mb-2 uppercase tracking-wide">{group.exerciseName}</h4>
                    <div className="space-y-2">
                      {group.sets.map((set: any, sIdx: number) => (
                         <div key={sIdx} className="flex justify-between items-center text-[12px] font-mono">
                           <span className="text-gray-500 font-sans font-medium text-[11px] uppercase w-12">Set {set.setNumber}</span>
                           <span className="text-white font-bold flex-1 text-right">
                             {set.type === 'strength' ? `${set.weight}kg × ${set.reps}` : `${set.durationSeconds}s`}
                           </span>
                         </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Global Grid Master View (Responsive: 4 cols mobile/tablet, 6 cols desktop) */
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {sessions.map(session => (
            <div 
              key={session.id} 
              className={`relative bg-[#111] border ${isDeleteMode && selectedIds.has(session.id) ? 'border-red-500 bg-red-500/[0.05]' : 'border-[#222]'} ${!isDeleteMode ? 'hover:border-[#C0FF00] hover:bg-[#161616]' : ''} rounded-[20px] p-4 flex flex-col justify-between cursor-pointer transition-all shadow-sm min-h-[110px] aspect-square group`}
              onClick={() => {
                if (isDeleteMode) {
                  toggleSelection(session.id);
                } else {
                  setExpandedSessionId(session.id);
                }
              }}
            >
              {isDeleteMode && (
                <div className="absolute top-2 right-2 pointer-events-none">
                  {selectedIds.has(session.id) ? <CheckCircle2 className="w-4 h-4 text-red-500" /> : <Circle className="w-4 h-4 text-gray-500" />}
                </div>
              )}
              <div>
                <h3 className={`font-display font-black text-xs sm:text-sm ${isDeleteMode && selectedIds.has(session.id) ? 'text-white' : 'text-[#C0FF00]'} uppercase tracking-tight leading-snug line-clamp-2 text-left w-full pr-3 group-hover:text-white transition-colors`}>
                  {session.workoutName}
                </h3>
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
          ))}
        </div>
      )}
      
      <ConfirmModal 
        isOpen={isConfirmOpen}
        title="Delete Workout Sessions"
        description={`Are you sure you want to delete ${selectedIds.size} session(s)? This action cannot be undone.`}
        onConfirm={executeDelete}
        onCancel={() => setIsConfirmOpen(false)}
        confirmText="Delete"
        confirmVariant="danger"
      />
    </div>
  );
};
