import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchUserRole,
  requestCoachRole,
  approveCoachRole,
  fetchUserPrivacySettings,
  updateUserPrivacySettings,
  fetchCoachAthleteLinks,
  createCoachInvite,
  acceptCoachLink,
  revokeCoachLink,
  fetchSavedRoutinePrograms,
  saveRoutineProgramToLibrary,
  setActiveRoutineProgram,
  deleteSavedRoutineProgram,
  fetchRoutineProposals,
  createRoutineProposal,
  updateRoutineProposalStatus,
  fetchActiveMacroPrescription,
  saveMacroPrescription,
  fetchWorkoutSetFeedback,
  addWorkoutSetFeedback,
} from '../../../src/lib/db/roles.ts';
import { supabase } from '../../../src/lib/supabase.ts';

describe('Roles, Privacy, Coaching & Routine Library Data Access Layer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('User Roles & Permissions', () => {
    it('returns default athlete role when database returns null', async () => {
      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      } as any);

      const role = await fetchUserRole('user-1');
      expect(role.role).toBe('athlete');
      expect(role.isApproved).toBe(false);
    });

    it('submits a coach role request and updates local cache', async () => {
      vi.spyOn(supabase, 'from').mockReturnValue({
        upsert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { user_id: 'user-1', role: 'coach', specialty: 'strength', is_approved: false },
          error: null,
        }),
      } as any);

      const role = await requestCoachRole('user-1', 'strength');
      expect(role.role).toBe('coach');
      expect(role.specialty).toBe('strength');
      expect(role.isApproved).toBe(false);
    });
  });

  describe('Privacy Settings', () => {
    it('fetches default privacy settings when no custom record exists', async () => {
      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      } as any);

      const privacy = await fetchUserPrivacySettings('user-1');
      expect(privacy.isPublicProfile).toBe(false);
      expect(privacy.shareWorkouts).toBe(true);
      expect(privacy.shareBiometrics).toBe(false);
    });

    it('updates privacy settings and persists to storage', async () => {
      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
      } as any);

      const updated = await updateUserPrivacySettings('user-1', {
        isPublicProfile: true,
        shareBiometrics: true,
      });

      expect(updated.isPublicProfile).toBe(true);
      expect(updated.shareBiometrics).toBe(true);
      expect(updated.shareWorkouts).toBe(true);
    });
  });

  describe('Saved Routines Library', () => {
    it('saves a routine program to the library', async () => {
      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      } as any);

      const prog = await saveRoutineProgramToLibrary('user-1', 'PPL Hypertrophy', { workouts: [] });
      expect(prog.title).toBe('PPL Hypertrophy');
      expect(prog.userId).toBe('user-1');
      expect(prog.isActive).toBe(false);
    });

    it('sets a program as active in the library', async () => {
      let mockPrograms = [
        { id: 'prog-1', user_id: 'user-1', title: 'PPL', is_active: false, program_data: { workouts: [] } },
        { id: 'prog-2', user_id: 'user-1', title: 'Upper/Lower', is_active: true, program_data: { workouts: [] } },
      ];

      vi.spyOn(supabase, 'from').mockImplementation(((table: string) => {
        if (table === 'saved_routine_programs') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockImplementation(() => Promise.resolve({ data: mockPrograms, error: null })),
            update: vi.fn().mockImplementation((payload: any) => {
              if (payload.is_active === false) {
                mockPrograms = mockPrograms.map((p) => ({ ...p, is_active: false }));
              }
              if (payload.is_active === true) {
                mockPrograms = mockPrograms.map((p) => (p.id === 'prog-1' ? { ...p, is_active: true } : p));
              }
              return {
                eq: vi.fn().mockResolvedValue({ data: null, error: null }),
              };
            }),
          };
        }
        return {} as any;
      }) as any);

      await setActiveRoutineProgram('user-1', 'prog-1');
      const progs = await fetchSavedRoutinePrograms('user-1');
      const active = progs.find((p) => p.id === 'prog-1');
      expect(active?.isActive).toBe(true);
    });
  });

  describe('Coach Proposals & Prescriptions', () => {
    it('creates a routine proposal for a client', async () => {
      vi.spyOn(supabase, 'from').mockReturnValue({
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      } as any);

      const proposal = await createRoutineProposal('coach-1', 'athlete-1', '4-Day Split', { workouts: [] });
      expect(proposal.title).toBe('4-Day Split');
      expect(proposal.status).toBe('proposed');
    });

    it('saves a nutrition macro prescription for an athlete', async () => {
      vi.spyOn(supabase, 'from').mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      } as any);

      const presc = await saveMacroPrescription('coach-1', 'athlete-1', 2500, 180, 250, 70);
      expect(presc.targetKcal).toBe(2500);
      expect(presc.targetProteinG).toBe(180);
      expect(presc.isActive).toBe(true);
    });
  });
});
