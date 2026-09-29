import React, { useState } from 'react';
import { Terminal, Play, AlertTriangle, ShieldCheck, CheckCircle2, RotateCcw, Bug } from 'lucide-react';
import { DefectType, TerminalExecutionResult } from '../types';

interface TerminalSandboxProps {
  repoKey: string;
  isFixed: boolean;
  onExecute: (cmd: string) => Promise<TerminalExecutionResult>;
}

export const TerminalSandbox: React.FC<TerminalSandboxProps> = ({
  repoKey,
  isFixed,
  onExecute,
}) => {
  const [commandInput, setCommandInput] = useState(
    repoKey.includes('Dessiidoo') ? 'pytest tests/' : 'npm test'
  );
  const [history, setHistory] = useState<TerminalExecutionResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runCommand = async (cmdToRun: string) => {
    if (!cmdToRun.trim() || isRunning) return;
    setIsRunning(true);
    try {
      const res = await onExecute(cmdToRun.trim());
      setHistory((prev) => [res, ...prev]);
    } catch (err: any) {
      setHistory((prev) => [
        {
          command: cmdToRun,
          exitCode: 1,
          stdout: '',
          stderr: err?.message || 'Execution failed',
          durationMs: 50,
          defectClassification: 'SANDBOX_ENVIRONMENT_LIMITATION',
          defectAnalysis: 'Execution error occurred in sandbox wrapper.',
        },
        ...prev,
      ]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runCommand(commandInput);
  };

  const QUICK_COMMANDS = repoKey.includes('Dessiidoo')
    ? [
        { label: 'pytest tests/', cmd: 'pytest tests/', desc: 'Run Python test suite' },
        { label: 'git status', cmd: 'git status', desc: 'Inspect working tree' },
        {
          label: 'Test Sandbox Limit (docker)',
          cmd: 'docker run --rm test-runner',
          desc: 'Demonstrate sandbox limitation detection',
        },
      ]
    : [
        { label: 'npm test', cmd: 'npm test', desc: 'Run Jest test suite' },
        { label: 'npm run build', cmd: 'npm run build', desc: 'Run TypeScript compiler' },
        { label: 'npm run lint', cmd: 'npm run lint', desc: 'Check code style' },
        {
          label: 'Test Sandbox Limit (docker)',
          cmd: 'docker build -t regina .',
          desc: 'Demonstrate sandbox limitation detection',
        },
      ];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl flex flex-col h-full">
      {/* Header */}
      <div className="bg-zinc-950/80 px-4 py-3 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-semibold text-zinc-100 uppercase tracking-wider">
            Repository Command Runner & Sandbox Verifier
          </h3>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
          <span>Sandbox:</span>
          <span className="text-zinc-200 bg-zinc-800 px-1.5 py-0.5 rounded">{repoKey}</span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] ${
              isFixed ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'
            }`}
          >
            {isFixed ? 'Patched State' : 'Unpatched State'}
          </span>
        </div>
      </div>

      {/* Terminal Command Input Form */}
      <div className="p-3 bg-zinc-950/50 border-b border-zinc-800">
        <form onSubmit={handleFormSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-xs select-none">
              $
            </span>
            <input
              type="text"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              placeholder="Enter terminal command (npm test, pytest, git status)..."
              disabled={isRunning}
              className="w-full pl-7 pr-3 py-2 text-xs bg-zinc-900 border border-zinc-700/80 rounded-lg font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={isRunning || !commandInput.trim()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 text-zinc-950 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {isRunning ? (
              <span className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>Execute</span>
          </button>
        </form>

        {/* Quick Commands */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          <span className="text-[10px] text-zinc-500 font-mono">Quick run:</span>
          {QUICK_COMMANDS.map((q) => (
            <button
              key={q.label}
              type="button"
              onClick={() => {
                setCommandInput(q.cmd);
                runCommand(q.cmd);
              }}
              className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-emerald-300 border border-zinc-700/50 transition-colors"
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* Terminal History Output */}
      <div className="p-4 flex-1 overflow-y-auto space-y-4 font-mono text-xs">
        {history.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center text-zinc-500">
            <Terminal className="w-8 h-8 text-zinc-700 mb-2" />
            <p className="text-zinc-400 font-medium">Ready for Command Execution</p>
            <p className="text-[11px] text-zinc-500 max-w-sm mt-1">
              Run `npm test` or `pytest` to verify the actual test output, or test how the agent differentiates repository defects from environment limitations.
            </p>
          </div>
        ) : (
          history.map((item, idx) => {
            const isCodeDefect = item.defectClassification === 'REPOSITORY_CODE_DEFECT';
            const isSandboxLimit = item.defectClassification === 'SANDBOX_ENVIRONMENT_LIMITATION';

            return (
              <div
                key={idx}
                className="bg-black/80 border border-zinc-800 rounded-lg p-3 space-y-2 shadow-inner"
              >
                {/* Command Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">$ {item.command}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded border font-semibold ${
                        item.exitCode === 0
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                          : 'bg-rose-950 text-rose-400 border-rose-800'
                      }`}
                    >
                      Exit Code: {item.exitCode}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-500">{item.durationMs}ms</span>
                </div>

                {/* Classification Banner */}
                {item.exitCode !== 0 && (
                  <div
                    className={`p-2 rounded border text-[11px] font-sans flex items-start gap-2 ${
                      isSandboxLimit
                        ? 'bg-purple-950/60 border-purple-600/60 text-purple-200'
                        : 'bg-amber-950/60 border-amber-600/60 text-amber-200'
                    }`}
                  >
                    {isSandboxLimit ? (
                      <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    ) : (
                      <Bug className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-semibold uppercase tracking-wider text-[10px] font-mono">
                        {isSandboxLimit
                          ? 'Execution Environment / Sandbox Limitation'
                          : 'Repository Source Code Defect'}
                      </div>
                      <p className="mt-0.5 text-zinc-300">{item.defectAnalysis}</p>
                    </div>
                  </div>
                )}

                {/* Output Terminal Stream */}
                {item.stdout && (
                  <pre className="whitespace-pre overflow-x-auto text-zinc-300 font-mono text-[11px] leading-relaxed pt-1">
                    {item.stdout}
                  </pre>
                )}

                {item.stderr && (
                  <pre className="whitespace-pre overflow-x-auto text-rose-400 font-mono text-[11px] leading-relaxed pt-1">
                    {item.stderr}
                  </pre>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
