import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { AdminService } from '../services/admin.service';
import { AuthenticatedRequest, UserInfo, NamespaceContext } from '../auth/types';
import { AppConfigResponse, HealthResponse } from '../types/api.types';
import { UserContext } from '../types/domain.types';

/**
 * Administrative controller
 */
export class AdminController extends BaseController {
  private readonly adminService = new AdminService();

  /**
   * Convert UserInfo to UserContext
   */
  private convertUser(userInfo?: UserInfo): UserContext | undefined {
    if (!userInfo) return undefined;
    return {
      id: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name,
      groups: userInfo.groups,
    };
  }

  /**
   * Get application configuration
   */
  public async getAppConfig(req: Request, res: Response): Promise<void> {
    const config = await this.adminService.getAppConfig();
    this.success(res, config);
  }

  /**
   * Get namespace configuration (debug endpoint)
   */
  public async getNamespaceConfig(req: Request, res: Response): Promise<void> {
    const namespaceConfig = await this.adminService.getNamespaceConfig();
    this.success(res, namespaceConfig);
  }

  /**
   * List available namespaces
   */
  public async listNamespaces(req: AuthenticatedRequest, res: Response): Promise<void> {
    const namespaces = await this.adminService.listNamespaces(this.convertUser(req.user));
    this.success(res, namespaces);
  }

  /**
   * Get schema repository status
   */
  public async getSchemaRepoStatus(req: Request, res: Response): Promise<void> {
    const status = await this.adminService.getSchemaRepoStatus();
    this.success(res, status);
  }

  /**
   * Clear schema repository cache
   */
  public async clearSchemaCache(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.adminService.clearSchemaCache();
    this.success(res, { cleared: true }, 'Schema cache cleared successfully');
  }

  /**
   * Health check
   */
  public async getHealth(req: Request, res: Response): Promise<void> {
    const health = await this.adminService.getHealthStatus();
    
    // Set appropriate status code based on health
    const statusCode = health.status === 'ok' ? 200 : 
                     health.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode);
    this.success(res, health);
  }
}