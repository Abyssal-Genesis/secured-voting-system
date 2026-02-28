/**
 * Helper Utilities
 * Common helper functions used throughout the application
 */

const crypto = require('crypto');

// =============================================================================
// STRING & ENCODING UTILITIES
// =============================================================================

const StringUtils = {
  /**
   * Generate random string of specified length
   */
  generateRandomString(length = 32) {
    return crypto.randomBytes(length).toString('hex').substring(0, length);
  },

  /**
   * Generate random token
   */
  generateToken(length = 64) {
    return crypto.randomBytes(length / 2).toString('hex');
  },

  /**
   * Slugify string
   */
  slugify(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },

  /**
   * Truncate string
   */
  truncate(text, length = 100, suffix = '...') {
    return text.length > length ? text.substring(0, length) + suffix : text;
  },

  /**
   * Mask email for privacy
   */
  maskEmail(email) {
    const [localPart, domain] = email.split('@');
    const visibleChars = Math.max(1, Math.ceil(localPart.length / 3));
    const masked = localPart.substring(0, visibleChars) + '*'.repeat(localPart.length - visibleChars);
    return `${masked}@${domain}`;
  },

  /**
   * Mask wallet address
   */
  maskAddress(address) {
    return address.substring(0, 6) + '...' + address.substring(address.length - 4);
  }
};

// =============================================================================
// DATE & TIME UTILITIES
// =============================================================================

const DateUtils = {
  /**
   * Get current timestamp in seconds
   */
  now() {
    return Math.floor(Date.now() / 1000);
  },

  /**
   * Format date to readable string
   */
  format(date, format = 'YYYY-MM-DD HH:mm:ss') {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  },

  /**
   * Add days to date
   */
  addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },

  /**
   * Get difference in seconds
   */
  differenceInSeconds(date1, date2) {
    return Math.floor((date2 - date1) / 1000);
  },

  /**
   * Check if date is in the past
   */
  isPast(date) {
    return new Date(date) < new Date();
  },

  /**
   * Check if date is in the future
   */
  isFuture(date) {
    return new Date(date) > new Date();
  }
};

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

const ValidationUtils = {
  /**
   * Validate email
   */
  isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  },

  /**
   * Validate Ethereum address
   */
  isValidEthereumAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  },

  /**
   * Validate transaction hash
   */
  isValidTxHash(hash) {
    return /^0x[a-fA-F0-9]{64}$/.test(hash);
  },

  /**
   * Validate UUID
   */
  isValidUUID(uuid) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
  },

  /**
   * Validate strong password
   */
  isStrongPassword(password) {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
  },

  /**
   * Validate phone number
   */
  isValidPhoneNumber(phone) {
    const regex = /^\+?[1-9]\d{1,14}$/;
    return regex.test(phone);
  }
};

// =============================================================================
// CRYPTO UTILITIES
// =============================================================================

const CryptoUtils = {
  /**
   * Hash string using SHA256
   */
  hash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  },

  /**
   * Generate hash with salt
   */
  hashWithSalt(data, salt = null) {
    const saltToUse = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.createHash('sha256').update(data + saltToUse).digest('hex');
    return `${hash}.${saltToUse}`;
  },

  /**
   * Verify hash with salt
   */
  verifyHash(data, hashedData) {
    const [hash, salt] = hashedData.split('.');
    const newHash = crypto.createHash('sha256').update(data + salt).digest('hex');
    return hash === newHash;
  },

  /**
   * Generate HMAC
   */
  generateHMAC(data, secret) {
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  },

  /**
   * Verify HMAC
   */
  verifyHMAC(data, signature, secret) {
    const expectedSignature = CryptoUtils.generateHMAC(data, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }
};

// =============================================================================
// ARRAY/OBJECT UTILITIES
// =============================================================================

const CollectionUtils = {
  /**
   * Group array by property
   */
  groupBy(array, key) {
    return array.reduce((result, item) => {
      const group = item[key];
      if (!result[group]) result[group] = [];
      result[group].push(item);
      return result;
    }, {});
  },

  /**
   * Flatten nested arrays
   */
  flatten(array) {
    return array.reduce((flat, toFlatten) => {
      return flat.concat(Array.isArray(toFlatten) ? CollectionUtils.flatten(toFlatten) : toFlatten);
    }, []);
  },

  /**
   * Remove duplicates from array
   */
  unique(array) {
    return [...new Set(array)];
  },

  /**
   * Chunk array into smaller arrays
   */
  chunk(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },

  /**
   * Deep clone object
   */
  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  /**
   * Merge objects deeply
   */
  deepMerge(target, source) {
    for (const key in source) {
      if (source[key] instanceof Object && key in target) {
        CollectionUtils.deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  }
};

// =============================================================================
// PAGINATION UTILITIES
// =============================================================================

const PaginationUtils = {
  /**
   * Get pagination metadata
   */
  getPaginationMetadata(page = 1, limit = 10, total = 0) {
    page = Math.max(1, parseInt(page) || 1);
    limit = Math.max(1, Math.min(100, parseInt(limit) || 10));

    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    return {
      page,
      limit,
      offset,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    };
  },

  /**
   * Paginate array
   */
  paginate(array, page = 1, limit = 10) {
    const pagination = PaginationUtils.getPaginationMetadata(page, limit, array.length);
    const items = array.slice(pagination.offset, pagination.offset + pagination.limit);

    return {
      data: items,
      pagination
    };
  }
};

// =============================================================================
// HTTP UTILITIES
// =============================================================================

const HttpUtils = {
  /**
   * Build query string from object
   */
  buildQueryString(params) {
    return Object.entries(params)
      .filter(([, value]) => value !== null && value !== undefined)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
  },

  /**
   * Parse query string to object
   */
  parseQueryString(queryString) {
    const params = new URLSearchParams(queryString);
    const result = {};
    for (const [key, value] of params) {
      result[key] = value;
    }
    return result;
  },

  /**
   * Get client IP from request
   */
  getClientIP(req) {
    return (
      req.headers['x-forwarded-for']?.split(',')[0].trim() ||
      req.headers['x-real-ip'] ||
      req.ip ||
      req.connection.remoteAddress
    );
  },

  /**
   * Check if request is from HTTPS
   */
  isSecureRequest(req) {
    return req.secure || req.headers['x-forwarded-proto'] === 'https';
  }
};

module.exports = {
  StringUtils,
  DateUtils,
  ValidationUtils,
  CryptoUtils,
  CollectionUtils,
  PaginationUtils,
  HttpUtils
};
