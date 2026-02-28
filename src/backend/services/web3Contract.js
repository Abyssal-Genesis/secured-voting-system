const { ethers } = require("ethers");

/**
 * Web3 Contract Service
 * Handles all interactions with the blockchain voting contract
 */

class Web3ContractService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.contractAddress = process.env.VOTING_CONTRACT_ADDRESS;
    this.privateKey = process.env.PRIVATE_KEY;
    this.initialized = false;
    this.contractABI = this.getContractABI();
    this.eventListeners = new Map();
  }

  /**
   * Initialize Web3 service
   */
  async initialize() {
    try {
      const rpcUrl = process.env.RPC_URL || "http://localhost:8545";
      this.provider = new ethers.JsonRpcProvider(rpcUrl);

      // Verify network connection
      const network = await this.provider.getNetwork();
      console.log(
        `✓ Web3 Connected to ${network.name} (Chain ID: ${network.chainId})`
      );

      // Initialize signer if private key is available
      if (this.privateKey) {
        this.signer = new ethers.Wallet(this.privateKey, this.provider);
        console.log(`✓ Signer initialized: ${this.signer.address}`);
      }

      // Load contract
      if (this.contractAddress) {
        this.contract = new ethers.Contract(
          this.contractAddress,
          this.contractABI,
          this.signer || this.provider
        );
        console.log(`✓ Contract loaded at ${this.contractAddress}`);
        this.setupEventListeners();
      }

      this.initialized = true;
      return true;
    } catch (error) {
      console.error("Web3 initialization failed:", error);
      this.initialized = false;
      return false;
    }
  }

  /**
   * Setup event listeners for contract events
   */
  setupEventListeners() {
    if (!this.contract) return;

    // Listen for SessionCreated events
    this.contract.on("SessionCreated", (sessionId, creator, title) => {
      console.log(`[EVENT] Session Created: ${title} (ID: ${sessionId})`);
      this.emitEvent("sessionCreated", { sessionId, creator, title });
    });

    // Listen for VoteCast events
    this.contract.on("VoteCast", (sessionId, voter, choice) => {
      console.log(`[EVENT] Vote Cast: Session ${sessionId}`);
      this.emitEvent("voteCast", { sessionId, voter, choice });
    });

    // Listen for SessionClosed events
    this.contract.on("SessionClosed", (sessionId, closer) => {
      console.log(`[EVENT] Session Closed: ${sessionId}`);
      this.emitEvent("sessionClosed", { sessionId, closer });
    });

    // Listen for SessionCancelled events
    this.contract.on("SessionCancelled", (sessionId, canceller) => {
      console.log(`[EVENT] Session Cancelled: ${sessionId}`);
      this.emitEvent("sessionCancelled", { sessionId, canceller });
    });

    // Listen for UserVerified events
    this.contract.on("UserVerified", (user) => {
      console.log(`[EVENT] User Verified: ${user}`);
      this.emitEvent("userVerified", { user });
    });

    // Listen for DoubleVoteAttempted events
    this.contract.on("VoterDoubleVoteAttempted", (sessionId, voter) => {
      console.log(`[EVENT] Double Vote Attempted: Session ${sessionId}`);
      this.emitEvent("doubleVoteAttempted", { sessionId, voter });
    });
  }

  /**
   * Emit custom events
   */
  emitEvent(eventName, data) {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, []);
    }
    const callbacks = this.eventListeners.get(eventName);
    callbacks.forEach(callback => callback(data));
  }

  /**
   * Subscribe to contract events
   */
  onEvent(eventName, callback) {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, []);
    }
    this.eventListeners.get(eventName).push(callback);
  }

  /**
   * Create voting session
   */
  async createSession(title, description, options, startTime, endTime, requiresVerification) {
    try {
      if (!this.contract || !this.signer) {
        throw new Error("Contract or signer not initialized");
      }

      console.log("Creating session on blockchain...", { title, options: options.length });

      const tx = await this.contract.createSession(
        title,
        description,
        options,
        Math.floor(startTime / 1000), // Convert to Unix timestamp if needed
        Math.floor(endTime / 1000),
        requiresVerification
      );

      const receipt = await tx.wait();
      console.log(`✓ Session created. TX Hash: ${receipt.hash}`);

      // Extract session ID from events
      const event = receipt.logs.find(log => log.fragment?.name === "SessionCreated");
      const decodedEvent = this.contract.interface.parseLog(event);
      const sessionId = decodedEvent?.args?.[0];

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        sessionId: sessionId?.toString()
      };
    } catch (error) {
      console.error("Failed to create session:", error);
      throw error;
    }
  }

  /**
   * Cast a vote
   */
  async castVote(sessionId, choice) {
    try {
      if (!this.contract || !this.signer) {
        throw new Error("Contract or signer not initialized");
      }

      console.log("Casting vote on blockchain...", { sessionId, choice });

      const tx = await this.contract.castVote(sessionId, choice);
      const receipt = await tx.wait();

      console.log(`✓ Vote cast. TX Hash: ${receipt.hash}`);

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      console.error("Failed to cast vote:", error);
      throw error;
    }
  }

  /**
   * Get voting results
   */
  async getResults(sessionId) {
    try {
      if (!this.contract) {
        throw new Error("Contract not initialized");
      }

      const results = await this.contract.getResults(sessionId);
      return results.map(r => r.toString());
    } catch (error) {
      console.error("Failed to get results:", error);
      throw error;
    }
  }

  /**
   * Get session details
   */
  async getSessionDetails(sessionId) {
    try {
      if (!this.contract) {
        throw new Error("Contract not initialized");
      }

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
      console.error("Failed to get session details:", error);
      throw error;
    }
  }

  /**
   * Get session options
   */
  async getSessionOptions(sessionId) {
    try {
      if (!this.contract) {
        throw new Error("Contract not initialized");
      }

      return await this.contract.getSessionOptions(sessionId);
    } catch (error) {
      console.error("Failed to get session options:", error);
      throw error;
    }
  }

  /**
   * Check if user has voted
   */
  async hasVoted(sessionId, voterAddress) {
    try {
      if (!this.contract) {
        throw new Error("Contract not initialized");
      }

      return await this.contract.hasVoted(sessionId, voterAddress);
    } catch (error) {
      console.error("Failed to check vote status:", error);
      throw error;
    }
  }

  /**
   * Get user's vote
   */
  async getUserVote(sessionId, voterAddress) {
    try {
      if (!this.contract) {
        throw new Error("Contract not initialized");
      }

      return await this.contract.getUserVote(sessionId, voterAddress);
    } catch (error) {
      console.error("Failed to get user vote:", error);
      throw error;
    }
  }

  /**
   * Get total votes for session
   */
  async getTotalVotes(sessionId) {
    try {
      if (!this.contract) {
        throw new Error("Contract not initialized");
      }

      const total = await this.contract.getTotalVotes(sessionId);
      return total.toString();
    } catch (error) {
      console.error("Failed to get total votes:", error);
      throw error;
    }
  }

  /**
   * Get vote history
   */
  async getVoteHistory(sessionId) {
    try {
      if (!this.contract) {
        throw new Error("Contract not initialized");
      }

      const history = await this.contract.getVoteHistory(sessionId);
      return history.map(vote => ({
        sessionId: vote[0].toString(),
        voter: vote[1],
        choice: vote[2].toString(),
        timestamp: vote[3].toString(),
        transactionHash: vote[4]
      }));
    } catch (error) {
      console.error("Failed to get vote history:", error);
      throw error;
    }
  }

  /**
   * Get user created sessions
   */
  async getUserCreatedSessions(creator) {
    try {
      if (!this.contract) {
        throw new Error("Contract not initialized");
      }

      const sessions = await this.contract.getUserCreatedSessions(creator);
      return sessions.map(s => s.toString());
    } catch (error) {
      console.error("Failed to get user sessions:", error);
      throw error;
    }
  }

  /**
   * Close session
   */
  async closeSession(sessionId) {
    try {
      if (!this.contract || !this.signer) {
        throw new Error("Contract or signer not initialized");
      }

      console.log("Closing session on blockchain...", { sessionId });

      const tx = await this.contract.closeSession(sessionId);
      const receipt = await tx.wait();

      console.log(`✓ Session closed. TX Hash: ${receipt.hash}`);

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error("Failed to close session:", error);
      throw error;
    }
  }

  /**
   * Cancel session
   */
  async cancelSession(sessionId, reason) {
    try {
      if (!this.contract || !this.signer) {
        throw new Error("Contract or signer not initialized");
      }

      console.log("Cancelling session on blockchain...", { sessionId, reason });

      const tx = await this.contract.cancelSession(sessionId, reason);
      const receipt = await tx.wait();

      console.log(`✓ Session cancelled. TX Hash: ${receipt.hash}`);

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error("Failed to cancel session:", error);
      throw error;
    }
  }

  /**
   * Verify user (owner only)
   */
  async verifyUser(userAddress) {
    try {
      if (!this.contract || !this.signer) {
        throw new Error("Contract or signer not initialized");
      }

      console.log("Verifying user on blockchain...", { userAddress });

      const tx = await this.contract.verifyUser(userAddress);
      const receipt = await tx.wait();

      console.log(`✓ User verified. TX Hash: ${receipt.hash}`);

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error("Failed to verify user:", error);
      throw error;
    }
  }

  /**
   * Check if user is verified
   */
  async isUserVerified(userAddress) {
    try {
      if (!this.contract) {
        throw new Error("Contract not initialized");
      }

      return await this.contract.isUserVerified(userAddress);
    } catch (error) {
      console.error("Failed to check verification status:", error);
      throw error;
    }
  }

  /**
   * Get user reputation
   */
  async getUserReputation(userAddress) {
    try {
      if (!this.contract) {
        throw new Error("Contract not initialized");
      }

      const reputation = await this.contract.getUserReputation(userAddress);
      return reputation.toString();
    } catch (error) {
      console.error("Failed to get reputation:", error);
      throw error;
    }
  }

  /**
   * Get total sessions
   */
  async getTotalSessions() {
    try {
      if (!this.contract) {
        throw new Error("Contract not initialized");
      }

      const total = await this.contract.getTotalSessions();
      return total.toString();
    } catch (error) {
      console.error("Failed to get total sessions:", error);
      throw error;
    }
  }

  /**
   * Get contract balance
   */
  async getContractBalance() {
    try {
      if (!this.provider || !this.contractAddress) {
        throw new Error("Provider or contract address not initialized");
      }

      const balance = await this.provider.getBalance(this.contractAddress);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error("Failed to get contract balance:", error);
      throw error;
    }
  }

  /**
   * Get network info
   */
  async getNetworkInfo() {
    try {
      if (!this.provider) {
        throw new Error("Provider not initialized");
      }

      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();
      const gasPrice = await this.provider.getGasPrice();

      return {
        network: network.name,
        chainId: network.chainId,
        blockNumber,
        gasPrice: ethers.formatUnits(gasPrice, "gwei")
      };
    } catch (error) {
      console.error("Failed to get network info:", error);
      throw error;
    }
  }

  /**
   * Get contract ABI
   */
  getContractABI() {
    // Return the contract ABI (Application Binary Interface)
    // This is a simplified version - in production, load from artifacts
    return [
      "function createSession(string title, string description, string[] options, uint256 startTime, uint256 endTime, bool requiresHumanVerification) returns (uint256)",
      "function castVote(uint256 sessionId, uint256 choice)",
      "function getResults(uint256 sessionId) view returns (uint256[])",
      "function getSessionDetails(uint256 sessionId) view returns (address, string, string, uint256, uint256, uint256, bool, bool, uint256)",
      "function getSessionOptions(uint256 sessionId) view returns (string[])",
      "function hasVoted(uint256 sessionId, address voter) view returns (bool)",
      "function getUserVote(uint256 sessionId, address voter) view returns (uint256)",
      "function getTotalVotes(uint256 sessionId) view returns (uint256)",
      "function getUserCreatedSessions(address creator) view returns (uint256[])",
      "function getVoteHistory(uint256 sessionId) view returns (tuple(uint256,address,uint256,uint256,bytes32)[])",
      "function closeSession(uint256 sessionId)",
      "function cancelSession(uint256 sessionId, string reason)",
      "function verifyUser(address user)",
      "function isUserVerified(address user) view returns (bool)",
      "function getUserReputation(address user) view returns (uint256)",
      "function getTotalSessions() view returns (uint256)",
      "event SessionCreated(uint256 indexed sessionId, address indexed creator, string title, uint256 startTime, uint256 endTime, uint256 optionCount)",
      "event VoteCast(uint256 indexed sessionId, address indexed voter, uint256 indexed choice, uint256 timestamp)",
      "event SessionClosed(uint256 indexed sessionId, address indexed closer, uint256 totalVotes)",
      "event SessionCancelled(uint256 indexed sessionId, address indexed canceller, string reason)",
      "event UserVerified(address indexed user, uint256 timestamp)",
      "event VoterDoubleVoteAttempted(uint256 indexed sessionId, address indexed voter, uint256 timestamp)"
    ];
  }

  /**
   * Check if service is initialized
   */
  isInitialized() {
    return this.initialized;
  }

  /**
   * Disconnect from blockchain
   */
  async disconnect() {
    try {
      if (this.contract) {
        this.contract.removeAllListeners();
      }
      console.log("✓ Disconnected from blockchain");
      return true;
    } catch (error) {
      console.error("Failed to disconnect:", error);
      return false;
    }
  }
}

module.exports = Web3ContractService;
