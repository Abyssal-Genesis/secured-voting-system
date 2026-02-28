import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '../services/authService';
import Web3Service from '../services/web3Service';
import '../styles/Login.css';

/**
 * Login Component
 * Handles user authentication via Google OAuth and email/password
 */
const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loginMethod, setLoginMethod] = useState('google'); // 'google' or 'email'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    // Initialize Google Sign-In
    initializeGoogleSignIn();
  }, []);

  /**
   * Initialize Google Sign-In
   */
  const initializeGoogleSignIn = () => {
    // This would be initialized by the Google API script in index.html
    // The button will be rendered by google_signin_container
  };

  /**
   * Handle Google OAuth response
   */
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setError(null);
      setLoading(true);

      const result = await AuthService.loginWithGoogle(credentialResponse.credential);

      // Call parent callback
      onLogin(
        result.user,
        result.token,
        result.refreshToken
      );

      // Navigate to dashboard
      navigate('/');
    } catch (err) {
      setError(err.message || 'Google login failed');
      console.error('Google login error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle email/password login
   */
  const handleEmailLogin = async (e) => {
    e.preventDefault();

    try {
      setError(null);
      setLoading(true);

      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      const result = await AuthService.loginWithEmail(email, password);

      onLogin(
        result.user,
        result.token,
        result.refreshToken
      );

      navigate('/');
    } catch (err) {
      setError(err.message || 'Email login failed');
      console.error('Email login error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Render Google Sign-In button
   */
  const renderGoogleButton = () => {
    // This will be rendered by the Google SDK
    return (
      <div
        id="google_signin_container"
        className="google-signin-button"
        data-size="large"
        data-type="standard"
      ></div>
    );
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Logo and Title */}
        <div className="login-header">
          <h1>🗳️ Secured Voting System</h1>
          <p>Transparent, Secure, Decentralized</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <span>⚠️ {error}</span>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="login-tabs">
          <button
            className={`tab-button ${loginMethod === 'google' ? 'active' : ''}`}
            onClick={() => setLoginMethod('google')}
            disabled={loading}
          >
            Google
          </button>
          <button
            className={`tab-button ${loginMethod === 'email' ? 'active' : ''}`}
            onClick={() => setLoginMethod('email')}
            disabled={loading}
          >
            Email
          </button>
        </div>

        {/* Login Method Contents */}
        <div className="login-content">
          {loginMethod === 'google' ? (
            // Google OAuth Login
            <div className="google-login-container">
              <p className="method-description">
                Sign in with your Google account to get started quickly and securely.
              </p>

              <div className="google-button-wrapper">
                {renderGoogleButton()}
              </div>

              <script
                src="https://accounts.google.com/gsi/client"
                async
                defer
              ></script>
              <script
                dangerouslySetInnerHTML={{
                  __html: `
                    window.onload = function() {
                      google.accounts.id.initialize({
                        client_id: '${process.env.REACT_APP_GOOGLE_CLIENT_ID}',
                        callback: window.handleGoogleSuccess || function(response) {
                          console.log('Google response:', response);
                        }
                      });
                      google.accounts.id.renderButton(
                        document.getElementById('google_signin_container'),
                        { theme: 'outline', size: 'large' }
                      );
                    };
                  `
                }}
              />

              <div className="divider">
                <span>Or</span>
              </div>

              <button
                className="wallet-button"
                onClick={async () => {
                  try {
                    await Web3Service.connectWallet();
                    alert('Wallet connected! Please sign in with your email account.');
                  } catch (err) {
                    setError('Failed to connect wallet: ' + err.message);
                  }
                }}
                disabled={loading}
              >
                🔐 Connect Wallet
              </button>
            </div>
          ) : (
            // Email/Password Login
            <form onSubmit={handleEmailLogin} className="email-login-form">
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <button
                type="submit"
                className="login-button"
                disabled={loading}
              >
                {loading ? '🔄 Signing in...' : '✓ Sign In'}
              </button>

              <div className="forgot-password">
                <a href="#forgot">Forgot password?</a>
              </div>
            </form>
          )}
        </div>

        {/* Footer Info */}
        <div className="login-footer">
          <p>
            🔒 Your security is our priority. We use industry-leading encryption
            and blockchain for vote verification.
          </p>
          <p className="tech-stack">
            Powered by React • Ethereum • Hardhat
          </p>
        </div>
      </div>

      {/* Background Animation */}
      <div className="background-blur">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>
    </div>
  );
};

// Make handler accessible to Google SDK
window.handleGoogleSuccess = function(response) {
  const event = new CustomEvent('googleSuccess', { detail: response });
  document.dispatchEvent(event);
};

export default Login;
