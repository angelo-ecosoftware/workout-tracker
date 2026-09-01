import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'danger' | 'primary';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  description,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary'
}) => {
  if (!isOpen) return null;

  const confirmBtnClass = confirmVariant === 'danger' 
    ? 'bg-red-500 hover:bg-red-600 text-white' 
    : 'bg-[#C0FF00] hover:bg-[#a0d600] text-black';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#111] border border-[#222] rounded-[24px] p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <h3 className="font-display font-black text-xl text-white uppercase tracking-tight mb-2">
          {title}
        </h3>
        <p className="text-gray-400 text-sm font-sans mb-6 leading-relaxed">
          {description}
        </p>
        
        <div className="flex items-center justify-end space-x-3">
          <button 
            onClick={onCancel}
            className="px-4 py-2 text-sm font-sans font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-wide"
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-sans font-bold rounded-xl transition-colors uppercase tracking-wide ${confirmBtnClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
