export interface FileInfo {
  name: string;
  path: string;
  sha: string;
  displayName: string;
  schemaType: string | null;
  isValidFormat: boolean;
}

export interface FileContent {
  frontmatter: any;
  content: string;
  sha: string;
  path: string;
}

export interface UpdateResponse {
  success: boolean;
  sha: string;
  commit: string;
}

export interface NamespaceInfo {
  id: string;
  name: string;
  isDefault: boolean;
  isUserNamespace: boolean;
}

export interface FileHistoryEntry {
  sha: string;
  commit: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
  url: string;
}

export interface TemplateInfo {
  id: string;
  name: string;
  description: string;
  schemaType: string;
  content: string;
  frontmatter: Record<string, any>;
}

export interface SchemaInfo {
  id: string;
  title: string;
  description: string;
  version?: string;
}

import { authService } from './auth.service';
import { configService } from './config.service';

export class ApiService {
  private static getApiBase(): string {
    return configService.getBaseUrl() + '/api';
  }

  static async getFiles(): Promise<FileInfo[]> {
    const response = await authService.authenticatedFetch(`${this.getApiBase()}/files`);
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required');
      }
      throw new Error('Failed to fetch files');
    }
    return response.json();
  }

  static async getFile(path: string): Promise<FileContent> {
    const response = await authService.authenticatedFetch(`${this.getApiBase()}/file/${encodeURIComponent(path)}`);
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required');
      }
      throw new Error('Failed to fetch file');
    }
    return response.json();
  }

  static async getNamespaces(): Promise<NamespaceInfo[]> {
    const response = await authService.authenticatedFetch(`${this.getApiBase()}/namespaces`);
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required');
      }
      throw new Error('Failed to fetch namespaces');
    }
    return response.json();
  }

  static async createFile(filePath: string, frontmatter: any, content: string, namespace?: string): Promise<UpdateResponse> {
    const response = await authService.authenticatedFetch(`${this.getApiBase()}/file`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename: filePath,
        frontmatter,
        content,
        namespace,
      }),
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to create file');
    }
    return response.json();
  }

  static async updateFile(path: string, frontmatter: any, content: string, sha: string): Promise<UpdateResponse> {
    const response = await authService.authenticatedFetch(`${this.getApiBase()}/file/${encodeURIComponent(path)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        frontmatter,
        content,
        sha,
      }),
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required');
      }
      throw new Error('Failed to update file');
    }
    return response.json();
  }

  static async deleteFile(path: string, sha: string): Promise<UpdateResponse> {
    const response = await authService.authenticatedFetch(`${this.getApiBase()}/file/${encodeURIComponent(path)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sha,
      }),
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required');
      }
      throw new Error('Failed to delete file');
    }
    return response.json();
  }

  static async moveFile(path: string, targetNamespace: string): Promise<UpdateResponse> {
    const response = await authService.authenticatedFetch(`${this.getApiBase()}/file/${encodeURIComponent(path)}/move`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        targetNamespace,
      }),
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to move file');
    }
    return response.json();
  }

  static async getFileHistory(path: string): Promise<FileHistoryEntry[]> {
    const response = await authService.authenticatedFetch(`${this.getApiBase()}/file/${encodeURIComponent(path)}/history`);
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required');
      }
      throw new Error('Failed to fetch file history');
    }
    return response.json();
  }

  static async getFileVersion(path: string, commitSha: string): Promise<FileContent> {
    const response = await authService.authenticatedFetch(`${this.getApiBase()}/file/${encodeURIComponent(path)}/version/${commitSha}`);
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required');
      }
      throw new Error('Failed to fetch file version');
    }
    return response.json();
  }

  // Schema API methods
  static async getSchemas(): Promise<SchemaInfo[]> {
    const response = await authService.authenticatedFetch(`${this.getApiBase()}/schemas`);
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required');
      }
      throw new Error('Failed to fetch schemas');
    }
    return response.json();
  }

  static async getSchema(schemaId: string): Promise<any> {
    const response = await authService.authenticatedFetch(`${this.getApiBase()}/schemas/${encodeURIComponent(schemaId)}`);
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required');
      }
      if (response.status === 404) {
        throw new Error('Schema not found');
      }
      throw new Error('Failed to fetch schema');
    }
    return response.json();
  }

  // Template API methods
  static async getTemplates(schemaType?: string): Promise<TemplateInfo[]> {
    const url = schemaType 
      ? `${this.getApiBase()}/templates?schemaType=${encodeURIComponent(schemaType)}`
      : `${this.getApiBase()}/templates`;
    
    const response = await authService.authenticatedFetch(url);
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required');
      }
      throw new Error('Failed to fetch templates');
    }
    return response.json();
  }

  static async getTemplate(templateId: string): Promise<TemplateInfo> {
    const response = await authService.authenticatedFetch(`${this.getApiBase()}/templates/${encodeURIComponent(templateId)}`);
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required');
      }
      if (response.status === 404) {
        throw new Error('Template not found');
      }
      throw new Error('Failed to fetch template');
    }
    return response.json();
  }
}