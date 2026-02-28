const hre = require("hardhat");

async function main() {
  console.log("=== Secured Voting System - Smart Contract Deployment ===\n");

  try {
    // Get accounts
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contract with account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

    // Deploy SecuredVotingSystem contract
    console.log("\nDeploying SecuredVotingSystem contract...");
    const VotingSystemFactory = await hre.ethers.getContractFactory("SecuredVotingSystem");
    const votingSystem = await VotingSystemFactory.deploy();
    await votingSystem.waitForDeployment();

    const deployedAddress = await votingSystem.getAddress();
    console.log("✓ SecuredVotingSystem deployed to:", deployedAddress);

    // Verify contract owner
    const owner = await votingSystem.contractOwner();
    console.log("✓ Contract owner set to:", owner);

    // Get initial state
    const totalSessions = await votingSystem.getTotalSessions();
    console.log("✓ Initial session count:", totalSessions.toString());

    // Save deployment info
    const deploymentInfo = {
      network: hre.network.name,
      contractAddress: deployedAddress,
      deployerAddress: deployer.address,
      timestamp: new Date().toISOString(),
      contractName: "SecuredVotingSystem"
    };

    console.log("\n=== Deployment Summary ===");
    console.log(JSON.stringify(deploymentInfo, null, 2));

    // Log contract methods for quick reference
    console.log("\n=== Available Functions ===");
    console.log("Session Management:");
    console.log("  - createSession() - Create a new voting session");
    console.log("  - closeSession() - Close an active session");
    console.log("  - cancelSession() - Cancel a session");
    
    console.log("\nVoting Operations:");
    console.log("  - castVote() - Cast a vote");
    console.log("  - attemptDoubleVote() - Test double voting protection");
    
    console.log("\nView Functions:");
    console.log("  - getResults() - Get voting results");
    console.log("  - getSessionDetails() - Get session information");
    console.log("  - getSessionOptions() - Get available voting options");
    console.log("  - hasVoted() - Check if user has voted");
    console.log("  - getUserVote() - Get user's vote choice");
    console.log("  - getVoteHistory() - Get complete vote history");
    console.log("  - getTotalSessions() - Get total sessions count");
    
    console.log("\nUser Verification:");
    console.log("  - verifyUser() - Mark user as human-verified");
    console.log("  - isUserVerified() - Check verification status");
    console.log("  - getUserReputation() - Get user reputation score");

    return deploymentInfo;

  } catch (error) {
    console.error("Deployment failed:", error);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
