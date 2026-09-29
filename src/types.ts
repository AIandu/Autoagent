export interface GitHubAccount {
  username: string;
  name: string;
  avatarUrl: string;
  repoCount: number;
}

export interface ImportantFile {
  path: string;
  purpose: string;
}

export interface RepairRecord {
  id: string;
  timestamp: string;
  branch: string;
  issueSummary: string;
  rootCause: string;
  changesSummary: string;
  decisionsMade: string[];
  filesChanged: string[];
  verificationResult: string;
  commitSha: string;
  prNumber?: number;
  prUrl?: string;
}

export interface CommitRecord {
  sha: string;
  message: string;
  author: string;
  date: string;
}

export interface ProjectMemory {
  id: string; // "owner/repo"
  repoName: string;
  owner: string; // "AIandu" | "Dessiidoo" | string
  purpose: string;
  architecture: string;
  techStack: string[];
  importantDirectories: string[];
  importantFiles: ImportantFile[];
  deploymentPlatform: string;
  knownExternalServices: string[];
  previousRepairs: RepairRecord[];
  unresolvedIssues: string[];
  lastBuildState: {
    status: 'passing' | 'failing' | 'unverified';
    lastRunAt: string;
    details: string;
  };
  relevantBranches: string[];
  relevantCommits: CommitRecord[];
}

export interface RepoFile {
  path: string;
  content: string;
  language: string;
  isModified?: boolean;
}

export interface RepositoryData {
  owner: string;
  name: string;
  fullName: string; // "AIandu/regina"
  description: string;
  defaultBranch: string;
  currentBranch: string;
  isPrivate: boolean;
  stars: number;
  language: string;
  updatedAt: string;
  files: Record<string, RepoFile>;
  memory: ProjectMemory;
  knownDefect?: {
    summary: string;
    failingCommand: string;
    expectedError: string;
    rootCause: string;
    fixStrategy: string;
  };
}

export type DefectType = 'REPOSITORY_CODE_DEFECT' | 'SANDBOX_ENVIRONMENT_LIMITATION' | 'UNKNOWN';

export interface AgentStep {
  id: string;
  timestamp: string;
  phase:
    | 'DISAMBIGUATION'
    | 'READING_MEMORY'
    | 'INSPECTING_CODEBASE'
    | 'DIAGNOSING_ISSUES'
    | 'WEB_RESEARCH'
    | 'CREATING_BRANCH'
    | 'PATCHING_CODE'
    | 'VERIFYING_TESTS'
    | 'GENERATING_DIFF'
    | 'CREATING_COMMIT_PR'
    | 'UPDATING_MEMORY'
    | 'COMPLETED'
    | 'FAILED';
  title: string;
  description: string;
  command?: string;
  commandOutput?: string;
  commandExitCode?: number;
  defectType?: DefectType;
  defectExplanation?: string;
  modifiedFiles?: string[];
  diffs?: FileDiff[];
  status: 'pending' | 'running' | 'success' | 'warning' | 'error';
}

export interface FileDiff {
  path: string;
  oldContent: string;
  newContent: string;
  diffLines: {
    type: 'add' | 'del' | 'normal' | 'header';
    text: string;
    oldLineNumber?: number;
    newLineNumber?: number;
  }[];
  additions: number;
  deletions: number;
}

export interface DisambiguationChoice {
  owner: string;
  name?: string;
  repo?: string;
  fullName: string;
  description: string;
  language: string;
  architecture: string;
  purpose?: string;
  matchScore?: number;
}

export interface TerminalExecutionResult {
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
  defectClassification: DefectType;
  defectAnalysis: string;
}
