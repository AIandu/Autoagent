import React, { useState } from 'react';
import { GitPullRequest, GitCommit, Check, Copy, ExternalLink, FileCode, CheckCircle2, ShieldAlert } from 'lucide-react';
import { FileDiff, RepairRecord } from '../types';

interface DiffViewerProps {
  diffs: FileDiff[];
  repairRecord: RepairRecord | null;
  currentBranch: string;
  repoFullName: string;
  onOpenPR?: (title: string, body: string) => void;
  isPROpening?: boolean;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  diffs,
  repairRecord,
  currentBranch,
  repoFullName,
  onOpenPR,
  isPROpening,
}) => {
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [prCreated, setPrCreated] = useState(false);

  const activeDiff = diffs[selectedFileIndex] || diffs[0];

  const handleCopyDiff = () => {
    if (!activeDiff) return;
    const text = activeDiff.diffLines.map((l) => l.text).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreatePR = () => {
    if (onOpenPR && repairRecord) {
      onOpenPR(
        `fix(${repoFullName.split('/')[1]}): ${repairRecord.issueSummary}`,
        `### Autonomous Repair Report\n\n**Root Cause:**\n${repairRecord.rootCause}\n\n**Changes:**\n${repairRecord.changesSummary}\n\n**Verification:**\n${repairRecord.verificationResult}`
      );
      setPrCreated(true);
    }
  };

  if (!diffs || diffs.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 flex flex-col items-center justify-center text-center text-zinc-500 h-96">
        <FileCode className="w-10 h-10 text-zinc-700 mb-3" />
        <p className="text-sm font-medium text-zinc-300">No Diff to Display Yet</p>
        <p className="text-xs text-zinc-500 max-w-sm mt-1">
          When the agent performs repairs, unified file diffs, branch checkpoints, and Pull Request metadata will be rendered here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl flex flex-col h-full">
      {/* Diff Header */}
      <div className="bg-zinc-950/90 border-b border-zinc-800 p-3 flex flex-wrap items-center justify-between gap-3">
        {/* File Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {diffs.map((diff, idx) => (
            <button
              key={diff.path}
              onClick={() => setSelectedFileIndex(idx)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                selectedFileIndex === idx
                  ? 'bg-zinc-800 text-emerald-400 border border-zinc-700 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>{diff.path}</span>
              <span className="flex items-center gap-1 text-[10px]">
                <span className="text-emerald-400">+{diff.additions}</span>
                <span className="text-rose-400">-{diff.deletions}</span>
              </span>
            </button>
          ))}
        </div>

        {/* Actions & Copy */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyDiff}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded bg-zinc-800 hover:bg-zinc-750 text-zinc-300 transition-colors border border-zinc-700"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Patch'}</span>
          </button>
        </div>
      </div>

      {/* Code Diff Body */}
      <div className="flex-1 overflow-auto bg-zinc-950 font-mono text-[12px] leading-relaxed p-2">
        {activeDiff?.diffLines.map((line, idx) => {
          let lineBg = 'hover:bg-zinc-900/50 text-zinc-300';
          let indicatorColor = 'text-zinc-600';

          if (line.type === 'add') {
            lineBg = 'bg-emerald-950/30 text-emerald-300 hover:bg-emerald-950/50';
            indicatorColor = 'text-emerald-500 font-bold';
          } else if (line.type === 'del') {
            lineBg = 'bg-rose-950/30 text-rose-300 hover:bg-rose-950/50 line-through';
            indicatorColor = 'text-rose-500 font-bold';
          } else if (line.type === 'header') {
            lineBg = 'bg-zinc-900 text-zinc-400 font-semibold italic';
          }

          return (
            <div key={idx} className={`flex items-start px-2 py-0.5 rounded-sm ${lineBg}`}>
              {/* Line Numbers */}
              <div className="w-16 shrink-0 flex items-center justify-between text-[10px] text-zinc-600 select-none pr-3">
                <span className="w-6 text-right">{line.oldLineNumber || ''}</span>
                <span className="w-6 text-right">{line.newLineNumber || ''}</span>
              </div>

              {/* Indicator */}
              <span className={`w-4 shrink-0 select-none ${indicatorColor}`}>
                {line.type === 'add' ? '+' : line.type === 'del' ? '-' : ' '}
              </span>

              {/* Code content */}
              <pre className="whitespace-pre overflow-x-auto flex-1 font-mono">{line.text.slice(1)}</pre>
            </div>
          );
        })}
      </div>

      {/* Pull Request Card / Commit Staging Footer */}
      {repairRecord && (
        <div className="border-t border-zinc-800 bg-zinc-950/90 p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-xs font-mono text-indigo-400 bg-indigo-950/60 border border-indigo-800/60 px-2 py-0.5 rounded">
                  <GitCommit className="w-3.5 h-3.5" />
                  {repairRecord.commitSha}
                </span>
                <span className="text-xs text-zinc-400 font-mono">
                  Branch: <strong className="text-zinc-200">{repairRecord.branch}</strong>
                </span>
              </div>
              <p className="text-xs text-zinc-300 mt-1 line-clamp-1">
                <strong>Repair:</strong> {repairRecord.changesSummary}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {prCreated ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 text-xs font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Pull Request Staged / Pushed</span>
                </div>
              ) : (
                <button
                  onClick={handleCreatePR}
                  disabled={isPROpening}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-zinc-950 text-xs font-semibold shadow-md transition-all cursor-pointer"
                >
                  <GitPullRequest className="w-3.5 h-3.5" />
                  <span>{isPROpening ? 'Publishing PR...' : 'Push & Open Pull Request'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
