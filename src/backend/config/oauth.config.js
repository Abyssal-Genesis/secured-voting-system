/**
 * OAuth Configuration Module
 * Handles all OAuth provider configurations (Google, GitHub, Facebook)
 * Testing Data: All endpoints return mock tokens and user data
 */

require('dotenv').config();

const oauthConfig = {
  // Google OAuth Configuration
  google: {
    clientID: process.env.GOOGLE_CLIENT_ID || 'test_google_client_id_12345',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'test_google_secret_67890',
    callbackURL: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/google/callback',
    scope: ['profile', 'email'],
    accessType: 'offline',
    prompt: 'consent',
    mockData: {
      id: 'google_user_123456',
      displayName: 'Test Google User',
      name: {
        familyName: 'User',
        givenName: 'Test'
      },
      emails: [{ value: 'test.google@example.com' }],
      photos: [{ value: 'https://api.example.com/avatar/google_default.png' }]
    }
  },

  // GitHub OAuth Configuration
  github: {
    clientID: process.env.GITHUB_CLIENT_ID || 'test_github_client_id_789',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || 'test_github_secret_456',
    callbackURL: process.env.GITHUB_REDIRECT_URI || 'http://localhost:3001/api/auth/github/callback',
    scope: ['user:email', 'read:user'],
    mockData: {
      id: 'github_user_789456',
      login: 'test-github-user',
      name: 'Test GitHub User',
      avatar_url: 'https://avatars.githubusercontent.com/u/0?v=4',
      email: 'test.github@example.com',
      bio: 'Test GitHub account',
      location: 'Test City'
    }
  },

  // Facebook OAuth Configuration
  facebook: {
    appID: process.env.FACEBOOK_APP_ID || 'test_facebook_app_id_999',
    appSecret: process.env.FACEBOOK_APP_SECRET || 'test_facebook_secret_111',
    callbackURL: process.env.FACEBOOK_REDIRECT_URI || 'http://localhost:3001/api/auth/facebook/callback',
    scope: ['public_profile', 'email'],
    fields: ['id', 'displayName', 'name', 'emails', 'picture'],
    mockData: {
      id: 'facebook_user_999111',
      displayName: 'Test Facebook User',
      name: {
        familyName: 'User',
        middleName: '',
        givenName: 'Test'
      },
      emails: [{ value: 'test.facebook@example.com' }],
      photos: [{ value: 'https://api.example.com/avatar/facebook_default.png' }]
    }
  },

  // Microsoft OAuth Configuration
  microsoft: {
    clientID: process.env.MICROSOFT_CLIENT_ID || 'test_microsoft_client_id_222',
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET || 'test_microsoft_secret_333',
    callbackURL: process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:3001/api/auth/microsoft/callback',
    scope: ['user.read', 'mail.read'],
    authority: 'https://login.microsoftonline.com/common',
    mockData: {
      id: 'microsoft_user_222333',
      displayName: 'Test Microsoft User',
      mailNickname: 'testmsuser',
      mail: 'test.microsoft@example.com',
      mobilePhone: '+1234567890',
      preferredLanguage: 'en-US'
    }
  },

  // Common OAuth Settings
  session: {
    secret: process.env.SESSION_SECRET || 'test_session_secret_change_in_production',
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  },

  // JWT Configuration for OAuth tokens
  jwt: {
    secret: process.env.JWT_SECRET || 'test_jwt_secret_change_in_production_minimum_32_chars',
    expiresIn: '7d',
    refreshExpiresIn: '30d'
  },

  // OAuth Callback Response Handlers
  callbackResponses: {
    success: {
      status: 200,
      message: 'OAuth authentication successful',
      redirectTo: process.env.FRONTEND_URL || 'http://localhost:3000/dashboard'
    },
    error: {
      status: 401,
      message: 'OAuth authentication failed',
      redirectTo: process.env.FRONTEND_URL || 'http://localhost:3000/login'
    }
  },

  // Testing Configuration
  testing: {
    enabled: process.env.NODE_ENV !== 'production',
    mockTokens: true,
    skipVerification: process.env.NODE_ENV === 'development',
    testUsers: {
      google: {
        accessToken: 'test_google_access_token_abcdefgh123456',
        refreshToken: 'test_google_refresh_token_ijklmnop789012',
        idToken: 'test_google_id_token_qrstuvwx345678'
      },
      github: {
        accessToken: 'test_github_access_token_ghp_1234567890abcdefghijklmnop',
        refreshToken: null
      },
      facebook: {
        accessToken: 'test_facebook_access_token_EAABsbCS1iHgBAOZBXXXXXXXXXXX'
      },
      microsoft: {
        accessToken: 'test_microsoft_access_token_M.R3_BAY._XXXXXXXXXXXX'
      }
    }
  },

  // Provider Verification
  providers: {
    google: {
      enabled: true,
      verifyEndpoint: 'https://www.googleapis.com/oauth2/v3/tokeninfo',
      userInfoEndpoint: 'https://www.googleapis.com/oauth2/v1/userinfo'
    },
    github: {
      enabled: true,
      verifyEndpoint: 'https://api.github.com/user',
      userInfoEndpoint: 'https://api.github.com/user'
    },
    facebook: {
      enabled: true,
      verifyEndpoint: 'https://graph.facebook.com/me',
      userInfoEndpoint: 'https://graph.facebook.com/me?fields=id,name,email,picture'
    },
    microsoft: {
      enabled: true,
      verifyEndpoint: 'https://graph.microsoft.com/v1.0/me',
      userInfoEndpoint: 'https://graph.microsoft.com/v1.0/me'
    }
  },

  // Feature Flags
  features: {
    enableOAuth: true,
    enableMultipleProviders: true,
    enableAccountLinking: true,
    autoCreateAccount: true,
    requireEmailVerification: false,
    enableSocialProofing: true
  }
};

module.exports = oauthConfig;
