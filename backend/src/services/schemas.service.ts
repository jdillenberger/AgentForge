import { ConfigService } from '../config/app.config';
import { FilesService } from './files.service';
import { SchemaInfo, TemplateInfo, CreateTemplateFileRequest, CreateFileRequest } from '../types/api.types';
import { UserContext } from '../types/domain.types';
import { NotFoundError, SchemaRepositoryError } from '../errors/app-errors';
import { GitBasedSchemaRepositoryService } from './git-schema-repository.service';

/**
 * Schemas and templates service
 */
export class SchemasService {
  private readonly config = ConfigService.getInstance();
  private readonly filesService = new FilesService();
  private readonly schemaRepositoryService: GitBasedSchemaRepositoryService;

  constructor() {
    // Initialize the same schema repository service as the old implementation
    const schemaRepoConfig = this.config.getSchemaRepoConfig();
    
    // Map the configuration properly for GitBasedSchemaRepositoryService
    const gitSchemaConfig = {
      ...schemaRepoConfig,
      repoType: schemaRepoConfig.type, // Map 'type' to 'repoType'
      gitUrl: schemaRepoConfig.gitUrl, // This should already match
    };
    
    this.schemaRepositoryService = new GitBasedSchemaRepositoryService(gitSchemaConfig);
  }

  /**
   * List all available schemas
   */
  public async listSchemas(): Promise<SchemaInfo[]> {
    try {
      // Use the same service as the old implementation
      return await this.schemaRepositoryService.getSchemas();
    } catch (error: unknown) {
      throw new SchemaRepositoryError('Failed to list schemas', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Get specific schema by ID
   */
  public async getSchema(schemaId: string): Promise<any> {
    try {
      // Return the raw schema from the repository service (same as old implementation)
      return await this.schemaRepositoryService.getSchema(schemaId);
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new SchemaRepositoryError(`Failed to get schema ${schemaId}`, error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * List all available templates (optionally filtered by schema type)
   */
  public async listTemplates(schemaType?: string): Promise<TemplateInfo[]> {
    try {
      // Use the same service as the old implementation, passing schemaType for filtering
      const templates = await this.schemaRepositoryService.getTemplates(schemaType);
      
      return templates.map(template => ({
        id: template.id,
        name: template.name,  // Add name field for frontend compatibility
        title: template.name,
        description: template.description,
        schemaType: template.schemaType,
        content: template.content,
        tags: [], // TODO: Add tags support to repository
      }));
    } catch (error: unknown) {
      throw new SchemaRepositoryError('Failed to list templates', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Get specific template by ID
   */
  public async getTemplate(templateId: string): Promise<TemplateInfo> {
    try {
      const template = await this.schemaRepositoryService.getTemplate(templateId);
      
      if (!template) {
        throw new NotFoundError(`Template ${templateId} not found`);
      }
      
      return {
        id: template.id,
        name: template.name,  // Add name field for frontend compatibility
        title: template.name,
        description: template.description,
        schemaType: template.schemaType,
        content: template.content,
        tags: [], // TODO: Add tags support to repository
      };
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new SchemaRepositoryError(`Failed to get template ${templateId}`, error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Create file from template
   */
  public async createFromTemplate(
    templateId: string,
    request: CreateTemplateFileRequest,
    user?: UserContext,
    namespace?: string
  ): Promise<{ sha: string; path: string; content: string }> {
    try {
      // Validate template values (using schemaRepositoryService like the old implementation)
      const validation = await this.schemaRepositoryService.validateTemplateValues(templateId, request.templateValues);
      if (!validation.valid) {
        throw new SchemaRepositoryError(`Template validation failed: ${validation.errors.join(', ')}`);
      }
      
      // Render template (using schemaRepositoryService like the old implementation)
      const processedContent = await this.schemaRepositoryService.renderTemplate(templateId, request.templateValues);
      
      // Create file using FilesService
      const createFileRequest: CreateFileRequest = {
        filename: request.filename,
        content: processedContent,
        namespace: request.namespace || namespace,
      };
      
      const result = await this.filesService.createFile(createFileRequest, user, namespace);
      
      return {
        sha: result.sha,
        path: result.path,
        content: processedContent,
      };
    } catch (error: unknown) {
      throw new SchemaRepositoryError(`Failed to create file from template ${templateId}`, error instanceof Error ? error : new Error(String(error)));
    }
  }

}