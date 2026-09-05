import { supabase } from '../supabase.ts';
import { AppRole, CoachSpecialty } from '../../models.ts';

export interface AdminUserListItem {
  userId: string;
  email?: string;
  name?: string;
  role: AppRole;
  specialty: CoachSpecialty | null;
  isApproved: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminMissingProductReport {
  id: string;
  barcode?: string;
  name?: string;
  brand?: string;
  store?: string;
  notes?: string;
  userId?: string;
  status: 'pending' | 'resolved' | 'rejected';
  createdAt: string;
}

/**
 * Fetches all registered users combined with their user_roles status.
 */
export async function fetchAllUsersForAdmin(): Promise<AdminUserListItem[]> {
  try {
    const [{ data: usersData, error: uErr }, { data: rolesData, error: rErr }] = await Promise.all([
      supabase.from('users').select('user_id, email, name, created_at'),
      supabase.from('user_roles').select('*'),
    ]);

    if (uErr) {
      console.warn('Error fetching users for admin:', uErr);
    }
    if (rErr) {
      console.warn('Error fetching roles for admin:', rErr);
    }

    const rolesMap = new Map<string, any>();
    if (rolesData) {
      rolesData.forEach((r) => rolesMap.set(r.user_id, r));
    }

    const userList: AdminUserListItem[] = [];

    if (usersData && usersData.length > 0) {
      usersData.forEach((u) => {
        const r = rolesMap.get(u.user_id);
        userList.push({
          userId: u.user_id,
          email: u.email || 'No email',
          name: u.name || 'Anonymous User',
          role: (r?.role as AppRole) || 'athlete',
          specialty: (r?.specialty as CoachSpecialty) || null,
          isApproved: r ? Boolean(r.is_approved) : false,
          createdAt: u.created_at || r?.created_at,
          updatedAt: r?.updated_at,
        });
      });
    }

    // Include roles that might not yet have a matching user profile row
    if (rolesData) {
      rolesData.forEach((r) => {
        if (!userList.some((u) => u.userId === r.user_id)) {
          userList.push({
            userId: r.user_id,
            email: 'User ' + r.user_id.substring(0, 8),
            name: 'User ' + r.user_id.substring(0, 8),
            role: (r.role as AppRole) || 'athlete',
            specialty: (r.specialty as CoachSpecialty) || null,
            isApproved: Boolean(r.is_approved),
            createdAt: r.created_at,
            updatedAt: r.updated_at,
          });
        }
      });
    }

    return userList;
  } catch (err) {
    console.error('Failed to load admin user list:', err);
    return [];
  }
}

/**
 * Updates a user's role, specialty, and approval state in user_roles.
 */
export async function updateUserRoleByAdmin(
  userId: string,
  role: AppRole,
  specialty: CoachSpecialty | null,
  isApproved: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = {
      user_id: userId,
      role,
      specialty: role === 'coach' ? (specialty || 'strength') : null,
      is_approved: isApproved,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('user_roles').upsert(payload, { onConflict: 'user_id' });

    if (error) {
      console.error('Error updating user role by admin:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to update user role' };
  }
}

/**
 * Fetches crowdsourced missing product / barcode reports submitted by athletes.
 */
export async function fetchMissingProductReportsForAdmin(): Promise<AdminMissingProductReport[]> {
  try {
    const { data, error } = await supabase
      .from('missing_product_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching missing product reports:', error);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      barcode: row.barcode,
      name: row.name,
      brand: row.brand,
      store: row.store,
      notes: row.notes,
      userId: row.user_id,
      status: row.status || 'pending',
      createdAt: row.created_at,
    }));
  } catch (err) {
    console.error('Failed to fetch product reports:', err);
    return [];
  }
}

/**
 * Updates the resolution status of a missing product report (pending, resolved, rejected).
 */
export async function updateMissingProductReportStatus(
  reportId: string,
  status: 'pending' | 'resolved' | 'rejected'
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('missing_product_reports')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', reportId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to update report status' };
  }
}
