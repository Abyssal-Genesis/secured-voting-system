/**
 * Web3 Service - Frontend Ethereum Integration
 * Handles wallet connection, contract interaction via frontend
 */

import { ethers } from 'ethers';

const CONTRACT_ABI = [
  {
    inputs: [
      { internalType: 'string', name: '_title', type: 'string' },
      { internalType: 'string', name: '_description', type: 'string' },
      { internalType: 'string[]', name: '_options', type: 'string[]' },
      { internalType: 'uint256', name: '_startTime', type: 'uint256' },
      { internalType: 'uint256', name: '_endTime', type: 'uint256' },
      { internalType: 'bool', name: '_requiresHumanVerification', type: 'bool' }
    ],
    name: 'createSession',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_sessionId', type: 'uint256' },
      { internalType: 'uint256', name: '_choice', type: 'uint256' }
    ],
    name: 'castVote',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: '_sessionId', type: 'uint256' }],
    name: 'getResults',
    outputs: [{ internalType: 'uint256[]', name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: '_sessionId', type: 'uint256' }],
    name: 'getSessionDetails',
    outputs: [
      { internalType: 'address', name: '', type: 'address' },
      { internalType: 'string', name: '', type: 'string' },
      { internalType: 'string', name: '', type: 'string' },
      { internalType: 'uint256', name: '', type: 'uint256' },
      { internalType: 'uint256', name: '', type: 'uint256' },
      { internalType: 'uint256', name: '', type: 'uint256' },
      { internalType: 'bool', name: '', type: 'bool' },
      { internalType: 'bool', name: '', type: 'bool' },
      { internalType: 'uint256', name: '', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: '_sessionId', type: 'uint256' }],
    name: 'getSessionOptions',
    outputs: [{ internalType: 'string[]', name: '', type: 'string[]' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_sessionId', type: 'uint256' },
      { internalType: 'address', name: '_voter', type: 'address' }
    ],
    name: 'hasVoted',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: '_user', type: 'address' }],
    name: 'getUserReputation',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: '_user', type: 'address' }],
    name: 'isUserVerified',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getTotalSessions',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
];

class Web3Service {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.connectedAddress = null;
  }

  /**
   * Check if MetaMask is available
   */
  static isMetaMaskAvailable() {
    return typeof window !== 'undefined' && window.ethereum;
  }

  /**
   * Connect to MetaMask wallet
   */
  async connectWallet() {
    try {
      if (!Web3Service.isMetaMaskAvailable()) {
        throw new Error('MetaMask is not installed');
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts available');
      }

      this.connectedAddress = accounts[0];

      // Create ethers provider and signer
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();

      // Initialize contract
      const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
      if (contractAddress && ethers.isAddress(contractAddress)) {
        this.contract = new ethers.Contract(
          contractAddress,
          CONTRACT_ABI,
          this.signer
        );
      }

      console.log('Connected to wallet:', this.connectedAddress);
      return this.connectedAddress;
    } catch (error) {
      console.error('Wallet connection failed:', error);
      throw error;
    }
  }

  /**
   * Get connected wallet address
   */
  getConnectedAddress() {
    return this.connectedAddress;
  }

  /**
   * Check if wallet is connected
   */
  isConnected() {
    return this.connectedAddress !== null;
  }

  /**
   * Disconnect wallet
   */
  disconnectWallet() {
    this.connectedAddress = null;
    this.contract = null;
    this.signer = null;
  }

  /**
   * Get user reputation score
   */
  async getUserReputation(address) {
    try {
      if (!this.contract) throw new Error('Contract not initialized');
      const reputation = await this.contract.getUserReputation(address);
      return Number(reputation);
    } catch (error) {
      console.error('Error fetching reputation:', error);
      return 0;
    }
  }

  /**
   * Check if user is verified
   */
  async isUserVerified(address) {
    try {
      if (!this.contract) throw new Error('Contract not initialized');
      return await this.contract.isUserVerified(address);
    } catch (error) {
      console.error('Error checking verification:', error);
      return false;
    }
  }

  /**
   * Get session details
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
      console.error('Error fetching session details:', error);
      throw error;
    }
  }

  /**
   * Get session options/choices
   */
  async getSessionOptions(sessionId) {
    try {
      if (!this.contract) throw new Error('Contract not initialized');
      return await this.contract.getSessionOptions(sessionId);
    } catch (error) {
      console.error('Error fetching options:', error);
      throw error;
    }
  }

  /**
   * Get voting results
   */
  async getResults(sessionId) {
    try {
      if (!this.contract) throw new Error('Contract not initialized');
      const results = await this.contract.getResults(sessionId);
      return results.map(r => Number(r));
    } catch (error) {
      console.error('Error fetching results:', error);
      throw error;
    }
  }

  /**
   * Check if user has voted
   */
  async hasVoted(sessionId, voterAddress) {
    try {
      if (!this.contract) throw new Error('Contract not initialized');
      return await this.contract.hasVoted(sessionId, voterAddress);
    } catch (error) {
      console.error('Error checking vote status:', error);
      return false;
    }
  }

  /**
   * Cast a vote
   */
  async castVote(sessionId, choice) {
    try {
      if (!this.contract) throw new Error('Contract not initialized');
      if (!this.signer) throw new Error('Signer not initialized');

      const tx = await this.contract.castVote(sessionId, choice);
      const receipt = await tx.wait();

      console.log('Vote cast successfully:', receipt.hash);
      return receipt;
    } catch (error) {
      console.error('Error casting vote:', error);
      throw error;
    }
  }

  /**
   * Get total number of sessions
   */
  async getTotalSessions() {
    try {
      if (!this.contract) throw new Error('Contract not initialized');
      const total = await this.contract.getTotalSessions();
      return Number(total);
    } catch (error) {
      console.error('Error fetching total sessions:', error);
      return 0;
    }
  }

  /**
   * Get current network
   */
  async getNetwork() {
    try {
      const network = await this.provider.getNetwork();
      return {
        name: network.name,
        chainId: network.chainId
      };
    } catch (error) {
      console.error('Error fetching network:', error);
      throw error;
    }
  }

  /**
   * Switch to a specific network
   */
  async switchNetwork(chainId) {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: ethers.toBeHex(chainId) }]
      });
    } catch (error) {
      console.error('Error switching network:', error);
      throw error;
    }
  }

  /**
   * Format address for display
   */
  static formatAddress(address, length = 6) {
    if (!address) return '';
    return `${address.substring(0, length)}...${address.substring(address.length - 4)}`;
  }

  /**
   * Validate Ethereum address
   */
  static isValidAddress(address) {
    return ethers.isAddress(address);
  }
}

// Export singleton instance
export default new Web3Service();
