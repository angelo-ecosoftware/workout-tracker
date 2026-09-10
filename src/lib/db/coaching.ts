import { supabase } from '../supabase.ts';
import { CoachAthleteLink, CoachSpecialty, LinkStatus } from '../../models.ts';
import { DbCoachAthleteLinkRow } from '../../types/supabase.ts';

export async function fetchCoachAthleteLinks(
  userId: string
): Promise<{ coaches: CoachAthleteLink[]; clients: CoachAthleteLink[] }> {
  try {
    const { data, error } = await supabase
      .from('coach_athlete_links')
      .select('*')
      .or(`coach_id.eq.${userId},athlete_id.eq.${userId}`);
    if (error || !data) return { coaches: [], clients: [] };

    const formatted: CoachAthleteLink[] = ((data as DbCoachAthleteLinkRow[]) || []).map((d) => ({
      id: d.id,
      coachId: d.coach_id,
      athleteId: d.athlete_id,
      specialty: (d.specialty || 'strength') as CoachSpecialty,
      status: d.status as LinkStatus,
      inviteCode: d.invite_code,
      notes: d.notes,
      coachName: d.coach_name || 'Coach',
      coachEmail: d.coach_email || undefined,
      athleteName: d.athlete_name || 'Athlete',
      athleteEmail: d.athlete_email || undefined,
      createdAt: new Date(d.created_at || Date.now()),
      updatedAt: new Date(d.updated_at || Date.now()),
    }));

    return {
      coaches: formatted.filter((link) => link.athleteId === userId && link.status === 'accepted'),
      clients: formatted.filter((link) => link.coachId === userId && link.status !== 'revoked'),
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
  const payload: Record<string, unknown> = {
    coach_id: coachId,
    specialty,
    status: 'pending',
    invite_code: inviteCode,
    coach_name: coachName || 'Coach',
  };

  if (athleteIdOrEmail) {
    if (athleteIdOrEmail.includes('@')) payload.athlete_email = athleteIdOrEmail.trim();
    else payload.athlete_id = athleteIdOrEmail.trim();
  }

  const { data, error } = await supabase
    .from('coach_athlete_links')
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error('Supabase error inserting coach invite:', error);
    throw new Error(`Failed to create coach invite: ${error.message}`);
  }

  return {
    id: data.id,
    coachId: data.coach_id,
    athleteId: data.athlete_id || '',
    specialty: (data.specialty as CoachSpecialty) || specialty,
    status: 'pending',
    inviteCode: data.invite_code,
    coachName: data.coach_name || coachName,
    createdAt: new Date(data.created_at || Date.now()),
    updatedAt: new Date(data.updated_at || Date.now()),
  };
}

export async function fetchInviteByCode(inviteCode: string): Promise<CoachAthleteLink | null> {
  if (!inviteCode) return null;
  const cleanCode = inviteCode.trim();

  try {
    const { data, error } = await supabase
      .from('coach_athlete_links')
      .select('*')
      .eq('invite_code', cleanCode)
      .maybeSingle();
    if (error || !data) return null;

    return {
      id: data.id,
      coachId: data.coach_id,
      athleteId: data.athlete_id,
      specialty: data.specialty || 'strength',
      status: data.status as LinkStatus,
      inviteCode: data.invite_code,
      notes: data.notes,
      coachName: data.coach_name || 'Coach',
      coachEmail: data.coach_email,
      athleteName: data.athlete_name,
      athleteEmail: data.athlete_email,
      createdAt: new Date(data.created_at || Date.now()),
      updatedAt: new Date(data.updated_at || Date.now()),
    };
  } catch {
    return null;
  }
}

export async function acceptCoachLinkByCode(
  inviteCode: string,
  athleteId: string,
  athleteName?: string
): Promise<CoachAthleteLink | null> {
  if (!inviteCode || !athleteId) return null;
  const cleanCode = inviteCode.trim();

  try {
    const existing = await fetchInviteByCode(cleanCode);
    if (!existing) {
      console.warn(`Invite code not found in database: "${cleanCode}"`);
      throw new Error('Could not find this invitation. It may have expired, was deleted, or the code is incorrect.');
    }
    if (existing.coachId === athleteId) {
      throw new Error('You cannot accept your own coaching invite. Please share this invite link with an athlete or switch accounts.');
    }
    if (existing.status === 'accepted') {
      if (existing.athleteId === athleteId) return existing;
      throw new Error('This invitation has already been claimed by another athlete.');
    }

    const { data, error } = await supabase
      .from('coach_athlete_links')
      .update({
        status: 'accepted',
        athlete_id: athleteId,
        athlete_name: athleteName || 'Athlete',
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .eq('status', 'pending')
      .select()
      .maybeSingle();

    if (error) {
      console.error('Failed to claim coach link:', error);
      if (error.code === '23505') throw new Error('You are already connected with this coach.');
      throw new Error(error.message || 'Failed to accept invitation.');
    }
    if (!data) return null;

    return {
      id: data.id,
      coachId: data.coach_id,
      athleteId: data.athlete_id,
      specialty: data.specialty || 'strength',
      status: 'accepted',
      inviteCode: data.invite_code,
      notes: data.notes,
      coachName: data.coach_name || 'Coach',
      athleteName: athleteName || 'Athlete',
      createdAt: new Date(data.created_at || Date.now()),
      updatedAt: new Date(data.updated_at || Date.now()),
    };
  } catch (error: unknown) {
    if (error instanceof Error) throw error;
    console.error('Exception accepting coach link:', error);
    return null;
  }
}

export async function acceptCoachLink(linkId: string, athleteId: string, athleteName?: string): Promise<void> {
  try {
    await supabase
      .from('coach_athlete_links')
      .update({
        status: 'accepted',
        athlete_id: athleteId,
        athlete_name: athleteName || 'Athlete',
        updated_at: new Date().toISOString(),
      })
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
