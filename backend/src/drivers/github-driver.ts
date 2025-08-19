import { Octokit } from '@octokit/rest';
import { GitDriver, GitConfig, FileInfo, FileContent, UpdateResponse, FileHistoryEntry } from './types';

export class GitHubDriver extends GitDriver {
  private octokit: Octokit;

  constructor(config: GitConfig) {
    super(config);
    this.octokit = new Octokit({
      auth: config.token,
    });
  }

  async getFiles(): Promise<FileInfo[]> {
    try {
      const response = await this.octokit.rest.repos.getContent({
        owner: this.config.owner,
        repo: this.config.repo,
        path: this.config.path,
      });

      if (Array.isArray(response.data)) {
        return response.data
          .filter(file => file.type === 'file' && file.name.endsWith('.md'))
          .map(file => ({
            name: file.name,
            path: file.path,
            sha: file.sha || '',
          }));
      }
      
      return [];
    } catch (error) {
      console.error('GitHub: Error fetching files:', error);
      throw new Error('Failed to fetch files from GitHub');
    }
  }

  async getFilesFromNamespaces(namespaces: string[]): Promise<FileInfo[]> {
    try {
      const allFiles: FileInfo[] = [];
      
      for (const namespace of namespaces) {
        try {
          const namespacePath = this.config.path ? `${this.config.path}/${namespace}` : namespace;
          const response = await this.octokit.rest.repos.getContent({
            owner: this.config.owner,
            repo: this.config.repo,
            path: namespacePath,
          });

          if (Array.isArray(response.data)) {
            const namespaceFiles = response.data
              .filter(file => file.type === 'file' && file.name.endsWith('.md'))
              .map(file => ({
                name: file.name,
                path: file.path,
                sha: file.sha || '',
              }));
            allFiles.push(...namespaceFiles);
          }
        } catch (error) {
          // Namespace folder might not exist yet, skip silently
          console.log(`Namespace ${namespace} not found, skipping`);
        }
      }
      
      return allFiles;
    } catch (error) {
      console.error('GitHub: Error fetching files from namespaces:', error);
      throw new Error('Failed to fetch files from GitHub namespaces');
    }
  }

  async getFile(filePath: string): Promise<FileContent> {
    try {
      const response = await this.octokit.rest.repos.getContent({
        owner: this.config.owner,
        repo: this.config.repo,
        path: filePath,
      });

      if ('content' in response.data && response.data.type === 'file') {
        const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
        const parsed = this.parseMarkdownFile(content);
        
        return {
          ...parsed,
          sha: response.data.sha,
          path: filePath,
        };
      }
      
      throw new Error('File not found or not a file');
    } catch (error) {
      console.error('GitHub: Error fetching file:', error);
      throw new Error('Failed to fetch file from GitHub');
    }
  }

  async updateFile(
    filePath: string,
    frontmatter: any,
    content: string,
    sha: string
  ): Promise<UpdateResponse> {
    try {
      const fileContent = this.serializeMarkdownFile(frontmatter, content);
      
      const response = await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: this.config.owner,
        repo: this.config.repo,
        path: filePath,
        message: `Update ${filePath}`,
        content: Buffer.from(fileContent).toString('base64'),
        sha: sha,
      });

      return {
        success: true,
        sha: response.data.content?.sha,
        commit: response.data.commit.sha,
      };
    } catch (error) {
      console.error('GitHub: Error updating file:', error);
      throw new Error('Failed to update file in GitHub');
    }
  }

  async createFile(
    filePath: string,
    frontmatter: any,
    content: string
  ): Promise<UpdateResponse> {
    try {
      const fileContent = this.serializeMarkdownFile(frontmatter, content);
      
      const response = await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: this.config.owner,
        repo: this.config.repo,
        path: filePath,
        message: `Create ${filePath}`,
        content: Buffer.from(fileContent).toString('base64'),
      });

      return {
        success: true,
        sha: response.data.content?.sha,
        commit: response.data.commit.sha,
      };
    } catch (error) {
      console.error('GitHub: Error creating file:', error);
      throw new Error('Failed to create file in GitHub');
    }
  }

  async deleteFile(filePath: string, sha: string): Promise<UpdateResponse> {
    try {
      const response = await this.octokit.rest.repos.deleteFile({
        owner: this.config.owner,
        repo: this.config.repo,
        path: filePath,
        message: `Delete ${filePath}`,
        sha: sha,
      });

      return {
        success: true,
        commit: response.data.commit.sha,
      };
    } catch (error) {
      console.error('GitHub: Error deleting file:', error);
      throw new Error('Failed to delete file from GitHub');
    }
  }

  async getFileHistory(filePath: string): Promise<FileHistoryEntry[]> {
    try {
      const response = await this.octokit.rest.repos.listCommits({
        owner: this.config.owner,
        repo: this.config.repo,
        path: filePath,
        per_page: 20, // Limit to last 20 commits for the file
      });

      return response.data.map(commit => ({
        sha: commit.sha,
        commit: commit.sha.substring(0, 7), // Short SHA
        message: commit.commit.message,
        author: {
          name: commit.commit.author?.name || 'Unknown',
          email: commit.commit.author?.email || 'unknown@example.com',
          date: commit.commit.author?.date || new Date().toISOString(),
        },
        url: commit.html_url,
      }));
    } catch (error) {
      console.error('GitHub: Error fetching file history:', error);
      throw new Error('Failed to fetch file history from GitHub');
    }
  }

  async getFileAtCommit(filePath: string, commitSha: string): Promise<FileContent> {
    try {
      const response = await this.octokit.rest.repos.getContent({
        owner: this.config.owner,
        repo: this.config.repo,
        path: filePath,
        ref: commitSha,
      });

      if ('content' in response.data && response.data.type === 'file') {
        const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
        const parsed = this.parseMarkdownFile(content);
        
        return {
          ...parsed,
          sha: response.data.sha,
          path: filePath,
        };
      }
      
      throw new Error('File not found or not a file');
    } catch (error) {
      console.error('GitHub: Error fetching file at commit:', error);
      throw new Error('Failed to fetch file version from GitHub');
    }
  }
}