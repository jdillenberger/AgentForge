import { GitDriver, GitConfig, FileInfo, FileContent, UpdateResponse, FileHistoryEntry } from './types';

export class GitLabDriver extends GitDriver {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(config: GitConfig) {
    super(config);
    
    // Default to GitLab.com if no baseUrl provided
    this.baseUrl = config.baseUrl || 'https://gitlab.com';
    this.headers = {
      'Authorization': `Bearer ${config.token}`,
      'Content-Type': 'application/json',
    };
  }

  async getFiles(): Promise<FileInfo[]> {
    try {
      const encodedProject = encodeURIComponent(`${this.config.owner}/${this.config.repo}`);
      const encodedPath = encodeURIComponent(this.config.path || '');
      const url = `${this.baseUrl}/api/v4/projects/${encodedProject}/repository/tree?path=${encodedPath}`;
      
      const response = await fetch(url, {
        headers: this.headers,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        return data
          .filter((file: any) => file.type === 'blob' && file.name.endsWith('.md'))
          .map((file: any) => ({
            name: file.name,
            path: file.path,
            sha: file.id,
          }));
      }
      
      return [];
    } catch (error) {
      console.error('GitLab: Error fetching files:', error);
      throw new Error('Failed to fetch files from GitLab');
    }
  }

  async getFile(filePath: string): Promise<FileContent> {
    try {
      const encodedProject = encodeURIComponent(`${this.config.owner}/${this.config.repo}`);
      const encodedPath = encodeURIComponent(filePath);
      const url = `${this.baseUrl}/api/v4/projects/${encodedProject}/repository/files/${encodedPath}?ref=main`;
      
      const response = await fetch(url, {
        headers: this.headers,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json() as any;
      
      if (data.content) {
        // GitLab returns base64 encoded content
        const content = Buffer.from(data.content, 'base64').toString('utf-8');
        const parsed = this.parseMarkdownFile(content);
        
        return {
          ...parsed,
          sha: data.blob_id,
          path: filePath,
        };
      }
      
      throw new Error('File not found');
    } catch (error) {
      console.error('GitLab: Error fetching file:', error);
      throw new Error('Failed to fetch file from GitLab');
    }
  }

  async createFile(
    filePath: string,
    frontmatter: any,
    content: string
  ): Promise<UpdateResponse> {
    try {
      const encodedProject = encodeURIComponent(`${this.config.owner}/${this.config.repo}`);
      const encodedPath = encodeURIComponent(filePath);
      const url = `${this.baseUrl}/api/v4/projects/${encodedProject}/repository/files/${encodedPath}`;
      
      const fileContent = this.serializeMarkdownFile(frontmatter, content);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          branch: 'main',
          content: fileContent,
          commit_message: `Create ${filePath}`,
          encoding: 'text',
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json() as any;
      
      return {
        success: true,
        sha: data.file_path,
        commit: data.id,
      };
    } catch (error) {
      console.error('GitLab: Error creating file:', error);
      throw new Error('Failed to create file in GitLab');
    }
  }

  async updateFile(
    filePath: string,
    frontmatter: any,
    content: string,
    sha: string
  ): Promise<UpdateResponse> {
    try {
      const encodedProject = encodeURIComponent(`${this.config.owner}/${this.config.repo}`);
      const encodedPath = encodeURIComponent(filePath);
      const url = `${this.baseUrl}/api/v4/projects/${encodedProject}/repository/files/${encodedPath}`;
      
      const fileContent = this.serializeMarkdownFile(frontmatter, content);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: this.headers,
        body: JSON.stringify({
          branch: 'main',
          content: fileContent,
          commit_message: `Update ${filePath}`,
          encoding: 'text',
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json() as any;
      
      return {
        success: true,
        sha: data.file_path, // GitLab doesn't return blob_id on update
        commit: data.id,
      };
    } catch (error) {
      console.error('GitLab: Error updating file:', error);
      throw new Error('Failed to update file in GitLab');
    }
  }

  async deleteFile(filePath: string, sha: string): Promise<UpdateResponse> {
    try {
      const encodedProject = encodeURIComponent(`${this.config.owner}/${this.config.repo}`);
      const encodedPath = encodeURIComponent(filePath);
      const url = `${this.baseUrl}/api/v4/projects/${encodedProject}/repository/files/${encodedPath}`;
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.headers,
        body: JSON.stringify({
          branch: 'main',
          commit_message: `Delete ${filePath}`,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json() as any;
      
      return {
        success: true,
        commit: data.id,
      };
    } catch (error) {
      console.error('GitLab: Error deleting file:', error);
      throw new Error('Failed to delete file from GitLab');
    }
  }

  async getFileHistory(filePath: string): Promise<FileHistoryEntry[]> {
    try {
      const encodedProject = encodeURIComponent(`${this.config.owner}/${this.config.repo}`);
      const encodedPath = encodeURIComponent(filePath);
      const url = `${this.baseUrl}/api/v4/projects/${encodedProject}/repository/commits?path=${encodedPath}&per_page=20`;
      
      const response = await fetch(url, {
        headers: this.headers,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json() as any[];
      
      return data.map(commit => ({
        sha: commit.id,
        commit: commit.short_id,
        message: commit.message,
        author: {
          name: commit.author_name,
          email: commit.author_email,
          date: commit.authored_date,
        },
        url: commit.web_url,
      }));
    } catch (error) {
      console.error('GitLab: Error fetching file history:', error);
      throw new Error('Failed to fetch file history from GitLab');
    }
  }

  async getFileAtCommit(filePath: string, commitSha: string): Promise<FileContent> {
    try {
      const encodedProject = encodeURIComponent(`${this.config.owner}/${this.config.repo}`);
      const encodedPath = encodeURIComponent(filePath);
      const url = `${this.baseUrl}/api/v4/projects/${encodedProject}/repository/files/${encodedPath}?ref=${commitSha}`;
      
      const response = await fetch(url, {
        headers: this.headers,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json() as any;
      
      if (data.content) {
        const content = Buffer.from(data.content, 'base64').toString('utf-8');
        const parsed = this.parseMarkdownFile(content);
        
        return {
          ...parsed,
          sha: data.blob_id,
          path: filePath,
        };
      }
      
      throw new Error('File not found');
    } catch (error) {
      console.error('GitLab: Error fetching file at commit:', error);
      throw new Error('Failed to fetch file version from GitLab');
    }
  }
}