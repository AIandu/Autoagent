import React, { useState } from 'react';
import { Play, Sparkles, AlertTriangle, ShieldCheck, Terminal, ArrowRight, Wrench } from 'lucide-react';

interface GoalInputProps {
  onRunGoal: (goal: string) => void;
  isRunning: boolean;
  selectedRepo: string;
}

export const GoalInput: React.FC<GoalInputProps> = ({
  onRunGoal,
  isRunning,
  selectedRepo,
}) => {
  const [goal, setGoal] = useState('Fix this repository and make all tests pass');

  const QUICK_PROMPTS = [
    { label: 'Fix Regina', prompt: 'Fix Regina' },
    { label: "Find what's wrong", prompt: "Find what's wrong" },
    { label: 'Repair this repository', prompt: 'Repair this repository' },
    { label: 'Get this working', prompt: 'Get this working' },
    { label: 'Fix this', prompt: 'Fix this.' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim() || isRunning) return;
    onRunGoal(goal.trim());
  };

  return (
    <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-xl p-4 shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              Autonomous Engineer Directive
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.5 rounded">
                Full Hands-On Mode
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Target: <span className="font-mono text-zinc-200 font-semibold">{selectedRepo || 'None selected'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-zinc-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Creates safe git branch • Distinguishes environment vs code defects</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="relative">
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            disabled={isRunning}
            rows={2}
            placeholder="Tell the agent what to do (e.g. 'Fix Regina', 'Find what's wrong', 'Repair this repository')..."
            className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 resize-none font-mono transition-all"
          />

          <button
            type="submit"
            disabled={isRunning || !goal.trim()}
            className={`absolute right-2.5 bottom-3.5 px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shadow-md ${
              isRunning
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-zinc-950 hover:shadow-emerald-500/20 cursor-pointer'
            }`}
          >
            {isRunning ? (
              <>
                <span className="w-3 h-3 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                <span>Running Repair Cycle...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Deploy Autonomous Agent</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[11px] text-zinc-500 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Quick directives:
          </span>
          {QUICK_PROMPTS.map((item) => (
            <button
              key={item.label}
              type="button"
              disabled={isRunning}
              onClick={() => {
                setGoal(item.prompt);
                onRunGoal(item.prompt);
              }}
              className="px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-emerald-300 border border-zinc-700/60 transition-colors"
            >
              "{item.label}"
            </button>
          ))}
        </div>
      </form>
    </div>
  );
};
