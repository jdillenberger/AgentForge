import { Router } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { FilesController } from '../controllers/files.controller';

/**
 * File management routes
 */
export function createFilesRoutes(): Router {
  console.log('🔧 Creating files routes...');
  const router = Router();
  const filesController = new FilesController();

  // List files
  console.log('📁 Setting up GET / for files');
  router.get('/', filesController.optionalAuthenticate, asyncHandler(filesController.listFiles.bind(filesController)));

  // Get single file
  router.get('/:filename', filesController.optionalAuthenticate, asyncHandler(filesController.getFile.bind(filesController)));

  // Create file
  router.post('/', filesController.authenticate, asyncHandler(filesController.createFile.bind(filesController)));

  // Update file
  router.put('/:filename', filesController.authenticate, asyncHandler(filesController.updateFile.bind(filesController)));

  // Delete file
  router.delete('/:filename', filesController.authenticate, asyncHandler(filesController.deleteFile.bind(filesController)));

  // Move/rename file
  router.post('/:filename/move', filesController.authenticate, asyncHandler(filesController.moveFile.bind(filesController)));

  // Get file history
  router.get('/:filename/history', filesController.optionalAuthenticate, asyncHandler(filesController.getFileHistory.bind(filesController)));

  // Get specific version
  router.get('/:filename/version/:commitSha', filesController.optionalAuthenticate, asyncHandler(filesController.getFileVersion.bind(filesController)));

  console.log('✅ Files routes created');
  return router;
}