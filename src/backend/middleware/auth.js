const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// ============== Configuration ==============

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRY = process.env.JWT_EXPIRY || "7d";
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 100;

// ============== Rate Limiting ==============

class RateLimiter {
  constructor() {
    this.requests = new Map();
  }

  isLimited(key) {
    const now = Date.now();
    const userRequests = this.requests.get(key) || [];

    // Remove old requests outside the window
    const recentRequests = userRequests.filter(
      time => now - time < RATE_LIMIT_WINDOW
    );

    if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
      return true;
    }

    recentRequests.push(now);
    this.requests.set(key, recentRequests);
    return false;
  }

  reset(key) {
    this.requests.delete(key);
  }

  getStats(key) {
    const now = Date.now();
    const userRequests = this.requests.get(key) || [];
    const recentRequests = userRequests.filter(
      time => now - time < RATE_LIMIT_WINDOW
    );

    return {
      requests: recentRequests.length,
      limit: RATE_LIMIT_MAX_REQUESTS,
      window: RATE_LIMIT_WINDOW / 1000 // seconds
    };
  }
}

const rateLimiter = new RateLimiter();

// ============== Request Validation ==============

class RequestValidator {
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validateWalletAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  static validateJWT(token, secret) {
    try {
      return jwt.verify(token, secret);
    } catch (error) {
      return null;
    }
  }

  static sanitizeInput(input) {
    if (typeof input === "string") {
      return input.trim().slice(0, 1000); // Limit string length
    }
    return input;
  }
}

// ============== Token Management ==============

class TokenManager {
  constructor() {
    this.blacklist = new Set();
    this.tokenCache = new Map();
    this.refreshTokens = new Map();
  }

  generateAccessToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
  }

  generateRefreshToken(payload) {
    const refreshToken = crypto.randomBytes(32).toString("hex");
    this.refreshTokens.set(refreshToken, {
      payload,
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
    });
    return refreshToken;
  }

  verifyAccessToken(token) {
    try {
      if (this.blacklist.has(token)) {
        return null;
      }

      const cached = this.tokenCache.get(token);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.payload;
      }

      const payload = jwt.verify(token, JWT_SECRET);
      this.tokenCache.set(token, {
        payload,
        expiresAt: Date.now() + 5 * 60 * 1000 // Cache for 5 minutes
      });

      return payload;
    } catch (error) {
      return null;
    }
  }

  verifyRefreshToken(refreshToken) {
    const tokenData = this.refreshTokens.get(refreshToken);

    if (!tokenData || tokenData.expiresAt < Date.now()) {
      return null;
    }

    return tokenData.payload;
  }

  reuseRefreshToken(refreshToken) {
    this.refreshTokens.delete(refreshToken);
  }

  revokeToken(token) {
    this.blacklist.add(token);
    this.tokenCache.delete(token);

    // Clean up old tokens from blacklist (older than 24 hours)
    if (this.blacklist.size > 1000) {
      console.log("Blacklist exceeds 1000 tokens, considering cleanup");
    }
  }

  revokeAllUserTokens(userId) {
    // In production, this would revoke all tokens for a user
    console.log(`Revoking all tokens for user: ${userId}`);
  }
}

const tokenManager = new TokenManager();

// ============== Authentication Middleware ==============

/**
 * Verify JWT token and attach user to request
 */
const authenticateJWT = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Access token required",
        code: "MISSING_TOKEN"
      });
    }

    const token = authHeader.slice(7); // Remove "Bearer " prefix

    const decoded = tokenManager.verifyAccessToken(token);
    if (!decoded) {
      return res.status(403).json({
        error: "Invalid or expired token",
        code: "INVALID_TOKEN"
      });
    }

    req.user = decoded;
    req.token = token;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({
      error: "Authentication failed",
      code: "AUTH_ERROR"
    });
  }
};

/**
 * Optional authentication - don't fail if no token, but use it if present
 */
const optionalJWT = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const decoded = tokenManager.verifyAccessToken(token);

      if (decoded) {
        req.user = decoded;
        req.token = token;
      }
    }

    next();
  } catch (error) {
    console.error("Optional authentication error:", error);
    next();
  }
};

/**
 * Rate limiting middleware
 */
const rateLimit = (maxRequests = RATE_LIMIT_MAX_REQUESTS) => {
  return (req, res, next) => {
    const key = req.user?.id || req.ip;

    if (rateLimiter.isLimited(key)) {
      const stats = rateLimiter.getStats(key);
      return res.status(429).json({
        error: "Too many requests",
        code: "RATE_LIMIT_EXCEEDED",
        stats
      });
    }

    next();
  };
};

/**
 * API key authentication
 */
const authenticateAPIKey = (req, res, next) => {
  try {
    const apiKey = req.headers["x-api-key"];

    if (!apiKey) {
      return res.status(401).json({
        error: "API key required",
        code: "MISSING_API_KEY"
      });
    }

    // Validate API key (in production, check against database)
    const isValidKey = apiKey === process.env.API_KEY;

    if (!isValidKey) {
      return res.status(403).json({
        error: "Invalid API key",
        code: "INVALID_API_KEY"
      });
    }

    next();
  } catch (error) {
    console.error("API key authentication error:", error);
    res.status(500).json({
      error: "API key authentication failed",
      code: "API_KEY_AUTH_ERROR"
    });
  }
};

/**
 * Verify user is owner/admin
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      error: "Admin access required",
      code: "INSUFFICIENT_PERMISSIONS"
    });
  }

  next();
};

/**
 * Verify user has completed human verification
 */
const requireHumanVerification = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: "Authentication required",
      code: "MISSING_AUTH"
    });
  }

  if (!req.user.verifiedHuman) {
    return res.status(403).json({
      error: "Human verification required",
      code: "NOT_VERIFIED"
    });
  }

  next();
};

/**
 * Verify user has linked wallet
 */
const requireWallet = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: "Authentication required",
      code: "MISSING_AUTH"
    });
  }

  if (!req.user.walletAddress) {
    return res.status(403).json({
      error: "Wallet connection required",
      code: "MISSING_WALLET"
    });
  }

  next();
};

/**
 * Input validation middleware
 */
const validateInput = (allowedFields = []) => {
  return (req, res, next) => {
    try {
      if (req.method !== "GET") {
        // Validate request body fields
        const body = req.body || {};

        // Check for unexpected fields
        const bodyKeys = Object.keys(body);
        const unexpectedFields = bodyKeys.filter(
          key => !allowedFields.includes(key)
        );

        if (unexpectedFields.length > 0 && allowedFields.length > 0) {
          console.warn("Unexpected fields in request:", unexpectedFields);
          // Don't fail, just log warning
        }

        // Sanitize all fields
        for (const key in body) {
          req.body[key] = RequestValidator.sanitizeInput(body[key]);
        }
      }

      next();
    } catch (error) {
      console.error("Input validation error:", error);
      res.status(400).json({
        error: "Invalid input",
        code: "INVALID_INPUT"
      });
    }
  };
};

/**
 * Verify request signature (for API calls)
 */
const verifySignature = (req, res, next) => {
  try {
    const signature = req.headers["x-signature"];
    const timestamp = req.headers["x-timestamp"];

    if (!signature || !timestamp) {
      return res.status(400).json({
        error: "Signature and timestamp required",
        code: "MISSING_SIGNATURE"
      });
    }

    // Check timestamp is recent (within 5 minutes)
    const now = Date.now();
    const requestTime = parseInt(timestamp);

    if (Math.abs(now - requestTime) > 5 * 60 * 1000) {
      return res.status(400).json({
        error: "Request timestamp too old",
        code: "STALE_TIMESTAMP"
      });
    }

    // Verify signature (in production, use HMAC with shared secret)
    const secret = process.env.API_SECRET || "secret";
    const message = `${req.method}${req.path}${timestamp}`;
    const hash = crypto
      .createHmac("sha256", secret)
      .update(message)
      .digest("hex");

    if (hash !== signature) {
      return res.status(403).json({
        error: "Invalid signature",
        code: "INVALID_SIGNATURE"
      });
    }

    next();
  } catch (error) {
    console.error("Signature verification error:", error);
    res.status(500).json({
      error: "Signature verification failed",
      code: "SIGNATURE_ERROR"
    });
  }
};

// ============== Response Interceptor ==============

const addSecurityHeaders = (req, res, next) => {
  // Add security headers
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");

  // Add CORS headers (if needed)
  res.setHeader("Access-Control-Allow-Origin", process.env.CORS_ORIGIN || "http://localhost:3000");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-API-Key"
  );

  next();
};

// ============== Exports ==============

module.exports = {
  // Middleware
  authenticateJWT,
  optionalJWT,
  rateLimit,
  authenticateAPIKey,
  requireAdmin,
  requireHumanVerification,
  requireWallet,
  validateInput,
  verifySignature,
  addSecurityHeaders,

  // Utilities
  TokenManager,
  RateLimiter,
  RequestValidator,
  tokenManager,
  rateLimiter
};

