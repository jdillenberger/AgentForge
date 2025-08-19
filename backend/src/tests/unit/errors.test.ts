import { 
  ValidationError, 
  NotFoundError, 
  AuthenticationError, 
  FileOperationError 
} from '../../errors/app-errors';

describe('Error Classes', () => {
  describe('ValidationError', () => {
    it('should create validation error with correct properties', () => {
      const error = new ValidationError('Invalid input', { field: 'email' });
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Invalid input');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.isOperational).toBe(true);
      expect(error.context).toEqual({ field: 'email' });
    });
  });

  describe('NotFoundError', () => {
    it('should create not found error with correct properties', () => {
      const error = new NotFoundError('User', 'user-123');
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('User not found: user-123');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.isOperational).toBe(true);
      expect(error.context).toEqual({ resource: 'User', id: 'user-123' });
    });
  });

  describe('AuthenticationError', () => {
    it('should create authentication error with correct properties', () => {
      const error = new AuthenticationError('Invalid token');
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Invalid token');
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('AUTHENTICATION_ERROR');
      expect(error.isOperational).toBe(true);
    });
  });

  describe('FileOperationError', () => {
    it('should create file operation error with correct properties', () => {
      const originalError = new Error('Disk full');
      const error = new FileOperationError('create', 'test.txt', 'Failed to create file', originalError);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Failed to create file');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('FILE_OPERATION_ERROR');
      expect(error.isOperational).toBe(true);
      expect(error.context).toEqual({
        operation: 'create',
        filename: 'test.txt',
        originalError: originalError.message,
      });
    });
  });
});