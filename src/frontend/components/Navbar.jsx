import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Navbar.css';

/**
 * Navbar Component
 * Displays user profile, wallet info, reputation, and navigation
 */
const Navbar = ({
  user,
  userWallet,
  userReputation,
  onLogout,
  onWalletConnect,
  authenticated
}) => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [walletDropdownOpen, setWalletDropdownOpen] = useState(false);

  /**
   * Format wallet address for display
   */
  const formatAddress = (address) => {
    if (!address) return 'Not Connected';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  /**
   * Copy address to clipboard
   */
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Wallet address copied to clipboard!');
  };

  /**
   * Handle logout
   */
  const handleLogout = () => {
    setDropdownOpen(false);
    onLogout();
    navigate('/');
  };

  /**
   * Handle wallet connect
   */
  const handleWalletConnect = () => {
    setWalletDropdownOpen(false);
    onWalletConnect();
  };

  /**
   * Toggle dropdown
   */
  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
    setWalletDropdownOpen(false);
  };

  /**
   * Toggle wallet dropdown
   */
  const toggleWalletDropdown = () => {
    setWalletDropdownOpen(!walletDropdownOpen);
    setDropdownOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo Section */}
        <div className="navbar-logo" onClick={() => navigate('/')}>
          <span className="logo-icon">🗳️</span>
          <span className="logo-text">SecureVote</span>
        </div>

        {/* Navigation Links */}
        <div className="navbar-links">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate('/');
            }}
            className="nav-link"
          >
            Dashboard
          </a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate('/create-session');
            }}
            className="nav-link"
          >
            Create Vote
          </a>
        </div>

        {/* Right Section */}
        {authenticated && (
          <div className="navbar-right">
            {/* Wallet Info */}
            <div className="wallet-section">
              <button
                className="wallet-button"
                onClick={toggleWalletDropdown}
                title={userWallet || 'Click to connect wallet'}
              >
                <span className="wallet-icon">👛</span>
                <span className="wallet-address">{formatAddress(userWallet)}</span>
                <span className="wallet-dropdown-icon">▼</span>
              </button>

              {walletDropdownOpen && (
                <div className="wallet-dropdown">
                  {userWallet ? (
                    <>
                      <div className="dropdown-item">
                        <span className="item-label">Connected Wallet</span>
                        <span className="item-value">{userWallet}</span>
                      </div>
                      <button
                        className="dropdown-btn"
                        onClick={() => copyToClipboard(userWallet)}
                      >
                        📋 Copy Address
                      </button>
                    </>
                  ) : (
                    <button
                      className="dropdown-btn connect-btn"
                      onClick={handleWalletConnect}
                    >
                      🔗 Connect Wallet
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Reputation Badge */}
            <div className="reputation-badge">
              <span className="reputation-icon">⭐</span>
              <span className="reputation-value">{userReputation || 0}</span>
              <span className="reputation-label">Rep</span>
            </div>

            {/* User Dropdown */}
            <div className="user-menu">
              <button
                className="user-button"
                onClick={toggleDropdown}
                title={user?.name || 'User Menu'}
              >
                <div className="user-avatar">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} />
                  ) : (
                    <span className="avatar-placeholder">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
                <span className="user-name">
                  {user?.name?.split(' ')[0] || 'User'}
                </span>
                <span className="dropdown-icon">▼</span>
              </button>

              {dropdownOpen && (
                <div className="user-dropdown">
                  <div className="dropdown-header">
                    <div className="header-avatar">
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user.name} />
                      ) : (
                        <span className="avatar-placeholder">
                          {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      )}
                    </div>
                    <div className="header-info">
                      <div className="header-name">{user?.name || 'User'}</div>
                      <div className="header-email">{user?.email || 'No email'}</div>
                    </div>
                  </div>

                  <div className="dropdown-divider"></div>

                  <button
                    className="dropdown-item"
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate('/profile');
                    }}
                  >
                    <span className="item-icon">👤</span>
                    <span>My Profile</span>
                  </button>

                  <button
                    className="dropdown-item"
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate('/verify');
                    }}
                  >
                    <span className="item-icon">✓</span>
                    <span>Verify Identity</span>
                  </button>

                  <button
                    className="dropdown-item"
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate('/settings');
                    }}
                  >
                    <span className="item-icon">⚙️</span>
                    <span>Settings</span>
                  </button>

                  <div className="dropdown-divider"></div>

                  <button
                    className="dropdown-item logout-item"
                    onClick={handleLogout}
                  >
                    <span className="item-icon">🚪</span>
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {!authenticated && (
          <div className="navbar-auth">
            <button
              className="auth-btn login-btn"
              onClick={() => navigate('/')}
            >
              Login
            </button>
          </div>
        )}
      </div>

      {/* Mobile Menu Button */}
      <div className="navbar-mobile">
        <button className="mobile-menu-btn">☰</button>
      </div>
    </nav>
  );
};

export default Navbar;
