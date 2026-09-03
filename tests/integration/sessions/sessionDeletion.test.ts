import { describe, it, expect, beforeEach, vi } from 'vitest';
import { deleteSessions } from '../../../src/lib/db/sessions.ts';

let mockSessionsDb: any[] = [];
let mockSetsDb: any[] = [];
let deletedPhotosList: string[] = [];

vi.mock('../../../src/lib/storage.ts', () => ({
  deleteWorkoutPhotos: vi.fn(async (photos: string[]) => {
    deletedPhotosList.push(...photos);
  }),
}));

vi.mock('../../../src/lib/supabase.ts', () => {
  const createBuilder = (table: string) => {
    const builder: any = {
      _filters: [] as { field: string; val: any }[],
      _inFilters: [] as { field: string; vals: any[] }[],
      select: vi.fn(() => builder),
      eq: vi.fn((field: string, val: any) => {
        builder._filters.push({ field, val });
        return builder;
      }),
      in: vi.fn((field: string, vals: any[]) => {
        builder._inFilters.push({ field, vals });
        if (table === 'sessions') {
          const matched = mockSessionsDb.filter((r) => vals.includes(r[field]));
          return Promise.resolve({ data: matched, error: null });
        }
        return builder;
      }),
      delete: vi.fn(() => ({
        in: (field: string, vals: any[]) => ({
          eq: (userField: string, userVal: any) => {
            if (table === 'sessions') {
              mockSessionsDb = mockSessionsDb.filter((r) => !(vals.includes(r[field]) && r[userField] === userVal));
            }
            return Promise.resolve({ data: null, error: null });
          },
          then: (resolve: any) => {
            if (table === 'sets') {
              mockSetsDb = mockSetsDb.filter((r) => !vals.includes(r[field]));
            } else {
              mockSessionsDb = mockSessionsDb.filter((r) => !vals.includes(r[field]));
            }
            return resolve({ data: null, error: null });
          },
        }),
      })),
    };
    return builder;
  };

  return {
    supabase: {
      from: vi.fn((table: string) => createBuilder(table)),
    },
  };
});

describe('Session Deletion & Cascade Child Sets/Photos Purge', () => {
  beforeEach(() => {
    mockSessionsDb = [
      { id: 'sess_del_1', user_id: 'usr_lifter', photos: ['photo1.jpg', 'photo2.jpg'] },
      { id: 'sess_del_2', user_id: 'usr_lifter', photos: [] },
      { id: 'sess_keep', user_id: 'usr_other', photos: ['other.jpg'] },
    ];
    mockSetsDb = [
      { id: 'set_1', session_id: 'sess_del_1', user_id: 'usr_lifter' },
      { id: 'set_2', session_id: 'sess_del_1', user_id: 'usr_lifter' },
      { id: 'set_3', session_id: 'sess_del_2', user_id: 'usr_lifter' },
      { id: 'set_keep', session_id: 'sess_keep', user_id: 'usr_other' },
    ];
    deletedPhotosList = [];
    vi.clearAllMocks();
  });

  it('1. Cascades deletion of single session, all nested workout sets, and storage photos', async () => {
    await deleteSessions(['sess_del_1'], 'usr_lifter');

    expect(mockSessionsDb.find((s) => s.id === 'sess_del_1')).toBeUndefined();
    expect(mockSetsDb.filter((s) => s.session_id === 'sess_del_1')).toHaveLength(0);
    expect(deletedPhotosList).toEqual(['photo1.jpg', 'photo2.jpg']);
  });

  it('2. Bulk deletes multiple sessions and aggregates all photo purge operations', async () => {
    await deleteSessions(['sess_del_1', 'sess_del_2'], 'usr_lifter');

    expect(mockSessionsDb.find((s) => s.id === 'sess_del_1')).toBeUndefined();
    expect(mockSessionsDb.find((s) => s.id === 'sess_del_2')).toBeUndefined();
    expect(mockSetsDb.filter((s) => ['sess_del_1', 'sess_del_2'].includes(s.session_id))).toHaveLength(0);
    expect(mockSessionsDb).toHaveLength(1);
    expect(mockSessionsDb[0].id).toBe('sess_keep');
  });

  it('3. Safely handles empty array inputs without performing rogue deletions', async () => {
    await deleteSessions([], 'usr_lifter');

    expect(mockSessionsDb).toHaveLength(3);
    expect(mockSetsDb).toHaveLength(4);
    expect(deletedPhotosList).toHaveLength(0);
  });
});
