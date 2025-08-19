import { GitDriver, GitConfig, FileInfo, FileContent, UpdateResponse, FileHistoryEntry } from './types';

export class GiteaDriver extends GitDriver {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(config: GitConfig) {
    super(config);
    
    // Default to Gitea.io if no baseUrl provided
    this.baseUrl = config.baseUrl || 'https://gitea.com';
    this.headers = {
      'Authorization': `token ${config.token}`,
      'Content-Type': 'application/json',
    };
  }

  async getFiles(): Promise<FileInfo[]> {
    try {
      const url = `${this.baseUrl}/api/v1/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.path}`;
      
      const response = await fetch(url, {
        headers: this.headers,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json() as any;
      
      if (Array.isArray(data)) {
        return data
          .filter((file: any) => file.type === 'file' && file.name.endsWith('.md'))
          .map((file: any) => ({
            name: file.name,
            path: file.path,
            sha: file.sha,
          }));
      }
      
      return [];
    } catch (error) {
      console.error('Gitea: Error fetching files:', error);
      throw new Error('Failed to fetch files from Gitea');
    }
  }

  async getFile(filePath: string): Promise<FileContent> {
    try {
      const url = `${this.baseUrl}/api/v1/repos/${this.config.owner}/${this.config.repo}/contents/${filePath}`;
      
      const response = await fetch(url, {
        headers: this.headers,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json() as any;
      
      if (data.type === 'file' && data.content) {
        const content = Buffer.from(data.content, 'base64').toString('utf-8');
        const parsed = this.parseMarkdownFile(content);
        
        return {
          ...parsed,
          sha: data.sha,
          path: filePath,
        };
      }
      
      throw new Error('File not found or not a file');
    } catch (error) {
      console.error('Gitea: Error fetching file:', error);
      throw new Error('Failed to fetch file from Gitea');
    }
  }

  async createFile(
    filePath: string,
    frontmatter: any,
    content: string
  ): Promise<UpdateResponse> {
    try {
      const url = `${this.baseUrl}/api/v1/repos/${this.config.owner}/${this.config.repo}/contents/${filePath}`;
      const fileContent = this.serializeMarkdownFile(frontmatter, content);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          message: `Create ${filePath}`,
          content: Buffer.from(fileContent).toString('base64'),
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json() as any;
      
      return {
        success: true,
        sha: data.content?.sha,
        commit: data.commit?.sha,
      };
    } catch (error) {
      console.error('Gitea: Error creating file:', error);
      throw new Error('Failed to create file in Gitea');
    }
  }

  async updateFile(
    filePath: string,
    frontmatter: any,
    content: string,
    sha: string
  ): Promise<UpdateResponse> {
    try {
      const url = `${this.baseUrl}/api/v1/repos/${this.config.owner}/${this.config.repo}/contents/${filePath}`;
      const fileContent = this.serializeMarkdownFile(frontmatter, content);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: this.headers,
        body: JSON.stringify({
          message: `Update ${filePath}`,
          content: Buffer.from(fileContent).toString('base64'),
          sha: sha,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json() as any;
      
      return {
        success: true,
        sha: data.content?.sha,
        commit: data.commit?.sha,
      };
    } catch (error) {
      console.error('Gitea: Error updating file:', error);
      throw new Error('Failed to update file in Gitea');
    }
  }

  async deleteFile(filePath: string, sha: string): Promise<UpdateResponse> {
    try {
      const url = `${this.baseUrl}/api/v1/repos/${this.config.owner}/${this.config.repo}/contents/${filePath}`;
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.headers,
        body: JSON.stringify({
          message: `Delete ${filePath}`,
          sha: sha,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json() as any;
      
      return {
        success: true,
        commit: data.commit?.sha,
      };
    } catch (error) {
      console.error('Gitea: Error deleting file:', error);
      throw new Error('Failed to delete file from Gitea');
    }
  }

  async getFileHistory(filePath: string): Promise<FileHistoryEntry[]> {
    try {
      const url = `${this.baseUrl}/api/v1/repos/${this.config.owner}/${this.config.repo}/commits?path=${encodeURIComponent(filePath)}&limit=20`;
      
      const response = await fetch(url, {
        headers: this.headers,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json() as any[];
      
      return data.map(commit => ({
        sha: commit.sha,
        commit: commit.sha.substring(0, 7),
        message: commit.commit.message,
        author: {
          name: commit.commit.author.name,
          email: commit.commit.author.email,
          date: commit.commit.author.date,
        },
        url: commit.html_url,
      }));
    } catch (error) {
      console.error('Gitea: Error fetching file history:', error);
      throw new Error('Failed to fetch file history from Gitea');
    }
  }

  async getFileAtCommit(filePath: string, commitSha: string): Promise<FileContent> {
    try {
      const url = `${this.baseUrl}/api/v1/repos/${this.config.owner}/${this.config.repo}/contents/${filePath}?ref=${commitSha}`;
      
      const response = await fetch(url, {
        headers: this.headers,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json() as any;
      
      if (data.type === 'file' && data.content) {
        const content = Buffer.from(data.content, 'base64').toString('utf-8');
        const parsed = this.parseMarkdownFile(content);
        
        return {
          ...parsed,
          sha: data.sha,
          path: filePath,
        };
      }
      
      throw new Error('File not found or not a file');
    } catch (error) {
      console.error('Gitea: Error fetching file at commit:', error);
      throw new Error('Failed to fetch file version from Gitea');
    }
  }
}