import { supabase } from '../supabase.ts';
import { UserPeerShare, UserPrivacySettings } from '../../models.ts';
import { DbUserPeerShareRow } from '../../types/supabase.ts';
import { getLocalStorageItem, setLocalStorageItem } from './rolesStorage.ts';

export async function fetchUserPrivacySettings(userId: string): Promise<UserPrivacySettings> {
  const defaultSettings: UserPrivacySettings = {
    userId,
    isPublicProfile: false,
    shareWorkouts: true,
    shareBiometrics: false,
    shareDietary: false,
    sharePhotos: false,
    shareReviewReceipts: true,
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
      shareReviewReceipts: data.share_review_receipts !== false,
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
      share_review_receipts: updated.shareReviewReceipts !== false,
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
    return ((data as DbUserPeerShareRow[]) || []).map((d) => ({
      id: d.id,
      ownerId: d.owner_id,
      granteeId: d.grantee_id,
      granteeName: d.grantee_name || undefined,
      granteeEmail: d.grantee_email || undefined,
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
  const payload: Partial<DbUserPeerShareRow> = {
    owner_id: ownerId,
    grantee_id: granteeId,
    grantee_name: granteeName,
    share_workouts: permissions.shareWorkouts,
    share_biometrics: permissions.shareBiometrics,
    share_dietary: permissions.shareDietary,
  };

  let savedId = '';
  try {
    const { data } = await supabase.from('user_peer_shares').upsert(payload).select().single();
    if (data?.id) savedId = data.id;
  } catch {
    // ignore
  }

  return {
    id: savedId || `peer_${Date.now()}`,
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
