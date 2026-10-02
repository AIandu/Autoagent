import React, { useState } from 'react';
import {
  GitPullRequest,
  GitCommit,
  Check,
  Copy,
  ExternalLink,
  FileCode,
  CheckCircle2,
  AlertCircle,
  Key,
  Terminal,
  ChevronDown,
  ChevronRight,
  Shield,
  Loader2,
} from 'lucide-react';
import { FileDiff, RepairRecord } from '../types';

interface DiffViewerProps {
  diffs: FileDiff[];
  repairRecord: RepairRecord | null;
  currentBranch: string;
  repoFullName: string;
  onOpenPR?: (title: string, body: string, tokenOverride?: string) => Promise<any>;
  isPROpening?: boolean;
  hasCustomToken: boolean;
  onSaveToken?: (token: string) => void;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  diffs,
  repairRecord,
  currentBranch,
  repoFullName,
  onOpenPR,
  isPROpening = false,
  hasCustomToken,
  onSaveToken,
}) => {
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [copiedCommands, setCopiedCommands] = useState(false);
  const [showCliFallback, setShowCliFallback] = useState(false);
  const [inlineToken, setInlineToken] = useState('');
  const [pushError, setPushError] = useState<string | null>(null);

  const activeDiff = diffs[selectedFileIndex] || diffs[0];

  const handleCopyDiff = () => {
    if (!activeDiff) return;
    const text = activeDiff.diffLines.map((l) => l.text).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreatePR = async (tokenToUse?: string) => {
    if (!onOpenPR || !repairRecord) return;
    setPushError(null);

    const token = tokenToUse || (hasCustomToken ? undefined : inlineToken);
    if (!hasCustomToken && !token) {
      setPushError('A GitHub Personal Access Token (PAT) with "repo" scope is required to push to GitHub.');
      return;
    }

    if (tokenToUse && onSaveToken) {
      onSaveToken(tokenToUse);
    }

    try {
      await onOpenPR(
        `fix(${repoFullName.split('/')[1]}): ${repairRecord.issueSummary}`,
        `### Autonomous Repair by RepoMaintainer\n\n**Root Cause:**\n${repairRecord.rootCause}\n\n**Summary of Changes:**\n${repairRecord.changesSummary}\n\n**Verification Results:**\n${repairRecord.verificationResult}\n\n---\n*Authored autonomously on isolated branch \`${repairRecord.branch}\`.*`,
        token
      );
    } catch (err: any) {
      setPushError(err?.message || 'Failed to push to GitHub');
    }
  };

  const gitCliCommands = repairRecord
    ? [
        `git checkout -b ${repairRecord.branch}`,
        `git add ${repairRecord.filesChanged.join(' ')}`,
        `git commit -m "fix(${repoFullName.split('/')[1]}): ${repairRecord.changesSummary}"`,
        `git push -u origin ${repairRecord.branch}`,
        `gh pr create --title "fix(${repoFullName.split('/')[1]}): ${repairRecord.issueSummary}" --body "Autonomous repair by RepoMaintainer"`,
      ].join('\n')
    : '';

  const handleCopyCli = () => {
    navigator.clipboard.writeText(gitCliCommands);
    setCopiedCommands(true);
    setTimeout(() => setCopiedCommands(false), 2000);
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

  const isPushedToRemote = !!(repairRecord?.pushedToRemote && repairRecord?.prUrl);

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

      {/* Pull Request Card & Remote GitHub Synchronization Footer */}
      {repairRecord && (
        <div className="border-t border-zinc-800 bg-zinc-950 p-4 space-y-3">
          {/* Status Bar */}
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

                {isPushedToRemote ? (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/80 border border-emerald-700/80 px-2 py-0.5 rounded">
                    <CheckCircle2 className="w-3 h-3" />
                    Live on GitHub (PR #{repairRecord.prNumber})
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded">
                    Local Branch Verified • Remote Push Pending
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-300 mt-1 line-clamp-1">
                <strong>Repair:</strong> {repairRecord.changesSummary}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {isPushedToRemote ? (
                <a
                  href={repairRecord.prUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-zinc-950 text-xs font-semibold shadow-md transition-all cursor-pointer"
                >
                  <GitPullRequest className="w-3.5 h-3.5" />
                  <span>View PR #{repairRecord.prNumber} on GitHub</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <button
                  onClick={() => handleCreatePR()}
                  disabled={isPROpening}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-950 text-xs font-semibold shadow-md transition-all cursor-pointer"
                >
                  {isPROpening ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Pushing to GitHub API...</span>
                    </>
                  ) : (
                    <>
                      <GitPullRequest className="w-3.5 h-3.5" />
                      <span>Push Branch & Open Pull Request</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* If push error occurred */}
          {pushError && (
            <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800/60 text-xs text-rose-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="font-semibold">GitHub Remote Push Did Not Complete</p>
                <p className="text-rose-300/90 leading-relaxed font-sans">{pushError}</p>
              </div>
            </div>
          )}

          {/* Token Prompt if not yet pushed and no token is saved */}
          {!isPushedToRemote && !hasCustomToken && (
            <div className="p-3 rounded-lg bg-zinc-900 border border-amber-600/30 space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-amber-300">
                <Key className="w-3.5 h-3.5" />
                <span>GitHub Personal Access Token (PAT) Required for Remote Push</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                The agent completed the repair and verified all tests locally. To create the remote branch and open the real Pull Request on <strong className="text-zinc-200">github.com/{repoFullName}</strong>, provide a GitHub token with <code className="text-zinc-300 font-mono">repo</code> scope:
              </p>
              <div className="flex gap-2 pt-1">
                <input
                  type="password"
                  placeholder="ghp_************************************"
                  value={inlineToken}
                  onChange={(e) => setInlineToken(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-zinc-950 border border-zinc-700 rounded font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => handleCreatePR(inlineToken.trim())}
                  disabled={!inlineToken.trim() || isPROpening}
                  className="px-3.5 py-1.5 rounded text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 text-zinc-950 transition-colors"
                >
                  Save & Push Now
                </button>
              </div>
            </div>
          )}

          {/* Manual Git CLI Fallback toggle */}
          {!isPushedToRemote && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowCliFallback(!showCliFallback)}
                className="text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1 font-mono transition-colors"
              >
                <Terminal className="w-3 h-3 text-zinc-500" />
                <span>{showCliFallback ? 'Hide' : 'Show'} manual Git CLI push commands</span>
                {showCliFallback ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </button>

              {showCliFallback && (
                <div className="mt-2 p-3 bg-black/90 border border-zinc-800 rounded font-mono text-[11px] text-zinc-300 relative group">
                  <button
                    onClick={handleCopyCli}
                    className="absolute right-2 top-2 p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors text-[10px] flex items-center gap-1"
                  >
                    {copiedCommands ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCommands ? 'Copied' : 'Copy Commands'}</span>
                  </button>
                  <pre className="whitespace-pre overflow-x-auto text-emerald-300/90 leading-relaxed pr-20">
                    {gitCliCommands}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
