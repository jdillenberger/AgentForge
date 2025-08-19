import { ConfigService } from '../../config/app.config';

describe('ConfigService', () => {
  let configService: ConfigService;

  beforeEach(() => {
    configService = ConfigService.getInstance();
  });

  describe('Git Configuration', () => {
    it('should return git configuration', () => {
      const gitConfig = configService.getGitConfig();
      
      expect(gitConfig).toBeDefined();
      expect(gitConfig.provider).toBe('github');
      expect(gitConfig.owner).toBe('test-owner');
      expect(gitConfig.repo).toBe('test-repo');
      expect(gitConfig.branch).toBe('main');
      expect(gitConfig.localPath).toBe('/tmp/test-git-repo');
    });
  });

  describe('OIDC Configuration', () => {
    it('should return disabled OIDC configuration', () => {
      const oidcConfig = configService.getOIDCConfig();
      
      expect(oidcConfig).toBeDefined();
      expect(oidcConfig.enabled).toBe(false);
    });
  });

  describe('Namespaces Configuration', () => {
    it('should return namespaces configuration', () => {
      const namespacesConfig = configService.getNamespacesConfig();
      
      expect(namespacesConfig).toBeDefined();
      expect(namespacesConfig.enabled).toBe(false);
      expect(namespacesConfig.defaultNamespace).toBe('test');
    });
  });

  describe('Schema Repository Configuration', () => {
    it('should return schema repository configuration', () => {
      const schemaConfig = configService.getSchemaRepoConfig();
      
      expect(schemaConfig).toBeDefined();
      expect(schemaConfig.enabled).toBe(false);
    });
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ConfigService.getInstance();
      const instance2 = ConfigService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });
});