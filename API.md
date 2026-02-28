# API Reference - Secured Voting System

Complete API documentation for the Secured Voting System backend.

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Error Handling](#error-handling)
4. [Endpoints](#endpoints)
5. [WebSocket Events](#websocket-events)
6. [Rate Limiting](#rate-limiting)
7. [Examples](#examples)

## Overview

**Base URL**: `http://localhost:5000/api` (development)
**Base URL**: `https://api.voting.example.com/api` (production)

**Response Format**: JSON

**Content-Type**: `application/json`

## Authentication

All protected endpoints require a JWT token in the Authorization header.

### Header Format

```http
Authorization: Bearer <JWT_TOKEN>
```

### Obtaining a Token

1. **Login Endpoint** returns a JWT token
2. Token is valid for 24 hours
3. Include token in all subsequent requests

### Example

```bash
# Request with authentication
curl -H "Authorization: Bearer token123" \
     http://localhost:5000/api/votes/submit
```

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "statusCode": 400,
  "details": {
    "field": "error details"
  }
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Successful request |
| 201 | Resource created |
| 400 | Bad request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not found |
| 429 | Too many requests |
| 500 | Server error |

### Common Error Codes

```
AUTH_REQUIRED         - Authentication token required
INVALID_TOKEN         - Token is invalid or expired
USER_NOT_VERIFIED     - User requires human verification
SESSION_CLOSED        - Voting session is closed
ALREADY_VOTED         - User has already voted in this session
INSUFFICIENT_CREDITS  - User needs more credits/permissions
DATABASE_ERROR        - Database operation failed
BLOCKCHAIN_ERROR      - Blockchain transaction failed
INVALID_INPUT         - Request validation failed
```

## Endpoints

### Authentication Endpoints

#### POST /auth/login

Authenticate user with Google OAuth token.

**Request**:
```json
{
  "googleToken": "google_id_token"
}
```

**Response** (Success - 200):
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "verified": true,
    "createdAt": "2024-02-25T10:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 86400
}
```

**Response** (Error - 401):
```json
{
  "success": false,
  "error": "Invalid Google token",
  "code": "INVALID_TOKEN"
}
```

#### POST /auth/logout

Logout current user and invalidate token.

**Headers**: `Authorization: Bearer <token>`

**Response** (Success - 200):
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### GET /auth/verify

Verify current authentication token.

**Headers**: `Authorization: Bearer <token>`

**Response** (Success - 200):
```json
{
  "success": true,
  "valid": true,
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

---

### Room/Session Endpoints

#### POST /rooms/create

Create a new voting session.

**Headers**: 
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

**Request**:
```json
{
  "name": "Class President Election",
  "description": "Vote for the next class president",
  "options": ["Alice", "Bob", "Charlie"],
  "startTime": "2024-02-25T14:00:00Z",
  "endTime": "2024-02-25T15:00:00Z",
  "maxVoters": 100
}
```

**Response** (Success - 201):
```json
{
  "success": true,
  "room": {
    "id": 1,
    "name": "Class President Election",
    "description": "Vote for the next class president",
    "options": ["Alice", "Bob", "Charlie"],
    "creator": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    },
    "contractAddress": "0x742d35Cc6634C0532925a3b844Bc5e8bE66B3f16",
    "status": "active",
    "startTime": "2024-02-25T14:00:00Z",
    "endTime": "2024-02-25T15:00:00Z",
    "maxVoters": 100,
    "votesCount": 0,
    "createdAt": "2024-02-25T13:30:00Z"
  }
}
```

**Response** (Error - 400):
```json
{
  "success": false,
  "error": "Invalid input",
  "code": "INVALID_INPUT",
  "details": {
    "options": "At least 2 options required"
  }
}
```

#### GET /rooms

List all available voting sessions.

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `status`: Filter by status (active, closed, cancelled) - optional
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

**Response** (Success - 200):
```json
{
  "success": true,
  "rooms": [
    {
      "id": 1,
      "name": "Class President Election",
      "creator": "John Doe",
      "status": "active",
      "votesCount": 25,
      "maxVoters": 100,
      "startTime": "2024-02-25T14:00:00Z",
      "endTime": "2024-02-25T15:00:00Z"
    },
    {
      "id": 2,
      "name": "Course Feedback",
      "creator": "Professor Smith",
      "status": "closed",
      "votesCount": 45,
      "maxVoters": 50,
      "startTime": "2024-02-24T10:00:00Z",
      "endTime": "2024-02-24T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 2,
    "pages": 1
  }
}
```

#### GET /rooms/:id

Get details of a specific voting session.

**Headers**: `Authorization: Bearer <token>`

**Parameters**:
- `id`: Room ID (required)

**Response** (Success - 200):
```json
{
  "success": true,
  "room": {
    "id": 1,
    "name": "Class President Election",
    "description": "Vote for the next class president",
    "options": ["Alice", "Bob", "Charlie"],
    "creator": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    },
    "contractAddress": "0x742d35Cc6634C0532925a3b844Bc5e8bE66B3f16",
    "status": "active",
    "startTime": "2024-02-25T14:00:00Z",
    "endTime": "2024-02-25T15:00:00Z",
    "maxVoters": 100,
    "votesCount": 25,
    "hasVoted": false
  }
}
```

#### POST /rooms/:id/close

Close a voting session (only room creator).

**Headers**: `Authorization: Bearer <token>`

**Parameters**:
- `id`: Room ID (required)

**Response** (Success - 200):
```json
{
  "success": true,
  "message": "Voting session closed successfully",
  "room": {
    "id": 1,
    "status": "closed",
    "finalVotesCount": 50
  }
}
```

---

### Voting Endpoints

#### POST /votes/submit

Submit a vote in a voting session.

**Headers**: 
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

**Request**:
```json
{
  "roomId": 1,
  "choice": "Alice"
}
```

**Response** (Success - 201):
```json
{
  "success": true,
  "vote": {
    "id": 45,
    "roomId": 1,
    "userId": 1,
    "choice": "Alice",
    "timestamp": "2024-02-25T14:15:00Z",
    "blockchainHash": "0xa1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
    "verified": true
  }
}
```

**Response** (Error - Already voted - 400):
```json
{
  "success": false,
  "error": "User has already voted in this session",
  "code": "ALREADY_VOTED"
}
```

**Response** (Error - Not verified - 403):
```json
{
  "success": false,
  "error": "User must complete human verification first",
  "code": "USER_NOT_VERIFIED"
}
```

#### GET /votes/results/:roomId

Get voting results for a session.

**Headers**: `Authorization: Bearer <token>`

**Parameters**:
- `roomId`: Room ID (required)

**Response** (Success - 200):
```json
{
  "success": true,
  "results": {
    "roomId": 1,
    "roomName": "Class President Election",
    "totalVotes": 50,
    "status": "active",
    "votes": {
      "Alice": {
        "count": 20,
        "percentage": 40
      },
      "Bob": {
        "count": 18,
        "percentage": 36
      },
      "Charlie": {
        "count": 12,
        "percentage": 24
      }
    },
    "updatedAt": "2024-02-25T14:15:00Z"
  }
}
```

#### GET /votes/my-votes

Get user's voting history.

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

**Response** (Success - 200):
```json
{
  "success": true,
  "votes": [
    {
      "id": 45,
      "room": {
        "id": 1,
        "name": "Class President Election"
      },
      "choice": "Alice",
      "timestamp": "2024-02-25T14:15:00Z",
      "verified": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5
  }
}
```

---

### Human Verification Endpoints

#### POST /verification/initiate

Initiate human verification process.

**Headers**: `Authorization: Bearer <token>`

**Response** (Success - 200):
```json
{
  "success": true,
  "verificationId": "verify_abc123",
  "challenge": {
    "type": "image_recognition",
    "description": "Select all images containing cats",
    "images": [
      "https://cdn.example.com/image1.jpg",
      "https://cdn.example.com/image2.jpg",
      ...
    ]
  },
  "expiresIn": 300
}
```

#### POST /verification/complete

Complete human verification challenge.

**Headers**: `Authorization: Bearer <token>`

**Request**:
```json
{
  "verificationId": "verify_abc123",
  "response": [0, 2, 5]
}
```

**Response** (Success - 200):
```json
{
  "success": true,
  "verified": true,
  "message": "Human verification completed successfully",
  "user": {
    "id": 1,
    "verified": true
  }
}
```

**Response** (Error - Verification failed - 400):
```json
{
  "success": false,
  "error": "Failed verification",
  "code": "VERIFICATION_FAILED",
  "attemptsRemaining": 2
}
```

#### GET /verification/status

Get user's verification status.

**Headers**: `Authorization: Bearer <token>`

**Response** (Success - 200):
```json
{
  "success": true,
  "verified": true,
  "verificationDate": "2024-02-20T10:00:00Z",
  "expiresAt": "2025-02-20T10:00:00Z",
  "verificationMethod": "image_recognition"
}
```

---

## WebSocket Events

Real-time voting updates via WebSocket connection.

**Connection URL**: `ws://localhost:5000/socket.io`

### Subscribe to Room Updates

```javascript
socket.on('connect', () => {
  socket.emit('join-room', { roomId: 1 });
});

// Receive vote updates
socket.on('vote-cast', (data) => {
  console.log('New vote for:', data.choice);
  console.log('Total votes:', data.totalVotes);
});

// Receive session updates
socket.on('session-update', (data) => {
  console.log('Session status:', data.status);
});

// Receive results update
socket.on('results-update', (data) => {
  console.log('Updated results:', data.votes);
});
```

### WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `join-room` | Send | Join a voting room |
| `leave-room` | Send | Leave a voting room |
| `vote-cast` | Receive | New vote submitted |
| `results-update` | Receive | Voting results updated |
| `session-update` | Receive | Session status changed |
| `user-joined` | Receive | New user joined room |
| `user-left` | Receive | User left room |

---

## Rate Limiting

API requests are rate-limited to prevent abuse.

**Limits**:
- **Authenticated users**: 100 requests per 15 minutes
- **Unauthenticated**: 20 requests per 15 minutes

**Headers** (in response):
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1708864500
```

**Error** (429 Too Many Requests):
```json
{
  "success": false,
  "error": "Too many requests",
  "code": "RATE_LIMITED",
  "retryAfter": 300
}
```

---

## Examples

### Complete Voting Flow

```bash
# 1. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"googleToken":"token123"}'

# Example response:
# {
#   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "user": {"id": 1, "email": "user@example.com"}
# }

# 2. Get available rooms
curl -X GET http://localhost:5000/api/rooms \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 3. Verify human (if not already verified)
curl -X POST http://localhost:5000/api/verification/initiate \
  -H "Authorization: Bearer token..."

# 4. Submit vote
curl -X POST http://localhost:5000/api/votes/submit \
  -H "Authorization: Bearer token..." \
  -H "Content-Type: application/json" \
  -d '{
    "roomId": 1,
    "choice": "Alice"
  }'

# 5. Get results
curl -X GET http://localhost:5000/api/votes/results/1 \
  -H "Authorization: Bearer token..."

# 6. Logout
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer token..."
```

### Using JavaScript/Fetch

```javascript
// Login
const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ googleToken: 'token123' })
});

const { token } = await loginResponse.json();

// Get rooms
const roomsResponse = await fetch('http://localhost:5000/api/rooms', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const { rooms } = await roomsResponse.json();

// Submit vote
const voteResponse = await fetch('http://localhost:5000/api/votes/submit', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    roomId: rooms[0].id,
    choice: 'Alice'
  })
});

const vote = await voteResponse.json();
console.log('Vote submitted:', vote);
```

---

**Last Updated**: February 2026
