/**
 * Test Data Factories
 * Generates mock data for testing - no real functionality
 */

const { v4: uuidv4 } = require('uuid');

// =============================================================================
// USER FACTORY
// =============================================================================

class UserFactory {
  static generate(overrides = {}) {
    return {
      id: uuidv4(),
      email: overrides.email || `test_${Date.now()}@voting.test`,
      name: overrides.name || `Test User ${Math.random().toString(36).substr(2, 9)}`,
      oauth_provider: overrides.oauth_provider || ['google', 'github', 'facebook'][Math.floor(Math.random() * 3)],
      oauth_id: overrides.oauth_id || `oauth_${Math.random().toString(36).substr(2, 15)}`,
      avatar_url: overrides.avatar_url || `https://api.example.com/avatar/${Math.random()}`,
      wallet_address: overrides.wallet_address || `0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      is_verified: overrides.is_verified !== undefined ? overrides.is_verified : true,
      verification_type: overrides.verification_type || 'facial_recognition',
      verification_data: overrides.verification_data || { confidence: 0.99, timestamp: Date.now() },
      created_at: overrides.created_at || new Date(),
      updated_at: overrides.updated_at || new Date()
    };
  }

  static generateBatch(count = 5, overrides = {}) {
    return Array.from({ length: count }, () => this.generate(overrides));
  }
}

// =============================================================================
// VOTING ROOM FACTORY
// =============================================================================

class VotingRoomFactory {
  static generate(overrides = {}) {
    const now = new Date();
    const startTime = new Date(now.getTime() + 3600000); // 1 hour from now
    const endTime = new Date(startTime.getTime() + 86400000); // 24 hours after start

    return {
      id: uuidv4(),
      title: overrides.title || `Test Voting: ${Math.random().toString(36).substr(2, 9)}`,
      description: overrides.description || 'This is a test voting room for demonstration purposes',
      creator_id: overrides.creator_id || uuidv4(),
      status: overrides.status || 'pending',
      voting_type: overrides.voting_type || 'single_choice',
      contract_address: overrides.contract_address || `0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      start_time: overrides.start_time || startTime,
      end_time: overrides.end_time || endTime,
      options: overrides.options || [
        { id: 'opt1', text: 'Option A', votes: 0 },
        { id: 'opt2', text: 'Option B', votes: 0 },
        { id: 'opt3', text: 'Option C', votes: 0 }
      ],
      total_votes: overrides.total_votes || 0,
      metadata: overrides.metadata || { region: 'test', category: 'demo' },
      created_at: overrides.created_at || now,
      updated_at: overrides.updated_at || now
    };
  }

  static generateBatch(count = 3, overrides = {}) {
    return Array.from({ length: count }, () => this.generate(overrides));
  }

  static generateWithCustomOptions(optionLabels = [], overrides = {}) {
    const options = optionLabels.map((label, idx) => ({
      id: `opt${idx + 1}`,
      text: label,
      votes: 0
    }));
    return this.generate({ ...overrides, options });
  }
}

// =============================================================================
// VOTE FACTORY
// =============================================================================

class VoteFactory {
  static generate(overrides = {}) {
    const options = ['opt1', 'opt2', 'opt3'];
    const randomOption = options[Math.floor(Math.random() * options.length)];

    return {
      id: uuidv4(),
      room_id: overrides.room_id || uuidv4(),
      voter_id: overrides.voter_id || uuidv4(),
      vote_choice: overrides.vote_choice || randomOption,
      transaction_hash: overrides.transaction_hash || `0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      block_number: overrides.block_number || Math.floor(Math.random() * 1000000),
      verified: overrides.verified !== undefined ? overrides.verified : true,
      verification_method: overrides.verification_method || 'liveness_detection',
      created_at: overrides.created_at || new Date()
    };
  }

  static generateBatch(count = 10, overrides = {}) {
    return Array.from({ length: count }, () => this.generate(overrides));
  }

  static generateForRoom(roomId, voterIds = [], overrides = {}) {
    return voterIds.map(voterId => 
      this.generate({
        ...overrides,
        room_id: roomId,
        voter_id: voterId
      })
    );
  }
}

// =============================================================================
// VERIFICATION LOG FACTORY
// =============================================================================

class VerificationLogFactory {
  static generate(overrides = {}) {
    const types = ['facial_recognition', 'liveness_detection', 'phone_verification', 'email_verification'];
    const randomType = types[Math.floor(Math.random() * types.length)];

    return {
      id: uuidv4(),
      user_id: overrides.user_id || uuidv4(),
      verification_type: overrides.verification_type || randomType,
      status: overrides.status || 'success',
      result: overrides.result || { 
        confidence: Math.random() * 1,
        timestamp: Date.now(),
        details: 'Test verification data'
      },
      ip_address: overrides.ip_address || '192.168.1.1',
      user_agent: overrides.user_agent || 'Mozilla/5.0 (Test Browser)',
      created_at: overrides.created_at || new Date()
    };
  }

  static generateBatch(count = 5, overrides = {}) {
    return Array.from({ length: count }, () => this.generate(overrides));
  }
}

// =============================================================================
// AUDIT LOG FACTORY
// =============================================================================

class AuditLogFactory {
  static generate(overrides = {}) {
    const actions = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'VERIFY'];
    const randomAction = actions[Math.floor(Math.random() * actions.length)];

    return {
      id: uuidv4(),
      user_id: overrides.user_id || uuidv4(),
      action: overrides.action || randomAction,
      resource_type: overrides.resource_type || 'voting_room',
      resource_id: overrides.resource_id || uuidv4(),
      changes: overrides.changes || { field: 'old_value', new_field: 'new_value' },
      ip_address: overrides.ip_address || '192.168.1.1',
      created_at: overrides.created_at || new Date()
    };
  }

  static generateBatch(count = 10, overrides = {}) {
    return Array.from({ length: count }, () => this.generate(overrides));
  }
}

// =============================================================================
// OAUTH FACTORY
// =============================================================================

class OAuthFactory {
  static generateGoogleUser(overrides = {}) {
    return {
      id: overrides.id || `google_${Math.random().toString(36).substr(2, 15)}`,
      displayName: overrides.displayName || 'Test Google User',
      emails: overrides.emails || [{ value: 'test.google@example.com' }],
      photos: overrides.photos || [{ value: 'https://lh3.googleusercontent.com/a/default-user=s96-c' }],
      provider: 'google'
    };
  }

  static generateGithubUser(overrides = {}) {
    return {
      id: overrides.id || Math.floor(Math.random() * 1000000),
      login: overrides.login || `test_github_${Math.random().toString(36).substr(2, 9)}`,
      name: overrides.name || 'Test GitHub User',
      avatar_url: overrides.avatar_url || 'https://avatars.githubusercontent.com/u/0?v=4',
      email: overrides.email || 'test.github@example.com',
      bio: overrides.bio || 'Test user bio',
      provider: 'github'
    };
  }

  static generateFacebookUser(overrides = {}) {
    return {
      id: overrides.id || Math.random().toString(36).substr(2, 15),
      displayName: overrides.displayName || 'Test Facebook User',
      emails: overrides.emails || [{ value: 'test.facebook@example.com' }],
      photos: overrides.photos || [{ value: 'https://platform-lookaside.fbsbx.com/platform/avatar.jpg' }],
      provider: 'facebook'
    };
  }

  static generateJWTToken(overrides = {}) {
    return {
      accessToken: overrides.accessToken || `test_access_token_${Math.random().toString(36).substr(2, 15)}`,
      refreshToken: overrides.refreshToken || `test_refresh_token_${Math.random().toString(36).substr(2, 15)}`,
      idToken: overrides.idToken || `test_id_token_${Math.random().toString(36).substr(2, 15)}`,
      expiresIn: overrides.expiresIn || 3600,
      tokenType: overrides.tokenType || 'Bearer'
    };
  }
}

// =============================================================================
// BLOCKCHAIN FACTORY
// =============================================================================

class BlockchainFactory {
  static generateTransaction(overrides = {}) {
    return {
      hash: overrides.hash || `0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      from: overrides.from || `0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      to: overrides.to || `0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      value: overrides.value || '0',
      gas: overrides.gas || '21000',
      gasPrice: overrides.gasPrice || '1000000000',
      nonce: overrides.nonce || Math.floor(Math.random() * 1000),
      blockNumber: overrides.blockNumber || Math.floor(Math.random() * 1000000),
      status: overrides.status || '0x1'
    };
  }

  static generateContractEvent(overrides = {}) {
    return {
      event: overrides.event || 'VoteCast',
      address: overrides.address || `0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      blockNumber: overrides.blockNumber || Math.floor(Math.random() * 1000000),
      transactionHash: overrides.transactionHash || `0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      args: overrides.args || {
        voter: `0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        vote: 'option_a',
        timestamp: Date.now()
      }
    };
  }
}

module.exports = {
  UserFactory,
  VotingRoomFactory,
  VoteFactory,
  VerificationLogFactory,
  AuditLogFactory,
  OAuthFactory,
  BlockchainFactory
};
