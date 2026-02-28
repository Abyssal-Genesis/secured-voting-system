/**
 * Logging Service
 * Centralized logging with levels and formatting
 */

const fs = require('fs');
const path = require('path');

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4
};

const LOG_COLORS = {
  ERROR: '\x1b[31m',    // Red
  WARN: '\x1b[33m',     // Yellow
  INFO: '\x1b[36m',     // Cyan
  DEBUG: '\x1b[35m',    // Magenta
  TRACE: '\x1b[37m',    // White
  RESET: '\x1b[0m'
};

class Logger {
  constructor(context = 'APP') {
    this.context = context;
    this.level = LOG_LEVELS[process.env.LOG_LEVEL || 'INFO'];
    this.logsDir = path.join(__dirname, '../../logs');
    this.ensureLogsDir();
  }

  ensureLogsDir() {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  getTimestamp() {
    return new Date().toISOString();
  }

  formatMessage(level, message, data = {}) {
    const timestamp = this.getTimestamp();
    const color = LOG_COLORS[level];
    const reset = LOG_COLORS.RESET;
    const dataStr = Object.keys(data).length > 0 ? JSON.stringify(data) : '';
    
    return `${color}[${timestamp}] [${level}] [${this.context}] ${message}${dataStr ? ' ' + dataStr : ''}${reset}`;
  }

  writeToFile(level, message, data = {}) {
    try {
      const logFile = path.join(this.logsDir, `${level.toLowerCase()}.log`);
      const logEntry = `[${this.getTimestamp()}] [${level}] [${this.context}] ${message} ${JSON.stringify(data)}\n`;
      fs.appendFileSync(logFile, logEntry);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  log(level, message, data = {}) {
    if (LOG_LEVELS[level] <= this.level) {
      const formatted = this.formatMessage(level, message, data);
      console.log(formatted);
      this.writeToFile(level, message, data);
    }
  }

  error(message, data = {}) {
    this.log('ERROR', message, data);
  }

  warn(message, data = {}) {
    this.log('WARN', message, data);
  }

  info(message, data = {}) {
    this.log('INFO', message, data);
  }

  debug(message, data = {}) {
    this.log('DEBUG', message, data);
  }

  trace(message, data = {}) {
    this.log('TRACE', message, data);
  }
}

module.exports = Logger;
