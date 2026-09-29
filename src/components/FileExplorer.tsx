import React, { useState } from 'react';
import { FileCode, Folder, ChevronRight, ChevronDown, Check, Copy } from 'lucide-react';
import { RepoFile } from '../types';

interface FileExplorerProps {
  files: Record<string, RepoFile>;
  repoFullName: string;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({ files, repoFullName }) => {
  const fileKeys = Object.keys(files || {});
  const [selectedPath, setSelectedPath] = useState<string>(fileKeys[0] || '');
  const [copied, setCopied] = useState(false);

  const currentFile = files[selectedPath] || (fileKeys.length > 0 ? files[fileKeys[0]] : null);

  const handleCopy = () => {
    if (currentFile) {
      navigator.clipboard.writeText(currentFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl flex flex-col md:flex-row h-full min-h-[450px]">
      {/* File Tree Left Sidebar */}
      <div className="w-full md:w-64 bg-zinc-950/90 border-r border-zinc-800 p-3 flex flex-col">
        <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Folder className="w-3.5 h-3.5 text-zinc-500" />
          <span>Repository Files</span>
        </div>

        <div className="space-y-1 overflow-y-auto flex-1">
          {fileKeys.map((path) => {
            const isSelected = selectedPath === path;
            const file = files[path];
            return (
              <button
                key={path}
                onClick={() => setSelectedPath(path)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center justify-between transition-colors ${
                  isSelected
                    ? 'bg-zinc-800 text-emerald-400 font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <FileCode className="w-3.5 h-3.5 shrink-0 text-zinc-500" />
                  <span className="truncate">{path}</span>
                </div>
                {file.isModified && (
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-1 rounded border border-emerald-800">
                    Mod
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* File Viewer Main Pane */}
      <div className="flex-1 flex flex-col bg-zinc-950">
        {/* File Header */}
        <div className="bg-zinc-900/60 border-b border-zinc-800 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-zinc-200 font-medium">
              {currentFile?.path || 'No file selected'}
            </span>
            {currentFile?.isModified && (
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.5 rounded">
                Repaired by Agent
              </span>
            )}
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-auto p-4 font-mono text-xs text-zinc-300 whitespace-pre leading-relaxed">
          {currentFile ? (
            <code>{currentFile.content}</code>
          ) : (
            <p className="text-zinc-500">Select a file from the repository tree.</p>
          )}
        </div>
      </div>
    </div>
  );
};
