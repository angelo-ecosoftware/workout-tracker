import React from 'react';
import { Loader2, HardDriveDownload, HardDriveUpload } from 'lucide-react';

interface SettingsBackupSectionProps {
  isExporting: boolean;
  isImporting: boolean;
  onExport: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const SettingsBackupSection: React.FC<SettingsBackupSectionProps> = ({
  isExporting,
  isImporting,
  onExport,
  fileInputRef,
  onFileChange,
}) => {
  return (
    <div className="pt-2">
      <div className="text-[10px] font-mono uppercase tracking-wider text-gray-500 font-bold px-1 mb-2">
        Data Backup & Transfer
      </div>

      <div className="space-y-2">
        <button
          onClick={onExport}
          disabled={isExporting}
          className="flex items-center gap-2.5 w-full p-2.5 sm:p-3 bg-[#1a1a1a] border border-[#222] hover:border-[#333] rounded-xl text-left transition-colors disabled:opacity-50 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <HardDriveDownload className="w-4 h-4" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-xs sm:text-sm text-white flex items-center justify-between">
              <span>Save All Data & Routines</span>
              <span className="text-[10px] font-mono text-blue-400 font-normal">.JSON</span>
            </div>
            <div className="text-[11px] text-gray-400 line-clamp-1">
              Download routines, exercises, weigh-ins & workout history in one file
            </div>
          </div>
        </button>

        <input
          type="file"
          accept=".json"
          ref={fileInputRef}
          onChange={onFileChange}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting}
          className="flex items-center gap-2.5 w-full p-2.5 sm:p-3 bg-[#1a1a1a] border border-[#222] hover:border-[#333] rounded-xl text-left transition-colors disabled:opacity-50 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-[#C0FF00]/10 border border-[#C0FF00]/20 flex items-center justify-center text-[#C0FF00] shrink-0">
            {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <HardDriveUpload className="w-4 h-4" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-xs sm:text-sm text-white flex items-center justify-between">
              <span>Restore Data from File</span>
              <span className="text-[10px] font-mono text-[#C0FF00] font-normal">RESTORE</span>
            </div>
            <div className="text-[11px] text-gray-400 line-clamp-1">
              Load saved routines, exercises & workout history from backup
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};
