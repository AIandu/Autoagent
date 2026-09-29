import { RepositoryData, GitHubAccount } from '../types';

export const GITHUB_ACCOUNTS: GitHubAccount[] = [
  {
    username: 'AIandu',
    name: 'AI & Autonomous Systems Engineering',
    avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
    repoCount: 8,
  },
  {
    username: 'Dessiidoo',
    name: 'Dessiidoo Cloud & Applied Pipelines',
    avatarUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=120&auto=format&fit=crop&q=80',
    repoCount: 6,
  },
];

export const INITIAL_REPOSITORIES: Record<string, RepositoryData> = {
  'AIandu/regina': {
    owner: 'AIandu',
    name: 'regina',
    fullName: 'AIandu/regina',
    description: 'Autonomous Session Gateway and Distributed Event Bus for microservices',
    defaultBranch: 'main',
    currentBranch: 'main',
    isPrivate: false,
    stars: 34,
    language: 'TypeScript',
    updatedAt: '2026-09-27T14:20:00Z',
    knownDefect: {
      summary: 'TypeError: session.validateToken is not a function and unhandled async error in SessionManager',
      failingCommand: 'npm test',
      expectedError: 'FAIL tests/session.test.ts\nTypeError: session.validateToken is not a function\n    at SessionManager.authenticate (src/auth/session-manager.ts:42:25)',
      rootCause: 'session-manager.ts invokes session.validateToken directly, but the TokenValidator helper was refactored into session.tokenValidator.verify() in the previous major version without updating the calling site.',
      fixStrategy: 'Refactor session-manager.ts to use this.tokenValidator.verify(token) and add a defensive null check on the decoded payload.'
    },
    files: {
      'package.json': {
        path: 'package.json',
        language: 'json',
        content: JSON.stringify(
          {
            name: 'regina',
            version: '2.4.1',
            description: 'Autonomous Session Gateway and Distributed Event Bus',
            main: 'dist/index.js',
            scripts: {
              test: 'jest --ci',
              build: 'tsc -p tsconfig.json',
              lint: 'eslint src/**/*.ts',
            },
            dependencies: {
              express: '^4.19.2',
              jsonwebtoken: '^9.0.2',
              dotenv: '^16.4.5',
            },
            devDependencies: {
              jest: '^29.7.0',
              typescript: '^5.4.5',
              '@types/jest': '^29.5.12',
              '@types/jsonwebtoken': '^9.0.6',
            },
          },
          null,
          2
        ),
      },
      'README.md': {
        path: 'README.md',
        language: 'markdown',
        content: `# Regina (AIandu)

> High-throughput Autonomous Session Gateway & Event Coordinator.

## Overview
Regina handles token revocation checks, distributed session tracking, and tenant isolation for AIandu's microservice fleet.

## Tech Stack
- TypeScript 5.4 + Node.js 20+
- Express REST API & WebSocket listener
- Jest for unit and integration testing
- Deployed on Google Cloud Run with Redis cluster
`,
      },
      'src/auth/token-validator.ts': {
        path: 'src/auth/token-validator.ts',
        language: 'typescript',
        content: `export interface TokenPayload {
  userId: string;
  role: string;
  tenantId: string;
  exp: number;
}

export class TokenValidator {
  private secret: string;

  constructor(secret: string = process.env.JWT_SECRET || 'regina-default-dev-secret') {
    this.secret = secret;
  }

  public verify(token: string): TokenPayload | null {
    if (!token || typeof token !== 'string') {
      return null;
    }
    // Token structure verification
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    try {
      const payloadDecoded = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
      if (payloadDecoded.exp && payloadDecoded.exp < Math.floor(Date.now() / 1000)) {
        return null; // Expired
      }
      return payloadDecoded as TokenPayload;
    } catch {
      return null;
    }
  }
}
`,
      },
      'src/auth/session-manager.ts': {
        path: 'src/auth/session-manager.ts',
        language: 'typescript',
        content: `import { TokenValidator, TokenPayload } from './token-validator';

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

    // BUG: Old code mistakenly calls session.validateToken instead of this.tokenValidator.verify
    const session = this as any;
    const payload = session.validateToken(token);

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
`,
      },
      'tests/session.test.ts': {
        path: 'tests/session.test.ts',
        language: 'typescript',
        content: `import { SessionManager } from '../src/auth/session-manager';

describe('Regina SessionManager', () => {
  let manager: SessionManager;

  beforeEach(() => {
    manager = new SessionManager();
  });

  test('creates active session with valid token', async () => {
    // Dummy JWT with userId 'usr_ai_402'
    const payload = { userId: 'usr_ai_402', role: 'engineer', tenantId: 'ten_global', exp: Math.floor(Date.now() / 1000) + 3600 };
    const dummyJwt = \`header.\${Buffer.from(JSON.stringify(payload)).toString('base64')}.signature\`;

    const session = await manager.authenticate(dummyJwt);
    expect(session).toBeDefined();
    expect(session.user.userId).toBe('usr_ai_402');
    expect(manager.getSession(session.sessionId)).toBeDefined();
  });

  test('rejects missing or empty token', async () => {
    await expect(manager.authenticate('')).rejects.toThrow('Token is required');
  });

  test('revokes existing session successfully', async () => {
    const payload = { userId: 'usr_ai_77', role: 'admin', tenantId: 'ten_hq', exp: Math.floor(Date.now() / 1000) + 3600 };
    const dummyJwt = \`header.\${Buffer.from(JSON.stringify(payload)).toString('base64')}.signature\`;

    const session = await manager.authenticate(dummyJwt);
    const revoked = manager.revokeSession(session.sessionId);
    expect(revoked).toBe(true);
    expect(manager.getSession(session.sessionId)).toBeUndefined();
  });
});
`,
      },
    },
    memory: {
      id: 'AIandu/regina',
      repoName: 'regina',
      owner: 'AIandu',
      purpose: 'Autonomous Session Gateway and Distributed Event Bus for microservices',
      architecture: 'Node.js 20 microservice using Express, TypeScript, in-memory distributed session maps with Redis fallback',
      techStack: ['TypeScript', 'Node.js', 'Express', 'Jest', 'JWT', 'Redis'],
      importantDirectories: ['src/auth', 'tests', 'config'],
      importantFiles: [
        { path: 'src/auth/session-manager.ts', purpose: 'Handles tenant token verification and session lifecycle' },
        { path: 'src/auth/token-validator.ts', purpose: 'Low-level JWT parsing and cryptographic signature checking' },
        { path: 'tests/session.test.ts', purpose: 'Test coverage for session creation, validation and revocation' },
      ],
      deploymentPlatform: 'Google Cloud Run (us-central1) with automated CI/CD via GitHub Actions',
      knownExternalServices: ['Redis Cluster', 'GCP Secret Manager'],
      previousRepairs: [
        {
          id: 'rep_001',
          timestamp: '2026-08-14T10:15:00Z',
          branch: 'fix/token-expiration-boundary',
          issueSummary: 'Off-by-one second token expiration rejected immediate valid logins',
          rootCause: 'Strict inequality comparison failed when token exp equaled server timestamp',
          changesSummary: 'Relaxed boundary in token-validator.ts to include grace window',
          decisionsMade: ['Kept token format backwards compatible', 'Added 5-second clock drift tolerance'],
          filesChanged: ['src/auth/token-validator.ts'],
          verificationResult: 'All 3 test suites passed; 0 regressions reported',
          commitSha: 'a4f891b',
        },
      ],
      unresolvedIssues: ['Session authentication crashing in unit tests due to missing method on session object'],
      lastBuildState: {
        status: 'failing',
        lastRunAt: '2026-09-27T14:18:22Z',
        details: 'npm test failed: TypeError: session.validateToken is not a function at SessionManager.authenticate',
      },
      relevantBranches: ['main', 'fix/token-expiration-boundary'],
      relevantCommits: [
        { sha: '7e2c99a', message: 'refactor: isolate TokenValidator class helper', author: 'AIandu', date: '2026-09-27' },
        { sha: 'a4f891b', message: 'fix: token expiration clock drift tolerance', author: 'AIandu', date: '2026-08-14' },
      ],
    },
  },

  'Dessiidoo/regina': {
    owner: 'Dessiidoo',
    name: 'regina',
    fullName: 'Dessiidoo/regina',
    description: 'Python / FastAPI asynchronous streaming ingest pipeline and dataset worker',
    defaultBranch: 'main',
    currentBranch: 'main',
    isPrivate: false,
    stars: 19,
    language: 'Python',
    updatedAt: '2026-09-28T09:40:00Z',
    knownDefect: {
      summary: 'PydanticImportError: BaseSettings has been moved to pydantic-settings package in Pydantic v2',
      failingCommand: 'pytest tests/',
      expectedError: 'ImportError: cannot import name \'BaseSettings\' from \'pydantic\' (pydantic/__init__.py)\n  File "regina/config.py", line 4, in <module>\n    from pydantic import BaseSettings, Field',
      rootCause: 'The project upgraded to Pydantic v2.x, but regina/config.py still imports BaseSettings directly from pydantic instead of pydantic_settings.',
      fixStrategy: 'Update regina/config.py to import BaseSettings from pydantic_settings and ensure requirements.txt includes pydantic-settings.'
    },
    files: {
      'requirements.txt': {
        path: 'requirements.txt',
        language: 'text',
        content: `fastapi>=0.110.0
uvicorn>=0.28.0
pydantic>=2.6.4
pydantic-settings>=2.2.1
pytest>=8.1.1
httpx>=0.27.0
`,
      },
      'README.md': {
        path: 'README.md',
        language: 'markdown',
        content: `# Regina (Dessiidoo)

> Asynchronous high-throughput data ingestion worker built on Python & FastAPI.

## Tech Stack
- Python 3.11+
- FastAPI & Pydantic v2
- Pytest for test suites
- Deployed on AWS ECS Fargate
`,
      },
      'regina/config.py': {
        path: 'regina/config.py',
        language: 'python',
        content: `"""Application configuration module."""
# BUG: In Pydantic v2, BaseSettings must be imported from pydantic_settings
from pydantic import BaseSettings, Field

class Settings(BaseSettings):
    app_name: str = Field(default="Regina Data Pipeline", env="APP_NAME")
    environment: str = Field(default="production", env="ENV")
    batch_size: int = Field(default=500, env="BATCH_SIZE")
    worker_concurrency: int = Field(default=4, env="CONCURRENCY")

    class Config:
        env_file = ".env"

settings = Settings()
`,
      },
      'regina/pipeline.py': {
        path: 'regina/pipeline.py',
        language: 'python',
        content: `from regina.config import settings

class PipelineWorker:
    def __init__(self):
        self.batch_size = settings.batch_size
        self.queue = []

    def ingest(self, records: list) -> dict:
        processed = len(records)
        return {
            "status": "success",
            "records_processed": processed,
            "batch_size": self.batch_size,
        }
`,
      },
      'tests/test_pipeline.py': {
        path: 'tests/test_pipeline.py',
        language: 'python',
        content: `from regina.pipeline import PipelineWorker

def test_pipeline_ingest():
    worker = PipelineWorker()
    records = [{"id": 1, "value": "sample"}, {"id": 2, "value": "data"}]
    result = worker.ingest(records)
    assert result["status"] == "success"
    assert result["records_processed"] == 2
`,
      },
    },
    memory: {
      id: 'Dessiidoo/regina',
      repoName: 'regina',
      owner: 'Dessiidoo',
      purpose: 'Python / FastAPI asynchronous streaming ingest pipeline and dataset worker',
      architecture: 'Async Python 3.11 backend with FastAPI, Pydantic configuration, Celery worker pool',
      techStack: ['Python', 'FastAPI', 'Pydantic v2', 'Pytest', 'Docker'],
      importantDirectories: ['regina', 'tests'],
      importantFiles: [
        { path: 'regina/config.py', purpose: 'Environment variable loading and app settings' },
        { path: 'regina/pipeline.py', purpose: 'Core batch ingestion worker logic' },
        { path: 'requirements.txt', purpose: 'Python package dependency definitions' },
      ],
      deploymentPlatform: 'AWS ECS Fargate with SQS queue triggers',
      knownExternalServices: ['AWS S3', 'AWS SQS'],
      previousRepairs: [
        {
          id: 'rep_002',
          timestamp: '2026-07-20T16:00:00Z',
          branch: 'fix/fastapi-concurrency-leak',
          issueSummary: 'Memory spike during large batch ingests',
          rootCause: 'Unbounded list accumulation in worker memory',
          changesSummary: 'Added automatic queue draining after batch threshold',
          decisionsMade: ['Flushed queue every 500 records'],
          filesChanged: ['regina/pipeline.py'],
          verificationResult: 'Memory tests stable under 250MB under sustained 5k records/sec load',
          commitSha: 'c88102d',
        },
      ],
      unresolvedIssues: ['Pydantic v2 migration import error breaking test suite execution'],
      lastBuildState: {
        status: 'failing',
        lastRunAt: '2026-09-28T09:35:10Z',
        details: 'pytest failed: ImportError: cannot import name BaseSettings from pydantic',
      },
      relevantBranches: ['main', 'fix/fastapi-concurrency-leak'],
      relevantCommits: [
        { sha: 'd9931b2', message: 'chore: bump dependencies to pydantic 2.6', author: 'Dessiidoo', date: '2026-09-28' },
        { sha: 'c88102d', message: 'fix: memory leak on unbounded batch queue', author: 'Dessiidoo', date: '2026-07-20' },
      ],
    },
  },

  'AIandu/agent-core': {
    owner: 'AIandu',
    name: 'agent-core',
    fullName: 'AIandu/agent-core',
    description: 'Autonomous multi-agent runtime and tool execution sandbox',
    defaultBranch: 'main',
    currentBranch: 'main',
    isPrivate: false,
    stars: 58,
    language: 'TypeScript',
    updatedAt: '2026-09-25T11:00:00Z',
    files: {
      'package.json': {
        path: 'package.json',
        language: 'json',
        content: JSON.stringify(
          {
            name: 'agent-core',
            version: '3.0.0',
            scripts: { test: 'jest' },
            dependencies: { express: '^4.19.2' },
          },
          null,
          2
        ),
      },
      'README.md': {
        path: 'README.md',
        language: 'markdown',
        content: '# Agent Core\nAutonomous execution sandbox.',
      },
    },
    memory: {
      id: 'AIandu/agent-core',
      repoName: 'agent-core',
      owner: 'AIandu',
      purpose: 'Multi-agent orchestration and safe execution harness',
      architecture: 'Distributed Node.js microservice with WebSocket state bus',
      techStack: ['TypeScript', 'Node.js', 'Jest'],
      importantDirectories: ['src/runtime', 'src/tools'],
      importantFiles: [{ path: 'package.json', purpose: 'Root manifest' }],
      deploymentPlatform: 'GCP Kubernetes Engine',
      knownExternalServices: ['Gemini API', 'GitHub API'],
      previousRepairs: [],
      unresolvedIssues: [],
      lastBuildState: { status: 'passing', lastRunAt: '2026-09-25T10:55:00Z', details: 'All 14 tests passing' },
      relevantBranches: ['main'],
      relevantCommits: [{ sha: 'b12a88f', message: 'feat: add agent state serialization', author: 'AIandu', date: '2026-09-25' }],
    },
  },

  'Dessiidoo/cloud-sync': {
    owner: 'Dessiidoo',
    name: 'cloud-sync',
    fullName: 'Dessiidoo/cloud-sync',
    description: 'Multi-cloud state synchronization engine for hybrid storage',
    defaultBranch: 'main',
    currentBranch: 'main',
    isPrivate: false,
    stars: 22,
    language: 'Go',
    updatedAt: '2026-09-24T18:30:00Z',
    files: {
      'go.mod': {
        path: 'go.mod',
        language: 'text',
        content: `module github.com/Dessiidoo/cloud-sync\n\ngo 1.22\n`,
      },
      'README.md': {
        path: 'README.md',
        language: 'markdown',
        content: '# Cloud Sync\nHybrid cloud state sync.',
      },
    },
    memory: {
      id: 'Dessiidoo/cloud-sync',
      repoName: 'cloud-sync',
      owner: 'Dessiidoo',
      purpose: 'Hybrid cloud file synchronization and deduplication service',
      architecture: 'Go 1.22 concurrent streaming daemon',
      techStack: ['Go', 'gRPC', 'PostgreSQL'],
      importantDirectories: ['pkg/sync', 'cmd/daemon'],
      importantFiles: [{ path: 'go.mod', purpose: 'Go modules manifest' }],
      deploymentPlatform: 'AWS EKS',
      knownExternalServices: ['AWS S3', 'GCS Bucket'],
      previousRepairs: [],
      unresolvedIssues: [],
      lastBuildState: { status: 'passing', lastRunAt: '2026-09-24T18:00:00Z', details: 'go test ./... passed' },
      relevantBranches: ['main'],
      relevantCommits: [{ sha: 'f901cb4', message: 'init: sync worker daemon', author: 'Dessiidoo', date: '2026-09-24' }],
    },
  },
};
