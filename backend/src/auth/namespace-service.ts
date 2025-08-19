import { NamespaceConfig, NamespaceContext, UserInfo } from './types';

export class NamespaceService {
  private config: NamespaceConfig;

  constructor() {
    this.config = {
      enabled: process.env.NAMESPACE_ENABLED === 'true',
      userClaim: process.env.NAMESPACE_USER_CLAIM || 'sub',
      groupsClaim: process.env.NAMESPACE_GROUPS_CLAIM || 'groups',
      defaultNamespace: process.env.DEFAULT_NAMESPACE || 'shared',
    };
  }

  /**
   * Check if namespace separation is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Get namespace configuration
   */
  getConfig(): NamespaceConfig {
    return { ...this.config };
  }

  /**
   * Extract namespace context from user information
   */
  createNamespaceContext(user?: UserInfo): NamespaceContext {
    if (!this.config.enabled || !user) {
      return {
        userId: 'anonymous',
        userGroups: [],
        availableNamespaces: [this.config.defaultNamespace],
        defaultNamespace: this.config.defaultNamespace,
      };
    }

    // Extract user ID from the configured claim
    const userId = this.extractUserClaim(user);
    
    // Extract groups from the configured claim
    const userGroups = this.extractGroupsClaim(user);

    // Available namespaces = user's personal namespace + all their groups
    const availableNamespaces = [userId, ...userGroups];

    return {
      userId,
      userGroups,
      availableNamespaces,
      defaultNamespace: userId, // User's personal namespace is default
    };
  }

  /**
   * Extract user identifier from user info based on configured claim
   */
  private extractUserClaim(user: UserInfo): string {
    const claimValue = user[this.config.userClaim as keyof UserInfo];
    
    if (typeof claimValue === 'string') {
      // Sanitize for filesystem usage - replace special characters with hyphens
      return claimValue.replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase();
    }
    
    // Fallback to sub if configured claim is not available
    if (user.sub) {
      return user.sub.replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase();
    }
    
    return 'unknown-user';
  }

  /**
   * Extract groups from user info based on configured claim
   */
  private extractGroupsClaim(user: UserInfo): string[] {
    const claimValue = user[this.config.groupsClaim as keyof UserInfo];
    
    if (Array.isArray(claimValue)) {
      // Sanitize group names for filesystem usage
      return claimValue
        .filter(group => typeof group === 'string')
        .map(group => group.replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase());
    }
    
    return [];
  }

  /**
   * Validate if a namespace is accessible by the user
   */
  isNamespaceAccessible(namespace: string, context: NamespaceContext): boolean {
    if (!this.config.enabled) {
      return true; // No restrictions when namespace separation is disabled
    }
    
    return context.availableNamespaces.includes(namespace);
  }

  /**
   * Get the full file path with namespace prefix
   */
  getNamespacedPath(filePath: string, namespace: string): string {
    if (!this.config.enabled) {
      return filePath;
    }
    
    // If path already includes namespace, return as-is
    if (filePath.startsWith(`${namespace}/`)) {
      return filePath;
    }
    
    // Add namespace prefix
    return `${namespace}/${filePath}`;
  }

  /**
   * Extract namespace from a file path
   */
  extractNamespaceFromPath(filePath: string): { namespace: string; relativePath: string } {
    if (!this.config.enabled) {
      return {
        namespace: this.config.defaultNamespace,
        relativePath: filePath,
      };
    }
    
    const pathParts = filePath.split('/');
    if (pathParts.length > 1) {
      return {
        namespace: pathParts[0],
        relativePath: pathParts.slice(1).join('/'),
      };
    }
    
    return {
      namespace: this.config.defaultNamespace,
      relativePath: filePath,
    };
  }

  /**
   * Filter file list to only include files from accessible namespaces
   */
  filterFilesByNamespace<T extends { path: string }>(
    files: T[],
    context: NamespaceContext
  ): T[] {
    if (!this.config.enabled) {
      return files;
    }
    
    return files.filter(file => {
      const { namespace } = this.extractNamespaceFromPath(file.path);
      return this.isNamespaceAccessible(namespace, context);
    });
  }
}

// Export singleton instance
export const namespaceService = new NamespaceService();