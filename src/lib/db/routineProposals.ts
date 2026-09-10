import { supabase } from '../supabase.ts';
import { Exercise, ProposalStatus, RoutineProposal, Workout } from '../../models.ts';
import { DbRoutineProposalRow } from '../../types/supabase.ts';

export async function fetchRoutineProposals(userId: string): Promise<RoutineProposal[]> {
  try {
    const { data, error } = await supabase
      .from('routine_proposals')
      .select('*')
      .or(`athlete_id.eq.${userId},coach_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return ((data as DbRoutineProposalRow[]) || []).map((d) => ({
      id: d.id,
      coachId: d.coach_id,
      athleteId: d.athlete_id,
      title: d.title,
      description: d.description,
      programPayload: (d.program_payload as { workouts: (Workout & { exercises: Exercise[] })[] }) || { workouts: [] },
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
  programPayload: { workouts: (Workout & { exercises: Exercise[] })[] },
  description?: string,
  coachName?: string
): Promise<RoutineProposal> {
  let dbId = '';
  try {
    const { data } = await supabase
      .from('routine_proposals')
      .insert({
        coach_id: coachId,
        athlete_id: athleteId,
        title,
        description: description || null,
        program_payload: programPayload,
        status: 'proposed',
        coach_name: coachName || 'Coach',
      })
      .select()
      .single();
    if (data?.id) dbId = data.id;
  } catch {
    // ignore
  }

  return {
    id: dbId || `prop_${Date.now()}`,
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
