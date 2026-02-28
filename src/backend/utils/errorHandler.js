/**
 * Error Handler & Custom Error Classes
 * Centralized error handling for the application
 */

const { ERROR_CODES, HTTP_STATUS } = require('./constants');
const Logger = require('./logger');

const logger = new Logger('ErrorHandler');

// =============================================================================
// CUSTOM ERROR CLASSES
// =============================================================================

class AppError extends Error {
  constructor(message, statusCode, errorCode = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.timestamp = new Date();
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = {}) {
    super(message, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.INVALID_CREDENTIALS);
    this.details = details;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED);
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Authorization failed') {
    super(message, HTTP_STATUS.FORBIDDEN, ERROR_CODES.UNAUTHORIZED);
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource', id = null) {
    const message = id ? `${resource} with id ${id} not found` : `${resource} not found`;
    super(message, HTTP_STATUS.NOT_FOUND, `${resource.toUpperCase()}_NOT_FOUND`);
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(message, HTTP_STATUS.CONFLICT, 'CONFLICT');
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Database error occurred') {
    super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.DATABASE_ERROR);
  }
}

class BlockchainError extends AppError {
  constructor(message = 'Blockchain error occurred') {
    super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.CONTRACT_ERROR);
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded', retryAfter = 60) {
    super(message, HTTP_STATUS.RATE_LIMITED, 'RATE_LIMITED');
    this.retryAfter = retryAfter;
  }
}

// =============================================================================
// ERROR RESPONSE FORMATTER
// =============================================================================

class ErrorResponse {
  constructor(error) {
    this.timestamp = new Date().toISOString();
    
    if (error instanceof AppError) {
      this.statusCode = error.statusCode;
      this.errorCode = error.errorCode;
      this.message = error.message;
      this.details = error.details || null;
      this.retryAfter = error.retryAfter || null;
    } else if (error instanceof Error) {
      this.statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
      this.errorCode = ERROR_CODES.INTERNAL_ERROR;
      this.message = process.env.NODE_ENV === 'production' 
        ? 'An internal server error occurred' 
        : error.message;
      this.details = process.env.NODE_ENV === 'development' ? error.stack : null;
    } else {
      this.statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
      this.errorCode = ERROR_CODES.INTERNAL_ERROR;
      this.message = 'An unexpected error occurred';
      this.details = null;
    }
  }

  toJSON() {
    const response = {
      timestamp: this.timestamp,
      statusCode: this.statusCode,
      errorCode: this.errorCode,
      message: this.message
    };

    if (this.details) {
      response.details = this.details;
    }

    if (this.retryAfter) {
      response.retryAfter = this.retryAfter;
    }

    return response;
  }
}

// =============================================================================
// ERROR HANDLER MIDDLEWARE
// =============================================================================

const errorHandler = (err, req, res, next) => {
  logger.error('Error caught by error handler', {
    message: err.message,
    statusCode: err.statusCode,
    errorCode: err.errorCode,
    path: req.path,
    method: req.method
  });

  const errorResponse = new ErrorResponse(err);
  const statusCode = errorResponse.statusCode;

  // Set retry-after header for rate limit errors
  if (errorResponse.retryAfter) {
    res.set('Retry-After', Math.ceil(errorResponse.retryAfter / 1000));
  }

  res.status(statusCode).json(errorResponse.toJSON());
};

// =============================================================================
// ASYNC WRAPPER
// =============================================================================

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// =============================================================================
// VALIDATION ERROR BUILDER
// =============================================================================

class ValidationErrorBuilder {
  constructor() {
    this.errors = {};
  }

  addError(field, message) {
    if (!this.errors[field]) {
      this.errors[field] = [];
    }
    this.errors[field].push(message);
    return this;
  }

  hasErrors() {
    return Object.keys(this.errors).length > 0;
  }

  throw() {
    if (this.hasErrors()) {
      throw new ValidationError('Validation failed', this.errors);
    }
    return this;
  }

  getErrors() {
    return this.errors;
  }
}

// =============================================================================
// ERROR RECOVERY STRATEGIES
// =============================================================================

const ErrorRecovery = {
  /**
   * Retry logic with exponential backoff
   */
  async retryWithBackoff(fn, maxAttempts = 3, baseDelay = 1000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (attempt < maxAttempts) {
          const delay = baseDelay * Math.pow(2, attempt - 1);
          logger.warn(`Attempt ${attempt} failed, retrying in ${delay}ms`, { error: error.message });
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  },

  /**
   * Fallback to cached data or default value
   */
  async withFallback(fn, fallbackValue = null) {
    try {
      return await fn();
    } catch (error) {
      logger.warn('Operation failed, using fallback value', { error: error.message });
      return fallbackValue;
    }
  },

  /**
   * Circuit breaker pattern
   */
  createCircuitBreaker(fn, threshold = 5, timeout = 60000) {
    let failureCount = 0;
    let lastFailureTime = null;
    let isOpen = false;

    return async (...args) => {
      if (isOpen) {
        if (Date.now() - lastFailureTime > timeout) {
          isOpen = false;
          failureCount = 0;
        } else {
          throw new Error('Circuit breaker is open');
        }
      }

      try {
        const result = await fn(...args);
        failureCount = 0;
        return result;
      } catch (error) {
        failureCount++;
        lastFailureTime = Date.now();
        
        if (failureCount >= threshold) {
          isOpen = true;
          logger.error('Circuit breaker opened', { failureCount });
        }
        
        throw error;
      }
    };
  }
};

module.exports = {
  // Error classes
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  BlockchainError,
  RateLimitError,
  
  // Response formatters
  ErrorResponse,
  
  // Middleware
  errorHandler,
  asyncHandler,
  
  // Builders
  ValidationErrorBuilder,
  
  // Recovery strategies
  ErrorRecovery
};
