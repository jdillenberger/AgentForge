import { z } from 'zod';

// Configuration schemas for validation
const gitProviderSchema = z.enum(['github', 'gitlab', 'gitea']);
const schemaRepoTypeSchema = z.enum(['api', 'git']);

// Git configuration schema
const gitConfigSchema = z.object({
  provider: gitProviderSchema,
  github: z.object({
    token: z.string().min(1, 'GitHub token is required'),
    owner: z.string().min(1, 'GitHub owner is required'),
    repo: z.string().min(1, 'GitHub repo is required'),
    baseUrl: z.string().optional(),
  }).optional(),
  gitlab: z.object({
    token: z.string().min(1, 'GitLab token is required'),
    projectId: z.string().min(1, 'GitLab project ID is required'),
    url: z.string().url().optional(),
  }).optional(),
  gitea: z.object({
    token: z.string().min(1, 'Gitea token is required'),
    owner: z.string().min(1, 'Gitea owner is required'),
    repo: z.string().min(1, 'Gitea repo is required'),
    url: z.string().url().optional(),
  }).optional(),
  path: z.string().optional(),
});

// OIDC configuration schema
const oidcConfigSchema = z.object({
  enabled: z.boolean(),
  issuer: z.string().optional(),
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  redirectUri: z.string().optional(),
});

// Schema repository configuration schema
const schemaRepoConfigSchema = z.object({
  enabled: z.boolean(),
  type: schemaRepoTypeSchema,
  localFallback: z.boolean(),
  cacheTimeout: z.number().min(1),
  gitUrl: z.string().optional(),
  pullInterval: z.number().min(1),
  shallowClone: z.boolean(),
  autoCleanup: z.boolean(),
  api: z.object({
    platform: gitProviderSchema.optional(),
    token: z.string().optional(),
    owner: z.string().optional(),
    repo: z.string().optional(),
    baseUrl: z.string().optional(),
  }),
});

// Main application configuration schema
const appConfigSchema = z.object({
  server: z.object({
    port: z.number().min(1).max(65535),
    nodeEnv: z.enum(['development', 'production', 'test']),
  }),
  security: z.object({
    jwtSecret: z.string().min(32, 'JWT secret must be at least 32 characters'),
    corsOrigin: z.string().optional(),
  }),
  git: gitConfigSchema,
  oidc: oidcConfigSchema,
  schemaRepo: schemaRepoConfigSchema,
  namespaces: z.object({
    enabled: z.boolean(),
    userClaim: z.string(),
    groupsClaim: z.string(),
    defaultNamespace: z.string(),
  }),
  logging: z.object({
    level: z.enum(['error', 'warn', 'info', 'debug']),
  }),
});

export type AppConfig = z.infer<typeof appConfigSchema>;
export type GitConfig = z.infer<typeof gitConfigSchema>;
export type OIDCConfig = z.infer<typeof oidcConfigSchema>;
export type SchemaRepoConfig = z.infer<typeof schemaRepoConfigSchema>;

/**
 * Configuration service that loads and validates application configuration
 * from environment variables with proper type safety and validation.
 */
export class ConfigService {
  private static instance: ConfigService;
  private config: AppConfig;

  private constructor() {
    this.config = this.loadConfig();
  }

  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  /**
   * Get the complete application configuration
   */
  public getConfig(): AppConfig {
    return this.config;
  }

  /**
   * Get server configuration
   */
  public getServerConfig() {
    return this.config.server;
  }

  /**
   * Get Git configuration
   */
  public getGitConfig() {
    return this.config.git;
  }

  /**
   * Get OIDC configuration
   */
  public getOIDCConfig() {
    return this.config.oidc;
  }

  /**
   * Get schema repository configuration
   */
  public getSchemaRepoConfig() {
    return this.config.schemaRepo;
  }

  /**
   * Get security configuration
   */
  public getSecurityConfig() {
    return this.config.security;
  }

  /**
   * Get namespaces configuration
   */
  public getNamespacesConfig() {
    return this.config.namespaces;
  }

  /**
   * Get logging configuration
   */
  public getLoggingConfig() {
    return this.config.logging;
  }

  /**
   * Load and validate configuration from environment variables
   */
  private loadConfig(): AppConfig {
    const rawConfig = {
      server: {
        port: parseInt(process.env.PORT || '3001'),
        nodeEnv: process.env.NODE_ENV || 'development',
      },
      security: {
        jwtSecret: process.env.JWT_SECRET || '',
        corsOrigin: process.env.CORS_ORIGIN,
      },
      git: this.loadGitConfig(),
      oidc: {
        enabled: process.env.OIDC_ENABLED === 'true',
        issuer: process.env.OIDC_ISSUER,
        clientId: process.env.OIDC_CLIENT_ID,
        clientSecret: process.env.OIDC_CLIENT_SECRET,
        redirectUri: process.env.OIDC_REDIRECT_URI,
      },
      schemaRepo: {
        enabled: process.env.SCHEMA_REPO_ENABLED === 'true',
        type: process.env.SCHEMA_REPO_TYPE || 'git',
        localFallback: process.env.SCHEMA_LOCAL_FALLBACK === 'true',
        cacheTimeout: parseInt(process.env.SCHEMA_CACHE_TIMEOUT || '300'),
        gitUrl: process.env.SCHEMA_REPO_URL,
        pullInterval: parseInt(process.env.SCHEMA_PULL_INTERVAL || '300'),
        shallowClone: process.env.SCHEMA_SHALLOW_CLONE === 'true',
        autoCleanup: process.env.SCHEMA_AUTO_CLEANUP === 'true',
        api: {
          platform: process.env.SCHEMA_GIT_PLATFORM,
          token: process.env.SCHEMA_GIT_TOKEN,
          owner: process.env.SCHEMA_GIT_OWNER,
          repo: process.env.SCHEMA_GIT_REPO,
          baseUrl: process.env.SCHEMA_GIT_BASE_URL,
        },
      },
      namespaces: {
        enabled: process.env.NAMESPACE_ENABLED === 'true',
        userClaim: process.env.NAMESPACE_USER_CLAIM || 'sub',
        groupsClaim: process.env.NAMESPACE_GROUPS_CLAIM || 'groups',
        defaultNamespace: process.env.DEFAULT_NAMESPACE || 'shared',
      },
      logging: {
        level: process.env.LOG_LEVEL || 'info',
      },
    };

    try {
      return appConfigSchema.parse(rawConfig);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.issues.map((err: any) => 
          `${err.path.join('.')}: ${err.message}`
        ).join('\n');
        throw new Error(`Configuration validation failed:\n${errorMessages}`);
      }
      throw error;
    }
  }

  /**
   * Load Git provider-specific configuration
   */
  private loadGitConfig(): any {
    const provider = process.env.GIT_PROVIDER;
    
    if (!provider) {
      throw new Error('GIT_PROVIDER environment variable is required');
    }

    const baseConfig = {
      provider,
      path: process.env.GIT_PATH,
    };

    switch (provider) {
      case 'github':
        return {
          ...baseConfig,
          github: {
            token: process.env.GITHUB_TOKEN,
            owner: process.env.GITHUB_OWNER,
            repo: process.env.GITHUB_REPO,
            baseUrl: process.env.GITHUB_BASE_URL,
          },
        };
      case 'gitlab':
        return {
          ...baseConfig,
          gitlab: {
            token: process.env.GITLAB_TOKEN,
            projectId: process.env.GITLAB_PROJECT_ID,
            url: process.env.GITLAB_URL,
          },
        };
      case 'gitea':
        return {
          ...baseConfig,
          gitea: {
            token: process.env.GITEA_TOKEN,
            owner: process.env.GITEA_OWNER,
            repo: process.env.GITEA_REPO,
            url: process.env.GITEA_URL,
          },
        };
      default:
        throw new Error(`Unsupported git provider: ${provider}. Supported providers: github, gitlab, gitea`);
    }
  }
}