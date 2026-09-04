import { supabase } from '../supabase.ts';
import {
  AppRole,
  CoachSpecialty,
  LinkStatus,
  ProposalStatus,
  UserRoleInfo,
  CoachAthleteLink,
  UserPrivacySettings,
  UserPeerShare,
  SavedRoutineProgram,
  RoutineProposal,
  CoachMacroPrescription,
  WorkoutSetCoachFeedback,
} from '../../models.ts';

function getLocalStorageItem(key: string): string | null {
  try {
    if (typeof localStorage !== 'undefined' && localStorage?.getItem) {
      return localStorage.getItem(key);
    }
  } catch {
    // ignore
  }
  return null;
}

function setLocalStorageItem(key: string, value: string): void {
  try {
    if (typeof localStorage !== 'undefined' && localStorage?.setItem) {
      localStorage.setItem(key, value);
    }
  } catch {
    // ignore
  }
}

// ============================================================================
// 1. USER ROLES & PERMISSIONS
// ============================================================================

export async function fetchUserRole(userId: string): Promise<UserRoleInfo> {
  const localRoleRaw = getLocalStorageItem(`user_role_${userId}`);
  let defaultRole: UserRoleInfo = {
    userId,
    role: 'athlete',
    specialty: null,
    isApproved: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (localRoleRaw) {
    try {
      defaultRole = { ...defaultRole, ...JSON.parse(localRoleRaw) };
    } catch {
      // ignore
    }
  }

  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      return defaultRole;
    }

    const resolved: UserRoleInfo = {
      userId: data.user_id,
      role: (data.role as AppRole) || 'athlete',
      specialty: (data.specialty as CoachSpecialty) || null,
      isApproved: Boolean(data.is_approved),
      createdAt: new Date(data.created_at || Date.now()),
      updatedAt: new Date(data.updated_at || Date.now()),
    };

    setLocalStorageItem(`user_role_${userId}`, JSON.stringify(resolved));
    return resolved;
  } catch {
    return defaultRole;
  }
}

export async function requestCoachRole(
  userId: string,
  specialty: CoachSpecialty = 'strength'
): Promise<UserRoleInfo> {
  const rolePayload = {
    user_id: userId,
    role: 'coach',
    specialty,
    is_approved: false,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('user_roles')
    .upsert(rolePayload, { onConflict: 'user_id' })
    .select()
    .single();

  const roleInfo: UserRoleInfo = {
    userId,
    role: 'coach',
    specialty,
    isApproved: Boolean(data?.is_approved),
    createdAt: new Date(data?.created_at || Date.now()),
    updatedAt: new Date(),
  };

  setLocalStorageItem(`user_role_${userId}`, JSON.stringify(roleInfo));
  if (error && error.code !== '42P01') {
    // If table doesn't exist yet, graceful local fallback
  }

  return roleInfo;
}

export async function approveCoachRole(
  userId: string,
  role: AppRole = 'coach',
  specialty: CoachSpecialty = 'strength'
): Promise<void> {
  await supabase
    .from('user_roles')
    .upsert({
      user_id: userId,
      role,
      specialty,
      is_approved: true,
      updated_at: new Date().toISOString(),
    });

  const updated: UserRoleInfo = {
    userId,
    role,
    specialty,
    isApproved: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  setLocalStorageItem(`user_role_${userId}`, JSON.stringify(updated));
}

// ============================================================================
// 2. ATHLETE PRIVACY SETTINGS & SELECTIVE PEER SHARING
// ============================================================================

export async function fetchUserPrivacySettings(userId: string): Promise<UserPrivacySettings> {
  const defaultSettings: UserPrivacySettings = {
    userId,
    isPublicProfile: false,
    shareWorkouts: true,
    shareBiometrics: false,
    shareDietary: false,
    sharePhotos: false,
  };

  const localRaw = getLocalStorageItem(`user_privacy_${userId}`);
  if (localRaw) {
    try {
      return { ...defaultSettings, ...JSON.parse(localRaw) };
    } catch {
      // ignore
    }
  }

  try {
    const { data, error } = await supabase
      .from('user_privacy_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) return defaultSettings;

    const resolved: UserPrivacySettings = {
      userId: data.user_id,
      isPublicProfile: Boolean(data.is_public_profile),
      shareWorkouts: data.share_workouts !== false,
      shareBiometrics: Boolean(data.share_biometrics),
      shareDietary: Boolean(data.share_dietary),
      sharePhotos: Boolean(data.share_photos),
      createdAt: data.created_at ? new Date(data.created_at) : undefined,
      updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
    };

    setLocalStorageItem(`user_privacy_${userId}`, JSON.stringify(resolved));
    return resolved;
  } catch {
    return defaultSettings;
  }
}

export async function updateUserPrivacySettings(
  userId: string,
  settings: Partial<UserPrivacySettings>
): Promise<UserPrivacySettings> {
  const current = await fetchUserPrivacySettings(userId);
  const updated: UserPrivacySettings = { ...current, ...settings, userId };

  setLocalStorageItem(`user_privacy_${userId}`, JSON.stringify(updated));

  try {
    await supabase.from('user_privacy_settings').upsert({
      user_id: userId,
      is_public_profile: updated.isPublicProfile,
      share_workouts: updated.shareWorkouts,
      share_biometrics: updated.shareBiometrics,
      share_dietary: updated.shareDietary,
      share_photos: updated.sharePhotos,
      updated_at: new Date().toISOString(),
    });
  } catch {
    // ignore
  }

  return updated;
}

export async function fetchUserPeerShares(userId: string): Promise<UserPeerShare[]> {
  try {
    const { data, error } = await supabase
      .from('user_peer_shares')
      .select('*')
      .eq('owner_id', userId);

    if (error || !data) return [];
    return data.map((d: any) => ({
      id: d.id,
      ownerId: d.owner_id,
      granteeId: d.grantee_id,
      granteeName: d.grantee_name,
      granteeEmail: d.grantee_email,
      shareWorkouts: Boolean(d.share_workouts),
      shareBiometrics: Boolean(d.share_biometrics),
      shareDietary: Boolean(d.share_dietary),
      createdAt: d.created_at ? new Date(d.created_at) : undefined,
    }));
  } catch {
    return [];
  }
}

export async function saveUserPeerShare(
  ownerId: string,
  granteeId: string,
  granteeName: string,
  permissions: { shareWorkouts: boolean; shareBiometrics: boolean; shareDietary: boolean }
): Promise<UserPeerShare> {
  const payload = {
    id: `peer_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    owner_id: ownerId,
    grantee_id: granteeId,
    share_workouts: permissions.shareWorkouts,
    share_biometrics: permissions.shareBiometrics,
    share_dietary: permissions.shareDietary,
  };

  try {
    await supabase.from('user_peer_shares').upsert(payload);
  } catch {
    // ignore
  }

  return {
    id: payload.id,
    ownerId,
    granteeId,
    granteeName,
    shareWorkouts: permissions.shareWorkouts,
    shareBiometrics: permissions.shareBiometrics,
    shareDietary: permissions.shareDietary,
    createdAt: new Date(),
  };
}

export async function deleteUserPeerShare(shareId: string): Promise<void> {
  try {
    await supabase.from('user_peer_shares').delete().eq('id', shareId);
  } catch {
    // ignore
  }
}

// ============================================================================
// 3. COACH-ATHLETE MUTUAL LINKS & INVITATIONS
// ============================================================================

export async function fetchCoachAthleteLinks(
  userId: string
): Promise<{ coaches: CoachAthleteLink[]; clients: CoachAthleteLink[] }> {
  try {
    const { data, error } = await supabase
      .from('coach_athlete_links')
      .select('*')
      .or(`coach_id.eq.${userId},athlete_id.eq.${userId}`);

    if (error || !data) return { coaches: [], clients: [] };

    const formatted: CoachAthleteLink[] = data.map((d: any) => ({
      id: d.id,
      coachId: d.coach_id,
      athleteId: d.athlete_id,
      specialty: d.specialty || 'strength',
      status: d.status as LinkStatus,
      inviteCode: d.invite_code,
      notes: d.notes,
      coachName: d.coach_name || 'Coach',
      coachEmail: d.coach_email,
      athleteName: d.athlete_name || 'Athlete',
      athleteEmail: d.athlete_email,
      createdAt: new Date(d.created_at || Date.now()),
      updatedAt: new Date(d.updated_at || Date.now()),
    }));

    return {
      coaches: formatted.filter((f) => f.athleteId === userId && f.status === 'accepted'),
      clients: formatted.filter((f) => f.coachId === userId),
    };
  } catch {
    return { coaches: [], clients: [] };
  }
}

export async function createCoachInvite(
  coachId: string,
  specialty: CoachSpecialty = 'strength',
  athleteIdOrEmail?: string,
  coachName?: string
): Promise<CoachAthleteLink> {
  const inviteCode = `invite_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const payload = {
    id: `link_${Date.now()}`,
    coach_id: coachId,
    athlete_id: athleteIdOrEmail?.includes('@') ? coachId : (athleteIdOrEmail || coachId), // Pending resolution
    specialty,
    status: 'pending' as LinkStatus,
    invite_code: inviteCode,
    coach_name: coachName || 'Coach',
  };

  try {
    await supabase.from('coach_athlete_links').insert(payload);
  } catch {
    // ignore
  }

  return {
    id: payload.id,
    coachId,
    athleteId: payload.athlete_id,
    specialty,
    status: 'pending',
    inviteCode,
    coachName: payload.coach_name,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export async function acceptCoachLink(linkId: string, athleteId: string): Promise<void> {
  try {
    await supabase
      .from('coach_athlete_links')
      .update({ status: 'accepted', athlete_id: athleteId, updated_at: new Date().toISOString() })
      .eq('id', linkId);
  } catch {
    // ignore
  }
}

export async function revokeCoachLink(linkId: string): Promise<void> {
  try {
    await supabase
      .from('coach_athlete_links')
      .update({ status: 'revoked', updated_at: new Date().toISOString() })
      .eq('id', linkId);
  } catch {
    // ignore
  }
}

// ============================================================================
// 4. SAVED ROUTINES LIBRARY
// ============================================================================

export async function fetchSavedRoutinePrograms(userId: string): Promise<SavedRoutineProgram[]> {
  const localProgramsRaw = getLocalStorageItem(`saved_programs_${userId}`);
  let defaultPrograms: SavedRoutineProgram[] = [];
  if (localProgramsRaw) {
    try {
      defaultPrograms = JSON.parse(localProgramsRaw);
    } catch {
      // ignore
    }
  }

  try {
    const { data, error } = await supabase
      .from('saved_routine_programs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return defaultPrograms;
    }

    const resolved = data.map((d: any) => ({
      id: d.id,
      userId: d.user_id,
      title: d.title,
      description: d.description,
      isActive: Boolean(d.is_active),
      sourceCoachId: d.source_coach_id,
      programData: d.program_data || { workouts: [] },
      createdAt: new Date(d.created_at || Date.now()),
      updatedAt: new Date(d.updated_at || Date.now()),
    }));

    setLocalStorageItem(`saved_programs_${userId}`, JSON.stringify(resolved));
    return resolved;
  } catch {
    return defaultPrograms;
  }
}

export async function saveRoutineProgramToLibrary(
  userId: string,
  title: string,
  programData: any,
  description?: string,
  sourceCoachId?: string
): Promise<SavedRoutineProgram> {
  const newProgram: SavedRoutineProgram = {
    id: `prog_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    userId,
    title,
    description: description || null,
    isActive: false,
    sourceCoachId: sourceCoachId || null,
    programData,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const existing = await fetchSavedRoutinePrograms(userId);
  const updated = [newProgram, ...existing.filter((p) => p.id !== newProgram.id)];
  setLocalStorageItem(`saved_programs_${userId}`, JSON.stringify(updated));

  try {
    await supabase.from('saved_routine_programs').insert({
      id: newProgram.id,
      user_id: userId,
      title,
      description: description || null,
      is_active: false,
      source_coach_id: sourceCoachId || null,
      program_data: programData,
    });
  } catch {
    // ignore
  }

  return newProgram;
}

export async function setActiveRoutineProgram(userId: string, programId: string): Promise<void> {
  const existing = await fetchSavedRoutinePrograms(userId);
  const updated = existing.map((p) => ({
    ...p,
    isActive: p.id === programId,
  }));
  setLocalStorageItem(`saved_programs_${userId}`, JSON.stringify(updated));

  try {
    await supabase
      .from('saved_routine_programs')
      .update({ is_active: false })
      .eq('user_id', userId);

    await supabase
      .from('saved_routine_programs')
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq('id', programId);
  } catch {
    // ignore
  }
}

export async function deleteSavedRoutineProgram(userId: string, programId: string): Promise<void> {
  const existing = await fetchSavedRoutinePrograms(userId);
  const updated = existing.filter((p) => p.id !== programId);
  setLocalStorageItem(`saved_programs_${userId}`, JSON.stringify(updated));

  try {
    await supabase.from('saved_routine_programs').delete().eq('id', programId);
  } catch {
    // ignore
  }
}

// ============================================================================
// 5. ROUTINE PROPOSALS (COACH -> ATHLETE)
// ============================================================================

export async function fetchRoutineProposals(userId: string): Promise<RoutineProposal[]> {
  try {
    const { data, error } = await supabase
      .from('routine_proposals')
      .select('*')
      .or(`athlete_id.eq.${userId},coach_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map((d: any) => ({
      id: d.id,
      coachId: d.coach_id,
      athleteId: d.athlete_id,
      title: d.title,
      description: d.description,
      programPayload: d.program_payload,
      status: d.status as ProposalStatus,
      coachName: d.coach_name || 'Coach',
      createdAt: new Date(d.created_at || Date.now()),
      updatedAt: new Date(d.updated_at || Date.now()),
    }));
  } catch {
    return [];
  }
}

export async function createRoutineProposal(
  coachId: string,
  athleteId: string,
  title: string,
  programPayload: any,
  description?: string,
  coachName?: string
): Promise<RoutineProposal> {
  const newProposal: RoutineProposal = {
    id: `prop_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    coachId,
    athleteId,
    title,
    description: description || null,
    programPayload,
    status: 'proposed',
    coachName: coachName || 'Coach',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  try {
    await supabase.from('routine_proposals').insert({
      id: newProposal.id,
      coach_id: coachId,
      athlete_id: athleteId,
      title,
      description: description || null,
      program_payload: programPayload,
      status: 'proposed',
    });
  } catch {
    // ignore
  }

  return newProposal;
}

export async function updateRoutineProposalStatus(
  proposalId: string,
  status: ProposalStatus
): Promise<void> {
  try {
    await supabase
      .from('routine_proposals')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', proposalId);
  } catch {
    // ignore
  }
}

// ============================================================================
// 6. COACH MACRONUTRIENT PRESCRIPTIONS
// ============================================================================

export async function fetchActiveMacroPrescription(
  athleteId: string
): Promise<CoachMacroPrescription | null> {
  const localPrescriptionRaw = getLocalStorageItem(`macro_prescription_${athleteId}`);
  let fallback: CoachMacroPrescription | null = null;
  if (localPrescriptionRaw) {
    try {
      fallback = JSON.parse(localPrescriptionRaw);
    } catch {
      // ignore
    }
  }

  try {
    const { data, error } = await supabase
      .from('coach_macro_prescriptions')
      .select('*')
      .eq('athlete_id', athleteId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (error || !data) return fallback;

    const resolved: CoachMacroPrescription = {
      id: data.id,
      coachId: data.coach_id,
      athleteId: data.athlete_id,
      targetKcal: data.target_kcal,
      targetProteinG: Number(data.target_protein_g),
      targetCarbsG: Number(data.target_carbs_g),
      targetFatG: Number(data.target_fat_g),
      targetFiberG: data.target_fiber_g ? Number(data.target_fiber_g) : null,
      notes: data.notes,
      isActive: Boolean(data.is_active),
      coachName: data.coach_name || 'Nutrition Coach',
      createdAt: new Date(data.created_at || Date.now()),
      updatedAt: new Date(data.updated_at || Date.now()),
    };

    setLocalStorageItem(`macro_prescription_${athleteId}`, JSON.stringify(resolved));
    return resolved;
  } catch {
    return fallback;
  }
}

export async function saveMacroPrescription(
  coachId: string,
  athleteId: string,
  targetKcal: number,
  targetProteinG: number,
  targetCarbsG: number,
  targetFatG: number,
  targetFiberG?: number,
  notes?: string,
  coachName?: string
): Promise<CoachMacroPrescription> {
  const newPrescription: CoachMacroPrescription = {
    id: `macro_presc_${Date.now()}`,
    coachId,
    athleteId,
    targetKcal,
    targetProteinG,
    targetCarbsG,
    targetFatG,
    targetFiberG: targetFiberG || null,
    notes: notes || null,
    isActive: true,
    coachName: coachName || 'Nutrition Coach',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  setLocalStorageItem(`macro_prescription_${athleteId}`, JSON.stringify(newPrescription));

  try {
    await supabase
      .from('coach_macro_prescriptions')
      .update({ is_active: false })
      .eq('athlete_id', athleteId);

    await supabase.from('coach_macro_prescriptions').insert({
      id: newPrescription.id,
      coach_id: coachId,
      athlete_id: athleteId,
      target_kcal: targetKcal,
      target_protein_g: targetProteinG,
      target_carbs_g: targetCarbsG,
      target_fat_g: targetFatG,
      target_fiber_g: targetFiberG || null,
      notes: notes || null,
      is_active: true,
    });
  } catch {
    // ignore
  }

  return newPrescription;
}

// ============================================================================
// 7. SET ANNOTATIONS & FORM CHECK VIDEO FEEDBACK
// ============================================================================

export async function fetchWorkoutSetFeedback(sessionId: string): Promise<WorkoutSetCoachFeedback[]> {
  try {
    const { data, error } = await supabase
      .from('workout_set_coach_feedback')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error || !data) return [];
    return data.map((d: any) => ({
      id: d.id,
      setId: d.set_id,
      sessionId: d.session_id,
      coachId: d.coach_id,
      athleteId: d.athlete_id,
      videoUrl: d.video_url,
      timestampMarker: d.timestamp_marker,
      cueText: d.cue_text,
      coachName: d.coach_name || 'Coach',
      createdAt: new Date(d.created_at || Date.now()),
    }));
  } catch {
    return [];
  }
}

export async function addWorkoutSetFeedback(
  setId: string,
  sessionId: string,
  coachId: string,
  athleteId: string,
  cueText: string,
  timestampMarker?: string,
  videoUrl?: string,
  coachName?: string
): Promise<WorkoutSetCoachFeedback> {
  const newFeedback: WorkoutSetCoachFeedback = {
    id: `fb_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    setId,
    sessionId,
    coachId,
    athleteId,
    videoUrl: videoUrl || null,
    timestampMarker: timestampMarker || null,
    cueText,
    coachName: coachName || 'Coach',
    createdAt: new Date(),
  };

  try {
    await supabase.from('workout_set_coach_feedback').insert({
      id: newFeedback.id,
      set_id: setId,
      session_id: sessionId,
      coach_id: coachId,
      athlete_id: athleteId,
      video_url: videoUrl || null,
      timestamp_marker: timestampMarker || null,
      cue_text: cueText,
    });
  } catch {
    // ignore
  }

  return newFeedback;
}
