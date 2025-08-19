import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, extname, basename } from 'path';
import { GitDriver, GitConfig } from '../drivers/driver-factory';

export interface SchemaInfo {
  id: string;
  title: string;
  description: string;
  version?: string;
}

export interface TemplateInfo {
  id: string;
  name: string;
  description: string;
  schemaType: string;
  content: string;
  frontmatter: Record<string, any>;
}

export interface SchemaRepositoryConfig {
  enabled: boolean;
  gitConfig?: GitConfig;
  localFallback: boolean;
  cacheTimeout: number; // in seconds
}

export class SchemaRepositoryService {
  protected driver?: GitDriver;
  protected config: SchemaRepositoryConfig;
  protected schemaCache: Map<string, any> = new Map();
  protected templateCache: Map<string, TemplateInfo[]> = new Map();
  protected lastCacheUpdate: number = 0;

  constructor(config: SchemaRepositoryConfig, driver?: GitDriver) {
    this.config = config;
    this.driver = driver;
  }

  /**
   * Get all available schemas
   */
  async getSchemas(): Promise<SchemaInfo[]> {
    try {
      // Try remote first if enabled
      if (this.config.enabled && this.driver) {
        const schemas = await this.getRemoteSchemas();
        if (schemas.length > 0) {
          return schemas;
        }
      }
    } catch (error) {
      console.warn('Failed to fetch remote schemas, falling back to local:', error);
    }

    // Fallback to local schemas
    if (this.config.localFallback) {
      return this.getLocalSchemas();
    }

    throw new Error('Schema repository unavailable and local fallback disabled');
  }

  /**
   * Get a specific schema by ID
   */
  async getSchema(schemaId: string): Promise<any> {
    try {
      // Try remote first if enabled
      if (this.config.enabled && this.driver) {
        const schema = await this.getRemoteSchema(schemaId);
        if (schema) {
          return schema;
        }
      }
    } catch (error) {
      console.warn(`Failed to fetch remote schema ${schemaId}, falling back to local:`, error);
    }

    // Fallback to local schema
    if (this.config.localFallback) {
      return this.getLocalSchema(schemaId);
    }

    throw new Error(`Schema ${schemaId} not found`);
  }

  /**
   * Get all templates for a specific schema type
   */
  async getTemplates(schemaType?: string): Promise<TemplateInfo[]> {
    try {
      // Try remote first if enabled
      if (this.config.enabled && this.driver) {
        const templates = await this.getRemoteTemplates(schemaType);
        if (templates.length > 0) {
          return templates;
        }
      }
    } catch (error) {
      console.warn('Failed to fetch remote templates, falling back to local:', error);
    }

    // Return empty array as there are no local templates yet
    return [];
  }

  /**
   * Get a specific template by ID
   */
  async getTemplate(templateId: string): Promise<TemplateInfo | null> {
    try {
      // Try remote first if enabled
      if (this.config.enabled && this.driver) {
        const template = await this.getRemoteTemplate(templateId);
        if (template) {
          return template;
        }
      }
    } catch (error) {
      console.warn(`Failed to fetch remote template ${templateId}:`, error);
    }

    // Return null as there are no local templates yet
    return null;
  }

  private async getRemoteSchemas(): Promise<SchemaInfo[]> {
    if (!this.driver) {
      throw new Error('Git driver not configured');
    }

    // Check cache first
    if (this.isCacheValid()) {
      const cached = Array.from(this.schemaCache.values());
      if (cached.length > 0) {
        return cached.map(schema => ({
          id: schema.id,
          title: schema.title,
          description: schema.description,
          version: schema.version
        }));
      }
    }

    try {
      // Get all files and filter for schemas directory
      const allFiles = await this.driver.getFiles();
      const schemaFiles = allFiles.filter(file => 
        file.path.startsWith('schemas/') && extname(file.name) === '.json'
      );
      const schemas: SchemaInfo[] = [];

      for (const file of schemaFiles) {
        try {
          const content = await this.driver.getFile(file.path);
          const schema = JSON.parse(content.content);
          const id = basename(file.name, '.json');
          
          const schemaInfo: SchemaInfo = {
            id,
            title: schema.title || id,
            description: schema.description || '',
            version: schema.version
          };

          schemas.push(schemaInfo);
          
          // Cache the full schema
          this.schemaCache.set(id, schema);
        } catch (error) {
          console.warn(`Failed to parse schema file ${file.name}:`, error);
        }
      }

      this.lastCacheUpdate = Date.now();
      return schemas;
    } catch (error) {
      console.error('Failed to fetch remote schemas:', error);
      throw error;
    }
  }

  private async getRemoteSchema(schemaId: string): Promise<any> {
    if (!this.driver) {
      throw new Error('Git driver not configured');
    }

    // Check cache first
    if (this.isCacheValid() && this.schemaCache.has(schemaId)) {
      return this.schemaCache.get(schemaId);
    }

    try {
      const content = await this.driver.getFile(`schemas/${schemaId}.json`);
      const schema = JSON.parse(content.content);
      
      // Cache the schema
      this.schemaCache.set(schemaId, schema);
      this.lastCacheUpdate = Date.now();
      
      return schema;
    } catch (error) {
      console.error(`Failed to fetch remote schema ${schemaId}:`, error);
      throw error;
    }
  }

  private async getRemoteTemplates(schemaType?: string): Promise<TemplateInfo[]> {
    if (!this.driver) {
      throw new Error('Git driver not configured');
    }

    const cacheKey = schemaType || 'all';
    
    // Check cache first
    if (this.isCacheValid() && this.templateCache.has(cacheKey)) {
      return this.templateCache.get(cacheKey) || [];
    }

    try {
      const templates: TemplateInfo[] = [];
      
      if (schemaType) {
        // Get templates for specific schema type
        const allFiles = await this.driver.getFiles();
        const templateFiles = allFiles.filter(file => 
          file.path.startsWith(`templates/${schemaType}/`) && extname(file.name) === '.md'
        );
        for (const file of templateFiles) {
          const template = await this.parseTemplate(file, schemaType);
          if (template) {
            templates.push(template);
          }
        }
      } else {
        // Get all templates
        const allFiles = await this.driver.getFiles();
        const templateFiles = allFiles.filter(file => 
          file.path.startsWith('templates/') && extname(file.name) === '.md'
        );
        for (const file of templateFiles) {
          // Extract schema type from path: templates/schemaType/template.md
          const pathParts = file.path.split('/');
          if (pathParts.length >= 3) {
            const type = pathParts[1];
            const template = await this.parseTemplate(file, type);
            if (template) {
              templates.push(template);
            }
          }
        }
      }

      // Cache the results
      this.templateCache.set(cacheKey, templates);
      this.lastCacheUpdate = Date.now();
      
      return templates;
    } catch (error) {
      console.error('Failed to fetch remote templates:', error);
      throw error;
    }
  }

  private async getRemoteTemplate(templateId: string): Promise<TemplateInfo | null> {
    if (!this.driver) {
      throw new Error('Git driver not configured');
    }

    const [schemaType, templateName] = templateId.split('/');
    if (!schemaType || !templateName) {
      throw new Error('Invalid template ID format. Expected: schemaType/templateName');
    }

    try {
      const fileName = templateName.endsWith('.md') ? templateName : `${templateName}.md`;
      const filePath = `templates/${schemaType}/${fileName}`;
      
      const allFiles = await this.driver.getFiles();
      const file = allFiles.find(f => f.path === filePath);
      
      if (!file) {
        return null;
      }
      
      return await this.parseTemplate(file, schemaType);
    } catch (error) {
      console.error(`Failed to fetch remote template ${templateId}:`, error);
      throw error;
    }
  }

  private async parseTemplate(file: any, schemaType: string): Promise<TemplateInfo | null> {
    try {
      const content = await this.driver!.getFile(file.path);
      
      // Parse frontmatter
      const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
      const match = content.content.match(frontmatterRegex);
      
      let frontmatter: Record<string, any> = {};
      let markdownContent = content.content;
      
      if (match) {
        try {
          const yaml = require('js-yaml');
          frontmatter = yaml.load(match[1]) || {};
          markdownContent = match[2];
        } catch (yamlError) {
          console.warn(`Failed to parse YAML frontmatter in ${file.path}:`, yamlError);
        }
      }
      
      const templateName = basename(file.name, '.md');
      
      return {
        id: `${schemaType}/${templateName}`,
        name: templateName,
        description: frontmatter.description || frontmatter.title || 'No description available',
        schemaType,
        content: markdownContent,
        frontmatter
      };
    } catch (error) {
      console.warn(`Failed to parse template ${file.path}:`, error);
      return null;
    }
  }

  private getLocalSchemas(): SchemaInfo[] {
    const schemasDir = join(__dirname, '../schemas');
    if (!existsSync(schemasDir)) {
      return [];
    }

    const schemas: SchemaInfo[] = [];
    const files = readdirSync(schemasDir);

    for (const file of files) {
      if (extname(file) === '.json') {
        try {
          const schemaPath = join(schemasDir, file);
          const content = readFileSync(schemaPath, 'utf-8');
          const schema = JSON.parse(content);
          const id = basename(file, '.json');
          
          schemas.push({
            id,
            title: schema.title || id,
            description: schema.description || '',
            version: schema.version
          });
        } catch (error) {
          console.warn(`Failed to parse local schema file ${file}:`, error);
        }
      }
    }

    return schemas;
  }

  private getLocalSchema(schemaId: string): any {
    const schemaPath = join(__dirname, '../schemas', `${schemaId}.json`);
    if (!existsSync(schemaPath)) {
      throw new Error(`Schema ${schemaId} not found locally`);
    }

    try {
      const content = readFileSync(schemaPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to parse local schema ${schemaId}: ${error}`);
    }
  }

  private isCacheValid(): boolean {
    if (this.lastCacheUpdate === 0) {
      return false;
    }
    
    const now = Date.now();
    const cacheAge = (now - this.lastCacheUpdate) / 1000; // in seconds
    return cacheAge < this.config.cacheTimeout;
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.schemaCache.clear();
    this.templateCache.clear();
    this.lastCacheUpdate = 0;
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { schemas: number; templates: number; lastUpdate: Date | null } {
    return {
      schemas: this.schemaCache.size,
      templates: Array.from(this.templateCache.values()).reduce((sum, templates) => sum + templates.length, 0),
      lastUpdate: this.lastCacheUpdate > 0 ? new Date(this.lastCacheUpdate) : null
    };
  }
}