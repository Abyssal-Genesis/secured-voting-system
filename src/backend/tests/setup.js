/**
 * Integration Test Suite - Setup & Configuration
 * Jest configuration and test utilities
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');

// Test configuration
const TEST_CONFIG = {
  baseURL: 'http://localhost:5000/api',
  timeout: 10000,
  jwtSecret: process.env.JWT_SECRET || 'test_jwt_secret',
  testUser: {
    id: 'test_user_123',
    email: 'test@voting.local',
    name: 'Test User',
    provider: 'test'
  }
};

// =============================================================================
// TEST UTILITIES
// =============================================================================

class TestHelper {
  /**
   * Generate test JWT token
   */
  static generateTestToken(userId = null, expiresIn = '7d') {
    const payload = {
      userId: userId || TEST_CONFIG.testUser.id,
      email: TEST_CONFIG.testUser.email,
      provider: TEST_CONFIG.testUser.provider,
      verified: true
    };

    return jwt.sign(payload, TEST_CONFIG.jwtSecret, { expiresIn });
  }

  /**
   * Create authenticated request
   */
  static authenticatedRequest(app, method = 'get', path = '/') {
    const token = this.generateTestToken();
    
    return request(app)
      [method](path)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json');
  }

  /**
   * Create request with custom token
   */
  static requestWithToken(app, token, method = 'get', path = '/') {
    return request(app)
      [method](path)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json');
  }

  /**
   * Wait for milliseconds
   */
  static async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate test data
   */
  static generateTestUser() {
    const id = `user_${Date.now()}`;
    return {
      id,
      email: `test_${id}@voting.local`,
      name: `Test User ${id}`,
      provider: 'test',
      wallet_address: `0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`
    };
  }

  /**
   * Generate test voting room
   */
  static generateTestRoom(creatorId) {
    return {
      title: `Test Room ${Date.now()}`,
      description: 'Test voting room',
      creator_id: creatorId,
      status: 'active',
      voting_type: 'single_choice',
      options: [
        { id: 'opt1', text: 'Option A', votes: 0 },
        { id: 'opt2', text: 'Option B', votes: 0 }
      ]
    };
  }

  /**
   * Generate test vote
   */
  static generateTestVote(roomId, voterId) {
    return {
      room_id: roomId,
      voter_id: voterId,
      vote_choice: 'opt1'
    };
  }
}

// =============================================================================
// MOCK SERVER SETUP
// =============================================================================

class MockServerSetup {
  /**
   * Setup mock database for tests
   */
  static mockDatabase() {
    const mockData = {
      users: new Map(),
      rooms: new Map(),
      votes: new Map()
    };

    return {
      users: mockData.users,
      rooms: mockData.rooms,
      votes: mockData.votes,
      addUser(user) {
        mockData.users.set(user.id, user);
      },
      getUser(id) {
        return mockData.users.get(id);
      },
      addRoom(room) {
        mockData.rooms.set(room.id, room);
      },
      getRoom(id) {
        return mockData.rooms.get(id);
      },
      addVote(vote) {
        mockData.votes.set(vote.id, vote);
      },
      getVotes(roomId) {
        return Array.from(mockData.votes.values()).filter(v => v.room_id === roomId);
      },
      clear() {
        mockData.users.clear();
        mockData.rooms.clear();
        mockData.votes.clear();
      }
    };
  }

  /**
   * Setup mock blockchain service
   */
  static mockBlockchain() {
    return {
      isConnected: true,
      getBalance: jest.fn().mockResolvedValue('1000000000000000000'),
      sendTransaction: jest.fn().mockResolvedValue({
        hash: `0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`
      }),
      verifySignature: jest.fn().mockResolvedValue(true),
      getContractEvents: jest.fn().mockResolvedValue([])
    };
  }

  /**
   * Setup mock OAuth
   */
  static mockOAuth() {
    return {
      google: {
        verify: jest.fn().mockResolvedValue({
          id: 'google_user_123',
          displayName: 'Test Google User',
          email: 'test.google@example.com'
        })
      },
      github: {
        verify: jest.fn().mockResolvedValue({
          id: 'github_user_456',
          login: 'test_github_user',
          email: 'test.github@example.com'
        })
      }
    };
  }
}

// =============================================================================
// TEST ASSERTIONS
// =============================================================================

const TestAssertions = {
  /**
   * Assert response structure
   */
  assertSuccessResponse(response) {
    expect(response.status).toBeLessThan(400);
    expect(response.body).toBeDefined();
  },

  /**
   * Assert error response
   */
  assertErrorResponse(response, statusCode, errorCode) {
    expect(response.status).toBe(statusCode);
    expect(response.body.errorCode).toBe(errorCode);
    expect(response.body.message).toBeDefined();
  },

  /**
   * Assert JWT token
   */
  assertValidToken(token) {
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    const decoded = jwt.decode(token);
    expect(decoded).toBeDefined();
    expect(decoded.userId).toBeDefined();
  },

  /**
   * Assert user object
   */
  assertValidUser(user) {
    expect(user).toBeDefined();
    expect(user.id).toBeDefined();
    expect(user.email).toBeDefined();
    expect(user.name).toBeDefined();
  },

  /**
   * Assert voting room object
   */
  assertValidRoom(room) {
    expect(room).toBeDefined();
    expect(room.id).toBeDefined();
    expect(room.title).toBeDefined();
    expect(room.creator_id).toBeDefined();
    expect(room.status).toBeDefined();
    expect(room.options).toBeDefined();
    expect(Array.isArray(room.options)).toBe(true);
  }
};

module.exports = {
  TEST_CONFIG,
  TestHelper,
  MockServerSetup,
  TestAssertions
};
