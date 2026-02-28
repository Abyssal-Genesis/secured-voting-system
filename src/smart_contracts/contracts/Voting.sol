// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title SecuredVotingSystem
 * @dev Decentralized voting system with enhanced security and transparency
 * @notice This contract manages secure voting sessions on the blockchain
 */
contract SecuredVotingSystem {
    
    // ============== Data Structures ==============
    
    struct VotingSession {
        uint256 id;
        address creator;
        string title;
        string description;
        string[] options;
        uint256 startTime;
        uint256 endTime;
        uint256 totalVotes;
        bool closed;
        bool cancelled;
        mapping(address => bool) voters;
        mapping(uint256 => uint256) voteCounts;
        mapping(address => uint256) voterChoices;
    }
    
    struct Vote {
        uint256 sessionId;
        address voter;
        uint256 choice;
        uint256 timestamp;
        bytes32 transactionHash;
    }
    
    struct SessionMetadata {
        string ipfsHash;
        uint256 requiredVerification;
        bool requiresHumanVerification;
        address[] verifiers;
    }
    
    // ============== State Variables ==============
    
    mapping(uint256 => VotingSession) public votingSessions;
    mapping(uint256 => Vote[]) public sessionVotes;
    mapping(address => uint256[]) public userSessions;
    mapping(uint256 => SessionMetadata) public sessionMetadata;
    
    uint256 public sessionCounter;
    address public contractOwner;
    
    mapping(address => bool) public verifiedUsers;
    mapping(address => uint256) public userReputation;
    
    // ============== Events ==============
    
    event SessionCreated(
        uint256 indexed sessionId,
        address indexed creator,
        string title,
        uint256 startTime,
        uint256 endTime,
        uint256 optionCount
    );
    
    event VoteCast(
        uint256 indexed sessionId,
        address indexed voter,
        uint256 indexed choice,
        uint256 timestamp
    );
    
    event SessionClosed(
        uint256 indexed sessionId,
        address indexed closer,
        uint256 totalVotes
    );
    
    event SessionCancelled(
        uint256 indexed sessionId,
        address indexed canceller,
        string reason
    );
    
    event UserVerified(
        address indexed user,
        uint256 timestamp
    );
    
    event VoterDoubleVoteAttempted(
        uint256 indexed sessionId,
        address indexed voter,
        uint256 timestamp
    );
    
    // ============== Modifiers ==============
    
    modifier onlyOwner() {
        require(msg.sender == contractOwner, "Only owner can call this");
        _;
    }
    
    modifier sessionExists(uint256 _sessionId) {
        require(_sessionId < sessionCounter && _sessionId >= 0, "Session does not exist");
        _;
    }
    
    modifier sessionActive(uint256 _sessionId) {
        VotingSession storage session = votingSessions[_sessionId];
        require(!session.closed && !session.cancelled, "Session is not active");
        require(block.timestamp >= session.startTime, "Session has not started");
        require(block.timestamp <= session.endTime, "Session has ended");
        _;
    }
    
    modifier hasNotVoted(uint256 _sessionId) {
        require(!votingSessions[_sessionId].voters[msg.sender], "Already voted");
        _;
    }
    
    modifier validChoice(uint256 _sessionId, uint256 _choice) {
        require(_choice < votingSessions[_sessionId].options.length, "Invalid choice");
        _;
    }
    
    modifier onlyCreator(uint256 _sessionId) {
        require(msg.sender == votingSessions[_sessionId].creator, "Only session creator");
        _;
    }
    
    // ============== Constructor ==============
    
    constructor() {
        contractOwner = msg.sender;
        sessionCounter = 0;
    }
    
    // ============== Session Management ==============
    
    /**
     * @dev Create a new voting session
     * @param _title Title of the voting session
     * @param _description Description of the voting
     * @param _options Array of voting options
     * @param _startTime When voting starts (Unix timestamp)
     * @param _endTime When voting ends (Unix timestamp)
     * @param _requiresHumanVerification Whether human verification is required
     * @return sessionId The ID of newly created session
     */
    function createSession(
        string memory _title,
        string memory _description,
        string[] memory _options,
        uint256 _startTime,
        uint256 _endTime,
        bool _requiresHumanVerification
    ) public returns (uint256) {
        require(_options.length >= 2, "Must have at least 2 options");
        require(_startTime > block.timestamp, "Start time must be in future");
        require(_endTime > _startTime, "End time must be after start time");
        require(bytes(_title).length > 0, "Title cannot be empty");
        
        uint256 sessionId = sessionCounter;
        VotingSession storage session = votingSessions[sessionId];
        
        session.id = sessionId;
        session.creator = msg.sender;
        session.title = _title;
        session.description = _description;
        session.options = _options;
        session.startTime = _startTime;
        session.endTime = _endTime;
        session.totalVotes = 0;
        session.closed = false;
        session.cancelled = false;
        
        sessionMetadata[sessionId].requiresHumanVerification = _requiresHumanVerification;
        
        userSessions[msg.sender].push(sessionId);
        sessionCounter++;
        
        emit SessionCreated(
            sessionId,
            msg.sender,
            _title,
            _startTime,
            _endTime,
            _options.length
        );
        
        return sessionId;
    }
    
    // ============== Voting Operations ==============
    
    /**
     * @dev Cast a vote in an active session
     * @param _sessionId The ID of the voting session
     * @param _choice The index of the chosen option
     */
    function castVote(uint256 _sessionId, uint256 _choice)
        public
        sessionExists(_sessionId)
        sessionActive(_sessionId)
        hasNotVoted(_sessionId)
        validChoice(_sessionId, _choice)
    {
        // Check human verification if required
        SessionMetadata memory metadata = sessionMetadata[_sessionId];
        if (metadata.requiresHumanVerification) {
            require(verifiedUsers[msg.sender], "Human verification required");
        }
        
        VotingSession storage session = votingSessions[_sessionId];
        
        // Record the vote
        session.voters[msg.sender] = true;
        session.voteCounts[_choice]++;
        session.voterChoices[msg.sender] = _choice;
        session.totalVotes++;
        
        // Store vote details
        Vote memory vote = Vote({
            sessionId: _sessionId,
            voter: msg.sender,
            choice: _choice,
            timestamp: block.timestamp,
            transactionHash: keccak256(abi.encode(_sessionId, msg.sender, block.timestamp))
        });
        
        sessionVotes[_sessionId].push(vote);
        
        // Increase user reputation
        userReputation[msg.sender] += 1;
        
        emit VoteCast(_sessionId, msg.sender, _choice, block.timestamp);
    }
    
    /**
     * @dev Attempt to vote twice - this will be caught and logged
     * @param _sessionId The voting session ID
     */
    function attemptDoubleVote(uint256 _sessionId) 
        public 
        sessionExists(_sessionId) 
    {
        if (votingSessions[_sessionId].voters[msg.sender]) {
            emit VoterDoubleVoteAttempted(_sessionId, msg.sender, block.timestamp);
            revert("Double voting attempted and blocked");
        }
    }
    
    // ============== View Functions ==============
    
    /**
     * @dev Get voting results for a session
     * @param _sessionId The voting session ID
     * @return Array of vote counts for each option
     */
    function getResults(uint256 _sessionId)
        public
        view
        sessionExists(_sessionId)
        returns (uint256[] memory)
    {
        VotingSession storage session = votingSessions[_sessionId];
        uint256[] memory results = new uint256[](session.options.length);
        
        for (uint256 i = 0; i < session.options.length; i++) {
            results[i] = session.voteCounts[i];
        }
        
        return results;
    }
    
    /**
     * @dev Get session details
     * @param _sessionId The voting session ID
     */
    function getSessionDetails(uint256 _sessionId)
        public
        view
        sessionExists(_sessionId)
        returns (
            address creator,
            string memory title,
            string memory description,
            uint256 startTime,
            uint256 endTime,
            uint256 totalVotes,
            bool closed,
            bool cancelled,
            uint256 optionCount
        )
    {
        VotingSession storage session = votingSessions[_sessionId];
        return (
            session.creator,
            session.title,
            session.description,
            session.startTime,
            session.endTime,
            session.totalVotes,
            session.closed,
            session.cancelled,
            session.options.length
        );
    }
    
    /**
     * @dev Get all options for a session
     * @param _sessionId The voting session ID
     */
    function getSessionOptions(uint256 _sessionId)
        public
        view
        sessionExists(_sessionId)
        returns (string[] memory)
    {
        return votingSessions[_sessionId].options;
    }
    
    /**
     * @dev Check if user has voted in a session
     * @param _sessionId The voting session ID
     * @param _voter Address of the voter to check
     */
    function hasVoted(uint256 _sessionId, address _voter)
        public
        view
        sessionExists(_sessionId)
        returns (bool)
    {
        return votingSessions[_sessionId].voters[_voter];
    }
    
    /**
     * @dev Get user's vote in a session
     * @param _sessionId The voting session ID
     * @param _voter Address of the voter
     */
    function getUserVote(uint256 _sessionId, address _voter)
        public
        view
        sessionExists(_sessionId)
        returns (uint256)
    {
        require(votingSessions[_sessionId].voters[_voter], "User has not voted");
        return votingSessions[_sessionId].voterChoices[_voter];
    }
    
    /**
     * @dev Get total votes for a session
     * @param _sessionId The voting session ID
     */
    function getTotalVotes(uint256 _sessionId)
        public
        view
        sessionExists(_sessionId)
        returns (uint256)
    {
        return votingSessions[_sessionId].totalVotes;
    }
    
    /**
     * @dev Get all sessions created by a user
     * @param _creator Address of the session creator
     */
    function getUserCreatedSessions(address _creator)
        public
        view
        returns (uint256[] memory)
    {
        return userSessions[_creator];
    }
    
    /**
     * @dev Get vote history for a session
     * @param _sessionId The voting session ID
     */
    function getVoteHistory(uint256 _sessionId)
        public
        view
        sessionExists(_sessionId)
        returns (Vote[] memory)
    {
        return sessionVotes[_sessionId];
    }
    
    // ============== Session Control ==============
    
    /**
     * @dev Close a voting session (only creator or owner)
     * @param _sessionId The voting session ID
     */
    function closeSession(uint256 _sessionId)
        public
        sessionExists(_sessionId)
        onlyCreator(_sessionId)
    {
        VotingSession storage session = votingSessions[_sessionId];
        require(!session.closed, "Session already closed");
        require(!session.cancelled, "Session is cancelled");
        
        session.closed = true;
        
        emit SessionClosed(_sessionId, msg.sender, session.totalVotes);
    }
    
    /**
     * @dev Cancel a voting session
     * @param _sessionId The voting session ID
     * @param _reason Reason for cancellation
     */
    function cancelSession(uint256 _sessionId, string memory _reason)
        public
        sessionExists(_sessionId)
        onlyCreator(_sessionId)
    {
        VotingSession storage session = votingSessions[_sessionId];
        require(!session.closed, "Cannot cancel closed session");
        require(!session.cancelled, "Session already cancelled");
        
        session.cancelled = true;
        
        emit SessionCancelled(_sessionId, msg.sender, _reason);
    }
    
    // ============== User Verification ==============
    
    /**
     * @dev Mark a user as human-verified (called by backend after verification)
     * @param _user Address to verify
     */
    function verifyUser(address _user) public onlyOwner {
        require(!verifiedUsers[_user], "User already verified");
        verifiedUsers[_user] = true;
        emit UserVerified(_user, block.timestamp);
    }
    
    /**
     * @dev Check if user is verified
     * @param _user Address to check
     */
    function isUserVerified(address _user) public view returns (bool) {
        return verifiedUsers[_user];
    }
    
    /**
     * @dev Get user reputation score
     * @param _user Address of the user
     */
    function getUserReputation(address _user) public view returns (uint256) {
        return userReputation[_user];
    }
    
    // ============== Admin Functions ==============
    
    /**
     * @dev Get total number of sessions created
     */
    function getTotalSessions() public view returns (uint256) {
        return sessionCounter;
    }
    
    /**
     * @dev Transfer ownership (emergency only)
     * @param _newOwner Address of new owner
     */
    function transferOwnership(address _newOwner) public onlyOwner {
        require(_newOwner != address(0), "Invalid address");
        contractOwner = _newOwner;
    }
    
    /**
     * @dev Get contract balance
     */
    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
