const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const humanVerificationService = require("../services/humanVerification");
const {
  authenticateJWT,
  validateInput,
  rateLimit,
  tokenManager
} = require("../middleware/auth");

dotenv.config();

// ============== Constants ==============
const JWT_SECRET = process.env.JWT_SECRET || "backup-secret";
const JWT_EXPIRY = process.env.JWT_EXPIRY || "7d";

// ============== Mock User Database ==============
const users = new Map();
const sessions = new Map();

// ============== Helper Functions ==============

function generateUserId() {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function findUserByEmail(email) {
  for (const [, user] of users) {
    if (user.email === email) {
      return user;
    }
  }
  return null;
}

// ============== Auth Routes ==============

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post(
  "/register",
  rateLimit(5), // Max 5 registration attempts per 15 mins
  validateInput(["email", "name", "password"]),
  async (req, res) => {
    try {
      const { email, name, password } = req.body;

      // Validation
      if (!email || !name || !password) {
        return res.status(400).json({
          error: "Email, name, and password required",
          code: "MISSING_FIELDS"
        });
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({
          error: "Invalid email format",
          code: "INVALID_EMAIL"
        });
      }

      if (password.length < 8) {
        return res.status(400).json({
          error: "Password must be at least 8 characters",
          code: "WEAK_PASSWORD"
        });
      }

      // Check if user exists
      if (findUserByEmail(email)) {
        return res.status(409).json({
          error: "Email already registered",
          code: "USER_EXISTS"
        });
      }

      // Create user
      const userId = generateUserId();
      const user = {
        id: userId,
        email,
        name,
        password: Buffer.from(password).toString("base64"), // Mock hashing
        verifiedHuman: false,
        walletAddress: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      users.set(userId, user);
      console.log(`✓ User registered: ${email}`);

      // Generate tokens
      const accessToken = tokenManager.generateAccessToken({
        id: userId,
        email,
        name
      });
      const refreshToken = tokenManager.generateRefreshToken({
        id: userId,
        email,
        name
      });

      res.status(201).json({
        success: true,
        message: "Registration successful",
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: "7d"
        },
        user: {
          id: userId,
          email,
          name,
          verifiedHuman: false
        }
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({
        error: "Registration failed",
        code: "REGISTRATION_ERROR"
      });
    }
  }
);

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post(
  "/login",
  rateLimit(10),
  validateInput(["email", "password"]),
  async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          error: "Email and password required",
          code: "MISSING_CREDENTIALS"
        });
      }

      const user = findUserByEmail(email);
      if (!user) {
        return res.status(401).json({
          error: "Invalid email or password",
          code: "INVALID_CREDENTIALS"
        });
      }

      // Mock password check
      if (Buffer.from(password).toString("base64") !== user.password) {
        return res.status(401).json({
          error: "Invalid email or password",
          code: "INVALID_CREDENTIALS"
        });
      }

      console.log(`✓ User logged in: ${email}`);

      // Generate tokens
      const accessToken = tokenManager.generateAccessToken({
        id: user.id,
        email: user.email,
        name: user.name,
        verifiedHuman: user.verifiedHuman
      });
      const refreshToken = tokenManager.generateRefreshToken({
        id: user.id,
        email: user.email,
        name: user.name
      });

      res.json({
        success: true,
        message: "Login successful",
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: "7d"
        },
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          verifiedHuman: user.verifiedHuman,
          walletAddress: user.walletAddress
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        error: "Login failed",
        code: "LOGIN_ERROR"
      });
    }
  }
);

/**
 * POST /api/auth/google-login
 * Login/Register with Google OAuth
 */
router.post(
  "/google-login",
  rateLimit(10),
  validateInput(["googleToken"]),
  async (req, res) => {
    try {
      const { googleToken } = req.body;

      if (!googleToken) {
        return res.status(400).json({
          error: "Google token required",
          code: "MISSING_TOKEN"
        });
      }

      // Mock Google verification (in production, verify with Google OAuth)
      const googleUser = {
        id: `google_${Math.random().toString(36).substr(2, 9)}`,
        email: `user_${Date.now()}@gmail.com`,
        name: "Google User"
      };

      // Find or create user
      let user = findUserByEmail(googleUser.email);
      if (!user) {
        const userId = generateUserId();
        user = {
          id: userId,
          email: googleUser.email,
          name: googleUser.name,
          googleId: googleUser.id,
          verifiedHuman: false,
          walletAddress: null,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        users.set(userId, user);
        console.log(`✓ User created via Google: ${googleUser.email}`);
      }

      // Generate tokens
      const accessToken = tokenManager.generateAccessToken({
        id: user.id,
        email: user.email,
        name: user.name,
        verifiedHuman: user.verifiedHuman
      });
      const refreshToken = tokenManager.generateRefreshToken({
        id: user.id,
        email: user.email,
        name: user.name
      });

      res.json({
        success: true,
        message: "Google login successful",
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: "7d"
        },
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          verifiedHuman: user.verifiedHuman
        }
      });
    } catch (error) {
      console.error("Google login error:", error);
      res.status(500).json({
        error: "Google login failed",
        code: "GOOGLE_LOGIN_ERROR"
      });
    }
  }
);

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post("/refresh", validateInput(["refreshToken"]), async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: "Refresh token required",
        code: "MISSING_REFRESH_TOKEN"
      });
    }

    const payload = tokenManager.verifyRefreshToken(refreshToken);
    if (!payload) {
      return res.status(401).json({
        error: "Invalid or expired refresh token",
        code: "INVALID_REFRESH_TOKEN"
      });
    }

    // Invalidate old refresh token and generate new ones
    tokenManager.reuseRefreshToken(refreshToken);

    const newAccessToken = tokenManager.generateAccessToken(payload);
    const newRefreshToken = tokenManager.generateRefreshToken(payload);

    res.json({
      success: true,
      tokens: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: "7d"
      }
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(500).json({
      error: "Token refresh failed",
      code: "REFRESH_ERROR"
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout current user
 */
router.post("/logout", authenticateJWT, async (req, res) => {
  try {
    const token = req.token;
    if (token) {
      tokenManager.revokeToken(token);
    }

    console.log(`✓ User logged out: ${req.user.email}`);

    res.json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      error: "Logout failed",
      code: "LOGOUT_ERROR"
    });
  }
});

/**
 * POST /api/auth/human-verification/start
 * Initiate human verification process
 */
router.post(
  "/human-verification/start",
  authenticateJWT,
  async (req, res) => {
    try {
      const userId = req.user.id;

      // Start verification process
      const verificationId = `VER_${userId}_${Date.now()}`;

      res.json({
        success: true,
        verificationId,
        message: "Verification process started",
        steps: [
          "Take a selfie",
          "Perform liveness check",
          "Verify email or phone",
          "Behavioral analysis"
        ]
      });
    } catch (error) {
      console.error("Verification start error:", error);
      res.status(500).json({
        error: "Failed to start verification",
        code: "VERIFICATION_START_ERROR"
      });
    }
  }
);

/**
 * POST /api/auth/human-verification/submit
 * Submit human verification data
 */
router.post(
  "/human-verification/submit",
  authenticateJWT,
  validateInput([
    "faceImage",
    "livenessVideo",
    "email",
    "phone",
    "behavioralData"
  ]),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const verificationData = req.body;

      // Call human verification service
      const result = await humanVerificationService.verifyUser(
        userId,
        verificationData
      );

      if (result.success) {
        // Update user as verified
        const user = users.get(userId);
        if (user) {
          user.verifiedHuman = true;
          user.updatedAt = new Date();
          users.set(userId, user);
        }

        console.log(`✓ User verified: ${userId}`);
      }

      res.json({
        success: result.success,
        message: result.success
          ? "Verification successful"
          : "Verification failed",
        verificationId: result.verificationId,
        successCount: result.successCount,
        totalChecks: result.totalChecks,
        averageConfidence: result.averageConfidence,
        details: result.success ? null : result.checks
      });
    } catch (error) {
      console.error("Verification submit error:", error);
      res.status(500).json({
        error: "Verification submission failed",
        code: "VERIFICATION_ERROR",
        message: error.message
      });
    }
  }
);

/**
 * GET /api/auth/profile
 * Get current user profile
 */
router.get("/profile", authenticateJWT, async (req, res) => {
  try {
    const user = users.get(req.user.id);

    if (!user) {
      return res.status(404).json({
        error: "User not found",
        code: "USER_NOT_FOUND"
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        verifiedHuman: user.verifiedHuman,
        walletAddress: user.walletAddress,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({
      error: "Failed to fetch profile",
      code: "PROFILE_ERROR"
    });
  }
});

/**
 * PUT /api/auth/profile
 * Update user profile
 */
router.put(
  "/profile",
  authenticateJWT,
  validateInput(["name", "walletAddress"]),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const updates = req.body;
      const user = users.get(userId);

      if (!user) {
        return res.status(404).json({
          error: "User not found",
          code: "USER_NOT_FOUND"
        });
      }

      // Update allowed fields
      if (updates.name) user.name = updates.name;
      if (updates.walletAddress) user.walletAddress = updates.walletAddress;
      user.updatedAt = new Date();

      users.set(userId, user);
      console.log(`✓ User profile updated: ${user.email}`);

      res.json({
        success: true,
        message: "Profile updated successfully",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          verifiedHuman: user.verifiedHuman,
          walletAddress: user.walletAddress
        }
      });
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({
        error: "Failed to update profile",
        code: "UPDATE_ERROR"
      });
    }
  }
);

module.exports = router;

