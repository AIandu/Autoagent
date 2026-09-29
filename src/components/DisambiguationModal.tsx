import React from 'react';
import { AlertTriangle, GitFork, ArrowRight, X, Layers, Code, Check } from 'lucide-react';
import { DisambiguationChoice } from '../types';

interface DisambiguationModalProps {
  isOpen: boolean;
  query: string;
  matches: DisambiguationChoice[];
  onSelect: (repo: DisambiguationChoice) => void;
  onClose: () => void;
}

export const DisambiguationModal: React.FC<DisambiguationModalProps> = ({
  isOpen,
  query,
  matches,
  onSelect,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-zinc-900 border border-amber-500/40 rounded-xl shadow-2xl overflow-hidden">
        {/* Header banner */}
        <div className="bg-amber-950/40 border-b border-amber-500/30 px-6 py-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                Ambiguous Repository Target
                <span className="text-xs font-mono font-normal text-amber-300 bg-amber-900/60 px-2 py-0.5 rounded border border-amber-700/50">
                  Multiple Owner Matches
                </span>
              </h3>
              <p className="text-xs text-zinc-300 mt-1">
                You referenced <span className="font-mono text-amber-200 font-semibold">"{query}"</span> without an owner prefix. Similarly named projects exist under both <strong className="text-zinc-100">AIandu</strong> and <strong className="text-zinc-100">Dessiidoo</strong>.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 p-1 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Comparison choices */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-zinc-400">
            To prevent modifying the wrong codebase, please choose the repository you want the agent to repair:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {matches.map((choice) => {
              const isAIandu = choice.owner === 'AIandu';
              return (
                <div
                  key={choice.fullName}
                  className={`group relative border rounded-xl p-4 flex flex-col justify-between transition-all hover:border-emerald-500/80 hover:bg-zinc-800/80 cursor-pointer ${
                    isAIandu
                      ? 'border-indigo-500/30 bg-indigo-950/10'
                      : 'border-teal-500/30 bg-teal-950/10'
                  }`}
                  onClick={() => onSelect(choice)}
                >
                  <div>
                    {/* Owner Badge */}
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-xs font-mono font-medium px-2 py-0.5 rounded border ${
                          isAIandu
                            ? 'text-indigo-300 bg-indigo-900/40 border-indigo-700/50'
                            : 'text-teal-300 bg-teal-900/40 border-teal-700/50'
                        }`}
                      >
                        Owner: {choice.owner}
                      </span>
                      <span className="text-xs text-zinc-400 flex items-center gap-1 font-mono">
                        <Code className="w-3 h-3" />
                        {choice.language}
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold text-zinc-100 group-hover:text-emerald-400 transition-colors">
                      {choice.fullName}
                    </h4>

                    <p className="text-xs text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                      {choice.description}
                    </p>

                    {/* Architecture Pill */}
                    {choice.architecture && (
                      <div className="mt-3 pt-3 border-t border-zinc-800/80">
                        <div className="flex items-start gap-1.5 text-[11px] text-zinc-300 font-mono">
                          <Layers className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{choice.architecture}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 flex items-center justify-between text-xs font-medium text-emerald-400">
                    <span>Select this repository</span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-lg bg-zinc-950/60 border border-zinc-800 p-3 text-[11px] text-zinc-400 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
            <span>
              <strong>Persistent Memory Rule:</strong> Each repository retains separate architecture records, defect logs, and branch checkpoints.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
