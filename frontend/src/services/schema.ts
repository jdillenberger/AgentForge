import { configService } from './config.service';
import { authService } from './auth.service';

function getApiBaseUrl(): string {
  return configService.getBaseUrl() + '/api';
}

export interface SchemaProperty {
  type: string;
  title?: string;
  description?: string;
  enum?: string[];
  default?: any;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;
  properties?: Record<string, SchemaProperty>;
  patternProperties?: Record<string, SchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
  multipleOf?: number;
}

export interface JsonSchema {
  $schema?: string;
  type: string;
  title?: string;
  description?: string;
  properties?: Record<string, SchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface SchemaInfo {
  id: string;
  title: string;
  description: string;
}

interface FormKitField {
  $formkit: string;
  name: string;
  label: string | false;
  help?: string;
  value?: any;
  validation?: string;
  options?: Array<{ label: string; value: string }>;
  rows?: number;
  min?: number;
  max?: number;
  step?: number;
  children?: FormKitField[];
}

export class SchemaService {
  private static schemas: Record<string, JsonSchema> = {};
  private static schemaList: SchemaInfo[] = [];

  static async loadSchemas(): Promise<void> {
    try {
      const response = await authService.authenticatedFetch(`${getApiBaseUrl()}/schemas`);
      if (!response.ok) {
        throw new Error('Failed to fetch schema list');
      }
      this.schemaList = await response.json();
      
      // Pre-load all schemas
      for (const schemaInfo of this.schemaList) {
        await this.loadSchema(schemaInfo.id);
      }
    } catch (error) {
      console.error('Error loading schemas:', error);
    }
  }

  static async loadSchema(schemaId: string): Promise<JsonSchema | null> {
    try {
      if (this.schemas[schemaId]) {
        return this.schemas[schemaId];
      }

      const response = await authService.authenticatedFetch(`${getApiBaseUrl()}/schemas/${schemaId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch schema: ${schemaId}`);
      }
      
      const schema = await response.json();
      this.schemas[schemaId] = schema;
      return schema;
    } catch (error) {
      console.error(`Error loading schema ${schemaId}:`, error);
      return null;
    }
  }

  static async getSchema(schemaName: string): Promise<JsonSchema | null> {
    if (this.schemas[schemaName]) {
      return this.schemas[schemaName];
    }
    
    return await this.loadSchema(schemaName);
  }

  static async detectSchema(schemaType: string | null, frontmatter?: any): Promise<JsonSchema | null> {
    // Primary: Use schema type from filename if available
    if (schemaType) {
      const schema = await this.getSchema(schemaType);
      if (schema) {
        return schema;
      }
      console.warn(`Schema type '${schemaType}' from filename not found`);
    }
    
    // Fallback: Legacy detection for backwards compatibility with existing files
    if (frontmatter) {
      // Check explicit type field in frontmatter (old format)
      if (frontmatter.type && typeof frontmatter.type === 'string') {
        const schema = await this.getSchema(frontmatter.type);
        if (schema) {
          return schema;
        }
        console.warn(`Schema type '${frontmatter.type}' from frontmatter not found`);
      }
      
      // Heuristic-based detection for very old files
      if (frontmatter.inbound_agents) {
        return await this.getSchema('healthcare-agent');
      }
    }
    
    // Default fallback
    if (frontmatter.title && (frontmatter.voice || frontmatter.language)) {
      return await this.getSchema('simple-agent');
    }
    
    // Default fallback - return null for dynamic form generation
    return null;
  }

  static generateFormKitSchema(jsonSchema: JsonSchema, data: any = {}): any[] {
    if (!jsonSchema.properties) return [];

    const formFields: any[] = [];

    for (const [key, property] of Object.entries(jsonSchema.properties)) {
      const field = this.propertyToFormKitField(key, property, data[key]);
      if (field) {
        formFields.push(field);
      }
    }

    return formFields;
  }

  private static propertyToFormKitField(key: string, property: SchemaProperty, value?: any): FormKitField {
    const baseField: FormKitField = {
      $formkit: this.getFormKitType(property),
      name: key,
      label: property.title || this.capitalize(key),
      help: property.description,
      value: value !== undefined ? value : property.default,
    };

    // Add validation
    const validation: string[] = [];
    if (property.minLength) validation.push(`length:${property.minLength}`);
    if (property.maxLength) validation.push(`length:0,${property.maxLength}`);
    if (property.minimum !== undefined) validation.push(`min:${property.minimum}`);
    if (property.maximum !== undefined) validation.push(`max:${property.maximum}`);
    if (property.pattern) validation.push(`matches:/^${property.pattern}$/`);

    if (validation.length > 0) {
      baseField.validation = validation.join('|');
    }

    // Handle specific types
    switch (property.type) {
      case 'string':
        if (property.enum) {
          baseField.$formkit = 'select';
          baseField.options = property.enum.map(option => ({
            label: option,
            value: option
          }));
        } else if (property.maxLength && property.maxLength > 100) {
          baseField.$formkit = 'textarea';
          baseField.rows = Math.min(Math.ceil(property.maxLength / 50), 6);
        }
        break;

      case 'number':
      case 'integer':
        baseField.$formkit = 'number';
        if (property.minimum !== undefined) baseField.min = property.minimum;
        if (property.maximum !== undefined) baseField.max = property.maximum;
        if (property.type === 'number' && property.multipleOf) {
          baseField.step = property.multipleOf;
        } else if (property.type === 'integer') {
          baseField.step = 1;
        }
        break;

      case 'boolean':
        baseField.$formkit = 'checkbox';
        break;

      case 'object':
        // Handle nested objects
        if (property.properties) {
          baseField.$formkit = 'group';
          baseField.children = [] as FormKitField[];
          
          for (const [nestedKey, nestedProperty] of Object.entries(property.properties)) {
            const nestedField = this.propertyToFormKitField(
              nestedKey, 
              nestedProperty, 
              value?.[nestedKey]
            );
            if (nestedField) {
              baseField.children!.push(nestedField);
            }
          }
        } else if (property.patternProperties) {
          // Handle dynamic objects (like inbound_agents)
          baseField.$formkit = 'group';
          baseField.children = [] as FormKitField[];
          
          if (value && typeof value === 'object') {
            for (const [objKey, objValue] of Object.entries(value)) {
              // Get the pattern property schema (usually there's only one)
              const patternSchema = Object.values(property.patternProperties)[0];
              if (patternSchema) {
                const groupField: FormKitField = {
                  $formkit: 'group',
                  name: objKey,
                  label: this.capitalize(objKey.replace(/_/g, ' ')),
                  children: [] as FormKitField[]
                };

                if (patternSchema.properties) {
                  for (const [propKey, propSchema] of Object.entries(patternSchema.properties)) {
                    const nestedField = this.propertyToFormKitField(
                      propKey,
                      propSchema,
                      (objValue as any)?.[propKey]
                    );
                    if (nestedField) {
                      groupField.children!.push(nestedField);
                    }
                  }
                }
                
                baseField.children!.push(groupField);
              }
            }
          }
        } else {
          // Generic object - use textarea with JSON
          baseField.$formkit = 'textarea';
          baseField.help = 'Enter JSON object';
          baseField.value = value ? JSON.stringify(value, null, 2) : '{}';
        }
        break;
    }

    return baseField;
  }

  private static getFormKitType(property: SchemaProperty): string {
    switch (property.type) {
      case 'string':
        if (property.enum) return 'select';
        if (property.format === 'email') return 'email';
        if (property.format === 'uri') return 'url';
        if (property.maxLength && property.maxLength > 100) return 'textarea';
        return 'text';
      case 'number':
      case 'integer':
        return 'number';
      case 'boolean':
        return 'checkbox';
      case 'object':
        return 'group';
      case 'array':
        return 'list';
      default:
        return 'text';
    }
  }

  private static capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
  }
}