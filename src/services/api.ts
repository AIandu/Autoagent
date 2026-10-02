import { GitHubAccount, RepositoryData, ProjectMemory, TerminalExecutionResult } from '../types';

export const api = {
  async getAccounts(): Promise<{ accounts: GitHubAccount[]; supportedOwners: string[] }> {
    const res = await fetch('/api/accounts');
    if (!res.ok) throw new Error('Failed to fetch accounts');
    return res.json();
  },

  async getRepos(token?: string): Promise<{ repositories: (Partial<RepositoryData> & { lastBuildState: any; hasDefect: boolean })[] }> {
    const headers: Record<string, string> = {};
    if (token) headers['x-github-token'] = token;
    const res = await fetch('/api/repos', { headers });
    if (!res.ok) throw new Error('Failed to fetch repositories');
    return res.json();
  },

  async searchRepos(query: string): Promise<{
    query: string;
    cleanTarget: string;
    hasMultipleMatches: boolean;
    matchingOwners: string[];
    matches: {
      owner: string;
      name: string;
      fullName: string;
      description: string;
      language: string;
      architecture: string;
      purpose: string;
    }[];
  }> {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Search failed');
    return res.json();
  },

  async getRepoDetails(owner: string, repo: string): Promise<{ repository: RepositoryData }> {
    const res = await fetch(`/api/repos/${owner}/${repo}`);
    if (!res.ok) throw new Error(`Failed to load ${owner}/${repo}`);
    return res.json();
  },

  async getMemory(owner: string, repo: string): Promise<{ memory: ProjectMemory }> {
    const res = await fetch(`/api/memory/${owner}/${repo}`);
    if (!res.ok) throw new Error(`Failed to load memory for ${owner}/${repo}`);
    return res.json();
  },

  async updateMemory(owner: string, repo: string, data: Partial<ProjectMemory>): Promise<{ memory: ProjectMemory }> {
    const res = await fetch(`/api/memory/${owner}/${repo}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Failed to update memory for ${owner}/${repo}`);
    return res.json();
  },

  async executeCommand(repoKey: string, command: string, isFixed: boolean = false): Promise<TerminalExecutionResult> {
    const res = await fetch('/api/terminal/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repoKey, command, isFixed }),
    });
    if (!res.ok) throw new Error('Command execution failed');
    return res.json();
  },

  async triggerAutonomousRepair(params: {
    repoKey: string;
    goal: string;
    authorOverride?: string;
  }): Promise<{
    success: boolean;
    repoKey: string;
    branchName: string;
    commitSha: string;
    geminiAnalysis: string | null;
    repairRecord: any;
    updatedMemory: ProjectMemory;
    modifiedFiles: string[];
    verificationCommand: string;
    testOutput: string;
  }> {
    const res = await fetch('/api/agent/autonomous-repair', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Autonomous repair failed');
    return res.json();
  },

  async verifyGitHubToken(token: string): Promise<{
    valid: boolean;
    user?: { login: string; name: string; avatarUrl: string; htmlUrl: string };
    scopes?: string[];
    hasRepoScope?: boolean;
    isTargetOwner?: boolean;
    error?: string;
  }> {
    const res = await fetch('/api/github/verify-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    return res.json();
  },

  async createPullRequest(params: {
    repoKey: string;
    branchName: string;
    title: string;
    body: string;
    token?: string;
    files?: Record<string, string>;
  }): Promise<{
    success: boolean;
    prNumber?: number;
    prUrl?: string;
    branch: string;
    message?: string;
    error?: string;
    requiresToken?: boolean;
    gitCommands?: string[];
  }> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (params.token) headers['x-github-token'] = params.token;
    const res = await fetch('/api/github/create-pr', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.error || 'Failed to create PR');
      (err as any).requiresToken = data.requiresToken;
      (err as any).gitCommands = data.gitCommands;
      throw err;
    }
    return data;
  },
};
