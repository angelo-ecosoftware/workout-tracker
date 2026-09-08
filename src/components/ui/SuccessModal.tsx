import React, { useEffect } from 'react';
import { Check, X } from 'lucide-react';

export interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  details?: string;
  actionText?: string;
  autoCloseMs?: number;
}

/**
 * Universal dynamic success modal for confirmation of updates, saves, and sync actions.
 * Highly responsive, dark athletic aesthetic, with auto-dismiss and keyboard dismissal.
 */
export const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  title = 'Successfully Updated',
  message = 'Your changes have been saved and applied.',
  details,
  actionText = 'Done',
  autoCloseMs = 2200,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    // Handle ESC key press
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Auto-close timer if specified
    let timer: NodeJS.Timeout | undefined;
    if (autoCloseMs && autoCloseMs > 0) {
      timer = setTimeout(() => {
        onClose();
      }, autoCloseMs);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timer) clearTimeout(timer);
    };
  }, [isOpen, onClose, autoCloseMs]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="success-modal-title"
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#121212] border border-[#C0FF00]/40 rounded-[28px] p-6 max-w-sm w-full shadow-[0_0_35px_rgba(192,255,0,0.18)] relative overflow-hidden flex flex-col items-center text-center animate-in zoom-in-95 duration-200"
      >
        {/* Subtle background glow */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#C0FF00]/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#C0FF00]/10 rounded-full blur-2xl pointer-events-none" />

        {/* Top Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close notification"
          className="absolute top-4 right-4 p-1.5 rounded-xl bg-[#1c1c1c] text-gray-400 hover:text-white border border-[#2a2a2a] transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Pulsing Success Badge */}
        <div className="w-14 h-14 rounded-2xl bg-[#C0FF00]/15 border border-[#C0FF00]/40 flex items-center justify-center text-[#C0FF00] shadow-[0_0_20px_rgba(192,255,0,0.25)] mb-4">
          <Check className="w-7 h-7 stroke-[3]" />
        </div>

        {/* Title */}
        <h3
          id="success-modal-title"
          className="font-display font-black text-lg text-white uppercase tracking-tight mb-1.5"
        >
          {title}
        </h3>

        {/* Message */}
        <p className="text-gray-300 text-xs font-sans leading-relaxed mb-3 max-w-[280px]">
          {message}
        </p>

        {/* Optional subtle details */}
        {details && (
          <div className="mb-4 px-2.5 py-1 rounded-lg bg-[#181818] border border-[#262626] text-[10px] font-mono text-gray-400">
            {details}
          </div>
        )}

        {/* Action Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 px-4 rounded-xl bg-[#C0FF00] hover:bg-[#a6dc00] text-black font-display font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md mt-1"
        >
          {actionText}
        </button>
      </div>
    </div>
  );
};
