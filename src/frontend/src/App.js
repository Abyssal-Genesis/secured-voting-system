import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Components
import Login from './components/Login';
import VotingComponent from './components/VotingComponent';
import HumanVerification from './components/HumanVerification';
import RoomCreate from './components/RoomCreate';
import Dashboard from './components/Dashboard';
import Navbar from './components/Navbar';

// Services
import { AuthService } from './services/authService';
import { Web3Service } from './services/web3Service';

/**
 * Main App Component
 * Handles authentication, routing, and global state
 */
function App() {
  const [user, setUser] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userWallet, setUserWallet] = useState(null);
  const [userReputation, setUserReputation] = useState(0);

  // Session and voting state
  const [currentSession, setCurrentSession] = useState(null);
  const [userVote, setUserVote] = useState(null);

  useEffect(() => {
    // Initialize app on mount
    initializeApp();
  }, []);

  /**
   * Initialize application
   * Check for existing tokens, connect Web3, restore state
   */
  const initializeApp = async () => {
    try {
      setLoading(true);

      // Check for existing authentication token
      const token = localStorage.getItem('authToken');
      if (token) {
        // Validate and restore user
        const userData = await AuthService.validateToken(token);
        if (userData) {
          setUser(userData);
          setAuthenticated(true);

          // Try to connect Web3 wallet
          try {
            const wallet = await Web3Service.connectWallet();
            setUserWallet(wallet);

            // Fetch user reputation
            const reputation = await Web3Service.getUserReputation(wallet);
            setUserReputation(reputation);
          } catch (error) {
            console.warn('Web3 connection failed:', error);
          }
        } else {
          // Token is invalid, clear it
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
        }
      }
    } catch (error) {
      console.error('App initialization error:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle user login
   */
  const handleLogin = async (userData, authToken, refreshToken) => {
    setUser(userData);
    setAuthenticated(true);
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('refreshToken', refreshToken);

    // Try to connect Web3
    try {
      const wallet = await Web3Service.connectWallet();
      setUserWallet(wallet);
    } catch (error) {
      console.warn('Web3 connection on login failed:', error);
    }
  };

  /**
   * Handle user logout
   */
  const handleLogout = () => {
    setUser(null);
    setAuthenticated(false);
    setUserWallet(null);
    setUserReputation(0);
    setCurrentSession(null);
    setUserVote(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
  };

  /**
   * Handle wallet connection
   */
  const handleWalletConnect = async () => {
    try {
      const wallet = await Web3Service.connectWallet();
      setUserWallet(wallet);

      // Fetch reputation
      const reputation = await Web3Service.getUserReputation(wallet);
      setUserReputation(reputation);

      // Link wallet to user account
      if (user) {
        await AuthService.linkWallet(wallet);
      }

      return wallet;
    } catch (error) {
      console.error('Wallet connection failed:', error);
      throw error;
    }
  };

  /**
   * Handle successful vote
   */
  const handleVoteCast = async (sessionId, choice) => {
    setUserVote({ sessionId, choice });
    // Reputation will increase automatically on blockchain
    const newReputation = await Web3Service.getUserReputation(userWallet);
    setUserReputation(newReputation);
  };

  if (loading) {
    return (
      <div className="app-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="app-container">
        {authenticated && (
          <Navbar
            user={user}
            userWallet={userWallet}
            userReputation={userReputation}
            onLogout={handleLogout}
            onWalletConnect={handleWalletConnect}
          />
        )}

        <main className="main-content">
          <Routes>
            {!authenticated ? (
              <>
                <Route
                  path="/"
                  element={<Login onLogin={handleLogin} />}
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </>
            ) : (
              <>
                <Route
                  path="/"
                  element={
                    <Dashboard
                      user={user}
                      userWallet={userWallet}
                      userReputation={userReputation}
                      onWalletConnect={handleWalletConnect}
                    />
                  }
                />
                <Route
                  path="/voting/:sessionId"
                  element={
                    <VotingComponent
                      user={user}
                      userWallet={userWallet}
                      onVoteCast={handleVoteCast}
                    />
                  }
                />
                <Route
                  path="/create-session"
                  element={
                    <RoomCreate
                      user={user}
                      userWallet={userWallet}
                    />
                  }
                />
                <Route
                  path="/verify"
                  element={
                    <HumanVerification user={user} />
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </>
            )}
          </Routes>
        </main>

        <footer className="app-footer">
          <p>&copy; 2026 Secured Voting System. All rights reserved.</p>
          <p>Built with React, Ethereum & Hardhat</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
