import { supabase } from '../supabase.ts';
import { AppRole, CoachSpecialty, UserRoleInfo } from '../../models.ts';
import { getLocalStorageItem, setLocalStorageItem } from './rolesStorage.ts';

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

    if (error || !data) return defaultRole;

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
    // If table doesn't exist yet, graceful local fallback.
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
