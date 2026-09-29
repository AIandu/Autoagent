import React, { useState } from 'react';
import { X, Key, Shield, Check, Lock, ExternalLink, RefreshCw } from 'lucide-react';
import { GitHubAccount } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: GitHubAccount[];
  token: string;
  onSaveToken: (token: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  accounts,
  token,
  onSaveToken,
}) => {
  const [inputVal, setInputVal] = useState(token);
  const [showSecret, setShowSecret] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveToken(inputVal.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  const handleClear = () => {
    setInputVal('');
    onSaveToken('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-zinc-950 px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-zinc-100">
              GitHub Credentials & Safety Policies
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 p-1 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Managed Owners */}
          <div>
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wide block mb-2">
              Configured GitHub Owners
            </label>
            <div className="grid grid-cols-2 gap-3">
              {accounts.map((acc) => (
                <div
                  key={acc.username}
                  className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center gap-3"
                >
                  <img
                    src={acc.avatarUrl}
                    alt={acc.name}
                    className="w-8 h-8 rounded-full border border-zinc-700 object-cover"
                  />
                  <div className="truncate">
                    <span className="text-xs font-semibold text-zinc-100 block truncate">
                      {acc.username}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {acc.repoCount} repositories
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* GitHub PAT input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Personal Access Token (PAT)
              </label>
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="text-[11px] text-emerald-400 hover:underline"
              >
                {showSecret ? 'Hide Token' : 'Reveal Token'}
              </button>
            </div>
            <div className="relative">
              <input
                type={showSecret ? 'text' : 'password'}
                placeholder="ghp_************************************"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <p className="text-[11px] text-zinc-500 mt-1.5 leading-relaxed">
              Required scopes: <code className="text-zinc-400">repo</code> (Full control of private repositories) and <code className="text-zinc-400">workflow</code> (GitHub Actions). When omitted, agent runs against local repository sandbox with simulated GitHub push.
            </p>
          </div>

          {/* Safety rules checklist */}
          <div className="p-3.5 rounded-lg bg-zinc-950/80 border border-zinc-800 space-y-2">
            <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              Safety & Secret Sanitization Guardrails
            </span>
            <ul className="text-[11px] text-zinc-400 space-y-1.5 pl-1">
              <li className="flex items-center gap-2">
                <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Never erase or rewrite functioning project architecture.</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Automatic secret scrubbing: all tokens, keys, and secrets are redacted from logs and commits.</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Execution Failure Rule: Halts retry loops if sandbox blocks external network or system sockets.</span>
              </li>
            </ul>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-zinc-500 hover:text-rose-400 transition-colors"
            >
              Clear Token
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-zinc-950 transition-colors flex items-center gap-1.5"
              >
                {savedSuccess && <Check className="w-3.5 h-3.5" />}
                <span>{savedSuccess ? 'Saved' : 'Save Configuration'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
