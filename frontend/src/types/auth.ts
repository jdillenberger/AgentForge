// User information from OIDC provider
export interface User {
  sub: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  email?: string;
  email_verified?: boolean;
  preferred_username?: string;
  roles?: string[];
  groups?: string[];
}

// App configuration from backend
export interface AppConfig {
  auth: {
    enabled: boolean;
    type: 'oidc' | 'none';
    loginUrl?: string;
    clientId?: string;
    redirectUri?: string;
    scopes?: string[];
  };
  features: {
    gitPlatform: string;
  };
}

// OIDC client configuration from backend
export interface OIDCClientConfig {
  issuer: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  userinfoEndpoint: string;
  jwksUri: string;
  clientId: string;
  redirectUri: string;
  scopes: string[];
  responseType: string;
}

// Token response from backend
export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  id_token?: string;
  scope?: string;
}

// Authentication state
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiry: number | null;
  error: string | null;
}

// PKCE (Proof Key for Code Exchange) state for security
export interface PKCEState {
  codeVerifier: string;
  codeChallenge: string;
  state: string;
}

// Login redirect information
export interface LoginRedirect {
  returnTo?: string;
  preserveQuery?: boolean;
}