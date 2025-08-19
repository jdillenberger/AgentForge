import { jwtVerify, createRemoteJWKSet, JWTPayload as JoseJWTPayload } from 'jose';
import { 
  OIDCConfig, 
  OIDCDiscoveryDocument, 
  UserInfo, 
  JWTPayload, 
  TokenResponse,
  TokenExchangeRequest,
  AuthenticationError 
} from './types';

export class OIDCService {
  private config: OIDCConfig;
  private discoveryDocument: OIDCDiscoveryDocument | null = null;
  private jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

  constructor(config: OIDCConfig) {
    this.config = config;
  }

  /**
   * Fetch and cache the OIDC discovery document
   */
  async getDiscoveryDocument(): Promise<OIDCDiscoveryDocument> {
    if (this.discoveryDocument) {
      return this.discoveryDocument;
    }

    try {
      const wellKnownUrl = `${this.config.issuerUrl}/.well-known/openid-configuration`;
      console.log(`Fetching OIDC discovery document from: ${wellKnownUrl}`);
      
      const response = await fetch(wellKnownUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch discovery document: ${response.status} ${response.statusText}`);
      }

      this.discoveryDocument = await response.json() as OIDCDiscoveryDocument;
      console.log('OIDC discovery document loaded successfully');
      
      return this.discoveryDocument!
    } catch (error) {
      console.error('Error fetching OIDC discovery document:', error);
      throw new AuthenticationError('Failed to fetch OIDC configuration');
    }
  }

  /**
   * Get the JWKS (JSON Web Key Set) for token validation
   */
  private async getJWKS(): Promise<ReturnType<typeof createRemoteJWKSet>> {
    if (this.jwks) {
      return this.jwks;
    }

    const discovery = await this.getDiscoveryDocument();
    this.jwks = createRemoteJWKSet(new URL(discovery.jwks_uri));
    
    return this.jwks;
  }

  /**
   * Validate and decode a JWT access token
   */
  async validateToken(token: string): Promise<JWTPayload> {
    try {
      const jwks = await this.getJWKS();
      
      const { payload } = await jwtVerify(token, jwks, {
        issuer: this.config.issuerUrl,
        audience: this.config.clientId,
      });

      return payload as JWTPayload;
    } catch (error) {
      console.error('Token validation failed:', error);
      throw new AuthenticationError('Invalid or expired token');
    }
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string, codeVerifier?: string): Promise<TokenResponse> {
    try {
      const discovery = await this.getDiscoveryDocument();
      
      const tokenRequest: TokenExchangeRequest = {
        grant_type: 'authorization_code',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code,
        redirect_uri: this.config.redirectUri,
      };

      if (codeVerifier) {
        tokenRequest.code_verifier = codeVerifier;
      }

      const response = await fetch(discovery.token_endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(tokenRequest as any),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as any;
        console.error('Token exchange failed:', response.status, errorData);
        throw new AuthenticationError(`Token exchange failed: ${errorData.error || response.statusText}`);
      }

      const tokenResponse: TokenResponse = await response.json() as TokenResponse;
      console.log('Token exchange successful');
      
      return tokenResponse;
    } catch (error) {
      console.error('Error during token exchange:', error);
      if (error instanceof AuthenticationError) {
        throw error;
      }
      throw new AuthenticationError('Failed to exchange authorization code for tokens');
    }
  }

  /**
   * Fetch user information using access token
   */
  async getUserInfo(accessToken: string): Promise<UserInfo> {
    try {
      const discovery = await this.getDiscoveryDocument();
      
      const response = await fetch(discovery.userinfo_endpoint, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user info: ${response.status} ${response.statusText}`);
      }

      const userInfo = await response.json() as UserInfo;
      console.log('User info fetched successfully');
      
      return userInfo;
    } catch (error) {
      console.error('Error fetching user info:', error);
      throw new AuthenticationError('Failed to fetch user information');
    }
  }

  /**
   * Extract user information from JWT payload
   */
  extractUserFromToken(payload: JWTPayload): UserInfo {
    return {
      sub: payload.sub,
      name: payload.name,
      given_name: payload.given_name,
      family_name: payload.family_name,
      email: payload.email,
      email_verified: payload.email_verified,
      preferred_username: payload.preferred_username,
      roles: payload.roles,
      groups: payload.groups,
    };
  }

  /**
   * Generate authorization URL for OIDC login
   */
  async generateAuthorizationUrl(state?: string, codeChallenge?: string): Promise<string> {
    const discovery = await this.getDiscoveryDocument();
    
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: 'openid profile email',
    });

    if (state) {
      params.append('state', state);
    }

    if (codeChallenge) {
      params.append('code_challenge', codeChallenge);
      params.append('code_challenge_method', 'S256');
    }

    return `${discovery.authorization_endpoint}?${params.toString()}`;
  }

  /**
   * Check if OIDC is properly configured
   */
  isConfigured(): boolean {
    return !!(
      this.config.enabled &&
      this.config.issuerUrl &&
      this.config.clientId &&
      this.config.clientSecret &&
      this.config.redirectUri
    );
  }

  /**
   * Get OIDC configuration for frontend
   */
  async getClientConfig() {
    if (!this.isConfigured()) {
      throw new AuthenticationError('OIDC is not configured');
    }

    const discovery = await this.getDiscoveryDocument();
    
    return {
      issuer: this.config.issuerUrl,
      authorizationEndpoint: discovery.authorization_endpoint,
      tokenEndpoint: discovery.token_endpoint,
      userinfoEndpoint: discovery.userinfo_endpoint,
      jwksUri: discovery.jwks_uri,
      clientId: this.config.clientId,
      redirectUri: this.config.redirectUri,
      scopes: ['openid', 'profile', 'email'],
      responseType: 'code',
    };
  }
}