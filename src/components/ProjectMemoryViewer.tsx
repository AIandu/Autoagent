import React, { useState } from 'react';
import {
  BookOpen,
  Layers,
  Cpu,
  Server,
  Cloud,
  History,
  AlertCircle,
  CheckCircle2,
  GitBranch,
  GitCommit,
  Clock,
  Shield,
  Tag,
  ExternalLink,
  Edit3,
  Save,
} from 'lucide-react';
import { ProjectMemory } from '../types';

interface ProjectMemoryViewerProps {
  memory: ProjectMemory | null;
  onUpdateMemory?: (data: Partial<ProjectMemory>) => void;
}

export const ProjectMemoryViewer: React.FC<ProjectMemoryViewerProps> = ({
  memory,
  onUpdateMemory,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [purpose, setPurpose] = useState('');
  const [architecture, setArchitecture] = useState('');

  if (!memory) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 flex flex-col items-center justify-center text-center text-zinc-500 h-96">
        <BookOpen className="w-10 h-10 text-zinc-700 mb-3" />
        <p className="text-sm font-medium text-zinc-400">No Persistent Memory Record</p>
        <p className="text-xs text-zinc-500 max-w-sm mt-1">
          Select a repository to inspect its persistent architecture record, past repairs, and decision logs.
        </p>
      </div>
    );
  }

  const handleStartEdit = () => {
    setPurpose(memory.purpose);
    setArchitecture(memory.architecture);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (onUpdateMemory) {
      onUpdateMemory({ purpose, architecture });
    }
    setIsEditing(false);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl flex flex-col h-full">
      {/* Header */}
      <div className="bg-zinc-950/80 px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-teal-400" />
          <h3 className="text-xs font-semibold text-zinc-100 uppercase tracking-wider">
            Persistent Project Record • {memory.id}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-zinc-400">
            Owner: <strong className="text-zinc-200">{memory.owner}</strong>
          </span>
          {isEditing ? (
            <button
              onClick={handleSave}
              className="flex items-center gap-1 px-2.5 py-1 text-xs rounded bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-medium transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Record</span>
            </button>
          ) : (
            <button
              onClick={handleStartEdit}
              className="flex items-center gap-1 px-2.5 py-1 text-xs rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Record</span>
            </button>
          )}
        </div>
      </div>

      {/* Memory Content */}
      <div className="p-4 flex-1 overflow-y-auto space-y-5 text-xs text-zinc-300 font-sans">
        {/* Memory Read Notice */}
        <div className="p-2.5 rounded-lg bg-teal-950/40 border border-teal-700/50 flex items-center justify-between text-teal-200 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-400" />
            <span>
              <strong>Zero-Re-explanation Cache:</strong> The agent reads this record on startup and immediately retains project context.
            </span>
          </div>
          <span className="text-[10px] font-mono text-teal-400 bg-teal-900/60 px-1.5 py-0.5 rounded">
            Cached
          </span>
        </div>

        {/* 1. Purpose & Architecture */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-zinc-400 font-medium mb-1.5">
              <Cpu className="w-3.5 h-3.5 text-teal-400" />
              <span>Repository Purpose</span>
            </div>
            {isEditing ? (
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                rows={2}
                className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded text-zinc-100 text-xs font-mono"
              />
            ) : (
              <p className="text-zinc-200 leading-relaxed font-sans">{memory.purpose}</p>
            )}
          </div>

          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-zinc-400 font-medium mb-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Architecture & Tech Stack</span>
            </div>
            {isEditing ? (
              <textarea
                value={architecture}
                onChange={(e) => setArchitecture(e.target.value)}
                rows={2}
                className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded text-zinc-100 text-xs font-mono"
              />
            ) : (
              <div>
                <p className="text-zinc-200 leading-relaxed mb-2 font-sans">{memory.architecture}</p>
                <div className="flex flex-wrap gap-1">
                  {memory.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. Deployment Platform & External Services */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-zinc-400 font-medium mb-1.5">
              <Cloud className="w-3.5 h-3.5 text-sky-400" />
              <span>Deployment Platform</span>
            </div>
            <p className="text-zinc-200 font-mono text-[11px]">{memory.deploymentPlatform}</p>
          </div>

          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-zinc-400 font-medium mb-1.5">
              <Server className="w-3.5 h-3.5 text-purple-400" />
              <span>Known External Services & APIs</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {memory.knownExternalServices.map((svc) => (
                <span
                  key={svc}
                  className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950/40 text-purple-300 border border-purple-800/40"
                >
                  {svc}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Important Files & Directories */}
        <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-zinc-400 font-medium mb-2">
            <Tag className="w-3.5 h-3.5 text-amber-400" />
            <span>Important Files & Directories</span>
          </div>
          <div className="divide-y divide-zinc-800">
            {memory.importantFiles.map((f) => (
              <div key={f.path} className="py-2 flex items-start justify-between gap-4">
                <span className="font-mono text-emerald-400 text-[11px] shrink-0">{f.path}</span>
                <span className="text-zinc-400 text-right">{f.purpose}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Last Successful Build/Test State & Unresolved Issues */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Build State */}
          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-zinc-400 font-medium">Last Build & Test State</span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded flex items-center gap-1 ${
                  memory.lastBuildState?.status === 'passing'
                    ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-800/60'
                    : 'text-rose-400 bg-rose-950/60 border border-rose-800/60'
                }`}
              >
                {memory.lastBuildState?.status === 'passing' ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  <AlertCircle className="w-3 h-3" />
                )}
                {memory.lastBuildState?.status?.toUpperCase()}
              </span>
            </div>
            <p className="text-[11px] text-zinc-300 font-mono">{memory.lastBuildState?.details}</p>
            <p className="text-[10px] text-zinc-500 font-mono mt-1">
              Last executed: {new Date(memory.lastBuildState?.lastRunAt || '').toLocaleString()}
            </p>
          </div>

          {/* Unresolved Issues */}
          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-3">
            <span className="text-zinc-400 font-medium block mb-1.5">Unresolved Issues</span>
            {memory.unresolvedIssues.length === 0 ? (
              <p className="text-emerald-400 text-[11px] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                No outstanding defect logs detected
              </p>
            ) : (
              <ul className="space-y-1">
                {memory.unresolvedIssues.map((issue, idx) => (
                  <li key={idx} className="text-rose-300 text-[11px] flex items-start gap-1.5">
                    <span className="text-rose-500 mt-0.5">•</span>
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* 5. Previous Repairs & Decisions Log */}
        <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 text-zinc-400 font-medium">
              <History className="w-3.5 h-3.5 text-emerald-400" />
              <span>Previous Repairs & Architectural Decisions ({memory.previousRepairs.length})</span>
            </div>
          </div>

          {memory.previousRepairs.length === 0 ? (
            <p className="text-zinc-500 text-center py-4">No previous repairs recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {memory.previousRepairs.map((rep) => (
                <div
                  key={rep.id}
                  className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                    <span className="font-semibold text-zinc-100 flex items-center gap-2">
                      <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
                      {rep.branch}
                    </span>
                    <span className="font-mono text-zinc-500">
                      {new Date(rep.timestamp).toLocaleDateString()} • {rep.commitSha}
                    </span>
                  </div>

                  <p className="text-zinc-300 font-sans leading-snug">
                    <strong className="text-zinc-400">Issue:</strong> {rep.issueSummary}
                  </p>

                  <p className="text-zinc-400 text-[11px]">
                    <strong className="text-zinc-500">Root Cause:</strong> {rep.rootCause}
                  </p>

                  <div className="pt-2 border-t border-zinc-800/80">
                    <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wide block mb-1">
                      Architectural Decisions Made:
                    </span>
                    <ul className="space-y-0.5 pl-2">
                      {rep.decisionsMade?.map((decision, dIdx) => (
                        <li key={dIdx} className="text-[11px] text-zinc-300 list-disc list-inside">
                          {decision}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-[10px] text-zinc-500 font-mono">
                    <span className="text-emerald-400">
                      ✓ {rep.verificationResult}
                    </span>
                    {rep.prUrl ? (
                      <a
                        href={rep.prUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium transition-colors"
                      >
                        <span>GitHub PR #{rep.prNumber || ''}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ) : (
                      <span className="text-zinc-500 font-mono">
                        Branch: {rep.branch} (Local)
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
