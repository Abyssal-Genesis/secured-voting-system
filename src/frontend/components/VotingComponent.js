import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Web3Service from '../services/web3Service';
import { AuthService } from '../services/authService';
import '../styles/VotingComponent.css';

/**
 * Voting Component
 * Displays voting session and allows user to cast vote
 */
const VotingComponent = ({ user, userWallet, onVoteCast }) => {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [options, setOptions] = useState([]);
  const [results, setResults] = useState(null);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState(null);
  const [sessionStatus, setSessionStatus] = useState('loading');
  const [timeRemaining, setTimeRemaining] = useState(null);

  useEffect(() => {
    if (sessionId) {
      loadSessionData();
    }
  }, [sessionId, userWallet]);

  useEffect(() => {
    // Update time remaining
    if (session && !session.closed && !session.cancelled) {
      const interval = setInterval(() => {
        const now = Math.floor(Date.now() / 1000);
        const remaining = Math.max(0, session.endTime - now);
        setTimeRemaining(remaining);

        if (remaining === 0) {
          setSessionStatus('ended');
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [session]);

  /**
   * Load session data from blockchain
   */
  const loadSessionData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get session details
      const details = await Web3Service.getSessionDetails(sessionId);
      const opts = await Web3Service.getSessionOptions(sessionId);
      const res = await Web3Service.getResults(sessionId);

      setSession(details);
      setOptions(opts);
      setResults(res);

      // Check if user has already voted
      if (userWallet) {
        const voted = await Web3Service.hasVoted(sessionId, userWallet);
        setHasVoted(voted);
      }

      // Determine session status
      const now = Math.floor(Date.now() / 1000);
      if (details.cancelled) {
        setSessionStatus('cancelled');
      } else if (details.closed) {
        setSessionStatus('closed');
      } else if (now < details.startTime) {
        setSessionStatus('pending');
      } else if (now > details.endTime) {
        setSessionStatus('ended');
      } else {
        setSessionStatus('active');
      }

      // Set initial time remaining
      const remaining = Math.max(0, details.endTime - now);
      setTimeRemaining(remaining);
    } catch (err) {
      setError(err.message || 'Failed to load session data');
      console.error('Error loading session:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle vote submission
   */
  const handleVote = async () => {
    if (selectedChoice === null) {
      setError('Please select an option');
      return;
    }

    if (!userWallet) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      setVoting(true);
      setError(null);

      // Cast vote on blockchain
      await Web3Service.castVote(sessionId, selectedChoice);

      // Update UI
      setHasVoted(true);

      // Update results
      const newResults = [...results];
      newResults[selectedChoice] += 1;
      setResults(newResults);

      // Call callback
      if (onVoteCast) {
        onVoteCast(sessionId, selectedChoice);
      }

      // Show success message
      alert('✓ Your vote has been recorded on the blockchain!');
    } catch (err) {
      setError(err.message || 'Failed to cast vote');
      console.error('Error casting vote:', err);
    } finally {
      setVoting(false);
    }
  };

  /**
   * Format time remaining
   */
  const formatTimeRemaining = (seconds) => {
    if (seconds === null) return 'Loading...';
    if (seconds === 0) return 'Voting ended';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s remaining`;
    } else {
      return `${secs}s remaining`;
    }
  };

  /**
   * Get status color
   */
  const getStatusColor = () => {
    switch (sessionStatus) {
      case 'active':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'ended':
      case 'closed':
        return '#ef4444';
      case 'cancelled':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  /**
   * Get vote percentage
   */
  const getVotePercentage = (voteCount) => {
    const total = results ? results.reduce((a, b) => a + b, 0) : 0;
    if (total === 0) return 0;
    return Math.round((voteCount / total) * 100);
  };

  if (loading) {
    return (
      <div className="voting-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading voting session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="voting-container">
        <div className="error-box">
          <h2>Session Not Found</h2>
          <p>The voting session you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="voting-container">
      <div className="voting-card">
        {/* Header */}
        <div className="voting-header">
          <div className="session-status" style={{ backgroundColor: getStatusColor() }}>
            {sessionStatus.toUpperCase()}
          </div>
          <h1>{session.title}</h1>
          <p className="session-description">{session.description}</p>
          <div className="session-meta">
            <span className="time-remaining">⏱️ {formatTimeRemaining(timeRemaining)}</span>
            <span className="total-votes">🗳️ {results ? results.reduce((a, b) => a + b, 0) : 0} votes</span>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <span>⚠️ {error}</span>
          </div>
        )}

        {/* Options */}
        {sessionStatus === 'active' && !hasVoted && (
          <div className="voting-options">
            <p className="options-title">Select your choice:</p>
            {options.map((option, index) => (
              <div
                key={index}
                className={`option-item ${selectedChoice === index ? 'selected' : ''}`}
                onClick={() => setSelectedChoice(index)}
              >
                <input
                  type="radio"
                  name="vote"
                  value={index}
                  checked={selectedChoice === index}
                  onChange={() => setSelectedChoice(index)}
                />
                <label>{option}</label>
              </div>
            ))}
          </div>
        )}

        {/* Results Display */}
        {sessionStatus !== 'pending' && (
          <div className="voting-results">
            <h3>Current Results</h3>
            {options.map((option, index) => (
              <div key={index} className="result-item">
                <div className="result-label">
                  <span className="option-name">{option}</span>
                  <span className="vote-count">{results[index]} votes ({getVotePercentage(results[index])}%)</span>
                </div>
                <div className="result-bar">
                  <div
                    className="result-fill"
                    style={{ width: `${getVotePercentage(results[index])}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Messages */}
        {hasVoted && (
          <div className="success-message">
            <span>✓ You have already voted in this session</span>
          </div>
        )}

        {sessionStatus === 'cancelled' && (
          <div className="warning-message">
            <span>⚠️ This voting session has been cancelled</span>
          </div>
        )}

        {sessionStatus === 'closed' && (
          <div className="info-message">
            <span>ℹ️ This voting session has been closed</span>
          </div>
        )}

        {sessionStatus === 'ended' && (
          <div className="info-message">
            <span>ℹ️ Voting time has ended</span>
          </div>
        )}

        {sessionStatus === 'pending' && (
          <div className="info-message">
            <span>ℹ️ Voting has not started yet</span>
          </div>
        )}

        {/* Vote Button */}
        {sessionStatus === 'active' && !hasVoted && (
          <button
            className="vote-button"
            onClick={handleVote}
            disabled={voting || selectedChoice === null || !userWallet}
          >
            {voting ? '🔄 Submitting Vote...' : '✓ Submit Vote'}
          </button>
        )}

        {/* Wallet Notice */}
        {!userWallet && (
          <div className="wallet-notice">
            <p>🔐 Please connect your Ethereum wallet to vote</p>
          </div>
        )}

        {/* Session Info */}
        <div className="session-info">
          <h4>Session Information</h4>
          <ul>
            <li>Creator: <code>{user?.email || 'Unknown'}</code></li>
            <li>Total Votes: <strong>{results ? results.reduce((a, b) => a + b, 0) : 0}</strong></li>
            <li>Options: <strong>{options.length}</strong></li>
            <li>Session ID: <code>{sessionId}</code></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default VotingComponent;