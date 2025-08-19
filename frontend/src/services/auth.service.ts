import { UserManager, type User as OidcUser, type UserManagerSettings } from 'oidc-client-ts';
import type { User, TokenResponse, PKCEState, LoginRedirect } from '@/types/auth';
import { configService } from './config.service';

class AuthService {
  private userManager: UserManager | null = null;
  private baseUrl: string;

  constructor() {
    this.baseUrl = configService.getBaseUrl();
  }

  /**
   * Initialize the OIDC UserManager
   */
  async initializeUserManager(): Promise<UserManager> {
    if (this.userManager) {
      return this.userManager;
    }

    try {
      const oidcConfig = await configService.getOIDCConfig();
      
      const settings: UserManagerSettings = {
        authority: oidcConfig.issuer,
        client_id: oidcConfig.clientId,
        redirect_uri: oidcConfig.redirectUri,
        response_type: oidcConfig.responseType,
        scope: oidcConfig.scopes.join(' '),
        post_logout_redirect_uri: window.location.origin,
        automaticSilentRenew: true,
        silent_redirect_uri: `${window.location.origin}/silent-renew.html`,
        filterProtocolClaims: true,
        loadUserInfo: true,
        
        // PKCE configuration for security
        response_mode: 'query',
        extraQueryParams: {},
        
        // Metadata endpoints
        metadata: {
          issuer: oidcConfig.issuer,
          authorization_endpoint: oidcConfig.authorizationEndpoint,
          token_endpoint: oidcConfig.tokenEndpoint,
          userinfo_endpoint: oidcConfig.userinfoEndpoint,
          jwks_uri: oidcConfig.jwksUri,
          end_session_endpoint: `${oidcConfig.issuer}/protocol/openid-connect/logout`,
        },
      };

      this.userManager = new UserManager(settings);
      
      // Set up event handlers
      this.setupEventHandlers();
      
      return this.userManager;
    } catch (error) {
      console.error('Failed to initialize UserManager:', error);
      throw new Error('Failed to initialize authentication system');
    }
  }

  /**
   * Set up event handlers for OIDC events
   */
  private setupEventHandlers(): void {
    if (!this.userManager) return;

    this.userManager.events.addUserLoaded((user: OidcUser) => {
      console.log('User loaded:', user.profile);
    });

    this.userManager.events.addUserUnloaded(() => {
      console.log('User unloaded');
    });

    this.userManager.events.addAccessTokenExpiring(() => {
      console.log('Access token expiring');
    });

    this.userManager.events.addAccessTokenExpired(() => {
      console.log('Access token expired');
    });

    this.userManager.events.addSilentRenewError((error) => {
      console.error('Silent renew error:', error);
    });
  }

  /**
   * Start the login process
   */
  async login(returnTo?: string): Promise<void> {
    try {
      const userManager = await this.initializeUserManager();
      
      // Store return URL in sessionStorage
      if (returnTo) {
        sessionStorage.setItem('auth_return_to', returnTo);
      }

      await userManager.signinRedirect();
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error('Failed to start login process');
    }
  }

  /**
   * Handle the login callback
   */
  async handleCallback(): Promise<User> {
    try {
      const userManager = await this.initializeUserManager();
      const user = await userManager.signinRedirectCallback();
      
      if (!user) {
        throw new Error('No user returned from callback');
      }

      return this.mapOidcUserToUser(user);
    } catch (error) {
      console.error('Callback handling failed:', error);
      throw new Error('Failed to complete login');
    }
  }

  /**
   * Logout the user
   */
  async logout(): Promise<void> {
    try {
      const userManager = await this.initializeUserManager();
      await userManager.signoutRedirect();
    } catch (error) {
      console.error('Logout failed:', error);
      throw new Error('Failed to logout');
    }
  }

  /**
   * Get the current user
   */
  async getUser(): Promise<User | null> {
    try {
      const userManager = await this.initializeUserManager();
      const oidcUser = await userManager.getUser();
      
      if (!oidcUser || oidcUser.expired) {
        return null;
      }

      return this.mapOidcUserToUser(oidcUser);
    } catch (error) {
      console.error('Failed to get user:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const user = await this.getUser();
      return !!user;
    } catch (error) {
      console.error('Failed to check authentication status:', error);
      return false;
    }
  }

  /**
   * Get access token for API calls
   */
  async getAccessToken(): Promise<string | null> {
    try {
      const userManager = await this.initializeUserManager();
      const user = await userManager.getUser();
      
      if (!user || user.expired) {
        return null;
      }

      return user.access_token;
    } catch (error) {
      console.error('Failed to get access token:', error);
      return null;
    }
  }

  /**
   * Refresh the access token
   */
  async refreshToken(): Promise<User | null> {
    try {
      const userManager = await this.initializeUserManager();
      const user = await userManager.signinSilent();
      
      if (!user) {
        return null;
      }

      return this.mapOidcUserToUser(user);
    } catch (error) {
      console.error('Token refresh failed:', error);
      return null;
    }
  }

  /**
   * Clear all authentication data
   */
  async clearAuth(): Promise<void> {
    try {
      const userManager = await this.initializeUserManager();
      await userManager.removeUser();
      sessionStorage.removeItem('auth_return_to');
    } catch (error) {
      console.error('Failed to clear auth data:', error);
    }
  }

  /**
   * Get the return URL after login
   */
  getReturnUrl(): string {
    const returnTo = sessionStorage.getItem('auth_return_to');
    sessionStorage.removeItem('auth_return_to');
    return returnTo || '/';
  }

  /**
   * Map OIDC user to our User type
   */
  private mapOidcUserToUser(oidcUser: OidcUser): User {
    const profile = oidcUser.profile;
    
    return {
      sub: profile.sub,
      name: profile.name,
      given_name: profile.given_name,
      family_name: profile.family_name,
      email: profile.email,
      email_verified: profile.email_verified,
      preferred_username: profile.preferred_username,
      roles: profile.roles as string[] || [],
      groups: profile.groups as string[] || [],
    };
  }

  /**
   * Generate PKCE parameters for enhanced security
   */
  generatePKCE(): PKCEState {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const codeVerifier = btoa(String.fromCharCode.apply(null, Array.from(array)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    
    return crypto.subtle.digest('SHA-256', data).then(hash => {
      const codeChallenge = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(hash))))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
      
      const state = btoa(Math.random().toString(36).substring(2));
      
      return {
        codeVerifier,
        codeChallenge,
        state
      };
    }) as any; // Type assertion for simplicity
  }

  /**
   * Make authenticated API request
   */
  async authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const token = await this.getAccessToken();
    
    const headers = {
      ...options.headers,
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };

    return fetch(url, {
      ...options,
      headers,
    });
  }
}

// Export a singleton instance
export const authService = new AuthService();
export default authService;