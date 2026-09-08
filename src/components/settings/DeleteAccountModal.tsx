import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Trash2,
  X,
  Loader2,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { executeGdprAccountPurge } from '../../lib/accountDeletionService.ts';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail?: string;
  onAccountDeleted?: () => void;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isOpen,
  onClose,
  userId,
  userEmail,
  onAccountDeleted,
}) => {
  const [countdown, setCountdown] = useState<number>(5);
  const [confirmationInput, setConfirmationInput] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState<boolean>(false);

  // Required confirmation phrase
  const expectedPhrase = 'PERMANENTLY DELETE';
  const isPhraseMatching = confirmationInput.trim().toUpperCase() === expectedPhrase;
  const isButtonEnabled = countdown === 0 && isPhraseMatching && !isDeleting;

  // 5-second safety timer on open
  useEffect(() => {
    if (!isOpen) return;

    setCountdown(5);
    setConfirmationInput('');
    setIsDeleting(false);
    setErrorMsg(null);
    setIsComplete(false);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDelete = async () => {
    if (!isButtonEnabled) return;

    setIsDeleting(true);
    setErrorMsg(null);

    const result = await executeGdprAccountPurge(userId);

    if (result.success) {
      setIsComplete(true);
      setTimeout(() => {
        if (onAccountDeleted) {
          onAccountDeleted();
        } else {
          window.location.href = '/';
        }
      }, 2000);
    } else {
      setIsDeleting(false);
      setErrorMsg(result.error || 'Failed to erase account. Please try again.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-account-title"
      onClick={isDeleting ? undefined : onClose}
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#111111] border border-red-500/40 rounded-[28px] p-6 max-w-md w-full shadow-[0_0_50px_rgba(239,68,68,0.2)] relative overflow-hidden flex flex-col text-left animate-in zoom-in-95 duration-200"
      >
        {/* Glow accent */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-red-600/15 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[#222222] mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-500 shrink-0 shadow-sm">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-400 block">
                GDPR Article 17
              </span>
              <h3
                id="delete-account-title"
                className="font-display font-black text-lg text-white uppercase tracking-tight"
              >
                Right to be Forgotten
              </h3>
            </div>
          </div>

          {!isDeleting && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="p-1.5 rounded-xl bg-[#1c1c1c] text-gray-400 hover:text-white border border-[#2a2a2a] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {isComplete ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="font-display font-black text-lg text-white uppercase tracking-tight">
              Account Permanently Erased
            </h4>
            <p className="text-gray-400 text-xs font-sans max-w-xs mx-auto">
              All personal records, workout logs, biometrics, and photos have been purged. Redirecting...
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Warning Box */}
            <div className="bg-red-950/20 border border-red-500/30 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-red-400 uppercase tracking-wide">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Irreversible Permanent Cascade</span>
              </div>
              <p className="text-xs text-gray-300 font-sans leading-relaxed">
                This will permanently delete your account, routines, workout history, sets, weight & BMI biometrics, progress photos, coach links, and dietary logs.
              </p>
              {userEmail && (
                <div className="text-[11px] font-mono text-gray-400 pt-1">
                  Target Account: <span className="text-white font-bold">{userEmail}</span>
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="bg-red-500/15 border border-red-500/40 rounded-xl p-3 text-xs text-red-300 font-mono">
                {errorMsg}
              </div>
            )}

            {/* Type Confirmation Input */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono text-gray-300 font-bold">
                To confirm, type <span className="text-red-400 font-black tracking-wider select-all">{expectedPhrase}</span> below:
              </label>
              <input
                type="text"
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                disabled={isDeleting}
                placeholder={expectedPhrase}
                className="w-full bg-[#181818] border border-[#333] focus:border-red-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none font-mono font-bold tracking-wider"
              />
            </div>

            {/* Safety countdown status */}
            {countdown > 0 && (
              <div className="flex items-center justify-center gap-1.5 text-xs font-mono text-amber-400/90 py-1">
                <Clock className="w-3.5 h-3.5 animate-pulse" />
                <span>Safety lock active: wait {countdown}s...</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl border border-[#333] text-gray-400 hover:text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={!isButtonEnabled}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-display font-black text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Erasing Data...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Erase All Data</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
