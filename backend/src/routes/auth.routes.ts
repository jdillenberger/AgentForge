import { Router } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { AuthController } from '../controllers/auth.controller';

/**
 * Authentication routes
 */
export function createAuthRoutes(): Router {
  const router = Router();
  const authController = new AuthController();

  // OIDC Configuration endpoint
  router.get('/oidc-config', asyncHandler(authController.getOIDCConfig.bind(authController)));

  // Token exchange endpoint
  router.post('/token', asyncHandler(authController.exchangeToken.bind(authController)));

  // User info endpoint
  router.get('/userinfo', authController.authenticate, asyncHandler(authController.getUserInfo.bind(authController)));

  // Authorization URL endpoint
  router.get('/authorize-url', asyncHandler(authController.getAuthorizeUrl.bind(authController)));

  return router;
}