import React from 'react';
import { GitBranch, Shield, Key, Terminal, Cpu } from 'lucide-react';
import { GitHubAccount } from '../types';

interface HeaderProps {
  accounts: GitHubAccount[];
  selectedOwner: string;
  onSelectOwner: (owner: string) => void;
  onOpenSettings: () => void;
  hasCustomToken: boolean;
  isAgentRunning: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  accounts,
  selectedOwner,
  onSelectOwner,
  onOpenSettings,
  hasCustomToken,
  isAgentRunning,
}) => {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-30 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 flex items-center justify-center text-zinc-950 shadow-lg shadow-emerald-500/20">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-100 tracking-tight text-base">
                RepoMaintainer
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-mono font-medium uppercase tracking-wide bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 rounded">
                Autonomous
              </span>
              {isAgentRunning && (
                <span className="flex items-center gap-1.5 px-2 py-0.5 text-xs text-amber-300 bg-amber-950/60 border border-amber-800/60 rounded-full animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  Repairing...
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400">
              Persistent engineering agent for <strong className="text-zinc-200">AIandu</strong> & <strong className="text-zinc-200">Dessiidoo</strong>
            </p>
          </div>
        </div>

        {/* Dual Account Selectors & Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Account Filter Pills */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => onSelectOwner('ALL')}
              className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                selectedOwner === 'ALL'
                  ? 'bg-zinc-800 text-zinc-100 shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All Owners
            </button>
            {accounts.map((acc) => (
              <button
                key={acc.username}
                onClick={() => onSelectOwner(acc.username)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all font-medium ${
                  selectedOwner === acc.username
                    ? 'bg-zinc-800 text-emerald-400 shadow'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
                <span>{acc.username}</span>
                <span className="text-[10px] text-zinc-500 font-mono">({acc.repoCount})</span>
              </button>
            ))}
          </div>

          {/* GitHub Token / Settings Trigger */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 transition-colors"
            title="GitHub Personal Access Token & Sandbox Configuration"
          >
            <Key className="w-3.5 h-3.5 text-zinc-400" />
            <span>GitHub PAT</span>
            {hasCustomToken ? (
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            ) : (
              <span className="text-[10px] text-zinc-500 bg-zinc-800 px-1 rounded">Dev Mode</span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
