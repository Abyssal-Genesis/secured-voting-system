/**
 * Database Schema & Migrations
 * Creates tables for users, voting rooms, votes, and audit logs
 * This is a test/development setup with mock data
 */

const { pool, query } = require('./database');

// =============================================================================
// SCHEMA CREATION
// =============================================================================

const USER_TABLE = `
  CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    oauth_provider VARCHAR(50),
    oauth_id VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    wallet_address VARCHAR(42),
    is_verified BOOLEAN DEFAULT false,
    verification_type VARCHAR(50),
    verification_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT email_valid CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
  );
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_users_oauth ON users(oauth_provider, oauth_id);
  CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
`;

const VOTING_ROOM_TABLE = `
  CREATE TABLE IF NOT EXISTS voting_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending',
    voting_type VARCHAR(50) DEFAULT 'single_choice',
    contract_address VARCHAR(42),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    options JSONB,
    total_votes INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_rooms_creator ON voting_rooms(creator_id);
  CREATE INDEX IF NOT EXISTS idx_rooms_status ON voting_rooms(status);
  CREATE INDEX IF NOT EXISTS idx_rooms_contract ON voting_rooms(contract_address);
`;

const VOTE_TABLE = `
  CREATE TABLE IF NOT EXISTS votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES voting_rooms(id) ON DELETE CASCADE,
    voter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vote_choice VARCHAR(255) NOT NULL,
    transaction_hash VARCHAR(66),
    block_number BIGINT,
    verified BOOLEAN DEFAULT false,
    verification_method VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT single_vote_per_room UNIQUE(room_id, voter_id)
  );
  CREATE INDEX IF NOT EXISTS idx_votes_room ON votes(room_id);
  CREATE INDEX IF NOT EXISTS idx_votes_voter ON votes(voter_id);
  CREATE INDEX IF NOT EXISTS idx_votes_tx_hash ON votes(transaction_hash);
`;

const VERIFICATION_LOG_TABLE = `
  CREATE TABLE IF NOT EXISTS verification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    verification_type VARCHAR(50) NOT NULL,
    status VARCHAR(50),
    result JSONB,
    ip_address INET,
    user_agent VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_verification_user ON verification_logs(user_id);
  CREATE INDEX IF NOT EXISTS idx_verification_type ON verification_logs(verification_type);
`;

const AUDIT_LOG_TABLE = `
  CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(255),
    changes JSONB,
    ip_address INET,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
  CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
`;

// =============================================================================
// INITIALIZATION FUNCTION
// =============================================================================

async function initializeDatabase() {
  try {
    console.log('[DB] Initializing database schema...');

    await pool.query(USER_TABLE);
    console.log('[DB] ✓ Users table created');

    await pool.query(VOTING_ROOM_TABLE);
    console.log('[DB] ✓ Voting rooms table created');

    await pool.query(VOTE_TABLE);
    console.log('[DB] ✓ Votes table created');

    await pool.query(VERIFICATION_LOG_TABLE);
    console.log('[DB] ✓ Verification logs table created');

    await pool.query(AUDIT_LOG_TABLE);
    console.log('[DB] ✓ Audit logs table created');

    console.log('[DB] Database schema initialized successfully');
    return true;
  } catch (error) {
    console.error('[DB] Error initializing database:', error);
    throw error;
  }
}

// =============================================================================
// SEED TEST DATA
// =============================================================================

async function seedTestData() {
  try {
    console.log('[DB] Seeding test data...');

    // Insert test users
    const testUsers = [
      {
        email: 'admin@voting.test',
        name: 'Test Admin',
        oauth_provider: 'google',
        wallet_address: '0x0000000000000000000000000000000000000001'
      },
      {
        email: 'voter1@voting.test',
        name: 'Test Voter 1',
        oauth_provider: 'github',
        wallet_address: '0x0000000000000000000000000000000000000002'
      },
      {
        email: 'voter2@voting.test',
        name: 'Test Voter 2',
        oauth_provider: 'facebook',
        wallet_address: '0x0000000000000000000000000000000000000003'
      }
    ];

    for (const user of testUsers) {
      await pool.query(
        `INSERT INTO users (email, name, oauth_provider, wallet_address, is_verified)
         VALUES ($1, $2, $3, $4, true)
         ON CONFLICT (email) DO NOTHING`,
        [user.email, user.name, user.oauth_provider, user.wallet_address]
      );
    }

    console.log('[DB] ✓ Test users seeded');

    // Get admin user ID
    const adminResult = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      ['admin@voting.test']
    );

    if (adminResult.rows.length > 0) {
      const adminId = adminResult.rows[0].id;

      // Insert test voting room
      await pool.query(
        `INSERT INTO voting_rooms 
         (title, description, creator_id, status, voting_type, options, contract_address)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT DO NOTHING`,
        [
          'Test Voting Session',
          'This is a test voting room for demonstration',
          adminId,
          'active',
          'single_choice',
          JSON.stringify([
            { id: 'opt1', text: 'Option A', votes: 0 },
            { id: 'opt2', text: 'Option B', votes: 0 },
            { id: 'opt3', text: 'Option C', votes: 0 }
          ]),
          '0x0000000000000000000000000000000000000001'
        ]
      );
    }

    console.log('[DB] ✓ Test data seeded successfully');
    return true;
  } catch (error) {
    console.error('[DB] Error seeding test data:', error);
    throw error;
  }
}

// =============================================================================
// CLEANUP FUNCTION
// =============================================================================

async function cleanupDatabase() {
  try {
    console.log('[DB] Cleaning up database...');
    
    const tables = [
      'votes',
      'verification_logs',
      'audit_logs',
      'voting_rooms',
      'users'
    ];

    for (const table of tables) {
      await pool.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
      console.log(`[DB] ✓ Dropped ${table} table`);
    }

    console.log('[DB] Database cleanup completed');
    return true;
  } catch (error) {
    console.error('[DB] Error cleaning database:', error);
    throw error;
  }
}

module.exports = {
  initializeDatabase,
  seedTestData,
  cleanupDatabase
};
