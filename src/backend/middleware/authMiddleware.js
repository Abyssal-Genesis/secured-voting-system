/**
 * Authentication Middleware
 * Handles JWT token verification and user authentication
 */

const jwt = require('jsonwebtoken');

class AuthMiddleware {
  constructor(config = {}) {
    this.jwtSecret = config.jwtSecret || process.env.JWT_SECRET;
    this.logger = config.logger || console;
  }

  /**
   * Middleware to verify JWT token in Authorization header
   */
  authenticate() {
    return (req, res, next) => {
      try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
          return res.status(401).json({
            success: false,
            error: 'Access token required'
          });
        }

        const decoded = jwt.verify(token, this.jwtSecret);
        req.user = decoded;
        
        this.logger.debug(`User authenticated: ${decoded.email}`);
        next();
      } catch (error) {
        if (error.name === 'TokenExpiredError') {
          return res.status(401).json({
            success: false,
            error: 'Token expired',
            expiredAt: error.expiredAt
          });
        }

        if (error.name === 'JsonWebTokenError') {
          return res.status(403).json({
            success: false,
            error: 'Invalid token'
          });
        }

        res.status(403).json({
          success: false,
          error: 'Authentication failed'
        });
      }
    };
  }

  /**
   * Middleware to check if user has required permissions
   */
  authorize(...roles) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      if (roles.length > 0 && !roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions'
        });
      }

      next();
    };
  }

  /**
   * Middleware to verify email verification
   */
  requireEmailVerification() {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      if (!req.user.emailVerified) {
        return res.status(403).json({
          success: false,
          error: 'Email verification required',
          requiresVerification: true
        });
      }

      next();
    };
  }

  /**
   * Middleware to verify human verification
   */
  requireHumanVerification() {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      if (!req.user.humanVerified) {
        return res.status(403).json({
          success: false,
          error: 'Human verification required',
          requiresVerification: true
        });
      }

      next();
    };
  }

  /**
   * Middleware for optional authentication
   * Sets req.user if token is present and valid, but doesn't fail if absent
   */
  authenticateOptional() {
    return (req, res, next) => {
      try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
          const decoded = jwt.verify(token, this.jwtSecret);
          req.user = decoded;
          this.logger.debug(`Optional auth: User authenticated`);
        } else {
          req.user = null;
        }

        next();
      } catch (error) {
        req.user = null;
        this.logger.debug(`Optional auth: No valid token`);
        next();
      }
    };
  }

  /**
   * Rate limiting middleware
   */
  rateLimit(windowMs = 15 * 60 * 1000, maxRequests = 100) {
    const requests = new Map();

    return (req, res, next) => {
      const ip = req.ip || req.connection.remoteAddress;
      const key = req.user ? `user-${req.user.id}` : `ip-${ip}`;
      const now = Date.now();

      if (!requests.has(key)) {
        requests.set(key, []);
      }

      const userRequests = requests.get(key);
      const recentRequests = userRequests.filter(time => now - time < windowMs);

      if (recentRequests.length >= maxRequests) {
        return res.status(429).json({
          success: false,
          error: 'Too many requests, please try again later',
          retryAfter: Math.ceil((windowMs - (now - recentRequests[0])) / 1000)
        });
      }

      recentRequests.push(now);
      requests.set(key, recentRequests);
      next();
    };
  }

  /**
   * CORS middleware
   */
  cors(config = {}) {
    const allowedOrigins = config.allowedOrigins || [
      'http://localhost:3000',
      'http://localhost:3001',
      process.env.CORS_ORIGIN
    ];

    return (req, res, next) => {
      const origin = req.headers.origin;

      if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      }

      if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
      }

      next();
    };
  }

  /**
   * Request logging middleware
   */
  requestLogger() {
    return (req, res, next) => {
      const start = Date.now();
      const originalSend = res.send;

      res.send = function(data) {
        const duration = Date.now() - start;
        const user = req.user ? req.user.email : 'anonymous';
        
        this.logger.info(`${req.method} ${req.path}`, {
          user,
          status: res.statusCode,
          duration: `${duration}ms`
        });

        return originalSend.call(this, data);
      };

      next();
    };
  }

  /**
   * Error handling middleware
   */
  errorHandler() {
    return (err, req, res, next) => {
      const status = err.statusCode || 500;
      const message = err.message || 'Internal server error';

      this.logger.error(`${req.method} ${req.path}`, {
        error: message,
        status,
        user: req.user ? req.user.email : 'anonymous'
      });

      res.status(status).json({
        success: false,
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      });
    };
  }

  /**
   * Validate request body
   */
  validateBody(schema) {
    return (req, res, next) => {
      try {
        const { error, value } = schema.validate(req.body, {
          abortEarly: false,
          stripUnknown: true
        });

        if (error) {
          const details = error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }));

          return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details
          });
        }

        req.validatedBody = value;
        next();
      } catch (err) {
        res.status(400).json({
          success: false,
          error: 'Request validation error'
        });
      }
    };
  }

  /**
   * Track user activity
   */
  trackActivity(activityService) {
    return async (req, res, next) => {
      if (req.user && activityService) {
        try {
          await activityService.logActivity({
            userId: req.user.id,
            action: `${req.method} ${req.path}`,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            timestamp: new Date()
          });
        } catch (error) {
          this.logger.warn('Failed to log activity:', error.message);
        }
      }

      next();
    };
  }
}

module.exports = AuthMiddleware;
