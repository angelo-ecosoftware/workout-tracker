import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { X, Download, Upload, Trash2, LogOut, Loader2, AlertTriangle, Smartphone } from 'lucide-react';
import { exportAllLogs, deleteAllLogs, importAllLogs } from '../lib/firebaseData.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !user) return null;

  const handleInstallApp = async () => {
    if (window.deferredPrompt) {
      window.deferredPrompt.prompt();
      const { outcome } = await window.deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        window.deferredPrompt = null;
      }
    } else {
      alert("To install the app:\n\nOn iOS Safari: Tap the Share button at the bottom and select 'Add to Home Screen'.\n\nOn Android Chrome: Tap the menu (3 dots) and select 'Install app' or 'Add to Home screen'.");
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = await exportAllLogs(user.uid);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `workout_logs_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to export logs:', e);
      alert('Failed to export logs.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await importAllLogs(user.uid, data);
      alert('Logs imported successfully!');
      onClose();
      window.location.reload();
    } catch (err) {
      console.error('Failed to import logs:', err);
      alert('Failed to import logs. Please check the file format.');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await deleteAllLogs(user.uid);
      setShowConfirmReset(false);
      onClose();
      // Optionally reload the page to clear state
      window.location.reload();
    } catch (e) {
      console.error('Failed to reset logs:', e);
      alert('Failed to reset logs.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#111] border border-[#222] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
        <div className="flex items-center justify-between p-4 border-b border-[#222]">
          <h2 className="font-display font-black uppercase italic tracking-tight text-white">Settings</h2>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-[#222] rounded-xl text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-3">
          <button
            onClick={handleInstallApp}
            className="flex items-center gap-3 w-full p-3 bg-[#1a1a1a] border border-[#222] hover:border-[#333] rounded-xl text-left transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-sm text-white">Install App</div>
              <div className="text-xs text-gray-500">Add to your home screen for easy access</div>
            </div>
          </button>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-3 w-full p-3 bg-[#1a1a1a] border border-[#222] hover:border-[#333] rounded-xl text-left transition-colors disabled:opacity-50"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            </div>
            <div>
              <div className="font-bold text-sm text-white">Export all logs (JSON)</div>
              <div className="text-xs text-gray-500">Download your history as a JSON file</div>
            </div>
          </button>

          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="flex items-center gap-3 w-full p-3 bg-[#1a1a1a] border border-[#222] hover:border-[#333] rounded-xl text-left transition-colors disabled:opacity-50"
          >
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
              {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            </div>
            <div>
              <div className="font-bold text-sm text-white">Import logs (JSON)</div>
              <div className="text-xs text-gray-500">Restore your history from a JSON file</div>
            </div>
          </button>

          {!showConfirmReset ? (
            <button
              onClick={() => setShowConfirmReset(true)}
              className="flex items-center gap-3 w-full p-3 bg-[#1a1a1a] border border-[#222] hover:border-red-900/50 rounded-xl text-left transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-sm text-red-500">Reset all logs</div>
                <div className="text-xs text-gray-500">Permanently delete your entire history</div>
              </div>
            </button>
          ) : (
            <div className="p-3 bg-red-500/10 border border-red-900/50 rounded-xl flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-sm text-red-500 uppercase tracking-tight">Are you sure about that?</div>
                  <div className="text-xs text-red-400/80 mt-1">This will permanently delete all your sessions and sets. This cannot be undone.</div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={() => setShowConfirmReset(false)}
                  disabled={isResetting}
                  className="flex-1 py-2 bg-transparent border border-red-900/50 text-red-400 text-xs font-bold rounded-lg hover:bg-red-900/20 transition-colors uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReset}
                  disabled={isResetting}
                  className="flex-1 py-2 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-colors uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  {isResetting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yes, Delete'}
                </button>
              </div>
            </div>
          )}

          <div className="h-px bg-[#222] my-1" />

          <button
            onClick={() => {
              onClose();
              logout();
            }}
            className="flex items-center justify-center gap-2 w-full p-3 bg-[#1a1a1a] border border-[#222] hover:bg-neutral-900 rounded-xl text-gray-300 transition-colors font-bold text-sm uppercase tracking-wider mt-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};
