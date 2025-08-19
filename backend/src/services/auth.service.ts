import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '../config/app.config';
import { AuthenticatedRequest, UserInfo, NamespaceContext } from '../auth/types';
import { AuthenticationError } from '../errors/app-errors';
import { UserContext } from '../types/domain.types';

/**
 * Authentication service
 */
export class AuthService {
  private static instance: AuthService;
  private readonly config = ConfigService.getInstance();

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Authentication middleware - requires valid authentication
   */
  public authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const oidcConfig = this.config.getOIDCConfig();
    
    // If OIDC is not enabled, skip authentication
    if (!oidcConfig.enabled) {
      req.user = { sub: 'anonymous', name: 'Anonymous User' };
      req.namespace = {
        userId: 'anonymous',
        userGroups: [],
        availableNamespaces: [this.config.getNamespacesConfig().defaultNamespace],
        defaultNamespace: this.config.getNamespacesConfig().defaultNamespace,
      };
      return next();
    }

    // TODO: Implement actual JWT/OIDC token validation
    // For now, throw error since OIDC is enabled but not implemented
    throw new AuthenticationError('Authentication required but OIDC not fully implemented');
  };

  /**
   * Optional authentication middleware - authentication not required
   */
  public optionalAuthenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const oidcConfig = this.config.getOIDCConfig();
    
    // If OIDC is not enabled, set anonymous user
    if (!oidcConfig.enabled) {
      req.user = { sub: 'anonymous', name: 'Anonymous User' };
      req.namespace = {
        userId: 'anonymous',
        userGroups: [],
        availableNamespaces: [this.config.getNamespacesConfig().defaultNamespace],
        defaultNamespace: this.config.getNamespacesConfig().defaultNamespace,
      };
      return next();
    }

    // TODO: Implement optional JWT/OIDC token validation
    // For now, set anonymous user
    req.user = { sub: 'anonymous', name: 'Anonymous User' };
    req.namespace = {
      userId: 'anonymous',
      userGroups: [],
      availableNamespaces: [this.config.getNamespacesConfig().defaultNamespace],
      defaultNamespace: this.config.getNamespacesConfig().defaultNamespace,
    };
    next();
  };

  /**
   * Extract user context from authentication token
   */
  public extractUserContext(authHeader?: string): UserContext | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    // TODO: Implement JWT token parsing and validation
    return {
      id: 'anonymous',
      name: 'Anonymous User',
    };
  }

  /**
   * Validate JWT token
   */
  public async validateToken(token: string): Promise<UserContext | null> {
    // TODO: Implement JWT validation with OIDC provider
    return null;
  }
}