# Setup Guide - Secured Voting System

Complete guide for setting up the Secured Voting System for local development.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Backend Setup](#backend-setup)
4. [Frontend Setup](#frontend-setup)
5. [Smart Contracts Setup](#smart-contracts-setup)
6. [Database Setup](#database-setup)
7. [Running the Application](#running-the-application)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

```bash
# Check Node.js version (16 or higher)
node --version

# Check npm version (7 or higher)
npm --version

# Check Python version (3.8 or higher)
python --version

# Check PostgreSQL version (12 or higher)
psql --version

# Optional: Check Hardhat installation
npx hardhat --version
```

### Installation

#### Node.js

**Windows**:
1. Download from https://nodejs.org
2. Run installer and follow setup wizard
3. Verify: `node --version`

#### PostgreSQL

**Windows**:
1. Download from https://www.postgresql.org/download/windows/
2. Run installer, remember the password you set for postgres user
3. Verify: `psql --version`

#### Python

**Windows**:
1. Download from https://www.python.org/downloads/
2. Run installer and check "Add Python to PATH"
3. Verify: `python --version`

## Environment Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd secured-voting-system
```

### 2. Create Environment File

Create `.env` file in the root directory:

```bash
# Copy example environment file
cp .env.example .env
```

Or manually create `.env` with the following variables:

```env
# Node Environment
NODE_ENV=development

# Google OAuth (get from Google Cloud Console)
GOOGLE_CLIENT_ID=your_client_id_here
REACT_APP_GOOGLE_CLIENT_ID=your_client_id_here

# JWT Secret (generate a random string)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Ethereum Configuration
ETH_RPC_URL=http://localhost:8545
ETH_PRIVATE_KEY=your_ethereum_private_key_here
VOTING_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000

# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/votingdb
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=votingdb
```

## Backend Setup

### 1. Install Dependencies

```bash
cd src/backend
npm install
```

### 2. Create Backend Environment File

Create `.env` in `src/backend/`:

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/votingdb
ETH_RPC_URL=http://localhost:8545
ETH_PRIVATE_KEY=your_private_key
VOTING_CONTRACT_ADDRESS=0x...
```

### 3. Verify Backend Structure

```bash
# Check these files exist
server.js              # Main server file
package.json          # Dependencies
middleware/auth.js    # Authentication middleware
routes/auth.js        # Auth routes
routes/rooms.js       # Room management routes
services/humanVerification.js  # Verification service
```

### 4. Test Backend

```bash
# Start the backend server
npm start

# Expected output:
# Server running on port 5000
```

## Frontend Setup

### 1. Install Dependencies

```bash
cd src/frontend
npm install
```

### 2. Create Frontend Environment File

Create `.env` in `src/frontend/`:

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
REACT_APP_ENVIRONMENT=development
```

### 3. Verify Frontend Structure

```bash
# Check these files exist
src/App.js                    # Main App component
src/index.js                  # React entry point
src/components/               # React components
public/index.html            # HTML template
package.json                 # Dependencies
```

### 4. Test Frontend

```bash
# Start the frontend development server
npm start

# Browser will open at http://localhost:3000
```

## Smart Contracts Setup

### 1. Install Dependencies

```bash
cd src/smart_contracts
npm install
```

### 2. Create Hardhat Environment File

Create `.env` in `src/smart_contracts/`:

```env
ETH_RPC_URL=http://localhost:8545
ETH_PRIVATE_KEY=0x0000000000000000000000000000000000000000
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### 3. Compile Contracts

```bash
# Compile Solidity contracts
npx hardhat compile

# Expected output:
# Compiled 1 Solidity file successfully
```

### 4. Deploy Contracts (Local)

For local development, start Hardhat's local Ethereum node:

```bash
# Terminal 1: Start local Ethereum node
npx hardhat node

# Terminal 2: Deploy contracts
npx hardhat run scripts/deploy.js --network localhost
```

## Database Setup

### 1. Start PostgreSQL Service

**Windows**:
```bash
# PostgreSQL should start automatically as a service
# Verify it's running by opening pgAdmin or using psql
```

### 2. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE votingdb;

# List databases to verify
\l

# Exit psql
\q
```

### 3. Run Migrations (if applicable)

```bash
# From the backend directory
cd src/backend

# Run any database setup scripts
npm run migrate
```

## Running the Application

### Option 1: Run All Services Separately

**Terminal 1 - Database**:
```bash
# PostgreSQL runs as a service (Windows)
# Or start it manually

psql -U postgres
```

**Terminal 2 - Backend**:
```bash
cd src/backend
npm install
npm start

# Expected: Server running on port 5000
```

**Terminal 3 - Frontend**:
```bash
cd src/frontend
npm install
npm start

# Expected: Browser opens at http://localhost:3000
```

**Terminal 4 - Smart Contracts** (for contract deployment):
```bash
cd src/smart_contracts
npm install
npx hardhat run scripts/deploy.js
```

### Option 2: Run with Docker Compose

```bash
# From root directory
docker-compose up --build

# Services will be available at:
# - Frontend: http://localhost:3000
# - Backend: http://localhost:5000
# - Database: localhost:5432
```

## Verification Checklist

After setup, verify:

- [ ] PostgreSQL database is running and accessible
- [ ] Backend server starts without errors
- [ ] Frontend loads at http://localhost:3000
- [ ] API responds to requests (check http://localhost:5000/api/health)
- [ ] Smart contracts compile successfully
- [ ] Environment variables are properly configured

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 5000 (backend)
netstat -ano | findstr :5000

# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Find process using port 3000 (frontend)
netstat -ano | findstr :3000
```

### Database Connection Failed

```bash
# Test PostgreSQL connection
psql -U postgres -h localhost

# Verify DATABASE_URL format
# Should be: postgresql://username:password@host:port/database
```

### npm Installation Issues

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -r node_modules package-lock.json
npm install
```

### Module Not Found Errors

```bash
# Reinstall dependencies
npm install

# Clear Next.js/React cache
rm -r .next node_modules
npm install
```

## Development Workflow

1. **Makes changes** to backend/frontend/contracts
2. **Test locally** with development servers
3. **Run tests**: `npm test`
4. **Check linting**: `npm run lint` (if configured)
5. **Commit changes** to git
6. **Push to repository**

## Next Steps

- Review [API Reference](./API.md) for backend endpoints
- Read [Architecture Guide](./ARCHITECTURE.md) for system design
- Check [Deployment Guide](./DEPLOYMENT.md) for production setup

---

**Last Updated**: February 2026
