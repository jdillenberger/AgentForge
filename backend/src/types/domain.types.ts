/**
 * Domain-specific types for the application
 */

// Git driver types
export interface GitConfig {
  platform: 'github' | 'gitlab' | 'gitea';
  token: string;
  owner: string;
  repo: string;
  path?: string;
  baseUrl?: string;
}

export interface GitFile {
  name: string;
  path: string;
  sha: string;
  content?: string;
  encoding?: string;
  size?: number;
}

export interface GitCommit {
  sha: string;
  message: string;
  author: string;
  email?: string;
  date: string;
}

// File information
export interface FileInfo {
  name: string;
  path: string;
  content?: string;
  size?: number;
  lastModified: string;
  type?: string;
  version?: string;
}

// Schema information
export interface SchemaInfo {
  id: string;
  name: string;
  description: string;
  version?: string;
  fields?: {
    name: string;
    type: string;
    required: boolean;
  }[];
}

// Template information  
export interface TemplateInfo {
  id: string;
  name: string;
  description: string;
  schemaId: string;
  content: string;
  variables: string[];
}

// Schema repository types
export interface SchemaRepositoryConfig {
  enabled: boolean;
  type: 'api' | 'git';
  localFallback: boolean;
  cacheTimeout: number;
  gitUrl?: string;
  pullInterval?: number;
  shallowClone?: boolean;
  autoCleanup?: boolean;
  apiConfig?: {
    enabled: boolean;
    driver?: GitConfig;
  };
}

export interface Schema {
  id: string;
  title: string;
  description: string;
  type: 'object';
  properties: Record<string, SchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
  version?: string;
  $schema?: string;
}

export interface SchemaProperty {
  type: string;
  description?: string;
  default?: unknown;
  enum?: unknown[];
  items?: SchemaProperty;
  properties?: Record<string, SchemaProperty>;
  required?: string[];
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  pattern?: string;
  format?: string;
}

export interface Template {
  id: string;
  title: string;
  description: string;
  schemaType: string;
  content: string;
  variables: TemplateVariable[];
  tags?: string[];
  category?: string;
  version?: string;
}

export interface TemplateVariable {
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  default?: unknown;
  placeholder?: string;
  options?: unknown[];
}

// Authentication types
export interface OIDCConfig {
  enabled: boolean;
  issuerUrl: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope?: string;
}

export interface JWTPayload {
  sub: string;
  iss: string;
  aud: string;
  exp: number;
  iat: number;
  email?: string;
  name?: string;
  picture?: string;
  groups?: string[];
  [key: string]: unknown;
}

// Namespace types
export interface NamespaceConfig {
  enabled: boolean;
  userClaim: string;
  groupsClaim: string;
  defaultNamespace: string;
}

export interface NamespaceInfo {
  name: string;
  type: 'user' | 'group' | 'system';
  displayName?: string;
  description?: string;
  permissions?: NamespacePermissions;
}

export interface NamespacePermissions {
  read: boolean;
  write: boolean;
  delete: boolean;
  admin: boolean;
}

// File operation types
export interface FileOperationContext {
  user?: UserContext;
  namespace?: string;
  operation: 'create' | 'read' | 'update' | 'delete' | 'move';
  filename: string;
  sha?: string;
}

export interface UserContext {
  id: string;
  email?: string;
  name?: string;
  groups?: string[];
  namespace?: string;
  permissions?: string[];
}

// Validation types
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings?: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
  code?: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  value?: unknown;
}

// File content parsing types
export interface ParsedMarkdownFile {
  frontmatter: Record<string, any>;
  content: string;
  metadata: {
    filename: string;
    displayName: string;
    schemaType: string | null;
    namespace?: string;
    isValid: boolean;
    errors?: string[];
  };
}

// Service types
export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message?: string;
  details?: Record<string, any>;
  lastCheck: string;
}

export interface CacheEntry<T = any> {
  data: T;
  expiresAt: number;
  createdAt: number;
}

// Event types
export interface AppEvent {
  type: string;
  timestamp: string;
  source: string;
  data: Record<string, any>;
  userId?: string;
  namespace?: string;
}

export interface FileEvent extends AppEvent {
  type: 'file.created' | 'file.updated' | 'file.deleted' | 'file.moved';
  data: {
    filename: string;
    path: string;
    sha: string;
    operation: string;
    namespace?: string;
  };
}

export interface AuthEvent extends AppEvent {
  type: 'auth.login' | 'auth.logout' | 'auth.refresh' | 'auth.error';
  data: {
    userId: string;
    method: string;
    ip?: string;
    userAgent?: string;
  };
}