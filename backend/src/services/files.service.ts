import { ConfigService } from '../config/app.config';
import { GitService } from './git.service';
import { FilesRepository } from '../repositories/files.repository';
import { FileItem, FileContent, FileHistory, CreateFileRequest, UpdateFileRequest, MoveFileRequest, ListFilesQuery } from '../types/api.types';
import { UserContext, FileOperationContext, FileInfo } from '../types/domain.types';
import { NotFoundError, FileOperationError, ValidationError } from '../errors/app-errors';
import { DriverFactory, GitConfig } from '../drivers/driver-factory';
import { parseFilename, getDisplayName, getSchemaType } from '../utils/filename-utils';

/**
 * Files service - handles file operations
 */
export class FilesService {
  private readonly config = ConfigService.getInstance();
  private readonly gitService = GitService.getInstance();
  private readonly filesRepository = new FilesRepository();
  private gitDriver: any; // Use existing git driver temporarily

  constructor() {
    // Initialize the existing git driver for immediate functionality
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
      console.error('Failed to initialize git driver in FilesService:', error);
    }
  }

  /**
   * List files with optional filtering
   */
  public async listFiles(query: ListFilesQuery, availableNamespaces?: string[]): Promise<FileItem[]> {
    try {
      if (!this.gitDriver) {
        return [];
      }

      let files: any[];
      
      // If user has available namespaces (authenticated), get files from all accessible namespaces
      if (availableNamespaces && availableNamespaces.length > 0 && 'getFilesFromNamespaces' in this.gitDriver) {
        files = await this.gitDriver.getFilesFromNamespaces(availableNamespaces);
      } else {
        // Unauthenticated user: get all files and filter for shared namespace only
        files = await this.gitDriver.getFiles();
        
        // Only show files from shared namespace (files without namespace directory prefix)
        files = files.filter((file: any) => {
          // Files in shared namespace are in root directory (no slash in path)
          return !file.path.includes('/');
        });
      }
      
      // Convert to FileItem format
      const fileItems: FileItem[] = files.map((file: any) => {
        const parsed = parseFilename(file.name);
        
        // Extract namespace from file path
        let fileNamespace = 'shared';
        if (file.path.includes('/')) {
          fileNamespace = file.path.split('/')[0];
        }
        
        return {
          name: file.name,
          path: file.path,
          sha: file.sha,
          displayName: getDisplayName(file.name),
          schemaType: getSchemaType(file.name),
          isValidFormat: parsed ? (parsed as any).isValid !== false : true,
          namespace: fileNamespace,
        };
      });

      // Apply search filter
      let filteredFiles = fileItems;
      if (query.search) {
        const searchTerm = query.search.toLowerCase();
        filteredFiles = filteredFiles.filter(file => 
          file.name.toLowerCase().includes(searchTerm) ||
          file.displayName.toLowerCase().includes(searchTerm) ||
          (file.schemaType && file.schemaType.toLowerCase().includes(searchTerm))
        );
      }

      // Apply schema type filter
      if (query.schemaType) {
        filteredFiles = filteredFiles.filter(file => file.schemaType === query.schemaType);
      }

      // Apply pagination
      const page = query.page || 1;
      const limit = query.limit || 50;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      
      return filteredFiles.slice(startIndex, endIndex);
    } catch (error: unknown) {
      throw new FileOperationError('list', 'all files', 'Failed to list files', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Get single file content
   */
  public async getFile(filename: string, namespace?: string): Promise<FileContent> {
    try {
      if (!this.gitDriver) {
        throw new NotFoundError('File', filename);
      }

      // Construct path (namespace/filename or just filename)
      const namespacePath = namespace && namespace !== 'shared' ? `${namespace}/` : '';
      const filePath = `${namespacePath}${filename}`;
      
      const fileData = await this.gitDriver.getFile(filePath);
      
      return {
        name: filename,
        path: filePath,
        sha: fileData.sha,
        content: fileData.content || '',
        frontmatter: this.extractFrontmatter(fileData.content || ''),
        namespace: namespace || 'shared',
      };
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      // Convert git driver errors to NotFoundError
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('not found') || errorMessage.includes('404')) {
        throw new NotFoundError('File', filename);
      }
      throw new FileOperationError('get', filename, 'Failed to get file', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Create new file
   */
  public async createFile(
    request: CreateFileRequest, 
    user?: UserContext, 
    namespace?: string
  ): Promise<{ sha: string; path: string }> {
    try {
      const targetNamespace = request.namespace || namespace;
      const result = await this.filesRepository.createFile(request.filename, request.content, targetNamespace);
      
      return result;
    } catch (error: unknown) {
      throw new FileOperationError('create', request.filename, 'Failed to create file', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Update existing file
   */
  public async updateFile(
    filename: string,
    request: UpdateFileRequest,
    user?: UserContext,
    namespace?: string
  ): Promise<{ sha: string; path: string }> {
    try {
      if (!this.gitDriver) {
        throw new NotFoundError('File', filename);
      }

      // Construct path (namespace/filename or just filename)
      const namespacePath = namespace && namespace !== 'shared' ? `${namespace}/` : '';
      const filePath = `${namespacePath}${filename}`;
      
      // Get current file to ensure it exists and get its SHA
      const fileData = await this.gitDriver.getFile(filePath);
      
      // Update the file via GitHub API
      // Note: The git driver expects (filePath, frontmatter, content, sha)
      const result = await this.gitDriver.updateFile(
        filePath, 
        request.frontmatter || {},  // frontmatter 
        request.content,           // content
        fileData.sha              // current SHA
      );
      
      return {
        sha: result.sha,
        path: filePath,
      };
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      // Convert git driver errors to NotFoundError for 404s
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('not found') || errorMessage.includes('404')) {
        throw new NotFoundError('File', filename);
      }
      throw new FileOperationError('update', filename, 'Failed to update file', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Delete file
   */
  public async deleteFile(filename: string, user?: UserContext, namespace?: string): Promise<void> {
    try {
      if (!this.gitDriver) {
        throw new NotFoundError('File', filename);
      }

      // Construct path (namespace/filename or just filename)
      const namespacePath = namespace && namespace !== 'shared' ? `${namespace}/` : '';
      const filePath = `${namespacePath}${filename}`;
      
      // Get current file to ensure it exists and get its SHA
      const fileData = await this.gitDriver.getFile(filePath);
      
      // Delete the file via GitHub API
      const commitMessage = `Delete ${filename}`;
      const author = user ? { 
        name: user.name || user.id, 
        email: user.email || `${user.id}@example.com` 
      } : { 
        name: 'System', 
        email: 'system@example.com' 
      };
      
      await this.gitDriver.deleteFile(filePath, fileData.sha, commitMessage, author);
      
    } catch (error: unknown) {
      console.error('FilesService.deleteFile error:', error);
      if (error instanceof NotFoundError) {
        throw error;
      }
      // Convert git driver errors to NotFoundError for 404s
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('not found') || errorMessage.includes('404')) {
        throw new NotFoundError('File', filename);
      }
      throw new FileOperationError('delete', filename, 'Failed to delete file', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Move/rename file
   */
  public async moveFile(
    filename: string,
    request: MoveFileRequest,
    user?: UserContext,
    namespace?: string
  ): Promise<{ sha: string; oldPath: string; newPath: string }> {
    try {
      await this.filesRepository.moveFile(filename, request.newFilename, namespace);
      
      // TODO: Commit the change to git
      // const commitMessage = `Move ${filename} to ${request.newFilename}`;
      // const author = user ? { name: user.name || user.id, email: user.email || `${user.id}@example.com` } : undefined;
      // await this.gitService.commit(commitMessage, author);
      
      return {
        sha: 'moved-file-sha',
        oldPath: `${namespace}/${filename}`,
        newPath: `${namespace}/${request.newFilename}`,
      };
    } catch (error: unknown) {
      throw new FileOperationError('move', filename, 'Failed to move file', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Get file history
   */
  public async getFileHistory(filename: string, limit: number, namespace?: string): Promise<FileHistory[]> {
    try {
      if (!this.gitDriver) {
        return [];
      }

      // Construct path (namespace/filename or just filename)
      const namespacePath = namespace && namespace !== 'shared' ? `${namespace}/` : '';
      const filePath = `${namespacePath}${filename}`;
      
      const commits = await this.gitDriver.getFileHistory(filePath);
      
      // Return the same format as the old server (raw GitHub API response)
      return commits.slice(0, limit);
    } catch (error: unknown) {
      console.error('FilesService.getFileHistory error:', error);
      throw new FileOperationError('history', filename, 'Failed to get file history', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Get specific file version
   */
  public async getFileVersion(filename: string, commitSha: string, namespace?: string): Promise<FileContent> {
    try {
      if (!this.gitDriver) {
        throw new NotFoundError('File', filename);
      }

      // Construct path (namespace/filename or just filename)
      const namespacePath = namespace && namespace !== 'shared' ? `${namespace}/` : '';
      const filePath = `${namespacePath}${filename}`;
      
      // Get actual historical file content from GitHub API
      const historicalFile = await this.gitDriver.getFileAtCommit(filePath, commitSha);
      
      return {
        name: filename,
        path: filePath,
        sha: commitSha,
        content: historicalFile.content || '',
        frontmatter: historicalFile.frontmatter || this.extractFrontmatter(historicalFile.content || ''),
        namespace: namespace || this.config.getNamespacesConfig().defaultNamespace,
      };
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      // Convert git driver errors to NotFoundError for 404s
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('not found') || errorMessage.includes('404')) {
        throw new NotFoundError('File', filename);
      }
      throw new FileOperationError('version', filename, 'Failed to get file version', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Extract frontmatter from file content
   */
  private extractFrontmatter(content: string): Record<string, any> {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      return {};
    }

    try {
      // Simple YAML-like parsing (in production, use a proper YAML parser)
      const frontmatterText = frontmatterMatch[1];
      const frontmatter: Record<string, any> = {};
      
      frontmatterText.split('\n').forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          const key = line.substring(0, colonIndex).trim();
          const value = line.substring(colonIndex + 1).trim().replace(/^["']|["']$/g, '');
          frontmatter[key] = value;
        }
      });
      
      return frontmatter;
    } catch {
      return {};
    }
  }
}