/**
 * Custom error classes for the application with proper error hierarchy
 */

export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  abstract readonly code: string;
  abstract readonly isOperational: boolean;

  constructor(message: string, public readonly context?: Record<string, any>) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Configuration-related errors
 */
export class ConfigurationError extends AppError {
  readonly statusCode = 500;
  readonly code = 'CONFIGURATION_ERROR';
  readonly isOperational = false;

  constructor(message: string, context?: Record<string, any>) {
    super(`Configuration Error: ${message}`, context);
  }
}

/**
 * Validation errors for request data
 */
export class ValidationError extends AppError {
  readonly statusCode = 400;
  readonly code = 'VALIDATION_ERROR';
  readonly isOperational = true;

  constructor(message: string, public readonly details?: any) {
    super(`Validation Error: ${message}`, { details });
  }
}

/**
 * Authentication-related errors
 */
export class AuthenticationError extends AppError {
  readonly statusCode = 401;
  readonly code = 'AUTHENTICATION_ERROR';
  readonly isOperational = true;

  constructor(message: string = 'Authentication failed', context?: Record<string, any>) {
    super(message, context);
  }
}

/**
 * Authorization-related errors
 */
export class AuthorizationError extends AppError {
  readonly statusCode = 403;
  readonly code = 'AUTHORIZATION_ERROR';
  readonly isOperational = true;

  constructor(message: string = 'Access denied', context?: Record<string, any>) {
    super(message, context);
  }
}

/**
 * Resource not found errors
 */
export class NotFoundError extends AppError {
  readonly statusCode = 404;
  readonly code = 'NOT_FOUND_ERROR';
  readonly isOperational = true;

  constructor(resource: string, identifier?: string) {
    const message = identifier 
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, { resource, identifier });
  }
}

/**
 * Resource conflict errors
 */
export class ConflictError extends AppError {
  readonly statusCode = 409;
  readonly code = 'CONFLICT_ERROR';
  readonly isOperational = true;

  constructor(message: string, context?: Record<string, any>) {
    super(`Conflict: ${message}`, context);
  }
}

/**
 * Git provider-related errors
 */
export class GitProviderError extends AppError {
  readonly statusCode = 502;
  readonly code = 'GIT_PROVIDER_ERROR';
  readonly isOperational = true;

  constructor(
    public readonly provider: string,
    message: string,
    public readonly originalError?: Error
  ) {
    super(`${provider} Error: ${message}`, { provider, originalError: originalError?.message });
  }
}

/**
 * File operation errors
 */
export class FileOperationError extends AppError {
  readonly statusCode = 422;
  readonly code = 'FILE_OPERATION_ERROR';
  readonly isOperational = true;

  constructor(
    public readonly operation: string,
    public readonly filename: string,
    message: string,
    public readonly originalError?: Error
  ) {
    super(`File ${operation} failed for '${filename}': ${message}`, {
      operation,
      filename,
      originalError: originalError?.message
    });
  }
}

/**
 * Schema repository errors
 */
export class SchemaRepositoryError extends AppError {
  readonly statusCode = 503;
  readonly code = 'SCHEMA_REPOSITORY_ERROR';
  readonly isOperational = true;

  constructor(message: string, public readonly originalError?: Error) {
    super(`Schema Repository Error: ${message}`, {
      originalError: originalError?.message
    });
  }
}

/**
 * Namespace-related errors
 */
export class NamespaceError extends AppError {
  readonly statusCode = 403;
  readonly code = 'NAMESPACE_ERROR';
  readonly isOperational = true;

  constructor(
    public readonly namespace: string,
    message: string
  ) {
    super(`Namespace '${namespace}': ${message}`, { namespace });
  }
}

/**
 * Rate limiting errors
 */
export class RateLimitError extends AppError {
  readonly statusCode = 429;
  readonly code = 'RATE_LIMIT_ERROR';
  readonly isOperational = true;

  constructor(message: string = 'Rate limit exceeded') {
    super(message);
  }
}

/**
 * Internal server errors for unexpected issues
 */
export class InternalServerError extends AppError {
  readonly statusCode = 500;
  readonly code = 'INTERNAL_SERVER_ERROR';
  readonly isOperational = false;

  constructor(message: string = 'Internal server error', originalError?: Error) {
    super(message, { originalError: originalError?.message });
  }
}