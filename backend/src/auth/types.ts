import { Request } from 'express';

// OIDC Configuration types
export interface OIDCConfig {
  enabled: boolean;
  issuerUrl: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

// OIDC Discovery document structure
export interface OIDCDiscoveryDocument {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint: string;
  jwks_uri: string;
  scopes_supported: string[];
  response_types_supported: string[];
  grant_types_supported: string[];
  subject_types_supported: string[];
  id_token_signing_alg_values_supported: string[];
}

// User information from OIDC provider
export interface UserInfo {
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

// JWT token payload structure
export interface JWTPayload {
  iss: string;
  sub: string;
  aud: string | string[];
  exp: number;
  iat: number;
  azp?: string;
  scope?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
  roles?: string[];
  groups?: string[];
}

// Token exchange request/response
export interface TokenExchangeRequest {
  grant_type: 'authorization_code';
  client_id: string;
  client_secret: string;
  code: string;
  redirect_uri: string;
  code_verifier?: string; // For PKCE
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  id_token?: string;
  scope?: string;
}

// Namespace configuration
export interface NamespaceConfig {
  enabled: boolean;
  userClaim: string;
  groupsClaim: string;
  defaultNamespace: string;
}

// User namespace context
export interface NamespaceContext {
  userId: string;
  userGroups: string[];
  availableNamespaces: string[];
  defaultNamespace: string;
}

// Express request with authenticated user
export interface AuthenticatedRequest extends Request {
  user?: UserInfo;
  token?: string;
  namespace?: NamespaceContext;
}

// App configuration response
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

// OIDC provider configuration response
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

// Error types
export class AuthenticationError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}