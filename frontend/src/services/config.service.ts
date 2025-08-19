import type { AppConfig, OIDCClientConfig } from '@/types/auth';

class ConfigService {
  private appConfig: AppConfig | null = null;
  private oidcConfig: OIDCClientConfig | null = null;
  private baseUrl: string;

  constructor() {
    // Use environment variable for API base URL, with intelligent defaults
    const envApiUrl = import.meta.env.VITE_API_BASE_URL;
    
    if (envApiUrl) {
      this.baseUrl = envApiUrl;
    } else if (typeof window !== 'undefined') {
      // In browser: use current hostname with backend port
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;
      
      // In production (nginx), backend is typically proxied at /api
      // In development, backend runs on port 3000
      if (window.location.port === '80' || window.location.port === '443' || !window.location.port) {
        this.baseUrl = `${protocol}//${hostname}`;
      } else {
        this.baseUrl = `${protocol}//${hostname}:3000`;
      }
    } else {
      // Server-side rendering fallback
      this.baseUrl = 'http://localhost:3000';
    }
  }

  /**
   * Fetch and cache app configuration
   */
  async getAppConfig(): Promise<AppConfig> {
    if (this.appConfig) {
      return this.appConfig;
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/config`);
      if (!response.ok) {
        throw new Error(`Failed to fetch app config: ${response.status} ${response.statusText}`);
      }

      this.appConfig = await response.json();
      return this.appConfig!;
    } catch (error) {
      console.error('Error fetching app configuration:', error);
      throw new Error('Failed to load application configuration');
    }
  }

  /**
   * Fetch and cache OIDC configuration
   */
  async getOIDCConfig(): Promise<OIDCClientConfig> {
    if (this.oidcConfig) {
      return this.oidcConfig;
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/auth/oidc-config`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('OIDC authentication is not enabled');
        }
        throw new Error(`Failed to fetch OIDC config: ${response.status} ${response.statusText}`);
      }

      this.oidcConfig = await response.json();
      return this.oidcConfig!;
    } catch (error) {
      console.error('Error fetching OIDC configuration:', error);
      throw error;
    }
  }

  /**
   * Check if authentication is enabled
   */
  async isAuthEnabled(): Promise<boolean> {
    try {
      const config = await this.getAppConfig();
      return config.auth.enabled;
    } catch (error) {
      console.error('Error checking auth status:', error);
      return false;
    }
  }

  /**
   * Clear cached configurations (useful for testing or config changes)
   */
  clearCache(): void {
    this.appConfig = null;
    this.oidcConfig = null;
  }

  /**
   * Get the base URL for API calls
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Set a custom base URL (useful for different environments)
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url;
    this.clearCache(); // Clear cache since base URL changed
  }
}

// Export a singleton instance
export const configService = new ConfigService();
export default configService;