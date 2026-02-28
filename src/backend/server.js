const express = require("express");
const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");
const jwt = require("jsonwebtoken");
const { ethers } = require("ethers");

// Load environment variables
dotenv.config();

// ============== Imports ==============
// Note: In production, these would be actual files
// For now, we'll create inline versions

// ============== Express App Setup ==============
const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";
const ENABLE_HTTPS = process.env.ENABLE_HTTPS !== "false";

// ============== Middleware ==============

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Logging middleware
app.use(morgan("combined"));

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// ============== Global Error Handler ==============
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

// ============== Logging Service ==============
const Logger = {
  info: (msg, data = {}) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${msg}`, data);
  },
  error: (msg, error = {}) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, error);
  },
  warn: (msg, data = {}) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`, data);
  },
  debug: (msg, data = {}) => {
    if (NODE_ENV === "development") {
      console.log(`[DEBUG] ${new Date().toISOString()} - ${msg}`, data);
    }
  }
};

// ============== Web3 Service ==============
class Web3Service {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.contractAddress = process.env.VOTING_CONTRACT_ADDRESS;
    this.contractABI = this.getContractABI();
    this.initialized = false;
  }

  async initialize() {
    try {
      const rpcUrl = process.env.RPC_URL || "http://localhost:8545";
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      
      // Verify network connection
      const network = await this.provider.getNetwork();
      Logger.info("Web3 Connected", { 
        network: network.name, 
        chainId: network.chainId 
      });

      // Initialize contract if address is provided
      if (this.contractAddress) {
        this.contract = new ethers.Contract(
          this.contractAddress,
          this.contractABI,
          this.provider
        );
        Logger.info("Voting contract loaded", { 
          address: this.contractAddress 
        });
      }

      this.initialized = true;
      return true;
    } catch (error) {
      Logger.error("Web3 initialization failed", error);
      this.initialized = false;
      return false;
    }
  }

  getContractABI() {
    // Load from artifacts or return inline ABI
    return [
      "function createSession(string memory title, string memory description, string[] memory options, uint256 startTime, uint256 endTime, bool requiresHumanVerification) public returns (uint256)",
      "function castVote(uint256 sessionId, uint256 choice) public",
      "function getResults(uint256 sessionId) public view returns (uint256[])",
      "function getSessionDetails(uint256 sessionId) public view returns (address, string, string, uint256, uint256, uint256, bool, bool, uint256)",
      "function getSessionOptions(uint256 sessionId) public view returns (string[])",
      "function hasVoted(uint256 sessionId, address voter) public view returns (bool)",
      "function getUserVote(uint256 sessionId, address voter) public view returns (uint256)",
      "function getTotalVotes(uint256 sessionId) public view returns (uint256)",
      "function getUserCreatedSessions(address creator) public view returns (uint256[])",
      "function getVoteHistory(uint256 sessionId) public view returns (tuple(uint256, address, uint256, uint256, bytes32)[])",
      "function closeSession(uint256 sessionId) public",
      "function cancelSession(uint256 sessionId, string memory reason) public",
      "function verifyUser(address user) public",
      "function isUserVerified(address user) public view returns (bool)",
      "function getUserReputation(address user) public view returns (uint256)",
      "function getTotalSessions() public view returns (uint256)"
    ];
  }

  async createSession(title, description, options, startTime, endTime, requiresVerification) {
    try {
      if (!this.contract) throw new Error("Contract not initialized");
      
      const tx = await this.contract.createSession(
        title,
        description,
        options,
        startTime,
        endTime,
        requiresVerification
      );
      
      const receipt = await tx.wait();
      Logger.info("Session created on blockchain", { 
        tx: receipt.hash 
      });
      
      return receipt;
    } catch (error) {
      Logger.error("Failed to create session", error);
      throw error;
    }
  }

  async castVote(sessionId, choice, userAddress = null) {
    try {
      if (!this.contract) throw new Error("Contract not initialized");
      
      const tx = await this.contract.castVote(sessionId, choice);
      const receipt = await tx.wait();
      
      Logger.info("Vote cast on blockchain", { 
        sessionId,
        choice,
        tx: receipt.hash 
      });
      
      return receipt;
    } catch (error) {
      Logger.error("Failed to cast vote", error);
      throw error;
    }
  }

  async getSessionDetails(sessionId) {
    try {
      if (!this.contract) throw new Error("Contract not initialized");
      
      const details = await this.contract.getSessionDetails(sessionId);
      return {
        creator: details[0],
        title: details[1],
        description: details[2],
        startTime: details[3].toString(),
        endTime: details[4].toString(),
        totalVotes: details[5].toString(),
        closed: details[6],
        cancelled: details[7],
        optionCount: details[8].toString()
      };
    } catch (error) {
      Logger.error("Failed to get session details", error);
      throw error;
    }
  }

  async getResults(sessionId) {
    try {
      if (!this.contract) throw new Error("Contract not initialized");
      const results = await this.contract.getResults(sessionId);
      return results.map(r => r.toString());
    } catch (error) {
      Logger.error("Failed to get results", error);
      throw error;
    }
  }

  async getSessionOptions(sessionId) {
    try {
      if (!this.contract) throw new Error("Contract not initialized");
      return await this.contract.getSessionOptions(sessionId);
    } catch (error) {
      Logger.error("Failed to get options", error);
      throw error;
    }
  }

  async hasVoted(sessionId, voterAddress) {
    try {
      if (!this.contract) throw new Error("Contract not initialized");
      return await this.contract.hasVoted(sessionId, voterAddress);
    } catch (error) {
      Logger.error("Failed to check vote status", error);
      throw error;
    }
  }

  async getUserReputation(userAddress) {
    try {
      if (!this.contract) throw new Error("Contract not initialized");
      const reputation = await this.contract.getUserReputation(userAddress);
      return reputation.toString();
    } catch (error) {
      Logger.error("Failed to get reputation", error);
      throw error;
    }
  }

  async isUserVerified(userAddress) {
    try {
      if (!this.contract) throw new Error("Contract not initialized");
      return await this.contract.isUserVerified(userAddress);
    } catch (error) {
      Logger.error("Failed to check verification status", error);
      throw error;
    }
  }
}

// ============== Database Service (Mock) ==============
class DatabaseService {
  constructor() {
    this.users = new Map();
    this.sessions = new Map();
    this.votes = new Map();
    this.sessionId = 0;
  }

  // User Management
  async createUser(googleId, email, name) {
    const user = {
      id: this.users.size + 1,
      googleId,
      email,
      name,
      verifiedHuman: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      walletAddress: null
    };
    this.users.set(email, user);
    Logger.info("User created", { email });
    return user;
  }

  async getUserByEmail(email) {
    return this.users.get(email) || null;
  }

  async updateUser(email, updates) {
    const user = this.users.get(email);
    if (!user) return null;
    
    const updated = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(email, updated);
    Logger.info("User updated", { email });
    return updated;
  }

  // Session Management
  async createSession(creator, title, description, options, startTime, endTime) {
    const session = {
      id: this.sessionId++,
      creator,
      title,
      description,
      options,
      startTime,
      endTime,
      contractAddress: null,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.sessions.set(session.id, session);
    Logger.info("Session created in DB", { sessionId: session.id });
    return session;
  }

  async getSession(sessionId) {
    return this.sessions.get(sessionId) || null;
  }

  async updateSession(sessionId, updates) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    
    const updated = { ...session, ...updates, updatedAt: new Date() };
    this.sessions.set(sessionId, updated);
    Logger.info("Session updated in DB", { sessionId });
    return updated;
  }

  async recordVote(sessionId, userId, choice, txHash) {
    const voteKey = `${sessionId}-${userId}`;
    const vote = {
      sessionId,
      userId,
      choice,
      txHash,
      timestamp: new Date()
    };
    this.votes.set(voteKey, vote);
    Logger.info("Vote recorded in DB", { sessionId, userId });
    return vote;
  }

  async getSessionVotes(sessionId) {
    const sessionVotes = [];
    this.votes.forEach((vote) => {
      if (vote.sessionId === sessionId) {
        sessionVotes.push(vote);
      }
    });
    return sessionVotes;
  }
}

// ============== Authentication Service ==============
class AuthService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || "backup-secret-key-change-in-production";
    this.tokenExpiry = process.env.JWT_EXPIRY || "7d";
  }

  generateToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      googleId: user.googleId
    };
    return jwt.sign(payload, this.jwtSecret, { expiresIn: this.tokenExpiry });
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      Logger.warn("Token verification failed", { error: error.message });
      return null;
    }
  }

  async verifyGoogleToken(token) {
    // In production, verify with Google OAuth API
    // For now, return mock data
    Logger.debug("Google token verified (mock)");
    return {
      id: Math.random().toString(36).substr(2, 9),
      email: "user@example.com",
      name: "User Name"
    };
  }
}

// ============== Middleware Functions ==============

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  const decoded = authService.verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }

  req.user = decoded;
  next();
};

const errorHandler = (err, req, res, next) => {
  Logger.error("Request error", { 
    message: err.message,
    path: req.path,
    method: req.method
  });

  const statusCode = err.statusCode || 500;
  const message = NODE_ENV === "production" 
    ? "Internal server error" 
    : err.message;

  res.status(statusCode).json({
    error: message,
    ...(NODE_ENV === "development" && { stack: err.stack })
  });
};

// ============== Service Instances ==============
const web3Service = new Web3Service();
const dbService = new DatabaseService();
const authService = new AuthService();

// ============== API Routes ==============

// Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    web3Connected: web3Service.initialized,
    environment: NODE_ENV
  });
});

// ============== Auth Routes ==============

app.post("/api/auth/login", async (req, res, next) => {
  try {
    const { googleToken } = req.body;
    
    if (!googleToken) {
      throw new AppError("Google token required", 400);
    }

    // Verify Google token
    const googleUser = await authService.verifyGoogleToken(googleToken);
    
    // Find or create user
    let user = await dbService.getUserByEmail(googleUser.email);
    if (!user) {
      user = await dbService.createUser(
        googleUser.id,
        googleUser.email,
        googleUser.name
      );
    }

    // Generate JWT token
    const token = authService.generateToken(user);
    
    Logger.info("User logged in", { email: user.email });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        verifiedHuman: user.verifiedHuman
      }
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/logout", authenticateToken, (req, res) => {
  Logger.info("User logged out", { user: req.user.email });
  res.json({ success: true, message: "Logged out successfully" });
});

// ============== Voting Routes ==============

app.post("/api/voting/sessions/create", authenticateToken, async (req, res, next) => {
  try {
    const { title, description, options, startTime, endTime, requiresVerification } = req.body;

    // Validation
    if (!title || !options || options.length < 2) {
      throw new AppError("Invalid session data", 400);
    }

    // Create session in database first
    const session = await dbService.createSession(
      req.user.id,
      title,
      description,
      options,
      startTime,
      endTime
    );

    // Create on blockchain (if Web3 is available)
    if (web3Service.initialized) {
      try {
        await web3Service.createSession(
          title,
          description,
          options,
          Math.floor(startTime / 1000),
          Math.floor(endTime / 1000),
          requiresVerification
        );
      } catch (web3Error) {
        Logger.warn("Blockchain session creation failed", web3Error);
      }
    }

    Logger.info("Voting session created", { 
      sessionId: session.id,
      creator: req.user.email 
    });

    res.status(201).json({
      success: true,
      session
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/voting/sessions/:sessionId", async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    
    const session = await dbService.getSession(parseInt(sessionId));
    if (!session) {
      throw new AppError("Session not found", 404);
    }

    // Get blockchain details if available
    let blockchainDetails = null;
    if (web3Service.initialized) {
      try {
        blockchainDetails = await web3Service.getSessionDetails(sessionId);
      } catch (error) {
        Logger.warn("Failed to fetch blockchain details", error);
      }
    }

    res.json({
      success: true,
      session,
      blockchainDetails
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/voting/cast", authenticateToken, async (req, res, next) => {
  try {
    const { sessionId, choice } = req.body;

    if (sessionId === undefined || choice === undefined) {
      throw new AppError("Session ID and choice required", 400);
    }

    // Check if user has already voted
    if (web3Service.initialized) {
      const hasVoted = await web3Service.hasVoted(sessionId, req.user.id);
      if (hasVoted) {
        throw new AppError("Already voted in this session", 400);
      }
    }

    // Cast vote on blockchain
    let txHash = null;
    if (web3Service.initialized) {
      try {
        const receipt = await web3Service.castVote(sessionId, choice);
        txHash = receipt.hash;
      } catch (error) {
        Logger.error("Blockchain vote failed", error);
        throw new AppError("Failed to cast vote on blockchain", 500);
      }
    }

    // Record in database
    await dbService.recordVote(sessionId, req.user.id, choice, txHash);

    Logger.info("Vote cast successfully", { 
      sessionId,
      choice,
      user: req.user.email 
    });

    res.json({
      success: true,
      message: "Vote recorded successfully",
      transactionHash: txHash
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/voting/results/:sessionId", async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    let results = null;
    let options = null;

    if (web3Service.initialized) {
      try {
        results = await web3Service.getResults(sessionId);
        options = await web3Service.getSessionOptions(sessionId);
      } catch (error) {
        Logger.warn("Failed to fetch blockchain results", error);
      }
    }

    res.json({
      success: true,
      sessionId,
      results,
      options
    });
  } catch (error) {
    next(error);
  }
});

// ============== User Routes ==============

app.get("/api/users/me", authenticateToken, async (req, res, next) => {
  try {
    const user = await dbService.getUserByEmail(req.user.email);
    
    if (!user) {
      throw new AppError("User not found", 404);
    }

    let reputation = null;
    if (web3Service.initialized && user.walletAddress) {
      try {
        reputation = await web3Service.getUserReputation(user.walletAddress);
      } catch (error) {
        Logger.warn("Failed to fetch reputation", error);
      }
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        verifiedHuman: user.verifiedHuman,
        walletAddress: user.walletAddress,
        reputation
      }
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/users/link-wallet", authenticateToken, async (req, res, next) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress || !ethers.isAddress(walletAddress)) {
      throw new AppError("Invalid wallet address", 400);
    }

    const updated = await dbService.updateUser(req.user.email, {
      walletAddress
    });

    Logger.info("Wallet linked", { 
      email: req.user.email,
      wallet: walletAddress 
    });

    res.json({
      success: true,
      message: "Wallet linked successfully",
      user: updated
    });
  } catch (error) {
    next(error);
  }
});

// ============== Stats Routes ==============

app.get("/api/stats/summary", async (req, res, next) => {
  try {
    const stats = {
      totalUsers: dbService.users.size,
      totalSessions: dbService.sessions.size,
      totalVotes: dbService.votes.size,
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    next(error);
  }
});

// ============== 404 Handler ==============
app.use((req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    path: req.path,
    method: req.method
  });
});

// ============== Error Handler ==============
app.use(errorHandler);

// ============== Server Initialization ==============
async function startServer() {
  try {
    Logger.info("Starting Secured Voting System Backend", {
      environment: NODE_ENV,
      port: PORT
    });

    // Initialize Web3
    await web3Service.initialize();

    // Create HTTP/HTTPS server
    let server;
    if (ENABLE_HTTPS && fs.existsSync("key.pem") && fs.existsSync("cert.pem")) {
      const options = {
        key: fs.readFileSync("key.pem"),
        cert: fs.readFileSync("cert.pem")
      };
      server = https.createServer(options, app);
      Logger.info("HTTPS enabled");
    } else {
      server = http.createServer(app);
      Logger.info("HTTP mode (HTTPS disabled)");
    }

    // Start listening
    server.listen(PORT, () => {
      Logger.info("🚀 Backend server running", {
        url: `http${ENABLE_HTTPS ? "s" : ""}://localhost:${PORT}`,
        environment: NODE_ENV
      });
    });

    // Graceful shutdown
    process.on("SIGTERM", () => {
      Logger.info("SIGTERM received, shutting down gracefully");
      server.close(() => {
        Logger.info("Server closed");
        process.exit(0);
      });
    });

  } catch (error) {
    Logger.error("Failed to start server", error);
    process.exit(1);
  }
}

// Start server
if (require.main === module) {
  startServer();
}

module.exports = { app, web3Service, dbService, authService };
