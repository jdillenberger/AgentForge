import { Router } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { AdminController } from '../controllers/admin.controller';

/**
 * Administrative routes
 */
export function createAdminRoutes(): Router {
  const router = Router();
  const adminController = new AdminController();

  // Application configuration
  router.get('/config', asyncHandler(adminController.getAppConfig.bind(adminController)));

  // Namespace configuration (debug endpoint)
  router.get('/debug/namespace-config', asyncHandler(adminController.getNamespaceConfig.bind(adminController)));

  // List namespaces
  router.get('/namespaces', adminController.optionalAuthenticate, asyncHandler(adminController.listNamespaces.bind(adminController)));

  // Schema repository status
  router.get('/schema-repository/status', adminController.optionalAuthenticate, asyncHandler(adminController.getSchemaRepoStatus.bind(adminController)));

  // Clear schema repository cache
  router.post('/schema-repository/clear-cache', adminController.authenticate, asyncHandler(adminController.clearSchemaCache.bind(adminController)));

  // Health check
  router.get('/health', asyncHandler(adminController.getHealth.bind(adminController)));

  return router;
}