import React, { FormEvent, useState } from 'react';
import { Loader2, Send, X } from 'lucide-react';

interface GeminiHelloModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GeminiHelloModal: React.FC<GeminiHelloModalProps> = ({ isOpen, onClose }) => {
  const [input, setInput] = useState('Hello world');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSending(true);
    setOutput('');
    setError('');

    try {
      const response = await fetch('/api/gemini-hello', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });
      const data = await response.json() as { output?: string; error?: string };
      if (!response.ok) throw new Error(data.error || 'Gemini request failed');
      setOutput(data.output || '');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Gemini request failed');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gemini-hello-title"
    >
      <div className="w-full max-w-lg rounded-[24px] border border-[#2b2b2b] bg-[#111] p-5 text-left shadow-2xl sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#C0FF00]">
              Gemini test
            </p>
            <h2 id="gemini-hello-title" className="font-display text-xl font-black italic uppercase text-white">
              Say hello to Gemini
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Gemini test"
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">
              Input
            </span>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              rows={3}
              className="w-full resize-y rounded-xl border border-[#333] bg-[#181818] p-3 text-sm text-white outline-none transition-colors focus:border-[#C0FF00]"
              placeholder="Hello world"
            />
          </label>

          <button
            type="submit"
            disabled={isSending || !input.trim()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#C0FF00] px-4 py-3 text-xs font-black uppercase tracking-wider text-black transition-colors hover:bg-[#a6dc00] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {isSending ? 'Sending…' : 'Send'}
          </button>
        </form>

        {(output || error) && (
          <div className="mt-5">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">
              Output
            </p>
            <div className={`rounded-xl border p-3 text-sm whitespace-pre-wrap ${
              error ? 'border-red-500/30 bg-red-500/10 text-red-200' : 'border-[#333] bg-[#181818] text-gray-200'
            }`}>
              {error || output}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
