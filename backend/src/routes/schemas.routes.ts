import { Router } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { SchemasController } from '../controllers/schemas.controller';

/**
 * Schema and template management routes
 */
export function createSchemasRoutes(): Router {
  const router = Router();
  const schemasController = new SchemasController();

  // List all schemas
  router.get('/', schemasController.optionalAuthenticate, asyncHandler(schemasController.listSchemas.bind(schemasController)));

  // Get specific schema
  router.get('/:schemaId', schemasController.optionalAuthenticate, asyncHandler(schemasController.getSchema.bind(schemasController)));

  return router;
}

/**
 * Template management routes
 */
export function createTemplatesRoutes(): Router {
  const router = Router();
  const schemasController = new SchemasController();

  // List all templates
  router.get('/', schemasController.optionalAuthenticate, asyncHandler(schemasController.listTemplates.bind(schemasController)));

  // Get specific template
  router.get('/:templateId', schemasController.optionalAuthenticate, asyncHandler(schemasController.getTemplate.bind(schemasController)));

  // Create file from template
  router.post('/:templateId/create', schemasController.authenticate, asyncHandler(schemasController.createFromTemplate.bind(schemasController)));

  return router;
}