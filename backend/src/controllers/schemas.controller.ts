import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { SchemasService } from '../services/schemas.service';
import { AuthenticatedRequest, UserInfo, NamespaceContext } from '../auth/types';
import { ValidationError } from '../errors/app-errors';
import { CreateTemplateFileRequest } from '../types/api.types';
import { UserContext } from '../types/domain.types';

/**
 * Schemas and templates controller
 */
export class SchemasController extends BaseController {
  private readonly schemasService = new SchemasService();

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
   * List all schemas
   */
  public async listSchemas(req: Request, res: Response): Promise<void> {
    const schemas = await this.schemasService.listSchemas();
    this.success(res, schemas);
  }

  /**
   * Get specific schema
   */
  public async getSchema(req: Request, res: Response): Promise<void> {
    const { schemaId } = req.params;
    
    if (!schemaId) {
      throw new ValidationError('Schema ID is required');
    }

    const schema = await this.schemasService.getSchema(schemaId);
    this.success(res, schema);
  }

  /**
   * List all templates (optionally filtered by schema type)
   */
  public async listTemplates(req: Request, res: Response): Promise<void> {
    const { schemaType } = req.query;
    const templates = await this.schemasService.listTemplates(schemaType as string);
    this.success(res, templates);
  }

  /**
   * Get specific template
   */
  public async getTemplate(req: Request, res: Response): Promise<void> {
    const { templateId } = req.params;
    
    if (!templateId) {
      throw new ValidationError('Template ID is required');
    }

    const template = await this.schemasService.getTemplate(templateId);
    this.success(res, template);
  }

  /**
   * Create file from template
   */
  public async createFromTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { templateId } = req.params;
    const createRequest: CreateTemplateFileRequest = req.body;
    
    if (!templateId || !createRequest.filename || !createRequest.templateValues) {
      throw new ValidationError('Template ID, filename, and template values are required');
    }

    const result = await this.schemasService.createFromTemplate(
      templateId,
      createRequest,
      this.convertUser(req.user),
      this.extractNamespace(req.namespace)
    );
    
    this.success(res, result, 'File created from template successfully');
  }
}