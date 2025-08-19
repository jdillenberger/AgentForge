import { existsSync, readdirSync, readFileSync, rmSync } from 'fs';
import { join, extname, basename } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { SchemaRepositoryService, SchemaInfo, TemplateInfo, SchemaRepositoryConfig } from './schema-repository.service';
import { parseMarkdownWithFrontmatter } from '../utils/yaml-parser';

const execAsync = promisify(exec);

export interface GitSchemaRepositoryConfig extends SchemaRepositoryConfig {
  gitUrl?: string;
  pullInterval?: number; // seconds
  shallowClone?: boolean;
  autoCleanup?: boolean;
  repoType?: 'api' | 'git';
}

export class GitBasedSchemaRepositoryService extends SchemaRepositoryService {
  private repoPath: string;
  private pullInterval: NodeJS.Timeout | null = null;
  private gitConfig: GitSchemaRepositoryConfig;
  private isInitialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;

  constructor(config: GitSchemaRepositoryConfig) {
    super(config);
    this.gitConfig = config;
    this.repoPath = join('/tmp', `schema-repo-${process.pid}-${Date.now()}`);
    
    // Start initialization but don't block constructor
    this.initializationPromise = this.initialize().catch(error => {
      console.error('Failed to initialize Git repository:', error);
      // Don't throw here - let the service fall back to API mode
    });
  }

  private async initialize(): Promise<void> {
    if (this.gitConfig.repoType !== 'git' || !this.gitConfig.gitUrl) {
      console.log('Git mode not enabled or URL not configured, using API mode');
      return;
    }

    try {
      console.log(`Initializing Git-based schema repository at ${this.repoPath}`);
      
      // Ensure repository is available
      await this.ensureRepository();
      
      // Start periodic pull if enabled
      if (this.gitConfig.enabled && this.gitConfig.pullInterval && this.gitConfig.pullInterval > 0) {
        this.startPeriodicPull();
      }
      
      this.isInitialized = true;
      console.log('Git-based schema repository initialized successfully');
    } catch (error) {
      console.error('Git repository initialization failed:', error);
      throw error;
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initializationPromise) {
      await this.initializationPromise;
      this.initializationPromise = null;
    }
  }

  private async ensureRepository(): Promise<void> {
    if (!this.gitConfig.gitUrl) {
      throw new Error('Git URL not configured');
    }

    if (!existsSync(this.repoPath)) {
      await this.cloneRepository();
    } else {
      // Validate existing repository
      try {
        await this.validateRepository();
      } catch (error) {
        console.warn('Existing repository invalid, re-cloning:', error);
        await this.cleanupRepository();
        await this.cloneRepository();
      }
    }
  }

  private async cloneRepository(): Promise<void> {
    if (!this.gitConfig.gitUrl) {
      throw new Error('Git URL not configured');
    }

    console.log(`Cloning schema repository from ${this.gitConfig.gitUrl}`);
    
    try {
      const cloneOptions = [];
      
      if (this.gitConfig.shallowClone !== false) {
        cloneOptions.push('--depth=1');
      }
      
      // Clone with error handling
      const cloneCommand = `git clone ${cloneOptions.join(' ')} "${this.gitConfig.gitUrl}" "${this.repoPath}"`;
      const { stdout, stderr } = await execAsync(cloneCommand, { timeout: 60000 });
      
      if (stderr && !stderr.includes('Cloning into')) {
        console.warn('Git clone warnings:', stderr);
      }
      
      console.log('Repository cloned successfully');
    } catch (error) {
      console.error('Failed to clone repository:', error);
      throw new Error(`Git clone failed: ${error}`);
    }
  }

  private async pullRepository(): Promise<void> {
    try {
      console.log('Pulling latest changes from schema repository');
      
      // Create a new temporary directory for atomic update
      const tempPath = `${this.repoPath}-update-${Date.now()}`;
      
      // Clone fresh copy to temp location
      const cloneOptions = this.gitConfig.shallowClone !== false ? ['--depth=1'] : [];
      const cloneCommand = `git clone ${cloneOptions.join(' ')} "${this.gitConfig.gitUrl}" "${tempPath}"`;
      
      await execAsync(cloneCommand, { timeout: 60000 });
      
      // Atomic swap - backup old, move new
      const backupPath = `${this.repoPath}-backup`;
      
      // Remove old backup if exists
      if (existsSync(backupPath)) {
        rmSync(backupPath, { recursive: true, force: true });
      }
      
      // Move current to backup
      if (existsSync(this.repoPath)) {
        await execAsync(`mv "${this.repoPath}" "${backupPath}"`);
      }
      
      // Move new to current
      await execAsync(`mv "${tempPath}" "${this.repoPath}"`);
      
      // Clear cache to force reload
      this.clearCache();
      
      console.log('Repository updated successfully');
      
      // Cleanup old backup after successful update
      if (this.gitConfig.autoCleanup !== false && existsSync(backupPath)) {
        setTimeout(() => {
          try {
            rmSync(backupPath, { recursive: true, force: true });
          } catch (error) {
            console.warn('Failed to cleanup backup repository:', error);
          }
        }, 5000); // Cleanup after 5 seconds
      }
      
    } catch (error) {
      console.error('Failed to pull repository updates:', error);
      // Don't throw - continue with existing repository
    }
  }

  private async validateRepository(): Promise<void> {
    // Check if schemas directory exists
    const schemasPath = join(this.repoPath, 'schemas');
    if (!existsSync(schemasPath)) {
      throw new Error('Schemas directory not found in repository');
    }
    
    // Check if it's a valid git repository
    const gitPath = join(this.repoPath, '.git');
    if (!existsSync(gitPath)) {
      throw new Error('Not a valid git repository');
    }
  }

  private startPeriodicPull(): void {
    if (this.pullInterval) {
      clearInterval(this.pullInterval);
    }
    
    const intervalMs = (this.gitConfig.pullInterval || 300) * 1000; // Convert to milliseconds
    console.log(`Starting periodic repository updates every ${this.gitConfig.pullInterval || 300} seconds`);
    
    this.pullInterval = setInterval(async () => {
      try {
        await this.pullRepository();
      } catch (error) {
        console.error('Periodic repository pull failed:', error);
      }
    }, intervalMs);
  }

  private async cleanupRepository(): Promise<void> {
    if (existsSync(this.repoPath)) {
      try {
        rmSync(this.repoPath, { recursive: true, force: true });
      } catch (error) {
        console.warn('Failed to cleanup repository:', error);
      }
    }
  }

  // Override parent methods to use Git-based loading

  async getSchemas(): Promise<SchemaInfo[]> {
    await this.ensureInitialized();
    
    if (this.isInitialized && this.gitConfig.repoType === 'git') {
      try {
        return await this.getGitSchemas();
      } catch (error) {
        console.warn('Failed to load schemas from Git, falling back to API:', error);
      }
    }
    
    // Fallback to parent API-based implementation
    return super.getSchemas();
  }

  async getSchema(schemaId: string): Promise<any> {
    await this.ensureInitialized();
    
    if (this.isInitialized && this.gitConfig.repoType === 'git') {
      try {
        return await this.getGitSchema(schemaId);
      } catch (error) {
        console.warn(`Failed to load schema ${schemaId} from Git, falling back to API:`, error);
      }
    }
    
    // Fallback to parent API-based implementation
    return super.getSchema(schemaId);
  }

  async getTemplates(schemaType?: string): Promise<TemplateInfo[]> {
    await this.ensureInitialized();
    
    if (this.isInitialized && this.gitConfig.repoType === 'git') {
      try {
        return await this.getGitTemplates(schemaType);
      } catch (error) {
        console.warn('Failed to load templates from Git, falling back to API:', error);
      }
    }
    
    // Fallback to parent API-based implementation
    return super.getTemplates(schemaType);
  }

  async getTemplate(templateId: string): Promise<TemplateInfo | null> {
    await this.ensureInitialized();
    
    if (this.isInitialized && this.gitConfig.repoType === 'git') {
      try {
        return await this.getGitTemplate(templateId);
      } catch (error) {
        console.warn(`Failed to load template ${templateId} from Git, falling back to API:`, error);
      }
    }
    
    // Fallback to parent API-based implementation
    return super.getTemplate(templateId);
  }

  // Git-based loading methods

  private async getGitSchemas(): Promise<SchemaInfo[]> {
    const schemasPath = join(this.repoPath, 'schemas');
    
    if (!existsSync(schemasPath)) {
      throw new Error('Schemas directory not found');
    }
    
    const files = readdirSync(schemasPath);
    const schemas: SchemaInfo[] = [];
    
    for (const file of files) {
      if (extname(file) === '.json') {
        try {
          const schemaPath = join(schemasPath, file);
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
          console.warn(`Failed to parse schema file ${file}:`, error);
        }
      }
    }
    
    return schemas;
  }

  private async getGitSchema(schemaId: string): Promise<any> {
    const schemaPath = join(this.repoPath, 'schemas', `${schemaId}.json`);
    
    if (!existsSync(schemaPath)) {
      throw new Error(`Schema ${schemaId} not found`);
    }
    
    try {
      const content = readFileSync(schemaPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to parse schema ${schemaId}: ${error}`);
    }
  }

  private async getGitTemplates(schemaType?: string): Promise<TemplateInfo[]> {
    const templatesPath = join(this.repoPath, 'templates');
    
    if (!existsSync(templatesPath)) {
      return []; // No templates directory
    }
    
    const templates: TemplateInfo[] = [];
    
    if (schemaType) {
      // Get templates for specific schema type
      const schemaTemplatePath = join(templatesPath, schemaType);
      if (existsSync(schemaTemplatePath)) {
        const files = readdirSync(schemaTemplatePath);
        for (const file of files) {
          if (extname(file) === '.md') {
            const template = await this.parseGitTemplate(schemaType, file);
            if (template) {
              templates.push(template);
            }
          }
        }
      }
    } else {
      // Get all templates
      const schemaTypeDirs = readdirSync(templatesPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
      
      for (const typeDir of schemaTypeDirs) {
        const schemaTemplatePath = join(templatesPath, typeDir);
        const files = readdirSync(schemaTemplatePath);
        
        for (const file of files) {
          if (extname(file) === '.md') {
            const template = await this.parseGitTemplate(typeDir, file);
            if (template) {
              templates.push(template);
            }
          }
        }
      }
    }
    
    return templates;
  }

  private async parseGitTemplate(schemaType: string, fileName: string): Promise<TemplateInfo | null> {
    try {
      const templatePath = join(this.repoPath, 'templates', schemaType, fileName);
      const content = readFileSync(templatePath, 'utf-8');
      
      // Parse frontmatter and content using improved parser
      const { frontmatter, content: markdownContent } = parseMarkdownWithFrontmatter(content);
      
      if (Object.keys(frontmatter).length === 0) {
        console.warn(`Template ${fileName} does not have valid frontmatter`);
        return null;
      }
      
      const templateName = basename(fileName, '.md');
      
      return {
        id: `${schemaType}/${templateName}`,
        name: templateName,
        description: frontmatter.description || frontmatter.title || 'No description available',
        schemaType,
        content: markdownContent,
        frontmatter
      };
    } catch (error) {
      console.warn(`Failed to parse template ${fileName}:`, error);
      return null;
    }
  }

  private async getGitTemplate(templateId: string): Promise<TemplateInfo | null> {
    const [schemaType, templateName] = templateId.split('/');
    if (!schemaType || !templateName) {
      throw new Error('Invalid template ID format. Expected: schemaType/templateName');
    }
    
    const fileName = templateName.endsWith('.md') ? templateName : `${templateName}.md`;
    return await this.parseGitTemplate(schemaType, fileName);
  }

  // Cleanup method
  destroy(): void {
    if (this.pullInterval) {
      clearInterval(this.pullInterval);
      this.pullInterval = null;
    }
    
    if (this.gitConfig.autoCleanup !== false) {
      try {
        this.cleanupRepository();
      } catch (error) {
        console.warn('Failed to cleanup repository on destroy:', error);
      }
    }
  }

  /**
   * Render template with provided values (same as old implementation)
   */
  public async renderTemplate(templateId: string, values: Record<string, any>): Promise<string> {
    const template = await this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }
    
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
   * Validate template values against schema (same as old implementation)
   */
  public async validateTemplateValues(templateId: string, values: Record<string, any>): Promise<{ valid: boolean; errors: string[] }> {
    const template = await this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }
    
    const schema = await this.getSchema(template.schemaType);
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
      errors
    };
  }

  // Enhanced cache stats including Git info
  getCacheStats(): { schemas: number; templates: number; lastUpdate: Date | null; gitInfo?: any } {
    const baseStats = super.getCacheStats();
    
    let gitInfo = undefined;
    if (this.isInitialized && existsSync(this.repoPath)) {
      try {
        const gitPath = join(this.repoPath, '.git');
        gitInfo = {
          repoPath: this.repoPath,
          isGitRepo: existsSync(gitPath),
          repoType: this.gitConfig.repoType,
          pullInterval: this.gitConfig.pullInterval
        };
      } catch (error) {
        // Ignore errors in stats collection
      }
    }
    
    return {
      ...baseStats,
      gitInfo
    };
  }
}