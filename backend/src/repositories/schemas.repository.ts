import { BaseRepository } from './base.repository';
import { SchemaInfo, TemplateInfo } from '../types/domain.types';
import { NotFoundError } from '../errors/app-errors';
import { GitBasedSchemaRepositoryService, GitSchemaRepositoryConfig } from '../services/git-schema-repository.service';

/**
 * Schemas repository - handles schema and template operations
 */
export class SchemasRepository extends BaseRepository {
  private gitSchemaService: GitBasedSchemaRepositoryService;

  constructor() {
    super();
    
    // Initialize Git-based schema repository service
    const schemaConfig = this.config.getSchemaRepoConfig();
    const gitSchemaConfig: GitSchemaRepositoryConfig = {
      enabled: schemaConfig.enabled,
      localFallback: schemaConfig.localFallback,
      cacheTimeout: schemaConfig.cacheTimeout,
      repoType: schemaConfig.type as 'git' | 'api',
      gitUrl: process.env.SCHEMA_REPO_URL,
      pullInterval: parseInt(process.env.SCHEMA_PULL_INTERVAL || '300'),
      shallowClone: process.env.SCHEMA_SHALLOW_CLONE === 'true',
      autoCleanup: process.env.SCHEMA_AUTO_CLEANUP === 'true',
    };

    this.gitSchemaService = new GitBasedSchemaRepositoryService(gitSchemaConfig);
  }

  /**
   * List all available schemas
   */
  public async listSchemas(): Promise<SchemaInfo[]> {
    const schemaConfig = this.config.getSchemaRepoConfig();
    
    if (!schemaConfig.enabled) {
      return [];
    }

    try {
      // Use the Git-based schema repository service
      const schemas = await this.gitSchemaService.getSchemas();
      
      // Convert from the service format to our domain format
      return schemas.map(schema => ({
        id: schema.id,
        name: schema.title,
        description: schema.description,
        version: schema.version || '1.0.0',
        fields: [], // TODO: Extract fields from schema if needed
      }));
    } catch (error) {
      console.error('Failed to get schemas from Git repository:', error);
      
      // Fall back to hardcoded schemas if Git fails
      return [
        {
          id: 'user-story',
          name: 'User Story',
          description: 'Template for writing user stories',
          version: '1.0.0',
          fields: [
            { name: 'title', type: 'string', required: true },
            { name: 'description', type: 'string', required: true },
            { name: 'acceptanceCriteria', type: 'string[]', required: false },
          ],
        },
        {
          id: 'bug-report',
          name: 'Bug Report',
          description: 'Template for reporting bugs',
          version: '1.0.0',
          fields: [
            { name: 'title', type: 'string', required: true },
            { name: 'description', type: 'string', required: true },
            { name: 'steps', type: 'string[]', required: true },
            { name: 'expected', type: 'string', required: true },
            { name: 'actual', type: 'string', required: true },
          ],
        },
      ];
    }
  }

  /**
   * Get specific schema
   */
  public async getSchema(schemaId: string): Promise<SchemaInfo> {
    const schemas = await this.listSchemas();
    const schema = schemas.find(s => s.id === schemaId);
    
    if (!schema) {
      throw new NotFoundError(`Schema not found: ${schemaId}`);
    }
    
    return schema;
  }

  /**
   * List all available templates
   */
  public async listTemplates(): Promise<TemplateInfo[]> {
    const schemaConfig = this.config.getSchemaRepoConfig();
    
    if (!schemaConfig.enabled) {
      return [];
    }

    try {
      // Use the Git-based schema repository service to get templates
      const templates = await this.gitSchemaService.getTemplates();
      
      // Convert from service format to our domain format
      return templates.map(template => ({
        id: template.id,
        name: template.name,
        description: template.description,
        schemaId: template.schemaType,
        content: template.content,
        variables: Object.keys(template.frontmatter || {}),
      }));
    } catch (error) {
      console.error('Failed to get templates from Git repository:', error);
      
      // Fall back to hardcoded templates if Git fails
      return [
        {
          id: 'user-story-basic',
          name: 'Basic User Story',
          description: 'Simple user story template',
          schemaId: 'user-story',
          content: '# {{title}}\n\n**As a** user\n**I want** {{description}}\n**So that** I can achieve my goal\n\n## Acceptance Criteria\n{{#each acceptanceCriteria}}\n- {{this}}\n{{/each}}',
          variables: ['title', 'description', 'acceptanceCriteria'],
        },
        {
          id: 'bug-report-detailed',
          name: 'Detailed Bug Report',
          description: 'Comprehensive bug report template',
          schemaId: 'bug-report',
          content: '# Bug: {{title}}\n\n## Description\n{{description}}\n\n## Steps to Reproduce\n{{#each steps}}\n{{@index}}. {{this}}\n{{/each}}\n\n## Expected Result\n{{expected}}\n\n## Actual Result\n{{actual}}',
          variables: ['title', 'description', 'steps', 'expected', 'actual'],
        },
      ];
    }
  }

  /**
   * Get specific template
   */
  public async getTemplate(templateId: string): Promise<TemplateInfo> {
    const templates = await this.listTemplates();
    const template = templates.find(t => t.id === templateId);
    
    if (!template) {
      throw new NotFoundError(`Template not found: ${templateId}`);
    }
    
    return template;
  }

  /**
   * Render template with provided values
   */
  public async renderTemplate(templateId: string, values: Record<string, any>): Promise<string> {
    const template = await this.getTemplate(templateId);
    
    // Simple template rendering (in production, use a proper template engine like Handlebars)
    let content = template.content;
    
    // Replace simple variables {{variable}}
    for (const [key, value] of Object.entries(values)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      content = content.replace(regex, String(value || ''));
    }
    
    // Handle arrays with {{#each array}} syntax (simplified)
    for (const [key, value] of Object.entries(values)) {
      if (Array.isArray(value)) {
        const eachRegex = new RegExp(`\\{\\{#each ${key}\\}\\}([\\s\\S]*?)\\{\\{/each\\}\\}`, 'g');
        content = content.replace(eachRegex, (match, itemTemplate) => {
          return value.map((item: unknown, index: number) => {
            return itemTemplate
              .replace(/\{\{this\}\}/g, String(item))
              .replace(/\{\{@index\}\}/g, String(index + 1));
          }).join('\n');
        });
      }
    }
    
    return content;
  }

  /**
   * Validate template values against schema
   */
  public async validateTemplateValues(templateId: string, values: Record<string, any>): Promise<{ valid: boolean; errors: string[] }> {
    const template = await this.getTemplate(templateId);
    const schema = await this.getSchema(template.schemaId);
    
    const errors: string[] = [];
    
    // Check required fields
    for (const field of schema.fields || []) {
      if (field.required && (!values[field.name] || values[field.name] === '')) {
        errors.push(`Field '${field.name}' is required`);
      }
      
      // Basic type checking
      if (values[field.name] !== undefined && values[field.name] !== null) {
        const value = values[field.name];
        
        if (field.type === 'string' && typeof value !== 'string') {
          errors.push(`Field '${field.name}' must be a string`);
        } else if (field.type === 'string[]' && (!Array.isArray(value) || !value.every(item => typeof item === 'string'))) {
          errors.push(`Field '${field.name}' must be an array of strings`);
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
}