import { GitDriver, GitConfig } from './types';
import { GitHubDriver } from './github-driver';
import { GitLabDriver } from './gitlab-driver';
import { GiteaDriver } from './gitea-driver';

export class DriverFactory {
  static createDriver(config: GitConfig): GitDriver {
    switch (config.platform) {
      case 'github':
        return new GitHubDriver(config);
      case 'gitlab':
        return new GitLabDriver(config);
      case 'gitea':
        return new GiteaDriver(config);
      default:
        throw new Error(`Unsupported git platform: ${config.platform}`);
    }
  }
}

export * from './types';
export { GitHubDriver } from './github-driver';
export { GitLabDriver } from './gitlab-driver';
export { GiteaDriver } from './gitea-driver';