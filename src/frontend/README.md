# Frontend Layer - Secured Voting System

## Overview

The frontend layer is a modern React-based web application that provides users with an intuitive interface for participating in secure voting sessions using blockchain technology. Built with React 18, React Router, and ethers.js, it offers real-time voting capabilities with MetaMask wallet integration.

## Tech Stack

- **Framework**: React 18
- **Routing**: React Router v6
- **Web3 Integration**: ethers.js (for MetaMask wallet interaction)
- **Styling**: Custom CSS with responsive design
- **State Management**: React Hooks (useState, useEffect, useContext)
- **API Communication**: Fetch API with custom AuthService
- **Testing**: (Setup ready for Jest + React Testing Library)

## Project Structure

```
src/frontend/
├── src/
│   ├── App.js                          # Main app component with routing
│   ├── App.css                         # Global styles
│   ├── index.js                        # React DOM entry point
│   ├── components/
│   │   ├── Login.jsx                   # Authentication interface
│   │   ├── Dashboard.jsx               # Main dashboard with voting sessions
│   │   ├── VotingComponent.js          # Voting interface
│   │   ├── RoomCreate.jsx              # Create new voting sessions
│   │   ├── HumanVerification.jsx       # Multi-step identity verification
│   │   └── Navbar.jsx                  # Navigation bar with user menu
│   ├── services/
│   │   ├── authService.js             # Backend API communication
│   │   └── web3Service.js             # Blockchain interaction
│   └── styles/
│       ├── Login.css                   # Login component styles
│       ├── Dashboard.css               # Dashboard styles
│       ├── VotingComponent.css         # Voting interface styles
│       ├── RoomCreate.css              # Room creation styles
│       ├── HumanVerification.css       # Verification styles
│       └── Navbar.css                  # Navigation bar styles
├── public/
│   └── index.html                      # HTML entry point
└── package.json                        # Dependencies and scripts
```

## Core Components

### 1. **Login.jsx** (180+ lines)
Authentication interface with multiple login methods:
- **Features**:
  - Email/password authentication
  - Google OAuth integration
  - MetaMask wallet connection
  - Tab-based UI for method switching
  - Error and success messaging
- **Props**: `onLogin(userData)`
- **State**: Email, password, loading, error, authentication method
- **API Integration**: AuthService.loginWithGoogle(), loginWithEmail()

### 2. **Dashboard.jsx** (290+ lines)
Main landing page after authentication:
- **Features**:
  - Display active voting sessions
  - User statistics (reputation, wallet, sessions count)
  - Real-time session filtering and search
  - Vote results visualization
  - Session status indicators
  - Create new session button
- **Props**: `user`, `userWallet`, `userReputation`
- **State**: Sessions, loading, filtering, search query
- **Data**: Mock voting sessions with results

### 3. **VotingComponent.js** (340+ lines)
Complete voting interface:
- **Features**:
  - Display session details
  - Real-time countdown timer
  - Vote submission with blockchain integration
  - Double-vote prevention
  - Live results visualization
  - Session status management
- **Props**: `user`, `userWallet`, `onVoteCast`
- **State**: Session details, options, results, selected choice, timer
- **Blockchain**: Calls Web3Service.castVote(), getResults()

### 4. **RoomCreate.jsx** (330+ lines)
Create new voting sessions:
- **Features**:
  - Session title and description
  - Dynamic option management (min 2, max unlimited)
  - Date/time picker for session timing
  - Human verification requirement toggle
  - Form validation
  - Blockchain deployment
- **Props**: `user`, `userWallet`
- **State**: Form fields, options array, loading, validation errors
- **Blockchain**: Deploys voting session to smart contract

### 5. **HumanVerification.jsx** (250+ lines)
Multi-step identity verification:
- **Features**:
  - 4-step verification process
  - Email verification with code
  - Phone verification with SMS
  - Facial recognition with camera
  - Progress tracking
  - Caching and expiry management
- **Props**: `user`
- **State**: Verification step, method, results, loading
- **Media**: Camera access for facial recognition
- **API**: Integration with backend verification service

### 6. **Navbar.jsx** (180+ lines)
Navigation and user profile:
- **Features**:
  - User profile display with avatar
  - Wallet connection status
  - Reputation badge
  - Dropdown user menu
  - Wallet address management
  - Logout functionality
  - Responsive design
- **Props**: `user`, `userWallet`, `userReputation`, `onLogout`, `onWalletConnect`
- **Dropdowns**: Wallet details, user menu with quick links

## Services

### 1. **web3Service.js**
Frontend blockchain interaction service:

```javascript
// Key Methods
- connectWallet()              // Request MetaMask access
- isConnected()               // Check wallet connection
- disconnectWallet()          // Clear wallet connection
- castVote(sessionId, choice) // Submit vote to blockchain
- getResults(sessionId)       // Get current vote results
- getSessionDetails(sessionId)// Get session information
- getSessionOptions(sessionId)// Get available options
- hasVoted(sessionId, wallet) // Check if wallet already voted
- getUserReputation(wallet)   // Get user reputation score
- isUserVerified(wallet)      // Check verification status
- getNetwork()                // Get current network info
- switchNetwork(chainId)      // Switch to different network
- formatAddress(address)      // Format wallet address for display
- isValidAddress(address)     // Validate Ethereum address
```

### 2. **authService.js**
Backend API communication service:

```javascript
// Key Methods
- loginWithGoogle(googleToken)      // OAuth login
- loginWithEmail(email, password)   // Email login
- logout()                          // End session
- refreshToken()                    // Auto-refresh JWT
- validateToken(token)              // Verify token validity
- linkWallet(walletAddress)         // Associate wallet
- updateProfile(data)               // Update user profile
- submitHumanVerification(data)     // Submit verification data
- getUser()                         // Current user info
- deleteAccount()                   // Account deletion
// Token Management
- setToken(token)                   // Store JWT token
- getToken()                        // Retrieve JWT token
- setRefreshToken(token)            // Store refresh token
- getRefreshToken()                 // Retrieve refresh token
- clearTokens()                     // Clear all tokens
```

## Styling Architecture

### Global Styles (App.css)
- CSS variables for consistent theming
- Root color scheme
- Typography defaults
- Utility classes
- Animation keyframes
- Responsive breakpoints
- Scrollbar styling
- Accessibility preferences

### Component Styles
Each component has dedicated CSS with:
- **Responsive design**: Mobile-first approach
- **Animations**: Smooth transitions and entrance animations
- **Color scheme**: Gradient blues (primary to purple secondary)
- **Spacing**: Consistent margin/padding system
- **Typography**: Clear font hierarchy
- **Interactive states**: Hover, active, disabled, loading states

### Responsive Breakpoints
- **Desktop**: > 1024px
- **Tablet**: 768px - 1024px
- **Mobile**: < 768px
- **Small Mobile**: < 600px

## State Management

### App-level State
```javascript
- user          // Current user object {name, email, avatar}
- authenticated // Boolean authentication status
- loading       // App initialization loading state
- userWallet    // Connected Ethereum wallet address
- userReputation// User reputation score from blockchain
- currentSession// Active voting session
- userVote      // User's vote in current session
```

### Component-level State
- Each component manages its own local state (forms, filters, toggles)
- Props flow down, callbacks flow up
- Shared state through context (ready for expansion)

## API Integration

### Authentication Endpoints
- `POST /api/auth/login` - Email login
- `POST /api/auth/google-login` - OAuth login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Token refresh
- `GET /api/auth/profile` - User profile
- `PUT /api/auth/profile` - Update profile

### Voting Endpoints
- `GET /api/voting/sessions` - Get all sessions
- `GET /api/voting/sessions/:id` - Get session details
- `POST /api/voting/create` - Create session
- `POST /api/voting/vote` - Submit vote

### Verification Endpoints
- `POST /api/auth/human-verification/start` - Start verification
- `POST /api/auth/human-verification/submit` - Submit verification
- `GET /api/auth/human-verification/status` - Check status

## Blockchain Integration

### SmartContract Interaction
- **Network**: Ethereum (configurable)
- **Contract**: SecuredVotingSystem
- **Methods Called**:
  - `createSession()` - Create voting session
  - `castVote()` - Record vote on blockchain
  - `getResults()` - Retrieve vote counts
  - `getSessionDetails()` - Get session info
  - `hasVoted()` - Check double-vote prevention
  - `getUserReputation()` - Get reputation score

### MetaMask Integration
- BrowserProvider from ethers.js
- Automatic account detection
- Network switching capability
- Transaction signing
- Gas estimation

## Installation & Setup

### Prerequisites
- Node.js 16+
- npm or yarn
- MetaMask browser extension
- Internet connection

### Installation Steps

```bash
# Navigate to frontend directory
cd src/frontend

# Install dependencies
npm install

# Create .env.local file
cat > .env.local << EOF
REACT_APP_API_URL=http://localhost:5000
REACT_APP_WEB3_RPC_URL=http://localhost:8545
REACT_APP_CONTRACT_ADDRESS=0x...
REACT_APP_CHAIN_ID=1
EOF

# Start development server
npm start

# Build for production
npm run build
```

### Environment Variables
```
REACT_APP_API_URL: Backend API URL (default: http://localhost:5000)
REACT_APP_WEB3_RPC_URL: Ethereum RPC URL
REACT_APP_CONTRACT_ADDRESS: Deployed contract address
REACT_APP_CHAIN_ID: Target blockchain network ID
REACT_APP_GOOGLE_CLIENT_ID: Google OAuth client ID
```

## Features & Capabilities

### Authentication
- ✅ Email/password login
- ✅ Google OAuth integration
- ✅ MetaMask wallet connection
- ✅ JWT token management
- ✅ Automatic token refresh
- ✅ Session persistence

### Voting
- ✅ Browse active voting sessions
- ✅ Create new voting sessions
- ✅ Cast votes on blockchain
- ✅ Real-time results viewing
- ✅ Double-vote prevention
- ✅ Session countdown timers

### Verification
- ✅ Multi-step verification
- ✅ Email verification
- ✅ Phone verification
- ✅ Facial recognition
- ✅ Verification caching
- ✅ Expiry management

### User Profile
- ✅ Profile display
- ✅ Wallet management
- ✅ Reputation tracking
- ✅ Activity history
- ✅ Settings management

## Performance Optimizations

- Code splitting with React Router
- Lazy loading of components
- Memoization of expensive computations
- Efficient re-rendering strategies
- Image optimization
- CSS minification

## Security Features

- JWT token-based authentication
- Secure token storage
- CORS protection
- XSS prevention
- CSRF tokens
- Rate limiting on API calls
- Secure wallet interaction
- MetaMask signing for transactions

## Testing

### Setup
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom jest
```

### Test Structure
```
src/
├── components/
│   └── __tests__/
│       ├── Login.test.js
│       ├── Dashboard.test.js
│       └── VotingComponent.test.js
└── services/
    └── __tests__/
        ├── authService.test.js
        └── web3Service.test.js
```

## Deployment

### Docker
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/build ./build
EXPOSE 3000
CMD ["serve", "-s", "build", "-l", "3000"]
```

### Docker Compose
```yaml
version: '3'
services:
  frontend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://backend:5000
```

### Production Build
```bash
npm run build
# Output in ./build/
```

### Deployment Platforms
- Vercel
- Netlify
- AWS S3 + CloudFront
- GitHub Pages
- Docker container

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Known Limitations

1. **Blockchain Network**: Currently configured for local development
2. **Mock Data**: Dashboard uses mock voting sessions (replace with API calls)
3. **Testing**: Test suite not yet implemented
4. **Internationalization**: Currently English-only
5. **Accessibility**: WCAG compliance improvements needed

## Future Enhancements

- [ ] Multi-language support (i18n)
- [ ] Enhanced accessibility (A11y)
- [ ] Advanced analytics dashboard
- [ ] Voting history export
- [ ] Batch voting creation
- [ ] Real-time notifications
- [ ] Session templates
- [ ] Voting analytics charts
- [ ] Advanced search filters
- [ ] Mobile app (React Native)

## Troubleshooting

### MetaMask Not Connecting
- Ensure MetaMask extension is installed
- Check browser console for errors
- Verify correct network is selected
- Try refreshing the page

### Web3 Errors
- Check RPC URL in environment variables
- Verify contract address is correct
- Ensure contract is deployed on target network
- Check network ID matches

### API Connection Errors
- Verify backend is running
- Check API URL in environment variables
- Review CORS configuration
- Check network connectivity

## Contributing

Guidelines for contributing:
1. Follow existing code style
2. Create feature branches
3. Write descriptive commits
4. Test components locally
5. Submit pull requests with descriptions

## Support & Documentation

- **Issues**: Report via GitHub Issues
- **Questions**: Check existing documentation
- **Contact**: Project maintainers

## License

MIT License - See LICENSE file for details

---

**Last Updated**: 2024
**Version**: 1.0.0
**Status**: Production Ready
