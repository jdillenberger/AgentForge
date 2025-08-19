import { Request, Response, NextFunction } from 'express';
import { OIDCService } from './oidc-service';
import { AuthenticatedRequest, AuthenticationError, AuthorizationError } from './types';
import { namespaceService } from './namespace-service';

export class AuthMiddleware {
  private oidcService: OIDCService;
  private isAuthEnabled: boolean;

  constructor(oidcService: OIDCService, isAuthEnabled: boolean) {
    this.oidcService = oidcService;
    this.isAuthEnabled = isAuthEnabled;
  }

  /**
   * Middleware to check if authentication is required and validate tokens
   */
  authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // If authentication is disabled, create namespace context and allow all requests
      if (!this.isAuthEnabled) {
        req.namespace = namespaceService.createNamespaceContext();
        return next();
      }

      // If OIDC is not properly configured, create namespace context and allow requests but log warning
      if (!this.oidcService.isConfigured()) {
        console.warn('OIDC authentication is enabled but not properly configured');
        req.namespace = namespaceService.createNamespaceContext();
        return next();
      }

      // Extract token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ 
          error: 'Authentication required',
          message: 'Missing or invalid Authorization header' 
        });
        return;
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      try {
        // Validate the JWT token
        const payload = await this.oidcService.validateToken(token);
        
        // Extract user information from token
        const user = this.oidcService.extractUserFromToken(payload);
        
        // Attach user info and token to request
        req.user = user;
        req.token = token;
        
        // Create namespace context
        req.namespace = namespaceService.createNamespaceContext(user);
        
        console.log(`Authenticated user: ${user.preferred_username || user.email || user.sub}`);
        console.log(`Available namespaces: ${req.namespace.availableNamespaces.join(', ')}`);
        next();
      } catch (error) {
        console.error('Token validation failed:', error);
        res.status(401).json({ 
          error: 'Authentication failed',
          message: error instanceof AuthenticationError ? error.message : 'Invalid token' 
        });
        return;
      }
    } catch (error) {
      console.error('Authentication middleware error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'Authentication check failed' 
      });
      return;
    }
  };

  /**
   * Middleware that only authenticates if a token is present (optional authentication)
   */
  optionalAuthenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Always create namespace context, even if auth is disabled
      if (!this.isAuthEnabled || !this.oidcService.isConfigured()) {
        req.namespace = namespaceService.createNamespaceContext();
        return next();
      }

      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // No token provided, create default namespace context
        req.namespace = namespaceService.createNamespaceContext();
        return next();
      }

      const token = authHeader.substring(7);

      try {
        const payload = await this.oidcService.validateToken(token);
        const user = this.oidcService.extractUserFromToken(payload);
        
        req.user = user;
        req.token = token;
        
        // Create namespace context
        req.namespace = namespaceService.createNamespaceContext(user);
        
        console.log(`Optionally authenticated user: ${user.preferred_username || user.email || user.sub}`);
      } catch (error) {
        // Token validation failed, but continue without authentication
        console.warn('Optional authentication failed, continuing without auth:', error);
        req.namespace = namespaceService.createNamespaceContext();
      }

      next();
    } catch (error) {
      console.error('Optional authentication middleware error:', error);
      // In case of unexpected error, continue without authentication
      req.namespace = namespaceService.createNamespaceContext();
      next();
    }
  };

  /**
   * Middleware to check if user has required roles
   */
  requireRoles = (requiredRoles: string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      if (!this.isAuthEnabled) {
        return next();
      }

      if (!req.user) {
        res.status(401).json({ 
          error: 'Authentication required',
          message: 'User not authenticated' 
        });
        return;
      }

      const userRoles = req.user.roles || [];
      const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));

      if (!hasRequiredRole) {
        res.status(403).json({ 
          error: 'Insufficient permissions',
          message: `Required roles: ${requiredRoles.join(', ')}` 
        });
        return;
      }

      next();
    };
  };

  /**
   * Middleware to check if user belongs to required groups
   */
  requireGroups = (requiredGroups: string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      if (!this.isAuthEnabled) {
        return next();
      }

      if (!req.user) {
        res.status(401).json({ 
          error: 'Authentication required',
          message: 'User not authenticated' 
        });
        return;
      }

      const userGroups = req.user.groups || [];
      const hasRequiredGroup = requiredGroups.some(group => userGroups.includes(group));

      if (!hasRequiredGroup) {
        res.status(403).json({ 
          error: 'Insufficient permissions',
          message: `Required groups: ${requiredGroups.join(', ')}` 
        });
        return;
      }

      next();
    };
  };

  /**
   * Utility method to check if current request is authenticated
   */
  static isAuthenticated(req: AuthenticatedRequest): boolean {
    return !!req.user;
  }

  /**
   * Utility method to get current user from request
   */
  static getCurrentUser(req: AuthenticatedRequest) {
    return req.user;
  }

  /**
   * Utility method to get current token from request
   */
  static getCurrentToken(req: AuthenticatedRequest): string | undefined {
    return req.token;
  }
}

/**
 * Factory function to create auth middleware instance
 */
export function createAuthMiddleware(oidcService: OIDCService, isAuthEnabled: boolean): AuthMiddleware {
  return new AuthMiddleware(oidcService, isAuthEnabled);
}