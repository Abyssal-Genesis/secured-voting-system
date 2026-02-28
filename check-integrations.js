#!/usr/bin/env node

/**
 * Integration Checker Script
 * Verifies all system integrations and dependencies
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('\n' + '='.repeat(80));
console.log('SECURED VOTING SYSTEM - INTEGRATION CHECKER');
console.log('='.repeat(80) + '\n');

const checks = {
  passed: [],
  failed: [],
  warnings: []
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function checkFile(filePath, description) {
  const fullPath = path.resolve(filePath);
  if (fs.existsSync(fullPath)) {
    checks.passed.push(`✓ ${description}`);
    return true;
  } else {
    checks.failed.push(`✗ ${description} - File not found: ${fullPath}`);
    return false;
  }
}

function checkModule(moduleName, description) {
  try {
    require.resolve(moduleName);
    checks.passed.push(`✓ ${description}`);
    return true;
  } catch (error) {
    checks.warnings.push(`⚠ ${description} - Module not installed: ${moduleName}`);
    return false;
  }
}

function checkCommand(command, description) {
  try {
    execSync(`${command} --version`, { stdio: 'ignore' });
    checks.passed.push(`✓ ${description}`);
    return true;
  } catch (error) {
    checks.warnings.push(`⚠ ${description} - Command not available: ${command}`);
    return false;
  }
}

// =============================================================================
// BACKEND INTEGRATION CHECKS
// =============================================================================

console.log('📦 BACKEND INTEGRATION CHECKS\n');

// Configuration files
checkFile('src/backend/.env', 'Environment configuration');
checkFile('src/backend/.env.example', 'Environment example');
checkFile('src/backend/config/oauth.config.js', 'OAuth configuration');
checkFile('src/backend/config/database.js', 'Database configuration');

// Route files
checkFile('src/backend/routes/auth.js', 'Auth routes');
checkFile('src/backend/routes/oauth.js', 'OAuth routes');
checkFile('src/backend/routes/voting.js', 'Voting routes');
checkFile('src/backend/routes/rooms.js', 'Rooms routes');

// Service files
checkFile('src/backend/services/web3Service.js', 'Web3 service');
checkFile('src/backend/services/web3Contract.js', 'Web3 contract service');
checkFile('src/backend/services/humanVerification.js', 'Human verification service');

// Middleware files
checkFile('src/backend/middleware/auth.js', 'Auth middleware');
checkFile('src/backend/middleware/authMiddleware.js', 'Auth middleware (v2)');

// Utility files
checkFile('src/backend/utils/constants.js', 'Constants utility');
checkFile('src/backend/utils/errorHandler.js', 'Error handler utility');
checkFile('src/backend/utils/helpers.js', 'Helper utilities');
checkFile('src/backend/utils/logger.js', 'Logger utility');
checkFile('src/backend/utils/testDataFactory.js', 'Test data factory');

// Test files
checkFile('src/backend/tests/setup.js', 'Test setup');
checkFile('src/backend/tests/auth.test.js', 'Auth tests');
checkFile('src/backend/tests/voting.test.js', 'Voting tests');

// Configuration files
checkFile('src/backend/jest.config.js', 'Jest configuration');
checkFile('src/backend/Dockerfile', 'Backend Dockerfile');

console.log('\n✓ Backend integration checks completed\n');

// =============================================================================
// FRONTEND INTEGRATION CHECKS
// =============================================================================

console.log('⚛️  FRONTEND INTEGRATION CHECKS\n');

checkFile('src/frontend/package.json', 'Frontend package file');
checkFile('src/frontend/src/App.js', 'Frontend App component');
checkFile('src/frontend/src/index.js', 'Frontend entry point');
checkFile('src/frontend/Dockerfile', 'Frontend Dockerfile');

console.log('\n✓ Frontend integration checks completed\n');

// =============================================================================
// BLOCKCHAIN INTEGRATION CHECKS
// =============================================================================

console.log('⛓️  BLOCKCHAIN INTEGRATION CHECKS\n');

checkFile('src/smart_contracts/contracts/Voting.sol', 'Voting smart contract');
checkFile('src/smart_contracts/hardhat.config.js', 'Hardhat configuration');
checkFile('src/smart_contracts/package.json', 'Smart contracts package file');

console.log('\n✓ Blockchain integration checks completed\n');

// =============================================================================
// DOCKER INTEGRATION CHECKS
// =============================================================================

console.log('🐳 DOCKER INTEGRATION CHECKS\n');

checkFile('docker-compose.yml', 'Development docker-compose');
checkFile('docker-compose-prod.yml', 'Production docker-compose');
checkFile('nginx.conf', 'Nginx configuration');

checkCommand('docker', 'Docker installation');
checkCommand('docker-compose', 'Docker Compose installation');

console.log('\n✓ Docker integration checks completed\n');

// =============================================================================
// DOCUMENTATION CHECKS
// =============================================================================

console.log('📖 DOCUMENTATION CHECKS\n');

checkFile('README.md', 'Main README');
checkFile('API.md', 'API documentation');
checkFile('ARCHITECTURE.md', 'Architecture documentation');
checkFile('PRODUCTION_DEPLOYMENT.md', 'Production deployment guide');

console.log('\n✓ Documentation checks completed\n');

// =============================================================================
// MODULE/DEPENDENCY CHECKS
// =============================================================================

console.log('📚 DEPENDENCY CHECKS\n');

// Backend dependencies
checkModule('express', 'Express');
checkModule('jsonwebtoken', 'JWT');
checkModule('dotenv', 'Dotenv');
checkModule('cors', 'CORS');
checkModule('ethers', 'Ethers.js');
checkModule('pg', 'PostgreSQL driver');
checkModule('redis', 'Redis client');
checkModule('helmet', 'Helmet security');
checkModule('morgan', 'Morgan logging');

console.log('\n✓ Dependency checks completed\n');

// =============================================================================
// CONFIGURATION VALIDATION
// =============================================================================

console.log('⚙️  CONFIGURATION VALIDATION\n');

try {
  const envPath = 'src/backend/.env';
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const hasRequiredVars = [
      'NODE_ENV',
      'JWT_SECRET',
      'DB_HOST',
      'DB_NAME',
      'DB_USER'
    ].every(v => envContent.includes(v));

    if (hasRequiredVars) {
      checks.passed.push('✓ Environment variables configured');
    } else {
      checks.failed.push('✗ Missing required environment variables');
    }
  }
} catch (error) {
  checks.failed.push('✗ Configuration validation failed');
}

console.log();

// =============================================================================
// OAUTH PROVIDER CHECKS
// =============================================================================

console.log('🔐 OAUTH PROVIDER CHECKS\n');

try {
  const oauthConfig = require('./src/backend/config/oauth.config.js');
  
  const providers = ['google', 'github', 'facebook', 'microsoft'];
  providers.forEach(provider => {
    if (oauthConfig[provider]) {
      checks.passed.push(`✓ ${provider.toUpperCase()} OAuth configured`);
    } else {
      checks.failed.push(`✗ ${provider.toUpperCase()} OAuth not configured`);
    }
  });
} catch (error) {
  checks.failed.push('✗ OAuth configuration file not found');
}

console.log();

// =============================================================================
// RESULTS SUMMARY
// =============================================================================

console.log('\n' + '='.repeat(80));
console.log('SUMMARY');
console.log('='.repeat(80) + '\n');

console.log(`✓ PASSED: ${checks.passed.length}`);
checks.passed.forEach(item => console.log(`  ${item}`));

if (checks.warnings.length > 0) {
  console.log(`\n⚠ WARNINGS: ${checks.warnings.length}`);
  checks.warnings.forEach(item => console.log(`  ${item}`));
}

console.log(`\n✗ FAILED: ${checks.failed.length}`);
if (checks.failed.length > 0) {
  checks.failed.forEach(item => console.log(`  ${item}`));
} else {
  console.log('  All checks passed!');
}

// =============================================================================
// FINAL STATUS
// =============================================================================

console.log('\n' + '='.repeat(80));

if (checks.failed.length === 0) {
  console.log('✅ ALL INTEGRATIONS VALIDATED SUCCESSFULLY');
  console.log('🚀 System is ready for deployment');
  process.exit(0);
} else {
  console.log('❌ SOME CHECKS FAILED');
  console.log('⚠️  Please fix the issues above before deployment');
  process.exit(1);
}

console.log('='.repeat(80) + '\n');
