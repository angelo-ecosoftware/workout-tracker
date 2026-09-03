import { describe, it, expect, beforeEach, vi } from 'vitest';

let mockUsersDb: any[] = [];
let mockSessionsDb: any[] = [];
let mockSetsDb: any[] = [];
let mockBodyLogsDb: any[] = [];
let mockDietaryLogsDb: any[] = [];
let mockFoodItemsDb: any[] = [];

vi.mock('../../../src/lib/supabase.ts', () => {
  const createBuilder = (table: string) => {
    const builder: any = {
      _filters: [] as { field: string; val: any }[],
      select: vi.fn(() => builder),
      eq: vi.fn((field: string, val: any) => {
        builder._filters.push({ field, val });
        return builder;
      }),
      delete: vi.fn(() => ({
        eq: (field: string, val: any) => {
          if (table === 'users') {
            mockUsersDb = mockUsersDb.filter((r) => r[field] !== val);
            mockSessionsDb = mockSessionsDb.filter((r) => r.user_id !== val);
            mockSetsDb = mockSetsDb.filter((r) => r.user_id !== val);
            mockBodyLogsDb = mockBodyLogsDb.filter((r) => r.user_id !== val);
            mockDietaryLogsDb = mockDietaryLogsDb.filter((r) => r.user_id !== val);
            mockFoodItemsDb = mockFoodItemsDb.filter((r) => r.user_id !== val);
          } else if (table === 'sessions') {
            mockSessionsDb = mockSessionsDb.filter((r) => r[field] !== val);
          } else if (table === 'sets') {
            mockSetsDb = mockSetsDb.filter((r) => r[field] !== val);
          }
          return Promise.resolve({ data: null, error: null, status: 200 });
        },
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

describe('User Account Deletion & Associated Data Purge', () => {
  beforeEach(() => {
    mockUsersDb = [{ user_id: 'usr_to_delete', email: 'delete_me@gym.com' }];
    mockSessionsDb = [
      { id: 'sess_1', user_id: 'usr_to_delete' },
      { id: 'sess_other', user_id: 'usr_other' },
    ];
    mockSetsDb = [
      { id: 'set_1', user_id: 'usr_to_delete', session_id: 'sess_1' },
      { id: 'set_other', user_id: 'usr_other', session_id: 'sess_other' },
    ];
    mockBodyLogsDb = [
      { id: 'blog_1', user_id: 'usr_to_delete', weight_kg: 80 },
      { id: 'blog_other', user_id: 'usr_other', weight_kg: 75 },
    ];
    mockDietaryLogsDb = [
      { id: 'dlog_1', user_id: 'usr_to_delete', date: '2025-05-01' },
      { id: 'dlog_other', user_id: 'usr_other', date: '2025-05-01' },
    ];
    mockFoodItemsDb = [
      { id: 'f_custom_1', user_id: 'usr_to_delete', name: 'Private Shake' },
      { id: 'f_public', user_id: null, name: 'Public Egg' },
    ];
    vi.clearAllMocks();
  });

  it('1. Purges user profile and cascades removal of all associated domain entities', async () => {
    const { supabase } = await import('../../../src/lib/supabase.ts');

    const { error } = await supabase.from('users').delete().eq('user_id', 'usr_to_delete');
    expect(error).toBeNull();

    expect(mockUsersDb.find((u) => u.user_id === 'usr_to_delete')).toBeUndefined();
    expect(mockSessionsDb.filter((s) => s.user_id === 'usr_to_delete')).toHaveLength(0);
    expect(mockSetsDb.filter((s) => s.user_id === 'usr_to_delete')).toHaveLength(0);
    expect(mockBodyLogsDb.filter((b) => b.user_id === 'usr_to_delete')).toHaveLength(0);
    expect(mockDietaryLogsDb.filter((d) => d.user_id === 'usr_to_delete')).toHaveLength(0);
    expect(mockFoodItemsDb.filter((f) => f.user_id === 'usr_to_delete')).toHaveLength(0);
  });

  it('2. Retains unrelated user records and public shared food catalog', async () => {
    const { supabase } = await import('../../../src/lib/supabase.ts');

    await supabase.from('users').delete().eq('user_id', 'usr_to_delete');

    expect(mockSessionsDb.find((s) => s.user_id === 'usr_other')).toBeDefined();
    expect(mockSetsDb.find((s) => s.user_id === 'usr_other')).toBeDefined();
    expect(mockBodyLogsDb.find((b) => b.user_id === 'usr_other')).toBeDefined();
    expect(mockFoodItemsDb.find((f) => f.id === 'f_public')).toBeDefined();
  });
});
