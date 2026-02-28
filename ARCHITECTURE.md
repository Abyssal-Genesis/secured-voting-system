# Architecture Guide - Secured Voting System

Comprehensive guide to the system architecture, components, and data flow.

## Table of Contents

1. [System Overview](#system-overview)
2. [Component Architecture](#component-architecture)
3. [Data Flow](#data-flow)
4. [Technology Stack](#technology-stack)
5. [Database Schema](#database-schema)
6. [Smart Contract Architecture](#smart-contract-architecture)
7. [Security Architecture](#security-architecture)
8. [Deployment Architecture](#deployment-architecture)

## System Overview

The Secured Voting System is a decentralized application (dApp) that leverages blockchain technology for transparent, secure voting. It combines:

- **Blockchain Layer**: Smart contracts for immutable vote recording
- **Backend Layer**: REST API for business logic
- **Frontend Layer**: React UI for user interaction
- **Database Layer**: PostgreSQL for supplementary data storage

```
┌─────────────────────────────────────────────────────────────┐
│                      User Interface                          │
│                   (React Frontend)                           │
│                   Port: 3000                                 │
└────────────┬────────────────────────────────────┬───────────┘
             │                                    │
      HTTP/REST                            WebSocket
             │                                    │
┌────────────▼────────────────────────────────────▼───────────┐
│                    Backend API                               │
│                 (Node.js/Express)                            │
│                   Port: 5000                                 │
├──────────────────────────────────────────────────────────────┤
│  Auth | Rooms | Voting | Human Verification | Analytics     │
└────────────┬────────────────────────┬──────────────┬────────┘
             │                        │              │
      PostgreSQL               Ethereum Network   Web3.js
             │                        │              │
┌────────────▼────────┐    ┌──────────▼──┐    ┌─────▼─────────┐
│   PostgreSQL        │    │  Blockchain │    │ Smart Contract│
│   Port: 5432        │    │   Network   │    │   (Voting)    │
└─────────────────────┘    └─────────────┘    └───────────────┘
```

## Component Architecture

### 1. Frontend Layer

**Location**: `src/frontend/`

**Technology**: React 18, React Scripts

**Components**:
- **App.js**: Main application component
- **components/VotingComponent.js**: Voting interface
- **components/Login.jsx**: Google OAuth login
- **components/HumanVerification.jsx**: Human verification
- **components/RoomCreate.jsx**: Create voting sessions
- **public/index.html**: HTML entry point

**Key Responsibilities**:
- User authentication (Google OAuth)
- Voting interface
- Real-time vote updates
- Session management

**Build Output**: Docker image, served on port 3000

### 2. Backend Layer

**Location**: `src/backend/`

**Technology**: Node.js, Express.js

**Directory Structure**:
```
backend/
├── server.js                    # Main server file
├── middleware/
│   └── auth.js                 # JWT authentication middleware
├── routes/
│   ├── auth.js                 # Authentication endpoints
│   └── rooms.js                # Room management endpoints
└── services/
    └── humanVerification.js    # Human verification service
```

**Key Endpoints**:
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/rooms/create` - Create voting session
- `GET /api/rooms` - List voting sessions
- `POST /api/votes/submit` - Submit vote
- `GET /api/votes/results` - Get voting results

**Key Responsibilities**:
- Authentication & Authorization
- Session management
- Vote recording
- API request validation
- Blockchain interaction

**Port**: 5000

### 3. Smart Contract Layer

**Location**: `src/smart_contracts/`

**Technology**: Hardhat, Solidity

**Contracts**:
- **Voting.sol**: Main voting contract

**Key Functions**:
- `createVotingSession()` - Create new voting session
- `castVote()` - Record vote on blockchain
- `getResults()` - Retrieve voting results
- `validateVoter()` - Verify voter eligibility

**Deployment**: 
- Local: Hardhat network (http://localhost:8545)
- Production: Ethereum mainnet/testnet

### 4. Database Layer

**Location**: PostgreSQL Container/Service

**Technology**: PostgreSQL 14

**Purpose**: 
- Store supplementary metadata
- User profiles
- Voting session details
- Audit logs

**Port**: 5432

## Data Flow

### Vote Submission Flow

```
1. User Interface (Frontend)
   ↓ (User fills voting form)
   
2. Frontend Component
   ↓ (Validates input, collects vote)
   
3. API Request
   ↓ (POST /api/votes/submit)
   
4. Backend Server
   ├─ Authenticate user (JWT validation)
   ├─ Validate request (middleware)
   ├─ Store in database
   └─ Send to blockchain
   
5. Smart Contract
   ├─ Verify vote eligibility
   ├─ Record vote immutably
   └─ Return transaction hash
   
6. Backend Response
   ↓ (Success confirmation)
   
7. Frontend Update
   └─ Display confirmation, update UI
```

### Authentication Flow

```
1. User Login (Frontend)
   ↓ (Google OAuth)
   
2. Google OAuth Response
   ↓ (ID token)
   
3. Backend Verification
   ├─ Validate token
   ├─ Create JWT token
   └─ Store user session
   
4. JWT Token Response
   ↓ (Backend to Frontend)
   
5. Frontend Storage
   └─ Store token in localStorage/sessionStorage
   
6. API Requests
   └─ Include token in Authorization header
```

## Technology Stack

### Frontend
| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | React | 18.0.0 |
| Build Tool | react-scripts | 5.0.1 |
| HTTP Client | fetch API / axios | - |
| State Management | React Hooks | - |
| CSS | CSS/Tailwind | - |

### Backend
| Component | Technology | Version |
|-----------|-----------|---------|
| Runtime | Node.js | 16+ |
| Framework | Express.js | 4.21.2 |
| Auth | JWT | 9.0.0 |
| Blockchain | Web3.js | 1.9.0 |
| Database | PostgreSQL | 14+ |

### Smart Contracts
| Component | Technology | Version |
|-----------|-----------|---------|
| Browser | Hardhat | 2.23.0 |
| Language | Solidity | 0.8.x |
| Network | Ethereum | - |
| Toolbox | @nomicfoundation/hardhat-toolbox | 5.0.0 |

### Infrastructure
| Component | Technology | Version |
|-----------|-----------|---------|
| Containerization | Docker | 20.10+ |
| Orchestration | Docker Compose | 1.29+ |
| OS | Linux/Windows/Mac | - |

## Database Schema

### Core Tables

#### users
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  google_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  verified_human BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### voting_sessions
```sql
CREATE TABLE voting_sessions (
  id SERIAL PRIMARY KEY,
  session_name VARCHAR(255) NOT NULL,
  description TEXT,
  creator_id INTEGER REFERENCES users(id),
  contract_address VARCHAR(255),
  status VARCHAR(50), -- active, closed, cancelled
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### votes
```sql
CREATE TABLE votes (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES voting_sessions(id),
  user_id INTEGER REFERENCES users(id),
  choice VARCHAR(255),
  blockchain_tx_hash VARCHAR(255) UNIQUE,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Smart Contract Architecture

### Voting.sol

**Contract Purpose**: Immutable vote recording on blockchain

**Key Variables**:
```solidity
struct VotingSession {
  address creator;
  string title;
  string[] options;
  uint256 startTime;
  uint256 endTime;
  mapping(address => bool) voters;
  mapping(string => uint256) votes;
  bool closed;
}
```

**Key Functions**:

1. **createSession()**
   - Creates new voting session
   - Stores on blockchain
   - Emits SessionCreated event

2. **castVote()**
   - Records vote immutably
   - Validates voter hasn't voted twice
   - Emits VoteCast event

3. **getResults()**
   - Returns current vote counts
   - Transparent to all participants

4. **closeSession()**
   - Finalizes voting
   - Prevents new votes

**Events**:
- `SessionCreated(address indexed creator, uint256 sessionId)`
- `VoteCast(uint256 indexed sessionId, address indexed voter)`
- `SessionClosed(uint256 indexed sessionId)`

## Security Architecture

### Authentication & Authorization

1. **Frontend Authentication**
   - Google OAuth 2.0 integration
   - Secure token storage
   - Token refresh mechanism

2. **Backend Authentication**
   - JWT token validation
   - Authorization middleware
   - Secure session management

3. **Blockchain Authentication**
   - Private key signing
   - Transaction verification
   - Gas limit validation

### Data Protection

1. **Transport Security**
   - HTTPS/TLS for API requests
   - Secure WebSocket (WSS)
   - CORS policy enforcement

2. **Data Storage**
   - Database encryption at rest
   - Hashed sensitive data
   - Audit logging

3. **Smart Contract Security**
   - Re-entrancy protection
   - Input validation
   - Access control

### Access Control

```
User Role Hierarchy:
├── Anonymous User
│   ├── View public voting sessions
│   └── View results
├── Authenticated User
│   ├── Create voting sessions
│   ├── Cast votes
│   └── View session details
└── Admin (future)
    ├── Manage sessions
    ├── Close voting
    └── Generate reports
```

## Deployment Architecture

### Local Development

```
Developer Machine
├── Frontend (React) - Port 3000
├── Backend (Express) - Port 5000
├── PostgreSQL - Port 5432
└── Hardhat Node - Port 8545
```

### Docker Deployment

```
Docker Host
├── Container: Frontend
│   └── Port 3000
├── Container: Backend
│   └── Port 5000
├── Container: PostgreSQL
│   └── Port 5432
└── Networks: app-network
```

### Production Architecture (future)

```
Cloud Provider (AWS/Azure/GCP)
├── Load Balancer
├── API Gateway
├── Microservices
│   ├── Frontend (CDN)
│   ├── Backend (Auto-scaling)
│   └── Database (Managed)
├── Blockchain Network
│   └── Ethereum Mainnet
└── Monitoring & Logging
```

## Integration Points

### Frontend ↔ Backend
- REST API (HTTP/HTTPS)
- WebSocket for real-time updates
- JSON data format

### Backend ↔ Blockchain
- Web3.js library
- RPC endpoint connection
- Contract ABI interface

### Backend ↔ Database
- PostgreSQL driver
- Connection pooling
- Transaction management

## Scalability Considerations

1. **Horizontal Scaling**
   - Multiple backend instances
   - Load balancing
   - Session management

2. **Vertical Scaling**
   - Increased server resources
   - Database optimization
   - Caching layer

3. **Blockchain Scalability**
   - Layer 2 solutions (Polygon)
   - Batch processing
   - Gas optimization

## Performance Metrics

- **API Response Time**: < 100ms
- **Vote Submission**: < 2 seconds (without blockchain)
- **Blockchain Confirmation**: 12-30 seconds
- **Database Query Time**: < 10ms
- **Frontend Load Time**: < 3 seconds

---

**Last Updated**: February 2026
