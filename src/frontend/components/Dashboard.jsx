import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Web3Service } from '../services/web3Service';
import '../styles/Dashboard.css';

/**
 * Dashboard Component
 * Displays voting sessions and user statistics
 */
const Dashboard = ({ user, userWallet, userReputation }) => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, ended
  const [searchQuery, setSearchQuery] = useState('');

  /**
   * Load voting sessions from blockchain
   */
  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock data - in production, would fetch from contract
      const mockSessions = [
        {
          id: 1,
          title: 'Class President Election 2024',
          description: 'Vote for the next class president',
          creator: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
          options: ['Alice Johnson', 'Bob Smith', 'Carol Davis'],
          votes: [45, 38, 22],
          startTime: Math.floor(Date.now() / 1000),
          endTime: Math.floor(Date.now() / 1000) + 86400,
          status: 'active',
          totalVotes: 105,
          requiresVerification: true
        },
        {
          id: 2,
          title: 'Community Center Budget Allocation',
          description: 'Decide how to allocate this year\'s budget',
          creator: '0x123d35Cc6634C0532925a3b844Bc9e7595f0bEb',
          options: ['Sports Programs', 'Arts & Culture', 'Community Services'],
          votes: [120, 95, 145],
          startTime: Math.floor(Date.now() / 1000) - 172800,
          endTime: Math.floor(Date.now() / 1000) - 86400,
          status: 'ended',
          totalVotes: 360,
          requiresVerification: false
        },
        {
          id: 3,
          title: 'New Team Lead Selection',
          description: 'Select the new team lead for Q4',
          creator: '0x456d35Cc6634C0532925a3b844Bc9e7595f0bEb',
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          votes: [0, 0, 0, 0],
          startTime: Math.floor(Date.now() / 1000) + 86400,
          endTime: Math.floor(Date.now() / 1000) + 172800,
          status: 'pending',
          totalVotes: 0,
          requiresVerification: true
        }
      ];

      setSessions(mockSessions);
    } catch (err) {
      setError('Failed to load voting sessions: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Filter and search sessions
   */
  const getFilteredSessions = () => {
    return sessions.filter(session => {
      const matchesStatus = filterStatus === 'all' || session.status === filterStatus;
      const matchesSearch = session.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  };

  /**
   * Format timestamp to readable date
   */
  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Get status badge color
   */
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'status-active';
      case 'ended':
        return 'status-ended';
      case 'pending':
        return 'status-pending';
      default:
        return '';
    }
  };

  /**
   * Get winner/leading option
   */
  const getWinner = (options, votes) => {
    if (!votes || votes.length === 0) return null;
    const maxVotes = Math.max(...votes);
    if (maxVotes === 0) return null;
    const winnerIndex = votes.indexOf(maxVotes);
    return options[winnerIndex];
  };

  const filteredSessions = getFilteredSessions();

  return (
    <div className="dashboard-container">
      {/* Welcome Section */}
      <div className="welcome-section">
        <div className="welcome-content">
          <h1>Welcome back, {user?.name || 'Voter'}! 👋</h1>
          <p>Here's your voting dashboard</p>
        </div>
        <button className="create-session-btn" onClick={() => navigate('/create-session')}>
          + Create New Session
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🗳️</div>
          <div className="stat-content">
            <div className="stat-value">{sessions.length}</div>
            <div className="stat-label">Total Sessions</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">
              {sessions.filter(s => s.status === 'active').length}
            </div>
            <div className="stat-label">Active Sessions</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <div className="stat-value">{userReputation || 0}</div>
            <div className="stat-label">Your Reputation</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👛</div>
          <div className="stat-content">
            <div className="stat-value">
              {userWallet ? userWallet.substring(0, 6) + '...' : 'Not Connected'}
            </div>
            <div className="stat-label">Wallet</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Section */}
      <div className="filter-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Search sessions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-buttons">
          <button
            className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            All Sessions
          </button>
          <button
            className={`filter-btn ${filterStatus === 'active' ? 'active' : ''}`}
            onClick={() => setFilterStatus('active')}
          >
            Active
          </button>
          <button
            className={`filter-btn ${filterStatus === 'ended' ? 'active' : ''}`}
            onClick={() => setFilterStatus('ended')}
          >
            Ended
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-alert">
          <span>⚠️ {error}</span>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading voting sessions...</p>
        </div>
      )}

      {/* Sessions Grid */}
      {!loading && (
        <div className="sessions-grid">
          {filteredSessions.length > 0 ? (
            filteredSessions.map((session) => (
              <div key={session.id} className="session-card">
                <div className="session-header">
                  <div className="session-title-section">
                    <h3 className="session-title">{session.title}</h3>
                    <span className={`status-badge ${getStatusColor(session.status)}`}>
                      {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                    </span>
                  </div>
                  {session.requiresVerification && (
                    <div className="verification-badge">🔐 Verified</div>
                  )}
                </div>

                <p className="session-description">{session.description}</p>

                <div className="session-meta">
                  <div className="meta-item">
                    <span className="meta-label">📅 Ends</span>
                    <span className="meta-value">{formatDate(session.endTime)}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">🗳️ Votes</span>
                    <span className="meta-value">{session.totalVotes}</span>
                  </div>
                </div>

                {/* Options and Results */}
                <div className="session-results">
                  {session.options.map((option, idx) => {
                    const percentage = session.totalVotes > 0
                      ? Math.round((session.votes[idx] / session.totalVotes) * 100)
                      : 0;
                    const isWinner = session.status === 'ended' &&
                      option === getWinner(session.options, session.votes);

                    return (
                      <div key={idx} className="result-item">
                        <div className="result-label">
                          {option}
                          {isWinner && <span className="winner-badge">👑 Winner</span>}
                        </div>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <div className="result-count">
                          {session.votes[idx]} ({percentage}%)
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Action Buttons */}
                <div className="session-actions">
                  <button
                    className="action-btn primary"
                    onClick={() => navigate(`/voting/${session.id}`)}
                    disabled={session.status !== 'active'}
                  >
                    {session.status === 'active' ? '✓ Vote Now' : 'View Results'}
                  </button>
                  {session.status === 'active' && (
                    <button className="action-btn secondary">
                      📊 Details
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="no-sessions">
              <div className="no-sessions-icon">📭</div>
              <p>No voting sessions found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
