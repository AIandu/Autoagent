import React, { useState } from 'react';
import { Search, GitBranch, Star, AlertCircle, CheckCircle2, Clock, ShieldCheck, ChevronRight, Sparkles } from 'lucide-react';
import { RepositoryData } from '../types';

interface RepoSelectorProps {
  repositories: (Partial<RepositoryData> & { lastBuildState: any; hasDefect: boolean })[];
  selectedRepo: string;
  onSelectRepo: (fullName: string) => void;
  selectedOwner: string;
  onDisambiguateNotice?: (query: string) => void;
}

export const RepoSelector: React.FC<RepoSelectorProps> = ({
  repositories,
  selectedRepo,
  onSelectRepo,
  selectedOwner,
}) => {
  const [search, setSearch] = useState('');

  const filtered = repositories.filter((r) => {
    const matchesOwner = selectedOwner === 'ALL' || r.owner === selectedOwner;
    const matchesSearch =
      !search ||
      r.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase());
    return matchesOwner && matchesSearch;
  });

  // Check if current search query matches multiple repositories across different owners
  const multiOwnerMatches =
    search.trim().length > 1
      ? repositories.filter((r) => r.name?.toLowerCase().includes(search.toLowerCase().trim()))
      : [];
  const uniqueOwnersInSearch = Array.from(new Set(multiOwnerMatches.map((m) => m.owner)));
  const isAmbiguousQuery = uniqueOwnersInSearch.length > 1;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-3 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            Target Repository
            <span className="text-[11px] font-mono text-zinc-400 font-normal">
              ({filtered.length} available)
            </span>
          </h2>
          <p className="text-xs text-zinc-400">
            Select a project from <strong className="text-zinc-200">AIandu</strong> or <strong className="text-zinc-200">Dessiidoo</strong>
          </p>
        </div>

        {/* Search */}
        <div className="relative w-48 sm:w-60">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search projects (e.g. regina)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
      </div>

      {/* Disambiguation warning banner if typing "regina" in search box */}
      {isAmbiguousQuery && (
        <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-600/40 text-xs text-amber-200 flex items-center justify-between gap-2 animate-in fade-in duration-100">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
            <span>
              "{search.trim()}" exists in both <strong className="text-zinc-100">AIandu</strong> and <strong className="text-zinc-100">Dessiidoo</strong>. Notice owner tags below:
            </span>
          </div>
        </div>
      )}

      {/* Repository Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
        {filtered.map((repo) => {
          const isSelected = selectedRepo === repo.fullName;
          const isAIandu = repo.owner === 'AIandu';
          const isFailing = repo.lastBuildState?.status === 'failing' || repo.hasDefect;

          return (
            <button
              key={repo.fullName}
              onClick={() => onSelectRepo(repo.fullName!)}
              className={`text-left p-3 rounded-lg border transition-all relative flex flex-col justify-between group ${
                isSelected
                  ? 'bg-zinc-800/90 border-emerald-500 ring-1 ring-emerald-500/30'
                  : 'bg-zinc-950/60 border-zinc-800/80 hover:bg-zinc-800/50 hover:border-zinc-700'
              }`}
            >
              <div>
                {/* Header with Owner Tag & Defect Badge */}
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-medium ${
                      isAIandu
                        ? 'text-indigo-300 bg-indigo-950/80 border border-indigo-800/60'
                        : 'text-teal-300 bg-teal-950/80 border border-teal-800/60'
                    }`}
                  >
                    {repo.owner}
                  </span>

                  {isFailing ? (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-rose-400 bg-rose-950/60 border border-rose-800/60 px-1.5 py-0.5 rounded">
                      <AlertCircle className="w-2.5 h-2.5" />
                      Defect Detected
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.5 rounded">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      Passing
                    </span>
                  )}
                </div>

                {/* Repo Name */}
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-zinc-100 group-hover:text-emerald-400 transition-colors flex items-center gap-1">
                    <span>{repo.name}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">({repo.language})</span>
                  </h3>
                </div>

                <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                  {repo.description}
                </p>
              </div>

              {/* Footer with branch and selection indicator */}
              <div className="mt-3 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[10px] text-zinc-500">
                <span className="flex items-center gap-1 font-mono text-zinc-400">
                  <GitBranch className="w-3 h-3 text-zinc-500" />
                  {repo.currentBranch || repo.defaultBranch}
                </span>

                <span
                  className={`font-medium ${
                    isSelected ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-zinc-300'
                  }`}
                >
                  {isSelected ? 'Active Target' : 'Select'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
