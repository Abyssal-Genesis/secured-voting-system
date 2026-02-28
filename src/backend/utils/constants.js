/**
 * Application Constants
 * Centralized constants used throughout the application
 */

// =============================================================================
// HTTP STATUS CODES
// =============================================================================

const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  RATE_LIMITED: 429,
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  SERVICE_UNAVAILABLE: 503
};

// =============================================================================
// ERROR CODES
// =============================================================================

const ERROR_CODES = {
  // Authentication Errors
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  UNAUTHORIZED: 'UNAUTHORIZED',
  
  // User Errors
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_EXISTS: 'USER_EXISTS',
  USER_UNVERIFIED: 'USER_UNVERIFIED',
  
  // Voting Errors
  VOTING_CLOSED: 'VOTING_CLOSED',
  ALREADY_VOTED: 'ALREADY_VOTED',
  INVALID_VOTE: 'INVALID_VOTE',
  ROOM_NOT_FOUND: 'ROOM_NOT_FOUND',
  
  // Verification Errors
  VERIFICATION_FAILED: 'VERIFICATION_FAILED',
  VERIFICATION_TIMEOUT: 'VERIFICATION_TIMEOUT',
  
  // Blockchain Errors
  CONTRACT_ERROR: 'CONTRACT_ERROR',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  INSUFFICIENT_GAS: 'INSUFFICIENT_GAS',
  
  // Server Errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE'
};

// =============================================================================
// USER ROLES & PERMISSIONS
// =============================================================================

const USER_ROLES = {
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  VOTER: 'voter',
  GUEST: 'guest'
};

const PERMISSIONS = {
  CREATE_ROOM: 'create_room',
  EDIT_ROOM: 'edit_room',
  DELETE_ROOM: 'delete_room',
  VOTE: 'vote',
  VIEW_RESULTS: 'view_results',
  MANAGE_USERS: 'manage_users',
  VIEW_AUDIT_LOGS: 'view_audit_logs'
};

// =============================================================================
// VOTING ROOM STATUS
// =============================================================================

const ROOM_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  PAUSED: 'paused',
  CLOSED: 'closed',
  ARCHIVED: 'archived',
  FAILED: 'failed'
};

// =============================================================================
// VOTING TYPES
// =============================================================================

const VOTING_TYPES = {
  SINGLE_CHOICE: 'single_choice',
  MULTIPLE_CHOICE: 'multiple_choice',
  RANKED: 'ranked',
  YES_NO: 'yes_no',
  CUSTOM: 'custom'
};

// =============================================================================
// VERIFICATION METHODS
// =============================================================================

const VERIFICATION_METHODS = {
  FACIAL_RECOGNITION: 'facial_recognition',
  LIVENESS_DETECTION: 'liveness_detection',
  PHONE_VERIFICATION: 'phone_verification',
  EMAIL_VERIFICATION: 'email_verification',
  TWO_FACTOR: 'two_factor',
  BIOMETRIC: 'biometric'
};

// =============================================================================
// VERIFICATION STATUS
// =============================================================================

const VERIFICATION_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
  EXPIRED: 'expired'
};

// =============================================================================
// OAUTH PROVIDERS
// =============================================================================

const OAUTH_PROVIDERS = {
  GOOGLE: 'google',
  GITHUB: 'github',
  FACEBOOK: 'facebook',
  MICROSOFT: 'microsoft',
  APPLE: 'apple'
};

// =============================================================================
// RATE LIMIT CONSTANTS
// =============================================================================

const RATE_LIMITS = {
  REGISTRATION: { attempts: 5, window: 15 * 60 * 1000 },        // 5 attempts per 15 minutes
  LOGIN: { attempts: 10, window: 15 * 60 * 1000 },              // 10 attempts per 15 minutes
  VOTING: { attempts: 100, window: 24 * 60 * 60 * 1000 },       // 100 actions per day
  API: { attempts: 1000, window: 60 * 60 * 1000 }               // 1000 requests per hour
};

// =============================================================================
// CACHE KEYS
// =============================================================================

const CACHE_KEYS = {
  USER: (id) => `user:${id}`,
  ROOM: (id) => `room:${id}`,
  VOTES: (roomId) => `votes:${roomId}`,
  USER_SESSION: (token) => `session:${token}`,
  VERIFICATION: (userId) => `verification:${userId}`
};

// =============================================================================
// CACHE TTL (Time To Live)
// =============================================================================

const CACHE_TTL = {
  SHORT: 5 * 60,           // 5 minutes
  MEDIUM: 30 * 60,         // 30 minutes
  LONG: 24 * 60 * 60,      // 1 day
  VERY_LONG: 7 * 24 * 60 * 60  // 7 days
};

// =============================================================================
// AUDIT LOG ACTIONS
// =============================================================================

const AUDIT_ACTIONS = {
  CREATE: 'CREATE',
  READ: 'READ',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  VERIFY: 'VERIFY',
  VOTE: 'VOTE',
  EXPORT: 'EXPORT',
  IMPORT: 'IMPORT'
};

// =============================================================================
// BLOCKCHAIN CONSTANTS
// =============================================================================

const BLOCKCHAIN = {
  NETWORK: {
    MAINNET: 1,
    SEPOLIA: 11155111,
    GANACHE: 1337,
    HARDHAT: 31337
  },
  GAS_LIMITS: {
    BASIC: 21000,
    VOTING: 200000,
    CONTRACT_DEPLOY: 5000000
  },
  CONFIRMATION_BLOCKS: 1,
  RPC_TIMEOUT: 30000
};

// =============================================================================
// REGEX PATTERNS
// =============================================================================

const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  ETHEREUM_ADDRESS: /^0x[a-fA-F0-9]{40}$/,
  ETHEREUM_HASH: /^0x[a-fA-F0-9]{64}$/,
  URL: /^https?:\/\/.+/,
  PHONE: /^\+?[1-9]\d{1,14}$/,
  PASSWORD_STRONG: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
};

// =============================================================================
// MESSAGE TEMPLATES
// =============================================================================

const MESSAGES = {
  SUCCESS: {
    LOGIN: 'Login successful',
    LOGOUT: 'Logout successful',
    VOTE_CAST: 'Your vote has been cast successfully',
    ROOM_CREATED: 'Voting room created successfully',
    USER_VERIFIED: 'User verified successfully'
  },
  ERROR: {
    INVALID_CREDENTIALS: 'Invalid email or password',
    TOKEN_EXPIRED: 'Your session has expired. Please login again',
    USER_NOT_FOUND: 'User not found',
    ALREADY_VOTED: 'You have already voted in this room',
    VERIFICATION_FAILED: 'Verification failed. Please try again',
    INTERNAL_ERROR: 'An internal server error occurred'
  }
};

module.exports = {
  HTTP_STATUS,
  ERROR_CODES,
  USER_ROLES,
  PERMISSIONS,
  ROOM_STATUS,
  VOTING_TYPES,
  VERIFICATION_METHODS,
  VERIFICATION_STATUS,
  OAUTH_PROVIDERS,
  RATE_LIMITS,
  CACHE_KEYS,
  CACHE_TTL,
  AUDIT_ACTIONS,
  BLOCKCHAIN,
  REGEX,
  MESSAGES
};
