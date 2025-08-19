import { GitService } from '../services/git.service';
import { ConfigService } from '../config/app.config';

/**
 * Base repository class with common functionality
 */
export abstract class BaseRepository {
  protected readonly gitService = GitService.getInstance();
  protected readonly config = ConfigService.getInstance();

  /**
   * Get namespace directory path
   */
  protected getNamespacePath(namespace?: string): string {
    const defaultNamespace = this.config.getNamespacesConfig().defaultNamespace;
    const targetNamespace = namespace || defaultNamespace;
    
    // Sanitize namespace to prevent path traversal
    const sanitizedNamespace = targetNamespace.replace(/[^a-zA-Z0-9-_]/g, '_');
    return `${sanitizedNamespace}/`;
  }

  /**
   * Validate file path to prevent path traversal
   */
  protected validatePath(path: string): void {
    if (path.includes('..') || path.includes('/./') || path.startsWith('/')) {
      throw new Error('Invalid file path');
    }
  }

  /**
   * Get full file path with namespace
   */
  protected getFilePath(filename: string, namespace?: string): string {
    this.validatePath(filename);
    const namespacePath = this.getNamespacePath(namespace);
    return `${namespacePath}${filename}`;
  }
}