export interface FileInfo {
  name: string;
  path: string;
  sha: string;
}

export interface FileContent {
  frontmatter: any;
  content: string;
  sha?: string;
  path?: string;
}

export interface UpdateResponse {
  success: boolean;
  sha?: string;
  commit?: string;
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

export interface GitConfig {
  platform: 'github' | 'gitlab' | 'gitea';
  token: string;
  owner: string;
  repo: string;
  path: string;
  baseUrl?: string; // For GitLab/Gitea self-hosted instances
}

export abstract class GitDriver {
  protected config: GitConfig;

  constructor(config: GitConfig) {
    this.config = config;
  }

  /**
   * Get list of markdown files from the repository
   */
  abstract getFiles(): Promise<FileInfo[]>;

  /**
   * Get content of a specific file with parsed frontmatter
   */
  abstract getFile(filePath: string): Promise<FileContent>;

  /**
   * Update file content and commit to repository
   */
  abstract updateFile(
    filePath: string,
    frontmatter: any,
    content: string,
    sha: string
  ): Promise<UpdateResponse>;

  /**
   * Create a new file in the repository
   */
  abstract createFile(
    filePath: string,
    frontmatter: any,
    content: string
  ): Promise<UpdateResponse>;

  /**
   * Delete a file from the repository
   */
  abstract deleteFile(filePath: string, sha: string): Promise<UpdateResponse>;

  /**
   * Get the commit history for a specific file
   */
  abstract getFileHistory(filePath: string): Promise<FileHistoryEntry[]>;

  /**
   * Get a specific version of a file by commit SHA
   */
  abstract getFileAtCommit(filePath: string, commitSha: string): Promise<FileContent>;

  /**
   * Parse markdown file with frontmatter
   */
  protected parseMarkdownFile(content: string): { frontmatter: any; content: string } {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);
    
    if (match) {
      const yaml = require('js-yaml');
      const frontmatter = yaml.load(match[1]);
      const markdownContent = match[2];
      return { frontmatter, content: markdownContent };
    }
    
    return { frontmatter: {}, content };
  }

  /**
   * Serialize markdown file with frontmatter
   */
  protected serializeMarkdownFile(frontmatter: any, content: string): string {
    const yaml = require('js-yaml');
    const frontmatterYaml = yaml.dump(frontmatter);
    return `---\n${frontmatterYaml}---\n${content}`;
  }
}