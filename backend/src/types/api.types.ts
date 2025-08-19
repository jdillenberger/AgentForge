/**
 * Core API request/response types
 */

// Base API response structure
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  timestamp: string;
  requestId?: string;
}

// Success response
export interface SuccessResponse<T = any> extends ApiResponse<T> {
  success: true;
  data: T;
}

// Pagination metadata
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Paginated response
export interface PaginatedResponse<T = any> extends SuccessResponse<T[]> {
  pagination: PaginationMeta;
}

// File-related types
export interface FileItem {
  name: string;
  path: string;
  sha: string;
  displayName: string;
  schemaType: string | null;
  isValidFormat: boolean;
  namespace?: string;
  size?: number;
  lastModified?: string;
}

export interface FileContent {
  name: string;
  path: string;
  sha: string;
  content: string;
  frontmatter?: Record<string, any>;
  namespace?: string;
}

export interface FileHistory {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
  };
  date: string;
  url?: string;
}

// Schema-related types
export interface SchemaInfo {
  id: string;
  title: string;
  description: string;
  version?: string;
  properties?: Record<string, any>;
}

export interface TemplateInfo {
  id: string;
  name: string;      // Add name field for frontend compatibility
  title: string;
  description: string;
  schemaType: string;
  tags?: string[];
  content?: string;
}

// Authentication types
export interface UserInfo {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
  groups?: string[];
  namespace?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresIn: number;
  tokenType: string;
}

// Configuration types
export interface AppConfigResponse {
  auth: {
    enabled: boolean;
    type: 'oidc' | 'none';
    issuer?: string;
  };
  features: {
    gitPlatform: string;
    namespaces: boolean;
    schemas: boolean;
    templates: boolean;
  };
  limits?: {
    maxFileSize: number;
    rateLimits: Record<string, number>;
  };
}

// Git operation types
export interface GitCommitInfo {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
  };
  date: string;
  files?: string[];
}

// Request body types
export interface CreateFileRequest {
  filename: string;
  content: string;
  frontmatter?: Record<string, any>;
  message?: string;
  namespace?: string;
}

export interface UpdateFileRequest {
  content: string;
  frontmatter?: Record<string, any>;
  message?: string;
  sha?: string;
}

export interface MoveFileRequest {
  newFilename: string;
  message?: string;
}

export interface CreateTemplateFileRequest {
  filename: string;
  templateValues: Record<string, any>;
  message?: string;
  namespace?: string;
}

// Query parameters
export interface ListFilesQuery {
  namespace?: string;
  schemaType?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export interface FileHistoryQuery {
  limit?: number;
  since?: string;
  until?: string;
}

// Health check response
export interface HealthResponse {
  status: 'ok' | 'degraded' | 'down';
  platform: string;
  timestamp: string;
  services?: {
    git: 'ok' | 'error';
    schema: 'ok' | 'error';
    auth: 'ok' | 'error';
  };
  uptime?: number;
  version?: string;
}