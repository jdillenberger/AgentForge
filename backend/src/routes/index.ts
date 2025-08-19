import { Router } from 'express';
import { createAuthRoutes } from './auth.routes';
import { createFilesRoutes } from './files.routes';
import { createSchemasRoutes, createTemplatesRoutes } from './schemas.routes';
import { createAdminRoutes } from './admin.routes';

/**
 * Main API router
 */
const router = Router();

// API v1 routes - specific routes first
console.log('🔧 Setting up routes...');


router.use('/files', createFilesRoutes());
router.use('/newfiles', createFilesRoutes()); // Test route
router.use('/file', createFilesRoutes()); // Legacy compatibility
router.use('/schemas', createSchemasRoutes());
router.use('/templates', createTemplatesRoutes());
router.use('/auth', createAuthRoutes());
router.use('/', createAdminRoutes()); // Admin routes at root level (LAST)
console.log('✅ Routes setup complete');

export default router;