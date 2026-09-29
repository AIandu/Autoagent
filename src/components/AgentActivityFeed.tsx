import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Terminal,
  ChevronDown,
  ChevronRight,
  GitBranch,
  Shield,
  FileCode,
  Search,
  BookOpen,
  Cpu,
  Layers,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { AgentStep } from '../types';

interface AgentActivityFeedProps {
  steps: AgentStep[];
  isAgentRunning: boolean;
  activeStepIndex: number;
}

export const AgentActivityFeed: React.FC<AgentActivityFeedProps> = ({
  steps,
  isAgentRunning,
  activeStepIndex,
}) => {
  const [expandedCommandId, setExpandedCommandId] = useState<string | null>(null);

  const toggleCommand = (id: string) => {
    setExpandedCommandId(expandedCommandId === id ? null : id);
  };

  const getPhaseIcon = (phase: AgentStep['phase'], status: AgentStep['status']) => {
    if (status === 'running') {
      return (
        <span className="w-5 h-5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin flex items-center justify-center" />
      );
    }
    if (status === 'error') {
      return <AlertCircle className="w-5 h-5 text-rose-400" />;
    }
    if (status === 'warning') {
      return <AlertCircle className="w-5 h-5 text-amber-400" />;
    }

    switch (phase) {
      case 'READING_MEMORY':
        return <BookOpen className="w-5 h-5 text-teal-400" />;
      case 'INSPECTING_CODEBASE':
        return <FileCode className="w-5 h-5 text-sky-400" />;
      case 'DIAGNOSING_ISSUES':
        return <Terminal className="w-5 h-5 text-amber-400" />;
      case 'WEB_RESEARCH':
        return <Search className="w-5 h-5 text-purple-400" />;
      case 'CREATING_BRANCH':
        return <GitBranch className="w-5 h-5 text-indigo-400" />;
      case 'PATCHING_CODE':
        return <Cpu className="w-5 h-5 text-cyan-400" />;
      case 'VERIFYING_TESTS':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'UPDATING_MEMORY':
        return <Layers className="w-5 h-5 text-emerald-300" />;
      default:
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl flex flex-col h-full">
      {/* Feed Header */}
      <div className="bg-zinc-950/80 px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-semibold text-zinc-100 uppercase tracking-wider">
            Autonomous Engineering Execution Stream
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {isAgentRunning ? (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Active Cycle
            </span>
          ) : steps.length > 0 ? (
            <span className="text-xs text-zinc-400 font-mono">
              {steps.filter((s) => s.status === 'success').length}/{steps.length} Steps Completed
            </span>
          ) : (
            <span className="text-xs text-zinc-500 font-mono">Idle • Awaiting Directive</span>
          )}
        </div>
      </div>

      {/* Feed Timeline */}
      <div className="p-4 flex-1 overflow-y-auto space-y-4 font-sans">
        {steps.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-zinc-500">
            <Cpu className="w-10 h-10 text-zinc-700 mb-3 animate-pulse" />
            <p className="text-sm font-medium text-zinc-400">Autonomous Agent is Ready</p>
            <p className="text-xs text-zinc-500 max-w-sm mt-1">
              Select a repository from AIandu or Dessiidoo and provide a prompt like "Fix Regina" to begin autonomous investigation and repair.
            </p>
          </div>
        ) : (
          steps.map((step, idx) => {
            const isCurrent = idx === activeStepIndex && isAgentRunning;
            const hasCommand = !!step.command;
            const isCommandOpen = expandedCommandId === step.id || isCurrent;

            return (
              <div
                key={step.id}
                className={`relative pl-8 pb-3 group transition-all ${
                  step.status === 'running' ? 'opacity-100' : 'opacity-95'
                }`}
              >
                {/* Connecting Line */}
                {idx < steps.length - 1 && (
                  <div
                    className={`absolute left-3.5 top-6 bottom-0 w-0.5 ${
                      step.status === 'success' ? 'bg-emerald-800/60' : 'bg-zinc-800'
                    }`}
                  />
                )}

                {/* Status Dot / Icon */}
                <div className="absolute left-1 top-0.5 bg-zinc-900 ring-4 ring-zinc-900 rounded-full">
                  {getPhaseIcon(step.phase, step.status)}
                </div>

                {/* Step Content Card */}
                <div
                  className={`rounded-lg border p-3 transition-all ${
                    isCurrent
                      ? 'bg-zinc-950 border-emerald-500/80 shadow-md ring-1 ring-emerald-500/20'
                      : step.status === 'error'
                      ? 'bg-rose-950/20 border-rose-800/60'
                      : 'bg-zinc-950/50 border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                        {step.phase.replace(/_/g, ' ')}
                      </span>
                      <h4 className="text-xs font-semibold text-zinc-100">{step.title}</h4>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500">
                      {new Date(step.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-300 mt-1.5 leading-relaxed font-sans">
                    {step.description}
                  </p>

                  {/* Defect Classification Badge if present */}
                  {step.defectType && (
                    <div
                      className={`mt-2 p-2 rounded border text-xs flex items-start gap-2 ${
                        step.defectType === 'REPOSITORY_CODE_DEFECT'
                          ? 'bg-amber-950/40 border-amber-600/40 text-amber-200'
                          : 'bg-indigo-950/40 border-indigo-600/40 text-indigo-200'
                      }`}
                    >
                      <Shield className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold font-mono text-[11px] uppercase tracking-wide">
                          Classification: {step.defectType.replace(/_/g, ' ')}
                        </div>
                        <p className="text-[11px] text-zinc-300 mt-0.5">
                          {step.defectExplanation}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Terminal Execution Toggle */}
                  {hasCommand && (
                    <div className="mt-2.5">
                      <button
                        type="button"
                        onClick={() => toggleCommand(step.id)}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-[11px] font-mono text-zinc-300 hover:bg-zinc-850 hover:text-zinc-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-300 font-semibold">$ {step.command}</span>
                          {step.commandExitCode !== undefined && (
                            <span
                              className={`text-[9px] px-1 rounded ${
                                step.commandExitCode === 0
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : 'bg-rose-950 text-rose-400 border border-rose-800'
                              }`}
                            >
                              exit {step.commandExitCode}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-zinc-500">
                          <span>{isCommandOpen ? 'Hide output' : 'Show output'}</span>
                          {isCommandOpen ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </div>
                      </button>

                      {isCommandOpen && step.commandOutput && (
                        <div className="mt-1 p-2.5 bg-black/90 border border-zinc-800 rounded font-mono text-[11px] text-zinc-300 overflow-x-auto whitespace-pre leading-snug">
                          {step.commandOutput}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Modified Files list if relevant */}
                  {step.modifiedFiles && step.modifiedFiles.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-zinc-800/80 flex items-center gap-2 text-[11px] text-zinc-400">
                      <span className="text-zinc-500">Modified:</span>
                      {step.modifiedFiles.map((f) => (
                        <span
                          key={f}
                          className="font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-1.5 py-0.5 rounded"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
