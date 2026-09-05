import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  Globe,
  Lock,
  X,
  Check,
  CheckCheck,
  Loader2,
  Users,
  Plus,
  Trash2,
  Info,
} from 'lucide-react';
import { UserPrivacySettings, UserPeerShare } from '../../models.ts';
import {
  fetchUserPrivacySettings,
  updateUserPrivacySettings,
  fetchUserPeerShares,
  saveUserPeerShare,
  deleteUserPeerShare,
} from '../../lib/supabaseData.ts';

interface PrivacySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export const PrivacySettingsModal: React.FC<PrivacySettingsModalProps> = ({
  isOpen,
  onClose,
  userId,
}) => {
  const [settings, setSettings] = useState<UserPrivacySettings>({
    userId,
    isPublicProfile: false,
    shareWorkouts: true,
    shareBiometrics: false,
    shareDietary: false,
    sharePhotos: false,
    shareReviewReceipts: true,
  });

  const [peerShares, setPeerShares] = useState<UserPeerShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New peer share form
  const [isAddingPeer, setIsAddingPeer] = useState(false);
  const [newPeerName, setNewPeerName] = useState('');
  const [newPeerId, setNewPeerId] = useState('');
  const [peerShareWorkouts, setPeerShareWorkouts] = useState(true);
  const [peerShareBiometrics, setPeerShareBiometrics] = useState(false);
  const [peerShareDietary, setPeerShareDietary] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      loadPrivacyData();
      setIsAddingPeer(false);
      setStatusMsg(null);
    }
  }, [isOpen, userId]);

  const loadPrivacyData = async () => {
    try {
      setLoading(true);
      const [privData, peers] = await Promise.all([
        fetchUserPrivacySettings(userId),
        fetchUserPeerShares(userId),
      ]);
      setSettings(privData);
      setPeerShares(peers);
    } catch (err: unknown) {
      console.error('Failed to load privacy settings:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleToggleSetting = async (key: keyof UserPrivacySettings) => {
    if (key === 'userId' || key === 'createdAt' || key === 'updatedAt') return;
    const newVal = !settings[key];
    const updated = { ...settings, [key]: newVal };
    setSettings(updated);

    try {
      setIsSaving(true);
      await updateUserPrivacySettings(userId, { [key]: newVal });
      setStatusMsg({ type: 'success', text: 'Privacy settings updated.' });
      setTimeout(() => setStatusMsg(null), 2500);
    } catch (err: unknown) {
      console.error('Failed to update privacy setting:', err);
      setStatusMsg({ type: 'error', text: 'Could not save setting.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddPeerShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPeerName.trim()) {
      setStatusMsg({ type: 'error', text: 'Please enter a training partner name.' });
      return;
    }

    try {
      setIsSaving(true);
      const targetGranteeId = newPeerId.trim() || `peer_user_${Date.now()}`;
      const savedPeer = await saveUserPeerShare(userId, targetGranteeId, newPeerName.trim(), {
        shareWorkouts: peerShareWorkouts,
        shareBiometrics: peerShareBiometrics,
        shareDietary: peerShareDietary,
      });

      setPeerShares((prev) => [...prev, savedPeer]);
      setIsAddingPeer(false);
      setNewPeerName('');
      setNewPeerId('');
      setStatusMsg({ type: 'success', text: `Access granted to ${savedPeer.granteeName}!` });
    } catch (err: unknown) {
      setStatusMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to grant peer access.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePeer = async (shareId: string, name?: string) => {
    try {
      await deleteUserPeerShare(shareId);
      setPeerShares((prev) => prev.filter((p) => p.id !== shareId));
      setStatusMsg({ type: 'success', text: `Revoked access for ${name || 'training partner'}.` });
    } catch (err: unknown) {
      console.error('Failed to delete peer share:', err);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#111111] border border-[#222222] rounded-[24px] w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#222] bg-[#141414]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#C0FF00]/10 border border-[#C0FF00]/20 flex items-center justify-center text-[#C0FF00]">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-black uppercase italic tracking-tight text-white text-base sm:text-lg">
                Privacy & Visibility Settings
              </h2>
              <p className="text-[10px] font-mono text-gray-400">
                Manage public profile visibility, peer sharing & coach overrides
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#222] rounded-xl text-gray-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close privacy settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Toast */}
        {statusMsg && (
          <div
            className={`mx-4 mt-4 p-3 rounded-xl flex items-center gap-2 text-xs font-mono font-bold ${
              statusMsg.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                : 'bg-red-500/10 border border-red-500/30 text-red-400'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <Check className="w-4 h-4 shrink-0" />
            ) : (
              <X className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Section 1: Public Profile Toggle */}
          <div className="p-4 rounded-2xl bg-[#161616] border border-[#282828] space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="p-2 rounded-xl bg-[#222] text-gray-300">
                  {settings.isPublicProfile ? (
                    <Globe className="w-4 h-4 text-[#C0FF00]" />
                  ) : (
                    <Lock className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                <div>
                  <h4 className="text-white text-xs sm:text-sm font-bold uppercase tracking-wide">
                    Public Profile
                  </h4>
                  <p className="text-[11px] text-gray-400 font-sans mt-0.5">
                    {settings.isPublicProfile
                      ? 'Your profile is accessible via public share links.'
                      : 'Your profile is strictly private. Only connected coaches can view.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleToggleSetting('isPublicProfile')}
                disabled={isSaving}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.isPublicProfile ? 'bg-[#C0FF00]' : 'bg-[#2a2a2a]'
                }`}
                aria-label="Toggle public profile"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out ${
                    settings.isPublicProfile ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Granular Module Visibility (When Public is ON) */}
            {settings.isPublicProfile && (
              <div className="pt-3 border-t border-[#222] space-y-2.5 animate-in fade-in duration-150">
                <span className="text-[10px] font-mono uppercase font-bold text-gray-400 tracking-wider block mb-1">
                  Granular Public Module Visibility
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#121212] border border-[#252525] text-xs text-gray-300 cursor-pointer">
                    <span>Workout History & Volume</span>
                    <input
                      type="checkbox"
                      checked={settings.shareWorkouts}
                      onChange={() => handleToggleSetting('shareWorkouts')}
                      className="accent-[#C0FF00] w-4 h-4"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#121212] border border-[#252525] text-xs text-gray-300 cursor-pointer">
                    <span>Bodyweight & BMI Matrix</span>
                    <input
                      type="checkbox"
                      checked={settings.shareBiometrics}
                      onChange={() => handleToggleSetting('shareBiometrics')}
                      className="accent-[#C0FF00] w-4 h-4"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#121212] border border-[#252525] text-xs text-gray-300 cursor-pointer">
                    <span>Dietary & Macro Logs</span>
                    <input
                      type="checkbox"
                      checked={settings.shareDietary}
                      onChange={() => handleToggleSetting('shareDietary')}
                      className="accent-[#C0FF00] w-4 h-4"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#121212] border border-[#252525] text-xs text-gray-300 cursor-pointer">
                    <span>Progress Photos</span>
                    <input
                      type="checkbox"
                      checked={settings.sharePhotos}
                      onChange={() => handleToggleSetting('sharePhotos')}
                      className="accent-[#C0FF00] w-4 h-4"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Coach Override Guarantee Notice */}
          <div className="p-4 rounded-2xl bg-[#0e1726] border border-[#1e3a8a]/40 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-[#3b82f6]/20 text-[#60a5fa] shrink-0 mt-0.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h4 className="text-[#93c5fd] font-display font-bold text-xs uppercase tracking-wider">
                Coach Handshake Security Guarantee
              </h4>
              <p className="text-[11px] text-gray-300 leading-relaxed font-sans">
                Coaches with an accepted connection automatically have full visibility into your workouts, recovery, biometrics, and nutrition to guide your program, regardless of public visibility settings.
              </p>
            </div>
          </div>

          {/* Section 2.5: Workout Review Receipts / Seen Status Toggle */}
          <div className="p-4 rounded-2xl bg-[#161616] border border-[#282828] space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="p-2 rounded-xl bg-sky-950/60 border border-sky-800/40 text-sky-400">
                  <CheckCheck className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="text-white text-xs sm:text-sm font-bold uppercase tracking-wide">
                    Workout Review Receipts (Seen Status)
                  </h4>
                  <p className="text-[11px] text-gray-400 font-sans mt-0.5">
                    {settings.shareReviewReceipts !== false
                      ? 'Enabled: You and your coach see when workouts are checked ("You reviewed this log" / "Checked by Coach").'
                      : 'Disabled: Review status is completely private. Neither party will see read receipts.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleToggleSetting('shareReviewReceipts')}
                disabled={isSaving}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.shareReviewReceipts !== false ? 'bg-[#C0FF00]' : 'bg-[#2a2a2a]'
                }`}
                aria-label="Toggle workout review receipts"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out ${
                    settings.shareReviewReceipts !== false ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Section 3: Selective Peer Sharing (Athlete-to-Athlete) */}
          <div className="p-4 rounded-2xl bg-[#161616] border border-[#282828] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#C0FF00]" />
                <h4 className="text-white text-xs sm:text-sm font-bold uppercase tracking-wide">
                  Selective Peer Sharing ({peerShares.length})
                </h4>
              </div>

              {!isAddingPeer && (
                <button
                  type="button"
                  onClick={() => setIsAddingPeer(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#222] hover:bg-[#333] text-gray-200 text-xs font-mono font-bold transition-all cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Add Partner
                </button>
              )}
            </div>

            {isAddingPeer && (
              <form
                onSubmit={handleAddPeerShare}
                className="p-3 rounded-xl bg-[#111] border border-[#333] space-y-3"
              >
                <div className="flex items-center justify-between pb-1 border-b border-[#222]">
                  <span className="text-[11px] font-mono font-bold text-[#C0FF00] uppercase">
                    Grant Access to Training Partner
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddingPeer(false)}
                    className="text-gray-500 hover:text-white text-xs font-mono"
                  >
                    Cancel
                  </button>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-mono text-gray-400 font-bold block mb-1">
                    Partner Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Marcus Rivera"
                    value={newPeerName}
                    onChange={(e) => setNewPeerName(e.target.value)}
                    className="w-full bg-[#181818] border border-[#333] focus:border-[#C0FF00] rounded-lg px-3 py-1.5 text-xs text-white outline-none"
                    required
                  />
                </div>

                <div className="space-y-1 pt-1">
                  <span className="text-[10px] font-mono text-gray-400 font-bold uppercase block">
                    Granted Modules:
                  </span>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-300">
                    <label className="flex items-center gap-1.5 bg-[#181818] px-2.5 py-1 rounded-lg border border-[#282828] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={peerShareWorkouts}
                        onChange={(e) => setPeerShareWorkouts(e.target.checked)}
                        className="accent-[#C0FF00]"
                      />
                      <span>Workouts</span>
                    </label>

                    <label className="flex items-center gap-1.5 bg-[#181818] px-2.5 py-1 rounded-lg border border-[#282828] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={peerShareBiometrics}
                        onChange={(e) => setPeerShareBiometrics(e.target.checked)}
                        className="accent-[#C0FF00]"
                      />
                      <span>Biometrics</span>
                    </label>

                    <label className="flex items-center gap-1.5 bg-[#181818] px-2.5 py-1 rounded-lg border border-[#282828] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={peerShareDietary}
                        onChange={(e) => setPeerShareDietary(e.target.checked)}
                        className="accent-[#C0FF00]"
                      />
                      <span>Dietary</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-3 py-1.5 rounded-lg bg-[#C0FF00] text-black font-display font-black text-xs uppercase tracking-wider"
                  >
                    Grant Access
                  </button>
                </div>
              </form>
            )}

            {peerShares.length === 0 ? (
              <p className="text-xs text-gray-500 font-sans py-2">
                No specific athlete friends granted selective access yet.
              </p>
            ) : (
              <div className="space-y-2 pt-1">
                {peerShares.map((peer) => (
                  <div
                    key={peer.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#121212] border border-[#252525]"
                  >
                    <div>
                      <span className="font-bold text-white text-xs block">
                        {peer.granteeName || 'Training Partner'}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-gray-400 mt-0.5">
                        {peer.shareWorkouts && <span>• Workouts</span>}
                        {peer.shareBiometrics && <span>• Biometrics</span>}
                        {peer.shareDietary && <span>• Dietary</span>}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeletePeer(peer.id, peer.granteeName)}
                      className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                      aria-label="Revoke partner access"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
