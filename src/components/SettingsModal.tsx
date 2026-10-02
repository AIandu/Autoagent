import React, { useState } from 'react';
import { X, Key, Shield, Check, Lock, ExternalLink, RefreshCw, AlertCircle, CheckCircle2, UserCheck } from 'lucide-react';
import { GitHubAccount } from '../types';
import { api } from '../services/api';

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
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{
    tested: boolean;
    valid?: boolean;
    username?: string;
    scopes?: string[];
    hasRepoScope?: boolean;
    error?: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleTestToken = async () => {
    if (!inputVal.trim()) {
      setVerifyResult({ tested: true, valid: false, error: 'Please enter a token first.' });
      return;
    }
    setIsVerifying(true);
    setVerifyResult(null);
    try {
      const res = await api.verifyGitHubToken(inputVal.trim());
      if (res.valid) {
        setVerifyResult({
          tested: true,
          valid: true,
          username: res.user?.login,
          scopes: res.scopes,
          hasRepoScope: res.hasRepoScope,
        });
      } else {
        setVerifyResult({
          tested: true,
          valid: false,
          error: res.error || 'Token invalid or expired',
        });
      }
    } catch (err: any) {
      setVerifyResult({
        tested: true,
        valid: false,
        error: err.message || 'Failed to connect to GitHub API',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveToken(inputVal.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleClear = () => {
    setInputVal('');
    onSaveToken('');
    setVerifyResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-zinc-950 px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-zinc-100">
              GitHub Credentials & Remote Push Setup
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
              Managed GitHub Accounts
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
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="text-[11px] text-emerald-400 hover:underline"
                >
                  {showSecret ? 'Hide Token' : 'Reveal Token'}
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showSecret ? 'text' : 'password'}
                  placeholder="ghp_************************************"
                  value={inputVal}
                  onChange={(e) => {
                    setInputVal(e.target.value);
                    setVerifyResult(null);
                  }}
                  className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="button"
                onClick={handleTestToken}
                disabled={isVerifying || !inputVal.trim()}
                className="px-3 py-2 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-750 disabled:bg-zinc-900 disabled:text-zinc-600 text-zinc-200 border border-zinc-700 transition-colors flex items-center gap-1.5 shrink-0"
              >
                {isVerifying ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                ) : (
                  <UserCheck className="w-3.5 h-3.5" />
                )}
                <span>{isVerifying ? 'Verifying...' : 'Test Connection'}</span>
              </button>
            </div>

            {/* Test result feedback */}
            {verifyResult && (
              <div className="mt-2.5">
                {verifyResult.valid ? (
                  <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-xs text-emerald-200 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">GitHub Connection Confirmed!</span>
                      <p className="text-[11px] text-zinc-300 mt-0.5">
                        Authenticated as <strong className="text-emerald-300">@{verifyResult.username}</strong>. Scopes: <code className="font-mono text-zinc-400">{verifyResult.scopes?.join(', ') || 'none'}</code>.
                        {!verifyResult.hasRepoScope && (
                          <span className="text-amber-300 block mt-1">
                            Warning: Token is missing the 'repo' scope. Pushing branches and PRs may fail without 'repo' permission.
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-800/80 text-xs text-rose-200 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Authentication Failed</span>
                      <p className="text-[11px] text-rose-300/90 mt-0.5">
                        {verifyResult.error}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed">
              Required permission: <code className="text-zinc-300 bg-zinc-800 px-1 py-0.5 rounded font-mono">repo</code> (Full control of private repositories) to allow the agent to create branches and open Pull Requests directly on GitHub.
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
                <span>Never claims a push or pull request completed unless GitHub API returns 201 Created.</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Automatic secret scrubbing: all tokens, keys, and secrets are redacted from logs and commits.</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Always operates on dedicated isolated branches (`repair/...`) before pushing.</span>
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
