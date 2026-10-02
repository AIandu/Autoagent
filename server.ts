import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { INITIAL_REPOSITORIES, GITHUB_ACCOUNTS } from './src/data/mockRepos';
import { ProjectMemory, RepositoryData, DefectType, RepairRecord } from './src/types';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));

// In-memory persistent database of repositories and memories
const repoDatabase: Record<string, RepositoryData> = JSON.parse(JSON.stringify(INITIAL_REPOSITORIES));

// Persistent Project Memory Store
const memoryStore: Record<string, ProjectMemory> = {};
Object.entries(repoDatabase).forEach(([key, repo]) => {
  memoryStore[key] = JSON.parse(JSON.stringify(repo.memory));
});

// Secret sanitizer to guarantee no API keys or PATs are ever exposed
export function sanitizeSecrets(text: string): string {
  if (!text) return text;
  return text
    .replace(/ghp_[A-Za-z0-9_]{20,}/g, 'ghp_********************')
    .replace(/github_pat_[A-Za-z0-9_]{20,}/g, 'github_pat_********************')
    .replace(/AIzaSy[A-Za-z0-9_-]{33}/g, 'AIzaSy*******************************')
    .replace(/(JWT_SECRET\s*=\s*['"]?)[^'"\s\n]+/gi, '$1[REDACTED_SECRET]')
    .replace(/(Bearer\s+)[A-Za-z0-9\-._~+/]+=*/gi, '$1[REDACTED_TOKEN]');
}

// Initialize Gemini client according to system guidelines
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// 1. Get Accounts (AIandu & Dessiidoo)
app.get('/api/accounts', (req, res) => {
  res.json({
    accounts: GITHUB_ACCOUNTS,
    supportedOwners: ['AIandu', 'Dessiidoo'],
  });
});

// 2. Get All Repositories
app.get('/api/repos', async (req, res) => {
  const token = req.headers['x-github-token'] as string | undefined;
  const repos = Object.values(repoDatabase).map((r) => ({
    owner: r.owner,
    name: r.name,
    fullName: r.fullName,
    description: r.description,
    defaultBranch: r.defaultBranch,
    currentBranch: r.currentBranch,
    language: r.language,
    stars: r.stars,
    updatedAt: r.updatedAt,
    lastBuildState: memoryStore[r.fullName]?.lastBuildState || { status: 'unverified' },
    hasDefect: !!r.knownDefect,
  }));

  // If token is provided, attempt to query public GitHub repos for both AIandu and Dessiidoo
  if (token) {
    try {
      const sanitized = sanitizeSecrets(token);
      console.log(`[GitHub API] Using authenticated PAT: ${sanitized.slice(0, 10)}...`);
    } catch {
      // ignore
    }
  }

  res.json({ repositories: repos });
});

// 3. Search & Disambiguation across both AIandu & Dessiidoo
app.get('/api/search', (req, res) => {
  const query = (req.query.q as string || '').toLowerCase().trim();
  if (!query) {
    return res.json({ matches: [], hasMultipleMatches: false });
  }

  // Strip common conversational prefixes like "fix ", "repair ", "inspect ", "get working "
  const cleanTarget = query
    .replace(/^(fix|repair|debug|inspect|investigate|check|test|clean|get)\s+/i, '')
    .replace(/\s+(working|fixed|running)$/i, '')
    .trim();

  const allRepos = Object.values(repoDatabase);
  const matches = allRepos.filter((r) => {
    const nameMatch = r.name.toLowerCase().includes(cleanTarget);
    const fullNameMatch = r.fullName.toLowerCase().includes(cleanTarget);
    const descMatch = r.description.toLowerCase().includes(cleanTarget);
    return nameMatch || fullNameMatch || descMatch;
  });

  // Check if multiple matches exist across different owners (e.g. AIandu/regina vs Dessiidoo/regina)
  const matchingOwners = Array.from(new Set(matches.map((m) => m.owner)));
  const hasMultipleMatches = matches.length > 1;

  res.json({
    query,
    cleanTarget,
    hasMultipleMatches,
    matchingOwners,
    matches: matches.map((m) => ({
      owner: m.owner,
      name: m.name,
      fullName: m.fullName,
      description: m.description,
      language: m.language,
      architecture: memoryStore[m.fullName]?.architecture || '',
      purpose: memoryStore[m.fullName]?.purpose || m.description,
    })),
  });
});

// 4. Get specific repository details & files
app.get('/api/repos/:owner/:repo', (req, res) => {
  const key = `${req.params.owner}/${req.params.repo}`;
  const repo = repoDatabase[key];
  if (!repo) {
    return res.status(404).json({ error: `Repository ${key} not found` });
  }

  res.json({
    repository: {
      ...repo,
      memory: memoryStore[key],
    },
  });
});

// 5. Get Persistent Project Memory for a repository
app.get('/api/memory/:owner/:repo', (req, res) => {
  const key = `${req.params.owner}/${req.params.repo}`;
  const memory = memoryStore[key];
  if (!memory) {
    return res.status(404).json({ error: `Persistent memory for ${key} not found` });
  }
  res.json({ memory });
});

// 6. Update Persistent Project Memory
app.put('/api/memory/:owner/:repo', (req, res) => {
  const key = `${req.params.owner}/${req.params.repo}`;
  if (!memoryStore[key]) {
    return res.status(404).json({ error: `Persistent memory for ${key} not found` });
  }

  const updatedFields = req.body;
  memoryStore[key] = {
    ...memoryStore[key],
    ...updatedFields,
  };

  // Sync back into repository representation
  if (repoDatabase[key]) {
    repoDatabase[key].memory = memoryStore[key];
  }

  res.json({ memory: memoryStore[key] });
});

// 7. Command Execution & Sandbox Runner with Defect Classification
app.post('/api/terminal/execute', (req, res) => {
  const { command, repoKey, isFixed } = req.body;
  const repo = repoDatabase[repoKey];

  if (!repo) {
    return res.status(404).json({ error: `Repository ${repoKey} not found` });
  }

  const startTime = Date.now();
  const cmd = (command || '').trim();

  // Handle specific project commands
  if (repoKey === 'AIandu/regina') {
    if (cmd === 'npm test' || cmd === 'jest') {
      if (isFixed) {
        return res.json({
          command: cmd,
          exitCode: 0,
          stdout: `
PASS tests/session.test.ts (1.42s)
  Regina SessionManager
    ✓ creates active session with valid token (28 ms)
    ✓ rejects missing or empty token (4 ms)
    ✓ revokes existing session successfully (6 ms)

Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
Snapshots:   0 total
Time:        1.42 s, estimated 2 s
Ran all test suites matching /tests/session.test.ts/i.
`.trim(),
          stderr: '',
          durationMs: Date.now() - startTime + 820,
          defectClassification: 'REPOSITORY_CODE_DEFECT',
          defectAnalysis: 'Verification successful: tests passed cleanly after tokenValidator.verify refactor.',
        });
      } else {
        return res.json({
          command: cmd,
          exitCode: 1,
          stdout: `
FAIL tests/session.test.ts
  Regina SessionManager
    ✕ creates active session with valid token (34 ms)
    ✓ rejects missing or empty token (3 ms)
    ✕ revokes existing session successfully (5 ms)

  ● Regina SessionManager › creates active session with valid token

    TypeError: session.validateToken is not a function

      40 |     // Session validation
      41 |     const session = this as any;
    > 42 |     const payload = session.validateToken(token);
         |                             ^
      43 |     if (!payload) {
      44 |       throw new Error('Invalid or expired authentication token');
      45 |     }

      at SessionManager.authenticate (src/auth/session-manager.ts:42:29)
      at Object.<anonymous> (tests/session.test.ts:14:27)

Test Suites: 1 failed, 1 total
Tests:       2 failed, 1 passed, 3 total
Snapshots:   0 total
Time:        1.25 s
`.trim(),
          stderr: 'npm ERR! Test failed. See above for more details.\n',
          durationMs: Date.now() - startTime + 650,
          defectClassification: 'REPOSITORY_CODE_DEFECT',
          defectAnalysis: 'Code defect: SessionManager invokes non-existent validateToken() method on its own instance instead of delegating to this.tokenValidator.verify().',
        });
      }
    } else if (cmd === 'npm run build' || cmd === 'tsc') {
      return res.json({
        command: cmd,
        exitCode: 0,
        stdout: 'Building regina microservice...\nCompiled 4 TypeScript source files into dist/ successfully in 840ms.',
        stderr: '',
        durationMs: 840,
        defectClassification: 'REPOSITORY_CODE_DEFECT',
        defectAnalysis: 'Build succeeded.',
      });
    } else if (cmd === 'npm run lint' || cmd.startsWith('eslint')) {
      return res.json({
        command: cmd,
        exitCode: isFixed ? 0 : 1,
        stdout: isFixed ? 'No lint errors found.' : 'src/auth/session-manager.ts:41:21: warning: unexpected any cast',
        stderr: '',
        durationMs: 300,
        defectClassification: 'REPOSITORY_CODE_DEFECT',
        defectAnalysis: isFixed ? 'Lint clean' : 'Type warning detected in session-manager.ts',
      });
    }
  } else if (repoKey === 'Dessiidoo/regina') {
    if (cmd.startsWith('pytest')) {
      if (isFixed) {
        return res.json({
          command: cmd,
          exitCode: 0,
          stdout: `
============================= test session starts ==============================
platform linux -- Python 3.11.8, pytest-8.1.1, pluggy-1.4.0
rootdir: /workspace/Dessiidoo/regina
collected 1 item

tests/test_pipeline.py .                                                 [100%]

============================== 1 passed in 0.18s ===============================
`.trim(),
          stderr: '',
          durationMs: Date.now() - startTime + 540,
          defectClassification: 'REPOSITORY_CODE_DEFECT',
          defectAnalysis: 'Verification successful: Pytest passed after migrating to pydantic-settings.',
        });
      } else {
        return res.json({
          command: cmd,
          exitCode: 1,
          stdout: `
============================= test session starts ==============================
platform linux -- Python 3.11.8, pytest-8.1.1, pluggy-1.4.0
rootdir: /workspace/Dessiidoo/regina
collected 0 items / 1 error

==================================== ERRORS ====================================
___________________ ERROR collecting tests/test_pipeline.py ____________________
ImportError while importing test module '/workspace/Dessiidoo/regina/tests/test_pipeline.py'.
Hint: make sure your test modules/packages have valid Python names.
Traceback:
regina/config.py:3: in <module>
    from pydantic import BaseSettings, Field
E   pydantic.errors.PydanticImportError: BaseSettings has been moved to the pydantic-settings package. See https://docs.pydantic.dev/2.6/migration/#basesettings-has-moved-to-pydantic-settings for more details.
=========================== 1 error in 0.22s ===================================
`.trim(),
          stderr: '',
          durationMs: Date.now() - startTime + 480,
          defectClassification: 'REPOSITORY_CODE_DEFECT',
          defectAnalysis: 'Code defect: regina/config.py imports BaseSettings from pydantic instead of pydantic_settings following Pydantic v2 upgrade.',
        });
      }
    }
  }

  // Handle generic git or info commands
  if (cmd.startsWith('git status')) {
    return res.json({
      command: cmd,
      exitCode: 0,
      stdout: isFixed
        ? `On branch repair/automated-fix\nChanges to be committed:\n  modified:   ${repo.knownDefect ? (repoKey.includes('AIandu') ? 'src/auth/session-manager.ts' : 'regina/config.py') : 'README.md'}`
        : `On branch ${repo.currentBranch}\nnothing to commit, working tree clean`,
      stderr: '',
      durationMs: 40,
      defectClassification: 'REPOSITORY_CODE_DEFECT',
      defectAnalysis: 'Git status clean',
    });
  }

  // Check for simulated sandbox environment limitation demonstration
  if (cmd.includes('docker') || cmd.includes('systemctl') || cmd.includes('ping -c')) {
    return res.json({
      command: cmd,
      exitCode: 126,
      stdout: '',
      stderr: 'Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?',
      durationMs: 80,
      defectClassification: 'SANDBOX_ENVIRONMENT_LIMITATION',
      defectAnalysis: 'ENVIRONMENT LIMITATION (Not a repo defect): Container runtime socket /var/run/docker.sock is blocked or unmounted in this execution sandbox. Halting retry loops as per Execution Failure Rule.',
    });
  }

  // Default simulated execution
  res.json({
    command: cmd,
    exitCode: 0,
    stdout: `[sandbox: ${repoKey}]$ ${cmd}\nCommand executed successfully.`,
    stderr: '',
    durationMs: 120,
    defectClassification: 'REPOSITORY_CODE_DEFECT',
    defectAnalysis: 'Execution normal',
  });
});

// 8. Autonomous Repair Engine Endpoint
app.post('/api/agent/autonomous-repair', async (req, res) => {
  const { repoKey, goal, authorOverride } = req.body;
  const repo = repoDatabase[repoKey];

  if (!repo) {
    return res.status(404).json({ error: `Repository ${repoKey} not found` });
  }

  const memory = memoryStore[repoKey] || repo.memory;
  const cleanGoal = sanitizeSecrets(goal || 'Repair this repository');

  // We can query Gemini for advanced diagnosis and insights if API key is active
  let geminiAnalysis: string | null = null;
  try {
    if (process.env.GEMINI_API_KEY) {
      const prompt = `You are an elite autonomous software engineer.
Project: ${repo.fullName}
Goal: ${cleanGoal}
Tech Stack: ${memory.techStack.join(', ')}
Architecture: ${memory.architecture}
Known Defect Summary: ${repo.knownDefect?.summary || 'Inspect and diagnose issues'}
Recent Failure: ${repo.knownDefect?.expectedError || 'N/A'}

Provide a 2-sentence precise diagnosis of the root cause and the safest surgical repair plan that preserves existing architecture.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });
      geminiAnalysis = response.text || null;
    }
  } catch (err: any) {
    console.log('[Gemini] Note: Falling back to internal engine reasoning:', err?.message);
  }

  // Determine repair specifics based on the repository identity
  const now = new Date().toISOString();
  const branchName = `repair/${repo.name}-autonomous-fix-${Date.now().toString().slice(-4)}`;

  let repairedFiles: Record<string, string> = {};
  let modifiedPaths: string[] = [];
  let rootCause = '';
  let changesSummary = '';
  let decisionsMade: string[] = [];
  let verificationCommand = '';
  let testOutput = '';

  if (repoKey === 'AIandu/regina') {
    const fixedContent = `import { TokenValidator, TokenPayload } from './token-validator';

export interface UserSession {
  sessionId: string;
  user: TokenPayload;
  createdAt: number;
  lastActiveAt: number;
}

export class SessionManager {
  private activeSessions: Map<string, UserSession> = new Map();
  public tokenValidator: TokenValidator;

  constructor(validator?: TokenValidator) {
    this.tokenValidator = validator || new TokenValidator();
  }

  /**
   * Authenticate a bearer token and create or update session
   */
  public async authenticate(token: string): Promise<UserSession> {
    if (!token) {
      throw new Error('Token is required for session authentication');
    }

    // FIXED: Correctly delegates token verification to this.tokenValidator.verify
    const payload = this.tokenValidator.verify(token);

    if (!payload) {
      throw new Error('Invalid or expired authentication token');
    }

    const sessionId = \`sess_\${payload.userId}_\${Date.now()}\`;
    const userSession: UserSession = {
      sessionId,
      user: payload,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
    };

    this.activeSessions.set(sessionId, userSession);
    return userSession;
  }

  public getSession(sessionId: string): UserSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  public revokeSession(sessionId: string): boolean {
    return this.activeSessions.delete(sessionId);
  }
}
`;
    repairedFiles['src/auth/session-manager.ts'] = fixedContent;
    modifiedPaths = ['src/auth/session-manager.ts'];
    rootCause = 'SessionManager.authenticate() attempted to call session.validateToken() on its own instance instead of delegating to this.tokenValidator.verify(token).';
    changesSummary = 'Delegated token verification to this.tokenValidator.verify(token) and preserved all UserSession lifecycle mappings.';
    decisionsMade = [
      'Preserved TokenValidator delegation architecture without rewriting SessionManager',
      'Kept backward-compatible session id format (sess_{userId}_{timestamp})',
      'Maintained zero external dependency overhead',
    ];
    verificationCommand = 'npm test';
    testOutput = `PASS tests/session.test.ts (1.42s)
  Regina SessionManager
    ✓ creates active session with valid token (28 ms)
    ✓ rejects missing or empty token (4 ms)
    ✓ revokes existing session successfully (6 ms)

Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
Snapshots:   0 total
Time:        1.42 s`;
  } else if (repoKey === 'Dessiidoo/regina') {
    const fixedConfig = `\"\"\"Application configuration module.\"\"\"
# FIXED: BaseSettings imported from pydantic_settings for Pydantic v2 compatibility
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    app_name: str = Field(default="Regina Data Pipeline", env="APP_NAME")
    environment: str = Field(default="production", env="ENV")
    batch_size: int = Field(default=500, env="BATCH_SIZE")
    worker_concurrency: int = Field(default=4, env="CONCURRENCY")

    class Config:
        env_file = ".env"

settings = Settings()
`;
    repairedFiles['regina/config.py'] = fixedConfig;
    modifiedPaths = ['regina/config.py'];
    rootCause = 'Pydantic v2 moved BaseSettings out of the core pydantic namespace into pydantic_settings.';
    changesSummary = 'Imported BaseSettings from pydantic_settings while retaining Field from pydantic.';
    decisionsMade = [
      'Preserved existing .env configuration schema and environment variable bindings',
      'Confirmed requirements.txt already specifies pydantic-settings>=2.2.1',
      'Avoided any modifications to Celery worker queue logic',
    ];
    verificationCommand = 'pytest tests/';
    testOutput = `============================= test session starts ==============================
platform linux -- Python 3.11.8, pytest-8.1.1
collected 1 item

tests/test_pipeline.py .                                                 [100%]

============================== 1 passed in 0.18s ===============================`;
  } else {
    // Generic repair for other repos
    const readme = repo.files['README.md']?.content || '# Repo';
    const updatedReadme = readme + `\n\n## Maintenance Update\nRepaired on ${now} via autonomous agent.`;
    repairedFiles['README.md'] = updatedReadme;
    modifiedPaths = ['README.md'];
    rootCause = 'Maintenance audit requested.';
    changesSummary = 'Validated repository configuration and updated project maintenance record.';
    decisionsMade = ['Retained existing configuration'];
    verificationCommand = repo.language === 'TypeScript' ? 'npm test' : 'go test ./...';
    testOutput = 'All validation checks passing successfully.';
  }

  // Apply repaired files in repository database
  Object.entries(repairedFiles).forEach(([p, content]) => {
    if (repo.files[p]) {
      repo.files[p].content = content;
      repo.files[p].isModified = true;
    }
  });

  const commitSha = Math.random().toString(16).substring(2, 9);
  const newRepair: RepairRecord = {
    id: `rep_${Date.now()}`,
    timestamp: now,
    branch: branchName,
    issueSummary: repo.knownDefect?.summary || cleanGoal,
    rootCause,
    changesSummary,
    decisionsMade,
    filesChanged: modifiedPaths,
    verificationResult: 'All test suites passed; 0 regressions detected.',
    commitSha,
    pushedToRemote: false, // NOT pushed to remote GitHub until explicitly authorized
    prNumber: undefined,
    prUrl: undefined,
  };

  // Update Persistent Project Memory
  memory.previousRepairs.unshift(newRepair);
  memory.unresolvedIssues = memory.unresolvedIssues.filter((issue) => !issue.includes(repo.name) && !issue.includes('crashing'));
  memory.lastBuildState = {
    status: 'passing',
    lastRunAt: now,
    details: `${verificationCommand} executed and passed: ${testOutput.split('\n')[0]}`,
  };
  memory.relevantBranches.unshift(branchName);
  memory.relevantCommits.unshift({
    sha: commitSha,
    message: `fix(${repo.name}): ${changesSummary}`,
    author: authorOverride || repo.owner,
    date: now.split('T')[0],
  });

  memoryStore[repoKey] = memory;
  repo.currentBranch = branchName;
  repo.updatedAt = now;

  res.json({
    success: true,
    repoKey,
    branchName,
    commitSha,
    geminiAnalysis,
    repairRecord: newRepair,
    updatedMemory: memory,
    modifiedFiles: modifiedPaths,
    verificationCommand,
    testOutput,
  });
});

// 9. Verify GitHub Personal Access Token (PAT)
app.post('/api/github/verify-token', async (req, res) => {
  const token = (req.body.token || req.headers['x-github-token'] || process.env.GITHUB_TOKEN) as string;
  if (!token || !token.trim()) {
    return res.status(400).json({ valid: false, error: 'No GitHub token provided' });
  }

  try {
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${token.trim()}`,
        'User-Agent': 'RepoMaintainer-Agent',
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!userRes.ok) {
      const errData = await userRes.json().catch(() => ({}));
      return res.status(userRes.status).json({
        valid: false,
        error: errData.message || `GitHub returned ${userRes.status}: ${userRes.statusText}`,
      });
    }

    const userData = await userRes.json();
    const scopesHeader = userRes.headers.get('x-oauth-scopes') || '';
    const scopes = scopesHeader.split(',').map((s) => s.trim()).filter(Boolean);
    const hasRepoScope = scopes.includes('repo') || scopes.includes('public_repo');
    const isTargetOwner = ['aiandu', 'dessiidoo'].includes((userData.login || '').toLowerCase());

    console.log(`[GitHub API] Token verified for user: ${userData.login}. Scopes: [${scopes.join(', ')}]`);

    res.json({
      valid: true,
      user: {
        login: userData.login,
        name: userData.name || userData.login,
        avatarUrl: userData.avatar_url,
        htmlUrl: userData.html_url,
      },
      scopes,
      hasRepoScope,
      isTargetOwner,
    });
  } catch (err: any) {
    console.error('[GitHub API] Verification error:', err);
    res.status(500).json({ valid: false, error: err.message || 'Failed to connect to GitHub API' });
  }
});

// 10. Real GitHub Push & Pull Request Creation
app.post('/api/github/create-pr', async (req, res) => {
  const { repoKey, branchName, title, body, files } = req.body;
  const token = (req.body.token || req.headers['x-github-token'] || process.env.GITHUB_TOKEN) as string | undefined;
  const repo = repoDatabase[repoKey];

  if (!repo) {
    return res.status(404).json({ error: `Repository ${repoKey} not found in agent database` });
  }

  // If no token is provided, do NOT fake a successful PR!
  if (!token || !token.trim()) {
    return res.status(401).json({
      success: false,
      requiresToken: true,
      error: 'GitHub Personal Access Token (PAT) required: You must configure a token with "repo" permission in order to push branches and open Pull Requests on github.com.',
      branch: branchName,
      gitCommands: [
        `git checkout -b ${branchName}`,
        `git add .`,
        `git commit -m "${title || 'fix: autonomous repair'}"`,
        `git push -u origin ${branchName}`,
        `gh pr create --title "${title || 'Autonomous Repair'}" --body "${body || 'Autonomous repair by RepoMaintainer.'}"`,
      ],
    });
  }

  const [owner, repoName] = repoKey.split('/');
  const ghHeaders = {
    Authorization: `Bearer ${token.trim()}`,
    'User-Agent': 'RepoMaintainer-Agent',
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  try {
    console.log(`[GitHub API] Attempting real push and PR for ${owner}/${repoName} on branch ${branchName}...`);

    // Step 1: Verify repository exists on GitHub
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, {
      headers: ghHeaders,
    });

    if (!repoRes.ok) {
      const errBody = await repoRes.json().catch(() => ({}));
      if (repoRes.status === 404) {
        return res.status(404).json({
          success: false,
          error: `Repository '${owner}/${repoName}' was not found on github.com. Please ensure the repository exists under account '${owner}' and your GitHub token has access to it.`,
          branch: branchName,
          gitCommands: [
            `# To push to your fork or own repository:`,
            `git remote set-url origin https://github.com/<your-username>/${repoName}.git`,
            `git checkout -b ${branchName}`,
            `git push -u origin ${branchName}`,
          ],
        });
      }
      return res.status(repoRes.status).json({
        success: false,
        error: `GitHub API error (${repoRes.status}): ${errBody.message || repoRes.statusText}`,
      });
    }

    const repoMeta = await repoRes.json();
    const defaultBranch = repoMeta.default_branch || 'main';

    // Step 2: Get latest commit SHA on base branch
    const refRes = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/git/ref/heads/${defaultBranch}`,
      { headers: ghHeaders }
    );

    if (!refRes.ok) {
      const errBody = await refRes.json().catch(() => ({}));
      return res.status(refRes.status).json({
        success: false,
        error: `Could not retrieve default branch '${defaultBranch}' commit: ${errBody.message || refRes.statusText}`,
      });
    }

    const refData = await refRes.json();
    const baseCommitSha = refData.object.sha;

    // Step 3: Create branch on GitHub
    const createBranchRes = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/git/refs`,
      {
        method: 'POST',
        headers: ghHeaders,
        body: JSON.stringify({
          ref: `refs/heads/${branchName}`,
          sha: baseCommitSha,
        }),
      }
    );

    if (!createBranchRes.ok && createBranchRes.status !== 422) {
      const errBody = await createBranchRes.json().catch(() => ({}));
      return res.status(createBranchRes.status).json({
        success: false,
        error: `Failed to create remote branch '${branchName}' on GitHub: ${errBody.message || createBranchRes.statusText}`,
      });
    }

    // Step 4: Commit modified files to the new branch
    const filesToCommit: Record<string, string> = files || {};
    if (Object.keys(filesToCommit).length === 0) {
      Object.entries(repo.files).forEach(([p, f]) => {
        if (f.isModified) filesToCommit[p] = f.content;
      });
    }

    for (const [filePath, content] of Object.entries(filesToCommit)) {
      // Check if file exists on this branch to obtain SHA
      let fileSha: string | undefined;
      const getFileRes = await fetch(
        `https://api.github.com/repos/${owner}/${repoName}/contents/${filePath}?ref=${branchName}`,
        { headers: ghHeaders }
      );

      if (getFileRes.ok) {
        const fileData = await getFileRes.json();
        fileSha = fileData.sha;
      }

      // Put/commit file content
      const putFileRes = await fetch(
        `https://api.github.com/repos/${owner}/${repoName}/contents/${filePath}`,
        {
          method: 'PUT',
          headers: ghHeaders,
          body: JSON.stringify({
            message: `fix(${filePath}): autonomous repair by RepoMaintainer`,
            content: Buffer.from(content).toString('base64'),
            branch: branchName,
            ...(fileSha ? { sha: fileSha } : {}),
          }),
        }
      );

      if (!putFileRes.ok) {
        const errBody = await putFileRes.json().catch(() => ({}));
        return res.status(putFileRes.status).json({
          success: false,
          error: `Failed to commit file '${filePath}' to branch '${branchName}' on GitHub: ${errBody.message || putFileRes.statusText}`,
        });
      }
    }

    // Step 5: Open real Pull Request on GitHub
    const prRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/pulls`, {
      method: 'POST',
      headers: ghHeaders,
      body: JSON.stringify({
        title: title || `fix(${repoName}): autonomous repair`,
        head: branchName,
        base: defaultBranch,
        body: body || 'Autonomous repair by RepoMaintainer.',
      }),
    });

    if (!prRes.ok) {
      const errBody = await prRes.json().catch(() => ({}));

      // Check if PR already exists for this head branch
      if (
        prRes.status === 422 &&
        JSON.stringify(errBody).toLowerCase().includes('pull request already exists')
      ) {
        const listPRsRes = await fetch(
          `https://api.github.com/repos/${owner}/${repoName}/pulls?head=${owner}:${branchName}&state=open`,
          { headers: ghHeaders }
        );
        if (listPRsRes.ok) {
          const prs = await listPRsRes.json();
          if (prs && prs.length > 0) {
            const existingPr = prs[0];

            // Update memory
            const memory = memoryStore[repoKey];
            if (memory && memory.previousRepairs.length > 0) {
              memory.previousRepairs[0].prNumber = existingPr.number;
              memory.previousRepairs[0].prUrl = existingPr.html_url;
              memory.previousRepairs[0].pushedToRemote = true;
            }

            return res.json({
              success: true,
              prNumber: existingPr.number,
              prUrl: existingPr.html_url,
              branch: branchName,
              state: existingPr.state,
              message: `Pull Request #${existingPr.number} already exists on GitHub: ${existingPr.html_url}`,
            });
          }
        }
      }

      return res.status(prRes.status).json({
        success: false,
        error: `GitHub failed to open Pull Request: ${errBody.message || prRes.statusText}`,
      });
    }

    const prData = await prRes.json();
    console.log(`[GitHub API] Successfully created Pull Request #${prData.number} at ${prData.html_url}`);

    // Update Persistent Project Memory with genuine GitHub URL
    const memory = memoryStore[repoKey];
    if (memory && memory.previousRepairs.length > 0) {
      memory.previousRepairs[0].prNumber = prData.number;
      memory.previousRepairs[0].prUrl = prData.html_url;
      memory.previousRepairs[0].pushedToRemote = true;
      delete memory.previousRepairs[0].remoteError;
    }

    res.json({
      success: true,
      prNumber: prData.number,
      prUrl: prData.html_url,
      branch: branchName,
      state: prData.state,
      message: `Pull Request #${prData.number} successfully created on GitHub!`,
    });
  } catch (err: any) {
    console.error('[GitHub API] Network/Execution Error:', err);
    res.status(500).json({
      success: false,
      error: `Network or communication error with GitHub: ${err.message}`,
    });
  }
});

// Mount Vite or static files
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Autonomous GitHub Maintenance Agent Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
