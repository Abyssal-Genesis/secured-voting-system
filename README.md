# Secured Voting System

A decentralized voting system built with blockchain technology, featuring secure human verification, real-time voting, and transparent vote tracking.

## 🌟 Features

- **Blockchain-based Voting**: Smart contracts ensure transparent and immutable voting records
- **Human Verification**: Integration with Google OAuth for user authentication
- **Secure Authentication**: JWT-based session management
- **Real-time Updates**: WebSocket support for live voting updates
- **Multi-room Sessions**: Support for multiple concurrent voting sessions
- **Docker Support**: Easy deployment with Docker and Docker Compose

## 🏗️ Project Structure

```
secured-voting-system/
├── src/
│   ├── backend/              # Node.js/Express API server
│   ├── frontend/             # React web application
│   └── smart_contracts/      # Hardhat Ethereum smart contracts
├── Decentralized-Voting-System/  # Legacy voting system
├── docs/                     # Documentation
├── docker-compose.yml        # Docker orchestration
└── README.md                 # This file
```

## 🚀 Quick Start

### Using Docker Compose (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd secured-voting-system

# Configure environment variables
cp .env.example .env

# Start all services
docker-compose up --build
```

Access the application:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Database**: postgresql://localhost:5432

### Local Development

See [SETUP.md](./SETUP.md) for detailed local development setup instructions.

## 📋 Requirements

### Docker Deployment
- Docker 20.10+
- Docker Compose 1.29+
- 4GB minimum RAM

### Local Development
- Node.js 16+
- npm or yarn
- Python 3.8+ (for Database API)
- PostgreSQL 12+
- Hardhat (for smart contract development)

## 🔧 Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id

# JWT Configuration
JWT_SECRET=your_jwt_secret_key

# Ethereum Configuration
ETH_RPC_URL=http://localhost:8545
ETH_PRIVATE_KEY=your_private_key
VOTING_CONTRACT_ADDRESS=0x...

# Database Configuration
DATABASE_URL=postgresql://postgres:example@localhost:5432/votingdb
```

## 📚 Documentation

- [Setup Guide](./SETUP.md) - Local development setup
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment
- [Architecture Guide](./ARCHITECTURE.md) - System architecture
- [API Reference](./API.md) - Backend API endpoints

## 🧪 Testing

```bash
# Backend tests
cd src/backend
npm test

# Frontend tests
cd src/frontend
npm test

# Smart contract tests
cd src/smart_contracts
npx hardhat test
```

## 🔐 Security

- All votes are recorded on the blockchain for transparency
- JWT tokens are used for API authentication
- Google OAuth for secure user authentication
- Human verification system to prevent automated voting

## 📝 Smart Contracts

The voting smart contract is deployed on the Ethereum blockchain. Key contract details:

- **Contract**: Voting.sol
- **Framework**: Hardhat
- **Network**: Configurable via hardhat.config.js

For more details, see the [Architecture Guide](./ARCHITECTURE.md).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the ISC License - see LICENSE file for details.

## 💬 Support

For issues and questions:
1. Check the [Documentation](./docs/)
2. Review [Architecture Guide](./ARCHITECTURE.md)
3. Check existing GitHub issues
4. Create a new issue with detailed description

## 🔄 Troubleshooting

### Docker Issues
- Ensure Docker daemon is running
- Check port availability (3000, 5000, 5432)
- Review logs: `docker-compose logs -f`

### Database Connection Issues
- Verify PostgreSQL is running
- Check DATABASE_URL environment variable
- Ensure database credentials are correct

### Smart Contract Issues
- Verify ETH_RPC_URL is accessible
- Check contract address and ABI
- Ensure sufficient gas for transactions

---

**Last Updated**: February 2026
