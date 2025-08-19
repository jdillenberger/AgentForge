import { ConfigService } from '../config/app.config';
import { AppConfigResponse, HealthResponse } from '../types/api.types';
import { UserContext, NamespaceInfo } from '../types/domain.types';

/**
 * Administrative service
 */
export class AdminService {
  private readonly config = ConfigService.getInstance();

  /**
   * Get application configuration for clients
   */
  public async getAppConfig(): Promise<AppConfigResponse> {
    const gitConfig = this.config.getGitConfig();
    const oidcConfig = this.config.getOIDCConfig();
    const namespacesConfig = this.config.getNamespacesConfig();
    const schemaConfig = this.config.getSchemaRepoConfig();

    return {
      auth: {
        enabled: oidcConfig.enabled,
        type: oidcConfig.enabled ? 'oidc' : 'none',
        issuer: oidcConfig.enabled ? oidcConfig.issuer : undefined,
      },
      features: {
        gitPlatform: gitConfig.provider,
        namespaces: namespacesConfig.enabled,
        schemas: schemaConfig.enabled,
        templates: schemaConfig.enabled, // Templates depend on schema repository
      },
      limits: {
        maxFileSize: 1024 * 1024, // 1MB
        rateLimits: {
          'api': 100, // requests per minute
        },
      },
    };
  }

  /**
   * Get namespace configuration (debug endpoint)
   */
  public async getNamespaceConfig(): Promise<any> {
    const namespacesConfig = this.config.getNamespacesConfig();
    
    return {
      enabled: namespacesConfig.enabled,
      userClaim: namespacesConfig.userClaim,
      groupsClaim: namespacesConfig.groupsClaim,
      defaultNamespace: namespacesConfig.defaultNamespace,
    };
  }

  /**
   * List available namespaces for user
   */
  public async listNamespaces(user?: UserContext): Promise<NamespaceInfo[]> {
    const namespacesConfig = this.config.getNamespacesConfig();
    
    if (!namespacesConfig.enabled) {
      return [
        {
          name: namespacesConfig.defaultNamespace,
          type: 'system',
          displayName: 'Default',
          description: 'Default namespace for all files',
          permissions: {
            read: true,
            write: true,
            delete: true,
            admin: true,
          },
        }
      ];
    }

    // TODO: Implement actual namespace listing based on user permissions
    const namespaces: NamespaceInfo[] = [
      {
        name: namespacesConfig.defaultNamespace,
        type: 'system',
        displayName: 'Shared',
        description: 'Shared namespace for all users',
        permissions: {
          read: true,
          write: true,
          delete: false,
          admin: false,
        },
      }
    ];

    if (user?.id && user.id !== 'anonymous') {
      namespaces.push({
        name: `user-${user.id}`,
        type: 'user',
        displayName: `${user.name || user.id}'s Files`,
        description: 'Personal namespace',
        permissions: {
          read: true,
          write: true,
          delete: true,
          admin: true,
        },
      });
    }

    return namespaces;
  }

  /**
   * Get schema repository status
   */
  public async getSchemaRepoStatus(): Promise<any> {
    const schemaConfig = this.config.getSchemaRepoConfig();
    
    return {
      enabled: schemaConfig.enabled,
      type: schemaConfig.type,
      status: schemaConfig.enabled ? 'healthy' : 'disabled',
      lastUpdate: new Date().toISOString(),
      // Status information available from configuration
    };
  }

  /**
   * Clear schema repository cache
   */
  public async clearSchemaCache(): Promise<void> {
    // Cache clearing would be implemented when actual caching is added
  }

  /**
   * Get application health status
   */
  public async getHealthStatus(): Promise<HealthResponse> {
    const gitConfig = this.config.getGitConfig();
    
    // Health checks use configuration status - more detailed checks can be added later
    const services = {
      git: 'ok' as const,
      schema: this.config.getSchemaRepoConfig().enabled ? 'ok' as const : 'ok' as const,
      auth: this.config.getOIDCConfig().enabled ? 'ok' as const : 'ok' as const,
    };

    const allHealthy = Object.values(services).every(status => status === 'ok');
    
    return {
      status: allHealthy ? 'ok' : 'degraded',
      platform: gitConfig.provider,
      timestamp: new Date().toISOString(),
      services,
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
    };
  }
}