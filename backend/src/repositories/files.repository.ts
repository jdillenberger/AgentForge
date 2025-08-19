import { BaseRepository } from './base.repository';
import { FileInfo, GitCommit } from '../types/domain.types';
import { ListFilesQuery } from '../types/api.types';
import { NotFoundError, ValidationError } from '../errors/app-errors';
import { DriverFactory, GitDriver, GitConfig } from '../drivers/driver-factory';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Files repository - handles file operations
 */
export class FilesRepository extends BaseRepository {
  private gitDriver?: GitDriver;

  constructor() {
    super();
    this.initializeGitDriver();
  }

  private initializeGitDriver() {
    try {
      const gitProvider = process.env.GIT_PROVIDER;
      if (!gitProvider) return;

      let token = '', owner = '', repo = '', baseUrl = '';
      
      switch (gitProvider) {
        case 'github':
          token = process.env.GITHUB_TOKEN || '';
          owner = process.env.GITHUB_OWNER || '';
          repo = process.env.GITHUB_REPO || '';
          baseUrl = process.env.GITHUB_BASE_URL || '';
          break;
        case 'gitlab':
          token = process.env.GITLAB_TOKEN || '';
          owner = process.env.GITLAB_PROJECT_ID || '';
          repo = '';
          baseUrl = process.env.GITLAB_URL || '';
          break;
        case 'gitea':
          token = process.env.GITEA_TOKEN || '';
          owner = process.env.GITEA_OWNER || '';
          repo = process.env.GITEA_REPO || '';
          baseUrl = process.env.GITEA_URL || '';
          break;
      }

      const gitConfig: GitConfig = {
        platform: gitProvider as any,
        token,
        owner,
        repo,
        path: process.env.GIT_PATH || '',
        baseUrl,
      };

      if (gitConfig.token && gitConfig.owner && gitConfig.repo) {
        this.gitDriver = DriverFactory.createDriver(gitConfig);
      }
    } catch (error) {
      console.error('Failed to initialize git driver in FilesRepository:', error);
    }
  }
  
  /**
   * List files in namespace
   */
  public async listFiles(query: ListFilesQuery, namespace?: string): Promise<FileInfo[]> {
    const namespacePath = this.getNamespacePath(namespace);
    const gitConfig = this.config.getGitConfig();
    const localPath = gitConfig.path || '/tmp/git-repo';
    const fullPath = path.join(localPath, namespacePath);
    
    try {
      const entries = await fs.readdir(fullPath, { withFileTypes: true });
      let files = entries
        .filter(entry => entry.isFile() && !entry.name.startsWith('.'))
        .map(entry => ({
          name: entry.name,
          path: this.getFilePath(entry.name, namespace),
          size: 0, // Will be populated later if needed
          lastModified: new Date().toISOString(),
          type: this.getFileType(entry.name),
        }));

      // Apply search filter
      if (query.search) {
        const searchTerm = query.search.toLowerCase();
        files = files.filter(file => 
          file.name.toLowerCase().includes(searchTerm) ||
          file.type?.toLowerCase().includes(searchTerm)
        );
      }

      // Apply schema type filter
      if (query.schemaType) {
        files = files.filter(file => file.type === query.schemaType);
      }

      // Apply pagination
      const page = query.page || 1;
      const limit = query.limit || 50;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      
      return files.slice(startIndex, endIndex);
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Get single file content
   */
  public async getFile(filename: string, namespace?: string): Promise<FileInfo> {
    const filePath = this.getFilePath(filename, namespace);
    const gitConfig = this.config.getGitConfig();
    const localPath = gitConfig.path || '/tmp/git-repo';
    const fullPath = path.join(localPath, filePath);
    
    try {
      const stats = await fs.stat(fullPath);
      const content = await fs.readFile(fullPath, 'utf-8');
      
      return {
        name: filename,
        path: filePath,
        content,
        size: stats.size,
        lastModified: stats.mtime.toISOString(),
        type: this.getFileType(filename),
      };
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        throw new NotFoundError(`File not found: ${filename}`);
      }
      throw error;
    }
  }

  /**
   * Create new file
   */
  public async createFile(filename: string, content: string, namespace?: string): Promise<{ sha: string; path: string }> {
    if (!this.gitDriver) {
      throw new Error('Git driver not initialized');
    }

    const filePath = this.getFilePath(filename, namespace);
    
    try {
      // Create file using Git driver
      const result = await this.gitDriver.createFile(filePath, {}, content);
      return {
        sha: result.sha || 'unknown',
        path: filePath
      };
    } catch (error: any) {
      if (error.message && error.message.includes('already exists')) {
        throw new ValidationError(`File already exists: ${filename}`);
      }
      throw error;
    }
  }

  /**
   * Update existing file
   */
  public async updateFile(filename: string, content: string, namespace?: string): Promise<void> {
    const filePath = this.getFilePath(filename, namespace);
    const gitConfig = this.config.getGitConfig();
    const localPath = gitConfig.path || '/tmp/git-repo';
    const fullPath = path.join(localPath, filePath);
    
    // Check if file exists
    try {
      await fs.access(fullPath);
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        throw new NotFoundError(`File not found: ${filename}`);
      }
      throw error;
    }

    // Write file
    await fs.writeFile(fullPath, content, 'utf-8');
  }

  /**
   * Delete file
   */
  public async deleteFile(filename: string, namespace?: string): Promise<void> {
    const filePath = this.getFilePath(filename, namespace);
    const gitConfig = this.config.getGitConfig();
    const localPath = gitConfig.path || '/tmp/git-repo';
    const fullPath = path.join(localPath, filePath);
    
    try {
      await fs.unlink(fullPath);
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        throw new NotFoundError(`File not found: ${filename}`);
      }
      throw error;
    }
  }

  /**
   * Move/rename file
   */
  public async moveFile(oldFilename: string, newFilename: string, namespace?: string): Promise<void> {
    const oldPath = this.getFilePath(oldFilename, namespace);
    const newPath = this.getFilePath(newFilename, namespace);
    const gitConfig = this.config.getGitConfig();
    const localPath = gitConfig.path || '/tmp/git-repo';
    const oldFullPath = path.join(localPath, oldPath);
    const newFullPath = path.join(localPath, newPath);
    
    // Check if source file exists
    try {
      await fs.access(oldFullPath);
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        throw new NotFoundError(`File not found: ${oldFilename}`);
      }
      throw error;
    }

    // Check if target file already exists
    try {
      await fs.access(newFullPath);
      throw new ValidationError(`Target file already exists: ${newFilename}`);
    } catch (error) {
      if ((error as any).code !== 'ENOENT') {
        throw error;
      }
    }

    // Ensure target directory exists
    await fs.mkdir(path.dirname(newFullPath), { recursive: true });
    
    // Move file
    await fs.rename(oldFullPath, newFullPath);
  }

  /**
   * Get file history from git
   */
  public async getFileHistory(filename: string, limit: number, namespace?: string): Promise<GitCommit[]> {
    if (!this.gitDriver) {
      console.warn('Git driver not available in FilesRepository, returning empty history');
      return [];
    }

    try {
      const filePath = this.getFilePath(filename, namespace);
      const history = await this.gitDriver.getFileHistory(filePath);
      
      // Convert from driver format to domain format
      return history.slice(0, limit).map(entry => ({
        sha: entry.sha,
        message: entry.message,
        author: entry.author.name,
        email: entry.author.email,
        date: entry.author.date,
      }));
    } catch (error) {
      console.error(`Failed to get file history for ${filename}:`, error);
      return [];
    }
  }

  /**
   * Get file content at specific commit
   */
  public async getFileVersion(filename: string, commitSha: string, namespace?: string): Promise<FileInfo> {
    const filePath = this.getFilePath(filename, namespace);
    // TODO: Implement actual git file retrieval
    const content = `# Historical Version of ${filename}\\n\\nCommit: ${commitSha}`;
    
    return {
      name: filename,
      path: filePath,
      content,
      size: content.length,
      lastModified: new Date().toISOString(),
      type: this.getFileType(filename),
      version: commitSha,
    };
  }

  /**
   * Determine file type from extension
   */
  private getFileType(filename: string): string | undefined {
    const ext = path.extname(filename).toLowerCase();
    const typeMap: Record<string, string> = {
      '.md': 'markdown',
      '.json': 'json',
      '.yaml': 'yaml',
      '.yml': 'yaml',
      '.txt': 'text',
      '.js': 'javascript',
      '.ts': 'typescript',
      '.py': 'python',
    };
    
    return typeMap[ext];
  }
}