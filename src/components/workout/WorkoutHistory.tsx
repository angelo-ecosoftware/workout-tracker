import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  fetchWorkoutHistory,
  fetchSetsForSession,
  deleteSessions,
  updateSessionDate,
  updateSessionNotes,
  updateSessionCoachNotes,
  updateSessionPhotos,
  markSessionAsReviewed,
  fetchWorkoutsData,
  fetchBodyMeasurementLogs,
  fetchUserPrivacySettings,
  logDailyBodyWeight,
  initializeUser,
} from '../../lib/supabaseData.ts';
import { uploadWorkoutPhoto, deleteWorkoutPhoto } from '../../lib/storage.ts';
import { BodyMeasurementLog, UserProfile } from '../../models.ts';
import { Activity, Loader2, ChevronLeft, Trash2 } from 'lucide-react';
import { ConfirmModal } from '../ui/ConfirmModal.tsx';
import { PopulatedSession, SessionDetailCard } from './history/SessionDetailCard.tsx';
import { SessionGridCard } from './history/SessionGridCard.tsx';
import { useResourceScroll } from '../../utils/useResourceScroll.ts';
import { clearContinuity, readContinuity, writeContinuity } from '../../utils/continuityState.ts';

export const WorkoutHistory: React.FC<{
  targetUserId?: string;
  isReadOnlyClientMode?: boolean;
  routeSessionId?: string | null;
  routeEditMode?: boolean;
  onResourceRouteChange?: (path: string) => void;
}> = ({
  targetUserId,
  isReadOnlyClientMode = false,
  routeSessionId = null,
  routeEditMode = false,
  onResourceRouteChange,
}) => {
  const { user, loading: authLoading } = useAuth();
  const activeUserId = targetUserId || user?.uid;
  const loadGenerationRef = useRef(0);
  const activeUserIdRef = useRef(activeUserId);
  activeUserIdRef.current = activeUserId;
  useResourceScroll(activeUserId, 'logbook-scroll', routeSessionId || 'list', routeEditMode ? 'edit' : 'view');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sessions, setSessions] = useState<PopulatedSession[]>([]);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [editingDateSessionId, setEditingDateSessionId] = useState<string | null>(null);
  const [editingDateValue, setEditingDateValue] = useState<string>("");
  const [editingSleepValue, setEditingSleepValue] = useState<number>(8);
  const [editingEnergyValue, setEditingEnergyValue] = useState<number>(7);

  // Notes editing state
  const [editingNotesSessionId, setEditingNotesSessionId] = useState<string | null>(null);
  const [editingNotesValue, setEditingNotesValue] = useState<string>("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const getNotesDraftKey = (sessionId: string) => `logbook_notes_draft_${activeUserId}_${sessionId}`;
  const getEditorDraft = (sessionId: string) => readContinuity<{
    field: 'notes' | 'date' | 'coachNotes' | 'weight';
    value: string | number;
    sleepHours?: number;
    energyScore?: number;
  }>(activeUserId, 'logbook-editor', sessionId, 1);

  // Coach Notes editing state
  const [editingCoachNotesSessionId, setEditingCoachNotesSessionId] = useState<string | null>(null);
  const [editingCoachNotesValue, setEditingCoachNotesValue] = useState<string>("");
  const [isSavingCoachNotes, setIsSavingCoachNotes] = useState(false);

  // Daily Bodyweight (kg) state
  const [bodyLogs, setBodyLogs] = useState<BodyMeasurementLog[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [allowReviewReceipts, setAllowReviewReceipts] = useState<boolean>(true);
  const [editingWeightSessionId, setEditingWeightSessionId] = useState<string | null>(null);
  const [editingWeightValue, setEditingWeightValue] = useState<string>("");
  const [isSavingWeight, setIsSavingWeight] = useState(false);

  // Share session state
  const [copiedSessionId, setCopiedSessionId] = useState<string | null>(null);

  // Photo uploading / deleting state
  const [uploadingPhotoSessionId, setUploadingPhotoSessionId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [activePhotoUploadSessionId, setActivePhotoUploadSessionId] = useState<string | null>(null);

  const handleOpenSession = async (session: PopulatedSession) => {
    setExpandedSessionId(session.id);
    onResourceRouteChange?.(`/logbook/${encodeURIComponent(session.id)}`);
    const isCoachInspectingAthlete = Boolean(user && activeUserId && activeUserId !== user.uid);
    if (isCoachInspectingAthlete && !session.reviewedAt && user && allowReviewReceipts) {
      try {
        const { reviewedAt, coachName } = await markSessionAsReviewed(session.id, user.uid, user.displayName);
        setSessions((prev) =>
          prev.map((s) => (s.id === session.id ? { ...s, reviewedAt, reviewedByCoachName: coachName || user.displayName } : s))
        );
      } catch (err) {
        console.warn('Auto-mark reviewed warning:', err);
      }
    }
  };

  const handleShareSession = async (session: PopulatedSession) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?session=${session.id}`;
    
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
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

  const startEditingNotes = (session: PopulatedSession) => {
    setEditingNotesSessionId(session.id);
    setEditingNotesValue(session.notes || "");
    onResourceRouteChange?.(`/logbook/${encodeURIComponent(session.id)}/edit`);
  };

  const saveNotesEdit = async (sessionId: string) => {
    try {
      setIsSavingNotes(true);
      const cleanNotes = editingNotesValue.trim() || null;
      await updateSessionNotes(sessionId, cleanNotes);

      setSessions(prev =>
        prev.map(s => (s.id === sessionId ? { ...s, notes: cleanNotes } : s))
      );
      try {
        localStorage.removeItem(getNotesDraftKey(sessionId));
      } catch {}
      clearContinuity(activeUserId, 'logbook-editor', sessionId);
      setEditingNotesSessionId(null);
      onResourceRouteChange?.(`/logbook/${encodeURIComponent(sessionId)}`);
    } catch (err) {
      console.error("Failed to update notes:", err);
      alert("Failed to update notes.");
    } finally {
      setIsSavingNotes(false);
    }
  };

  const cancelNotesEdit = () => {
    if (editingNotesSessionId) {
      try {
        localStorage.removeItem(getNotesDraftKey(editingNotesSessionId));
      } catch {}
    }
    setEditingNotesSessionId(null);
    setEditingNotesValue("");
    if (routeSessionId) onResourceRouteChange?.(`/logbook/${encodeURIComponent(routeSessionId)}`);
  };

  const startEditingCoachNotes = (session: PopulatedSession) => {
    setEditingCoachNotesSessionId(session.id);
    setEditingCoachNotesValue(session.coachNotes || "");
    onResourceRouteChange?.(`/logbook/${encodeURIComponent(session.id)}/edit`);
  };

  const saveCoachNotesEdit = async (sessionId: string) => {
    try {
      setIsSavingCoachNotes(true);
      const cleanCoachNotes = editingCoachNotesValue.trim() || null;
      await updateSessionCoachNotes(sessionId, cleanCoachNotes, user?.displayName || 'Coach');

      setSessions(prev =>
        prev.map(s => (s.id === sessionId ? { ...s, coachNotes: cleanCoachNotes, coachName: user?.displayName || s.coachName } : s))
      );
      clearContinuity(activeUserId, 'logbook-editor', sessionId);
      setEditingCoachNotesSessionId(null);
      onResourceRouteChange?.(`/logbook/${encodeURIComponent(sessionId)}`);
    } catch (err) {
      console.error("Failed to update coach notes:", err);
      alert("Failed to update coach notes.");
    } finally {
      setIsSavingCoachNotes(false);
    }
  };

  const cancelCoachNotesEdit = () => {
    if (editingCoachNotesSessionId) clearContinuity(activeUserId, 'logbook-editor', editingCoachNotesSessionId);
    setEditingCoachNotesSessionId(null);
    setEditingCoachNotesValue("");
    if (routeSessionId) onResourceRouteChange?.(`/logbook/${encodeURIComponent(routeSessionId)}`);
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
    onResourceRouteChange?.(`/logbook/${encodeURIComponent(session.id)}/edit`);
  };

  const cancelWeightEdit = () => {
    if (editingWeightSessionId) clearContinuity(activeUserId, 'logbook-editor', editingWeightSessionId);
    setEditingWeightSessionId(null);
    setEditingWeightValue("");
    if (routeSessionId) onResourceRouteChange?.(`/logbook/${encodeURIComponent(routeSessionId)}`);
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

      setBodyLogs(prev => {
        const idx = prev.findIndex(l => l.logDate === sessionDateStr);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = updatedLog;
          return updated;
        }
        return [...prev, updatedLog].sort((a, b) => a.logDate.localeCompare(b.logDate));
      });

      setUserProfile(prev => prev ? {
        ...prev,
        weightKg: parsedWeight,
        metrics: { ...prev.metrics, weight: parsedWeight },
      } : prev);

      clearContinuity(activeUserId, 'logbook-editor', session.id);
      setEditingWeightSessionId(null);
      onResourceRouteChange?.(`/logbook/${encodeURIComponent(session.id)}`);
    } catch (err: unknown) {
      console.error("Failed to save body weight:", err);
      alert(err instanceof Error ? err.message : "Failed to save body weight.");
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
    } catch (err: unknown) {
      console.error("Photo upload error:", err);
      alert(err instanceof Error ? err.message : "Failed to upload photo.");
    } finally {
      setUploadingPhotoSessionId(null);
      setActivePhotoUploadSessionId(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const handleDeletePhoto = async (sessionId: string, photoIndexToRemove: number) => {
    const targetSession = sessions.find(s => s.id === sessionId);
    if (!targetSession || !targetSession.photos) return;

    if (!confirm("Are you sure you want to remove this photo?")) return;

    const photoUrlToDelete = targetSession.photos[photoIndexToRemove];

    try {
      if (photoUrlToDelete) {
        await deleteWorkoutPhoto(photoUrlToDelete);
      }

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
    setEditingSleepValue(session.sleepHours != null ? session.sleepHours : 8);
    setEditingEnergyValue(session.energyScore != null ? session.energyScore : 7);
    if (session.completedAt) {
      const d = session.completedAt;
      const pad = (n: number) => n.toString().padStart(2, '0');
      const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      setEditingDateValue(formatted);
    } else {
      setEditingDateValue("");
    }
    onResourceRouteChange?.(`/logbook/${encodeURIComponent(session.id)}/edit`);
  };

  const saveDateEdit = async (session: PopulatedSession) => {
    if (!editingDateValue) {
      setEditingDateSessionId(null);
      return;
    }
    
    try {
      const newDate = new Date(editingDateValue);
      await updateSessionDate(session.id, newDate, editingSleepValue, editingEnergyValue);
      
      setSessions(prev => 
        prev.map(s => 
          s.id === session.id 
            ? { ...s, completedAt: newDate, sleepHours: editingSleepValue, energyScore: editingEnergyValue } 
            : s
        ).sort((a, b) => (a.completedAt?.getTime() || 0) - (b.completedAt?.getTime() || 0))
      );
      clearContinuity(activeUserId, 'logbook-editor', session.id);
      
      setEditingDateSessionId(null);
      onResourceRouteChange?.(`/logbook/${encodeURIComponent(session.id)}`);
    } catch (err) {
      console.error("Failed to update date and metrics:", err);
      alert("Failed to update date and metrics.");
    }
  };

  const cancelDateEdit = () => {
    if (editingDateSessionId) clearContinuity(activeUserId, 'logbook-editor', editingDateSessionId);
    setEditingDateSessionId(null);
    setEditingDateValue("");
    if (routeSessionId) onResourceRouteChange?.(`/logbook/${encodeURIComponent(routeSessionId)}`);
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
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete sessions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadGeneration = ++loadGenerationRef.current;
    let cancelled = false;
    const isCurrentLoad = () =>
      !cancelled &&
      loadGenerationRef.current === loadGeneration &&
      activeUserIdRef.current === activeUserId;

    async function loadHistory() {
      if (authLoading) return;
      if (!activeUserId) {
        if (isCurrentLoad()) setLoading(false);
        return;
      }
      try {
        if (!isCurrentLoad()) return;
        setLoading(true);
        setErrorMsg(null);
        
        const [historySessions, workoutsData, userProfileData, historicalBodyLogs, viewerPrivacy, athletePrivacy] = await Promise.all([
          fetchWorkoutHistory(activeUserId),
          fetchWorkoutsData(activeUserId),
          initializeUser(activeUserId),
          fetchBodyMeasurementLogs(activeUserId),
          user?.uid ? fetchUserPrivacySettings(user.uid) : Promise.resolve(null),
          activeUserId && activeUserId !== user?.uid ? fetchUserPrivacySettings(activeUserId) : Promise.resolve(null),
        ]);

        if (!isCurrentLoad()) return;
        if (userProfileData) {
          setUserProfile(userProfileData);
        }
        if (historicalBodyLogs) {
          setBodyLogs(historicalBodyLogs);
        }

        const viewerReceiptsOn = viewerPrivacy ? viewerPrivacy.shareReviewReceipts !== false : true;
        const athleteReceiptsOn = athletePrivacy ? athletePrivacy.shareReviewReceipts !== false : true;
        if (!isCurrentLoad()) return;
        setAllowReviewReceipts(viewerReceiptsOn && athleteReceiptsOn);

        const { workoutsList, exercisesList } = workoutsData;
        const workoutMap = new Map(workoutsList.map(w => [w.id, w]));
        const exerciseMap = new Map(exercisesList.map(e => [e.id, e]));

        const promises = historySessions.map(async (session) => {
          if (!isCurrentLoad()) return null;
          if (!session.completedAt) return null;
          
          const workout = workoutMap.get(session.workoutId);
          const workoutName = workout?.name || 'Unknown Workout';
          const order = workout?.order || 0;
          
          const rawSets = await fetchSetsForSession(session.id);
          if (!isCurrentLoad()) return null;
          
          const populatedSets = rawSets.map((s) => {
            const ex = exerciseMap.get(s.exerciseId);
            return {
              ...s,
              exerciseName: ex ? ex.name : 'Unknown Exercise',
              type: ex ? ex.type : 'strength'
            };
          });

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
        if (!isCurrentLoad()) return;
        const populated = results.filter((res): res is PopulatedSession => res !== null);
        
        setSessions(populated);
      } catch (err: unknown) {
        if (!isCurrentLoad()) return;
        console.error('Error loading history:', err);
        setErrorMsg(err instanceof Error ? err.message : 'Failed to load history.');
      } finally {
        if (isCurrentLoad()) setLoading(false);
      }
    }
    
    loadHistory();
    return () => {
      cancelled = true;
    };
  }, [activeUserId, user, authLoading]);

  useEffect(() => {
    if (!routeEditMode && (editingNotesSessionId || editingDateSessionId || editingCoachNotesSessionId || editingWeightSessionId)) {
      setEditingNotesSessionId(null);
      setEditingNotesValue("");
      setEditingDateSessionId(null);
      setEditingDateValue("");
      setEditingCoachNotesSessionId(null);
      setEditingCoachNotesValue("");
      setEditingWeightSessionId(null);
      setEditingWeightValue("");
    }
    if (routeSessionId && sessions.some((session) => session.id === routeSessionId)) {
      setExpandedSessionId(routeSessionId);
      if (
        routeEditMode
        && !editingNotesSessionId
        && !editingDateSessionId
        && !editingCoachNotesSessionId
        && !editingWeightSessionId
        && !isReadOnlyClientMode
      ) {
        const session = sessions.find((candidate) => candidate.id === routeSessionId);
        if (session) {
          let notes = session.notes || "";
          const draft = getEditorDraft(session.id);
          if (draft?.payload.field === 'date') {
            setEditingDateSessionId(session.id);
            setEditingDateValue(String(draft.payload.value));
            setEditingSleepValue(draft.payload.sleepHours ?? session.sleepHours ?? 8);
            setEditingEnergyValue(draft.payload.energyScore ?? session.energyScore ?? 7);
          } else if (draft?.payload.field === 'coachNotes') {
            setEditingCoachNotesSessionId(session.id);
            setEditingCoachNotesValue(String(draft.payload.value));
          } else if (draft?.payload.field === 'weight') {
            setEditingWeightSessionId(session.id);
            setEditingWeightValue(String(draft.payload.value));
          } else {
            const legacyDraft = (() => {
              try {
                const raw = localStorage.getItem(getNotesDraftKey(session.id));
                const parsed = raw ? JSON.parse(raw) : null;
                return typeof parsed?.value === 'string' ? parsed.value : null;
              } catch {
                return null;
              }
            })();
            notes = legacyDraft ?? (draft?.payload.field === 'notes' ? String(draft.payload.value) : notes);
            setEditingNotesSessionId(session.id);
            setEditingNotesValue(notes);
          }
        }
      }
    }
  }, [
    routeSessionId,
    routeEditMode,
    sessions,
    editingNotesSessionId,
    editingDateSessionId,
    editingCoachNotesSessionId,
    editingWeightSessionId,
    isReadOnlyClientMode,
    activeUserId,
  ]);

  useEffect(() => {
    const field = editingNotesSessionId
      ? 'notes'
      : editingDateSessionId
        ? 'date'
        : editingCoachNotesSessionId
          ? 'coachNotes'
          : editingWeightSessionId
            ? 'weight'
            : null;
    const sessionId = editingNotesSessionId || editingDateSessionId || editingCoachNotesSessionId || editingWeightSessionId;
    if (!field || !sessionId || isReadOnlyClientMode || !activeUserId) return;
    const value = field === 'notes'
      ? editingNotesValue
      : field === 'date'
        ? editingDateValue
        : field === 'coachNotes'
          ? editingCoachNotesValue
          : editingWeightValue;
    const timer = window.setTimeout(() => {
      writeContinuity(activeUserId, 'logbook-editor', sessionId, 1, {
        field,
        value,
        sleepHours: field === 'date' ? editingSleepValue : undefined,
        energyScore: field === 'date' ? editingEnergyValue : undefined,
      });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [
    editingNotesSessionId,
    editingNotesValue,
    editingDateSessionId,
    editingDateValue,
    editingSleepValue,
    editingEnergyValue,
    editingCoachNotesSessionId,
    editingCoachNotesValue,
    editingWeightSessionId,
    editingWeightValue,
    isReadOnlyClientMode,
    activeUserId,
  ]);

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
            onClick={() => {
              setExpandedSessionId(null);
              onResourceRouteChange?.('/history');
            }}
            className="mb-4 text-[#C0FF00] font-sans font-bold text-sm flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5" />
            BACK TO ALL SESSIONS
          </button>
          {sessions.filter(s => s.id === expandedSessionId).map(session => (
            <SessionDetailCard
              key={session.id}
              session={session}
              isEditingDate={editingDateSessionId === session.id}
              editingDateValue={editingDateValue}
              onChangeDateValue={setEditingDateValue}
              editingSleepValue={editingSleepValue}
              onChangeSleepValue={setEditingSleepValue}
              editingEnergyValue={editingEnergyValue}
              onChangeEnergyValue={setEditingEnergyValue}
              onStartDateEdit={startEditingDate}
              onSaveDateEdit={saveDateEdit}
              onCancelDateEdit={cancelDateEdit}
              copiedSessionId={copiedSessionId}
              onShareSession={handleShareSession}
              isEditingNotes={editingNotesSessionId === session.id}
              editingNotesValue={editingNotesValue}
              isSavingNotes={isSavingNotes}
              onStartNotesEdit={startEditingNotes}
              onSaveNotesEdit={saveNotesEdit}
              onCancelNotesEdit={cancelNotesEdit}
              onChangeNotesValue={setEditingNotesValue}
              isEditingCoachNotes={editingCoachNotesSessionId === session.id}
              editingCoachNotesValue={editingCoachNotesValue}
              isSavingCoachNotes={isSavingCoachNotes}
              onStartCoachNotesEdit={startEditingCoachNotes}
              onSaveCoachNotesEdit={saveCoachNotesEdit}
              onCancelCoachNotesEdit={cancelCoachNotesEdit}
              onChangeCoachNotesValue={setEditingCoachNotesValue}
              sessionDateStr={getSessionDateString(session)}
              sessionBodyLog={getSessionBodyLog(session)}
              isEditingWeight={editingWeightSessionId === session.id}
              editingWeightValue={editingWeightValue}
              isSavingWeight={isSavingWeight}
              onStartWeightEdit={startEditingWeight}
              onSaveWeightEdit={saveWeightEdit}
              onCancelWeightEdit={cancelWeightEdit}
              onChangeWeightValue={setEditingWeightValue}
              uploadingPhotoSessionId={uploadingPhotoSessionId}
              onTriggerAddPhoto={triggerAddPhoto}
              onDeletePhoto={handleDeletePhoto}
              athleteId={activeUserId}
              coachId={user?.uid}
              coachName={user?.displayName}
              isCoach={Boolean(user && activeUserId && activeUserId !== user.uid)}
              allowReviewReceipts={allowReviewReceipts}
            />
          ))}
        </div>
      ) : (
        /* Global Grid Master View */
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {sessions.map(session => (
            <SessionGridCard
              key={session.id}
              session={session}
              isDeleteMode={isDeleteMode}
              isSelected={selectedIds.has(session.id)}
              allowReviewReceipts={allowReviewReceipts}
              isCoach={Boolean(user && activeUserId && activeUserId !== user.uid)}
              onClick={() => {
                if (isDeleteMode) {
                  toggleSelection(session.id);
                } else {
                  handleOpenSession(session);
                }
              }}
            />
          ))}
        </div>
      )}

      {/* Hidden file inputs for photo uploads */}
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handlePhotoUpload}
        accept="image/*"
        capture="environment"
        className="hidden"
      />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handlePhotoUpload}
        accept="image/*"
        multiple
        className="hidden"
      />
      
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
