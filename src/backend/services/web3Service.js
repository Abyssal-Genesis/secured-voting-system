/**
 * Web3 Service - Blockchain Interaction Layer
 * Handles all interactions with the Voting smart contract
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

class Web3Service {
  constructor(config = {}) {
    this.rpcUrl = config.rpcUrl || process.env.RPC_URL || 'http://localhost:8545';
    this.contractAddress = config.contractAddress || process.env.VOTING_CONTRACT_ADDRESS;
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.initialized = false;
    this.logger = config.logger || console;
  }

  /**
   * Initialize Web3 connection and load contract ABI
   */
  async initialize() {
    try {
      this.logger.info('Initializing Web3 Service...');
      
      // Create provider
      this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
      
      // Test connection
      const network = await this.provider.getNetwork();
      this.logger.info(`Connected to network: ${network.name} (Chain ID: ${network.chainId})`);
      
      // Load contract ABI
      const abiPath = path.join(__dirname, '../smart_contracts/artifacts/contracts/Voting.sol/SecuredVotingSystem.json');
      let contractABI = this.getDefaultABI();
      
      if (fs.existsSync(abiPath)) {
        const artifact = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
        contractABI = artifact.abi;
        this.logger.info('Loaded contract ABI from artifacts');
      }
      
      // Initialize contract if address is provided
      if (this.contractAddress && ethers.isAddress(this.contractAddress)) {
        this.contract = new ethers.Contract(
          this.contractAddress,
          contractABI,
          this.provider
        );
        this.logger.info(`Voting contract loaded at ${this.contractAddress}`);
      } else {
        this.logger.warn('Contract address not configured or invalid');
      }
      
      this.initialized = true;
      return true;
    } catch (error) {
      this.logger.error('Web3 initialization failed:', error.message);
      this.initialized = false;
      return false;
    }
  }

  /**
   * Get default contract ABI if artifacts not available
   */
  getDefaultABI() {
    return [
      {
        "inputs": [
          { "internalType": "string", "name": "_title", "type": "string" },
          { "internalType": "string", "name": "_description", "type": "string" },
          { "internalType": "string[]", "name": "_options", "type": "string[]" },
          { "internalType": "uint256", "name": "_startTime", "type": "uint256" },
          { "internalType": "uint256", "name": "_endTime", "type": "uint256" },
          { "internalType": "bool", "name": "_requiresHumanVerification", "type": "bool" }
        ],
        "name": "createSession",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          { "internalType": "uint256", "name": "_sessionId", "type": "uint256" },
          { "internalType": "uint256", "name": "_choice", "type": "uint256" }
        ],
        "name": "castVote",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [{ "internalType": "uint256", "name": "_sessionId", "type": "uint256" }],
        "name": "getResults",
        "outputs": [{ "internalType": "uint256[]", "name": "", "type": "uint256[]" }],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [{ "internalType": "uint256", "name": "_sessionId", "type": "uint256" }],
        "name": "getSessionDetails",
        "outputs": [
          { "internalType": "address", "name": "", "type": "address" },
          { "internalType": "string", "name": "", "type": "string" },
          { "internalType": "string", "name": "", "type": "string" },
          { "internalType": "uint256", "name": "", "type": "uint256" },
          { "internalType": "uint256", "name": "", "type": "uint256" },
          { "internalType": "uint256", "name": "", "type": "uint256" },
          { "internalType": "bool", "name": "", "type": "bool" },
          { "internalType": "bool", "name": "", "type": "bool" },
          { "internalType": "uint256", "name": "", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [{ "internalType": "uint256", "name": "_sessionId", "type": "uint256" }],
        "name": "getSessionOptions",
        "outputs": [{ "internalType": "string[]", "name": "", "type": "string[]" }],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          { "internalType": "uint256", "name": "_sessionId", "type": "uint256" },
          { "internalType": "address", "name": "_voter", "type": "address" }
        ],
        "name": "hasVoted",
        "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          { "internalType": "uint256", "name": "_sessionId", "type": "uint256" },
          { "internalType": "address", "name": "_voter", "type": "address" }
        ],
        "name": "getUserVote",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [{ "internalType": "uint256", "name": "_sessionId", "type": "uint256" }],
        "name": "getTotalVotes",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [{ "internalType": "address", "name": "_creator", "type": "address" }],
        "name": "getUserCreatedSessions",
        "outputs": [{ "internalType": "uint256[]", "name": "", "type": "uint256[]" }],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [{ "internalType": "uint256", "name": "_sessionId", "type": "uint256" }],
        "name": "getVoteHistory",
        "outputs": [
          {
            "components": [
              { "internalType": "uint256", "name": "sessionId", "type": "uint256" },
              { "internalType": "address", "name": "voter", "type": "address" },
              { "internalType": "uint256", "name": "choice", "type": "uint256" },
              { "internalType": "uint256", "name": "timestamp", "type": "uint256" },
              { "internalType": "bytes32", "name": "transactionHash", "type": "bytes32" }
            ],
            "internalType": "struct Vote[]",
            "name": "",
            "type": "tuple[]"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [{ "internalType": "uint256", "name": "_sessionId", "type": "uint256" }],
        "name": "closeSession",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          { "internalType": "uint256", "name": "_sessionId", "type": "uint256" },
          { "internalType": "string", "name": "_reason", "type": "string" }
        ],
        "name": "cancelSession",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [{ "internalType": "address", "name": "_user", "type": "address" }],
        "name": "verifyUser",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [{ "internalType": "address", "name": "_user", "type": "address" }],
        "name": "isUserVerified",
        "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [{ "internalType": "address", "name": "_user", "type": "address" }],
        "name": "getUserReputation",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "getTotalSessions",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
      }
    ];
  }

  /**
   * Get session details from blockchain
   */
  async getSessionDetails(sessionId) {
    try {
      if (!this.contract) throw new Error('Contract not initialized');
      
      const details = await this.contract.getSessionDetails(sessionId);
      
      return {
        creator: details[0],
        title: details[1],
        description: details[2],
        startTime: Number(details[3]),
        endTime: Number(details[4]),
        totalVotes: Number(details[5]),
        closed: details[6],
        cancelled: details[7],
        optionCount: Number(details[8])
      };
    } catch (error) {
      this.logger.error(`Error fetching session ${sessionId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get session options (voting choices)
   */
  async getSessionOptions(sessionId) {
    try {
      if (!this.contract) throw new Error('Contract not initialized');
      return await this.contract.getSessionOptions(sessionId);
    } catch (error) {
      this.logger.error(`Error fetching options for session ${sessionId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get voting results for a session
   */
  async getResults(sessionId) {
    try {
      if (!this.contract) throw new Error('Contract not initialized');
      const results = await this.contract.getResults(sessionId);
      return results.map(r => Number(r));
    } catch (error) {
      this.logger.error(`Error fetching results for session ${sessionId}:`, error.message);
      throw error;
    }
  }

  /**
   * Check if user has voted in a session
   */
  async hasVoted(sessionId, voterAddress) {
    try {
      if (!this.contract) throw new Error('Contract not initialized');
      return await this.contract.hasVoted(sessionId, voterAddress);
    } catch (error) {
      this.logger.error(`Error checking vote status:`, error.message);
      throw error;
    }
  }

  /**
   * Get user's vote choice in a session
   */
  async getUserVote(sessionId, voterAddress) {
    try {
      if (!this.contract) throw new Error('Contract not initialized');
      const vote = await this.contract.getUserVote(sessionId, voterAddress);
      return Number(vote);
    } catch (error) {
      this.logger.error(`Error fetching user vote:`, error.message);
      throw error;
    }
  }

  /**
   * Get total votes cast in a session
   */
  async getTotalVotes(sessionId) {
    try {
      if (!this.contract) throw new Error('Contract not initialized');
      const total = await this.contract.getTotalVotes(sessionId);
      return Number(total);
    } catch (error) {
      this.logger.error(`Error fetching total votes:`, error.message);
      throw error;
    }
  }

  /**
   * Get vote history for a session
   */
  async getVoteHistory(sessionId) {
    try {
      if (!this.contract) throw new Error('Contract not initialized');
      const history = await this.contract.getVoteHistory(sessionId);
      return history.map(vote => ({
        sessionId: Number(vote.sessionId),
        voter: vote.voter,
        choice: Number(vote.choice),
        timestamp: Number(vote.timestamp),
        transactionHash: vote.transactionHash
      }));
    } catch (error) {
      this.logger.error(`Error fetching vote history:`, error.message);
      throw error;
    }
  }

  /**
   * Get user reputation score
   */
  async getUserReputation(userAddress) {
    try {
      if (!this.contract) throw new Error('Contract not initialized');
      const reputation = await this.contract.getUserReputation(userAddress);
      return Number(reputation);
    } catch (error) {
      this.logger.error(`Error fetching reputation:`, error.message);
      throw error;
    }
  }

  /**
   * Check if user is verified
   */
  async isUserVerified(userAddress) {
    try {
      if (!this.contract) throw new Error('Contract not initialized');
      return await this.contract.isUserVerified(userAddress);
    } catch (error) {
      this.logger.error(`Error checking verification:`, error.message);
      throw error;
    }
  }

  /**
   * Get total sessions count
   */
  async getTotalSessions() {
    try {
      if (!this.contract) throw new Error('Contract not initialized');
      const total = await this.contract.getTotalSessions();
      return Number(total);
    } catch (error) {
      this.logger.error(`Error fetching total sessions:`, error.message);
      throw error;
    }
  }

  /**
   * Get sessions created by a user
   */
  async getUserCreatedSessions(creatorAddress) {
    try {
      if (!this.contract) throw new Error('Contract not initialized');
      const sessions = await this.contract.getUserCreatedSessions(creatorAddress);
      return sessions.map(s => Number(s));
    } catch (error) {
      this.logger.error(`Error fetching user sessions:`, error.message);
      throw error;
    }
  }

  /**
   * Check if address is valid Ethereum address
   */
  isValidAddress(address) {
    return ethers.isAddress(address);
  }

  /**
   * Get current provider network info
   */
  async getNetworkInfo() {
    try {
      if (!this.provider) throw new Error('Provider not initialized');
      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();
      
      return {
        name: network.name,
        chainId: network.chainId,
        blockNumber
      };
    } catch (error) {
      this.logger.error('Error fetching network info:', error.message);
      throw error;
    }
  }
}

module.exports = Web3Service;
