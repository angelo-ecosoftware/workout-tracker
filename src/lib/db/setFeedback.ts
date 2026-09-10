import { supabase } from '../supabase.ts';
import { WorkoutSetCoachFeedback } from '../../models.ts';
import { DbWorkoutSetCoachFeedbackRow } from '../../types/supabase.ts';

export async function fetchWorkoutSetFeedback(sessionId: string): Promise<WorkoutSetCoachFeedback[]> {
  try {
    const { data, error } = await supabase
      .from('workout_set_coach_feedback')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    if (error || !data) return [];
    return ((data as DbWorkoutSetCoachFeedbackRow[]) || []).map((d) => ({
      id: d.id,
      setId: d.set_id,
      sessionId: d.session_id,
      coachId: d.coach_id,
      athleteId: d.athlete_id,
      videoUrl: d.video_cue_url || undefined,
      timestampMarker: d.timestamp_marker || undefined,
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
  let dbId = '';
  try {
    const { data } = await supabase
      .from('workout_set_coach_feedback')
      .insert({
        set_id: setId,
        session_id: sessionId,
        coach_id: coachId,
        athlete_id: athleteId,
        video_url: videoUrl || null,
        timestamp_marker: timestampMarker || null,
        cue_text: cueText,
        coach_name: coachName || 'Coach',
      })
      .select()
      .single();
    if (data?.id) dbId = data.id;
  } catch {
    // ignore
  }

  return {
    id: dbId || `fb_${Date.now()}`,
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
}
