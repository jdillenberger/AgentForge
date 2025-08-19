import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { FilesService } from '../services/files.service';
import { AuthenticatedRequest, UserInfo, NamespaceContext } from '../auth/types';
import { ValidationError, NotFoundError } from '../errors/app-errors';
import { CreateFileRequest, UpdateFileRequest, MoveFileRequest, ListFilesQuery } from '../types/api.types';
import { UserContext } from '../types/domain.types';

/**
 * Files controller
 */
export class FilesController extends BaseController {
  private readonly filesService = new FilesService();

  /**
   * Convert UserInfo to UserContext
   */
  private convertUser(userInfo?: UserInfo): UserContext | undefined {
    if (!userInfo) return undefined;
    return {
      id: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name,
      groups: userInfo.groups,
    };
  }

  /**
   * Extract namespace string from NamespaceContext
   */
  private extractNamespace(namespace?: NamespaceContext): string | undefined {
    return namespace?.defaultNamespace;
  }

  /**
   * List files
   */
  public async listFiles(req: AuthenticatedRequest, res: Response): Promise<void> {
    const query: ListFilesQuery = {
      namespace: req.query.namespace as string,
      schemaType: req.query.schemaType as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 50,
      search: req.query.search as string,
    };

    // Pass available namespaces from authenticated user context
    const availableNamespaces = req.namespace?.availableNamespaces;
    const files = await this.filesService.listFiles(query, availableNamespaces);
    this.success(res, files);
  }

  /**
   * Get single file
   */
  public async getFile(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { filename } = req.params;
    
    if (!filename) {
      throw new ValidationError('Filename is required');
    }

    const file = await this.filesService.getFile(filename, this.extractNamespace(req.namespace));
    this.success(res, file);
  }

  /**
   * Create file
   */
  public async createFile(req: AuthenticatedRequest, res: Response): Promise<void> {
    const createRequest: CreateFileRequest = req.body;
    
    if (!createRequest.filename || !createRequest.content) {
      throw new ValidationError('Filename and content are required');
    }

    const result = await this.filesService.createFile(
      createRequest,
      this.convertUser(req.user),
      this.extractNamespace(req.namespace)
    );
    
    this.success(res, result, 'File created successfully');
  }

  /**
   * Update file
   */
  public async updateFile(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { filename } = req.params;
    const updateRequest: UpdateFileRequest = req.body;
    
    if (!filename) {
      throw new ValidationError('Filename is required');
    }

    if (!updateRequest.content) {
      throw new ValidationError('Content is required');
    }

    const result = await this.filesService.updateFile(
      filename,
      updateRequest,
      this.convertUser(req.user),
      this.extractNamespace(req.namespace)
    );
    
    this.success(res, result, 'File updated successfully');
  }

  /**
   * Delete file
   */
  public async deleteFile(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { filename } = req.params;
    
    if (!filename) {
      throw new ValidationError('Filename is required');
    }

    await this.filesService.deleteFile(filename, this.convertUser(req.user), this.extractNamespace(req.namespace));
    this.success(res, { deleted: true }, 'File deleted successfully');
  }

  /**
   * Move/rename file
   */
  public async moveFile(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { filename } = req.params;
    const moveRequest: MoveFileRequest = req.body;
    
    if (!filename || !moveRequest.newFilename) {
      throw new ValidationError('Current filename and new filename are required');
    }

    const result = await this.filesService.moveFile(
      filename,
      moveRequest,
      this.convertUser(req.user),
      this.extractNamespace(req.namespace)
    );
    
    this.success(res, result, 'File moved successfully');
  }

  /**
   * Get file history
   */
  public async getFileHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { filename } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;
    
    if (!filename) {
      throw new ValidationError('Filename is required');
    }

    const history = await this.filesService.getFileHistory(filename, limit, this.extractNamespace(req.namespace));
    this.success(res, history);
  }

  /**
   * Get specific file version
   */
  public async getFileVersion(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { filename, commitSha } = req.params;
    
    if (!filename || !commitSha) {
      throw new ValidationError('Filename and commit SHA are required');
    }

    const fileVersion = await this.filesService.getFileVersion(filename, commitSha, this.extractNamespace(req.namespace));
    this.success(res, fileVersion);
  }
}