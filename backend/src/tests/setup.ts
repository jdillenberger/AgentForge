// Global test setup
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-key-32-characters-long';
  process.env.GIT_PROVIDER = 'github';
  process.env.GIT_OWNER = 'test-owner';
  process.env.GIT_REPO = 'test-repo';
  process.env.GIT_BRANCH = 'main';
  process.env.GIT_LOCAL_PATH = '/tmp/test-git-repo';
  process.env.OIDC_ENABLED = 'false';
  process.env.NAMESPACES_ENABLED = 'false';
  process.env.NAMESPACES_DEFAULT_NAMESPACE = 'test';
  process.env.SCHEMA_REPO_ENABLED = 'false';
});

afterEach(() => {
  // Clear any test data between tests
  jest.clearAllMocks();
});