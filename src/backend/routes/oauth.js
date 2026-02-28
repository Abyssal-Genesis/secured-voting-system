/**
 * OAuth Routes
 * Handles OAuth login and callback endpoints for multiple providers
 * Testing Data: Uses mock OAuth tokens and user data - no actual OAuth verification
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const oauthConfig = require('../config/oauth.config');

// Mock user database (in production, use real database)
const mockUsers = new Map();

/**
 * Helper: Generate JWT tokens
 */
function generateTokens(userId, userData) {
  const accessToken = jwt.sign(
    {
      userId,
      email: userData.email,
      provider: userData.provider,
      verified: true
    },
    oauthConfig.jwt.secret,
    { expiresIn: oauthConfig.jwt.expiresIn }
  );

  const refreshToken = jwt.sign(
    { userId },
    oauthConfig.jwt.secret,
    { expiresIn: oauthConfig.jwt.refreshExpiresIn }
  );

  return { accessToken, refreshToken };
}

/**
 * Helper: Create or update user from OAuth data
 */
function upsertUser(provider, oauthData) {
  const userId = `${provider}_${oauthData.id}`;
  
  const userData = {
    id: userId,
    provider,
    providerId: oauthData.id,
    email: oauthData.email || oauthData.emails?.[0]?.value || `${oauthData.id}@${provider}.oauth`,
    name: oauthData.displayName || oauthData.name || 'Test User',
    avatar: oauthData.photos?.[0]?.value || oauthData.picture?.data?.url || `https://api.example.com/avatar/${provider}.png`,
    createdAt: new Date(),
    updatedAt: new Date(),
    verified: true
  };

  mockUsers.set(userId, userData);
  return userData;
}

// ============== Google OAuth ==============

/**
 * GET /auth/google
 * Initiates Google OAuth flow (testing: returns mock redirect)
 */
router.get('/google', (req, res) => {
  try {
    // In production, this would redirect to Google's OAuth page
    // For testing, we'll return mock redirect info
    const mockAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${oauthConfig.google.clientID}&redirect_uri=${encodeURIComponent(oauthConfig.google.callbackURL)}&scope=${encodeURIComponent(oauthConfig.google.scope.join(' '))}&response_type=code`;
    
    res.json({
      message: 'Testing mode: Redirect to Google OAuth',
      authUrl: mockAuthUrl,
      testMode: true
    });
  } catch (error) {
    res.status(500).json({ error: 'OAuth initiation failed', details: error.message });
  }
});

/**
 * GET /auth/google/callback
 * Google OAuth callback (testing: uses mock data)
 */
router.get('/google/callback', (req, res) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      return res.redirect(`${oauthConfig.callbackResponses.error.redirectTo}?error=${error}`);
    }

    // Testing: Use mock data instead of verifying code
    const mockGoogleUser = {
      ...oauthConfig.google.mockData,
      email: process.env.TEST_EMAIL || 'test.google@example.com'
    };

    const userData = upsertUser('google', mockGoogleUser);
    const { accessToken, refreshToken } = generateTokens(userData.id, userData);

    // Store refresh token in secure cookie (testing)
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    // Redirect to frontend with tokens
    res.redirect(
      `${oauthConfig.callbackResponses.success.redirectTo}?accessToken=${accessToken}&provider=google&user=${encodeURIComponent(JSON.stringify(userData))}`
    );
  } catch (error) {
    res.redirect(`${oauthConfig.callbackResponses.error.redirectTo}?error=callback_error`);
  }
});

// ============== GitHub OAuth ==============

/**
 * GET /auth/github
 * Initiates GitHub OAuth flow
 */
router.get('/github', (req, res) => {
  try {
    const mockAuthUrl = `https://github.com/login/oauth/authorize?client_id=${oauthConfig.github.clientID}&redirect_uri=${encodeURIComponent(oauthConfig.github.callbackURL)}&scope=${encodeURIComponent(oauthConfig.github.scope.join(' '))}`;
    
    res.json({
      message: 'Testing mode: Redirect to GitHub OAuth',
      authUrl: mockAuthUrl,
      testMode: true
    });
  } catch (error) {
    res.status(500).json({ error: 'OAuth initiation failed' });
  }
});

/**
 * GET /auth/github/callback
 * GitHub OAuth callback
 */
router.get('/github/callback', (req, res) => {
  try {
    const { code, error } = req.query;

    if (error) {
      return res.redirect(`${oauthConfig.callbackResponses.error.redirectTo}?error=${error}`);
    }

    // Testing: Use mock data
    const mockGithubUser = {
      ...oauthConfig.github.mockData,
      email: process.env.TEST_EMAIL || 'test.github@example.com'
    };

    const userData = upsertUser('github', mockGithubUser);
    const { accessToken, refreshToken } = generateTokens(userData.id, userData);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    res.redirect(
      `${oauthConfig.callbackResponses.success.redirectTo}?accessToken=${accessToken}&provider=github&user=${encodeURIComponent(JSON.stringify(userData))}`
    );
  } catch (error) {
    res.redirect(`${oauthConfig.callbackResponses.error.redirectTo}?error=callback_error`);
  }
});

// ============== Facebook OAuth ==============

/**
 * GET /auth/facebook
 * Initiates Facebook OAuth flow
 */
router.get('/facebook', (req, res) => {
  try {
    const mockAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${oauthConfig.facebook.appID}&redirect_uri=${encodeURIComponent(oauthConfig.facebook.callbackURL)}&scope=${encodeURIComponent(oauthConfig.facebook.scope.join(','))}`;
    
    res.json({
      message: 'Testing mode: Redirect to Facebook OAuth',
      authUrl: mockAuthUrl,
      testMode: true
    });
  } catch (error) {
    res.status(500).json({ error: 'OAuth initiation failed' });
  }
});

/**
 * GET /auth/facebook/callback
 * Facebook OAuth callback
 */
router.get('/facebook/callback', (req, res) => {
  try {
    const { code, error } = req.query;

    if (error) {
      return res.redirect(`${oauthConfig.callbackResponses.error.redirectTo}?error=${error}`);
    }

    // Testing: Use mock data
    const mockFacebookUser = {
      ...oauthConfig.facebook.mockData,
      email: process.env.TEST_EMAIL || 'test.facebook@example.com'
    };

    const userData = upsertUser('facebook', mockFacebookUser);
    const { accessToken, refreshToken } = generateTokens(userData.id, userData);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    res.redirect(
      `${oauthConfig.callbackResponses.success.redirectTo}?accessToken=${accessToken}&provider=facebook&user=${encodeURIComponent(JSON.stringify(userData))}`
    );
  } catch (error) {
    res.redirect(`${oauthConfig.callbackResponses.error.redirectTo}?error=callback_error`);
  }
});

// ============== Microsoft OAuth ==============

/**
 * GET /auth/microsoft
 * Initiates Microsoft OAuth flow
 */
router.get('/microsoft', (req, res) => {
  try {
    const mockAuthUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${oauthConfig.microsoft.clientID}&redirect_uri=${encodeURIComponent(oauthConfig.microsoft.callbackURL)}&scope=${encodeURIComponent(oauthConfig.microsoft.scope.join(' '))}&response_type=code`;
    
    res.json({
      message: 'Testing mode: Redirect to Microsoft OAuth',
      authUrl: mockAuthUrl,
      testMode: true
    });
  } catch (error) {
    res.status(500).json({ error: 'OAuth initiation failed' });
  }
});

/**
 * GET /auth/microsoft/callback
 * Microsoft OAuth callback
 */
router.get('/microsoft/callback', (req, res) => {
  try {
    const { code, error } = req.query;

    if (error) {
      return res.redirect(`${oauthConfig.callbackResponses.error.redirectTo}?error=${error}`);
    }

    // Testing: Use mock data
    const mockMicrosoftUser = {
      ...oauthConfig.microsoft.mockData,
      email: process.env.TEST_EMAIL || 'test.microsoft@example.com'
    };

    const userData = upsertUser('microsoft', mockMicrosoftUser);
    const { accessToken, refreshToken } = generateTokens(userData.id, userData);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    res.redirect(
      `${oauthConfig.callbackResponses.success.redirectTo}?accessToken=${accessToken}&provider=microsoft&user=${encodeURIComponent(JSON.stringify(userData))}`
    );
  } catch (error) {
    res.redirect(`${oauthConfig.callbackResponses.error.redirectTo}?error=callback_error`);
  }
});

// ============== OAuth User Info ==============

/**
 * GET /auth/me
 * Get current authenticated user info
 */
router.get('/me', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, oauthConfig.jwt.secret);
    const user = mockUsers.get(decoded.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        provider: user.provider,
        verified: user.verified
      }
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token provided' });
    }

    const decoded = jwt.verify(refreshToken, oauthConfig.jwt.secret);
    const user = mockUsers.get(decoded.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { accessToken } = generateTokens(user.id, user);

    res.json({ accessToken });
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

/**
 * POST /auth/logout
 * Logout user and clear tokens
 */
router.post('/logout', (req, res) => {
  try {
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

// ============== OAuth Status ==============

/**
 * GET /auth/status
 * Get OAuth configuration and testing status
 */
router.get('/status', (req, res) => {
  try {
    res.json({
      testing: oauthConfig.testing.enabled,
      providers: {
        google: oauthConfig.providers.google.enabled,
        github: oauthConfig.providers.github.enabled,
        facebook: oauthConfig.providers.facebook.enabled,
        microsoft: oauthConfig.providers.microsoft.enabled
      },
      features: oauthConfig.features,
      mockUsers: Array.from(mockUsers.values()).map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        provider: u.provider
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Status check failed' });
  }
});

module.exports = router;
