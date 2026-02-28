const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SecuredVotingSystem Contract Tests", function () {
  let votingSystem;
  let owner;
  let addr1;
  let addr2;
  let addr3;
  let addrs;

  beforeEach(async function () {
    // Get signers
    [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();

    // Deploy contract
    const VotingSystemFactory = await ethers.getContractFactory("SecuredVotingSystem");
    votingSystem = await VotingSystemFactory.deploy();
    await votingSystem.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const contractOwner = await votingSystem.contractOwner();
      expect(contractOwner).to.equal(owner.address);
    });

    it("Should initialize session counter to 0", async function () {
      const totalSessions = await votingSystem.getTotalSessions();
      expect(totalSessions).to.equal(0);
    });

    it("Should have correct contract balance", async function () {
      const balance = await votingSystem.getContractBalance();
      expect(balance).to.equal(0);
    });
  });

  describe("Session Creation", function () {
    it("Should create a voting session successfully", async function () {
      const title = "Test Voting Session";
      const description = "This is a test";
      const options = ["Option A", "Option B", "Option C"];
      const now = Math.floor(Date.now() / 1000);
      const startTime = now + 3600; // 1 hour from now
      const endTime = now + 7200; // 2 hours from now

      const tx = await votingSystem.createSession(
        title,
        description,
        options,
        startTime,
        endTime,
        false
      );

      await tx.wait();

      const totalSessions = await votingSystem.getTotalSessions();
      expect(totalSessions).to.equal(1);
    });

    it("Should emit SessionCreated event", async function () {
      const title = "Test Session";
      const description = "Test";
      const options = ["Yes", "No"];
      const now = Math.floor(Date.now() / 1000);
      const startTime = now + 3600;
      const endTime = now + 7200;

      await expect(
        votingSystem.createSession(title, description, options, startTime, endTime, false)
      ).to.emit(votingSystem, "SessionCreated");
    });

    it("Should fail if options < 2", async function () {
      const now = Math.floor(Date.now() / 1000);
      const startTime = now + 3600;
      const endTime = now + 7200;

      await expect(
        votingSystem.createSession("Test", "Test", ["Only One Option"], startTime, endTime, false)
      ).to.be.revertedWith("Must have at least 2 options");
    });

    it("Should fail if start time is not in future", async function () {
      const now = Math.floor(Date.now() / 1000);
      const pastTime = now - 3600;
      const endTime = now + 3600;

      await expect(
        votingSystem.createSession(
          "Test",
          "Test",
          ["A", "B"],
          pastTime,
          endTime,
          false
        )
      ).to.be.revertedWith("Start time must be in future");
    });

    it("Should fail if end time <= start time", async function () {
      const now = Math.floor(Date.now() / 1000);
      const startTime = now + 3600;
      const endTime = startTime; // Same as start time

      await expect(
        votingSystem.createSession(
          "Test",
          "Test",
          ["A", "B"],
          startTime,
          endTime,
          false
        )
      ).to.be.revertedWith("End time must be after start time");
    });
  });

  describe("Session Details", function () {
    let sessionId = 0;

    beforeEach(async function () {
      const now = Math.floor(Date.now() / 1000);
      const startTime = now + 3600;
      const endTime = now + 7200;

      await votingSystem.createSession(
        "Test Session",
        "A test voting session",
        ["Option 1", "Option 2", "Option 3"],
        startTime,
        endTime,
        false
      );
      sessionId = 0;
    });

    it("Should retrieve session details correctly", async function () {
      const details = await votingSystem.getSessionDetails(sessionId);
      expect(details.creator).to.equal(owner.address);
      expect(details.title).to.equal("Test Session");
      expect(details.description).to.equal("A test voting session");
      expect(details.closed).to.equal(false);
      expect(details.cancelled).to.equal(false);
      expect(details.optionCount).to.equal(3);
    });

    it("Should retrieve session options correctly", async function () {
      const options = await votingSystem.getSessionOptions(sessionId);
      expect(options.length).to.equal(3);
      expect(options[0]).to.equal("Option 1");
      expect(options[1]).to.equal("Option 2");
      expect(options[2]).to.equal("Option 3");
    });

    it("Should return empty user sessions initially", async function () {
      const sessions = await votingSystem.getUserCreatedSessions(addr1.address);
      expect(sessions.length).to.equal(0);
    });

    it("Should return user created sessions", async function () {
      const sessions = await votingSystem.getUserCreatedSessions(owner.address);
      expect(sessions.length).to.equal(1);
      expect(sessions[0]).to.equal(sessionId);
    });
  });

  describe("Voting and Vote Recording", function () {
    let sessionId = 0;

    beforeEach(async function () {
      const now = Math.floor(Date.now() / 1000);
      const startTime = now - 100; // Already started
      const endTime = now + 7200; // Still running

      await votingSystem.createSession(
        "Active Voting Session",
        "Test voting",
        ["Yes", "No", "Abstain"],
        startTime,
        endTime,
        false
      );
      sessionId = 0;
    });

    it("Should allow voting during active session", async function () {
      await expect(
        votingSystem.connect(addr1).castVote(sessionId, 0)
      ).to.emit(votingSystem, "VoteCast");
    });

    it("Should prevent double voting", async function () {
      await votingSystem.connect(addr1).castVote(sessionId, 0);

      await expect(
        votingSystem.connect(addr1).castVote(sessionId, 1)
      ).to.be.revertedWith("Already voted");
    });

    it("Should prevent invalid choice", async function () {
      await expect(
        votingSystem.connect(addr1).castVote(sessionId, 999)
      ).to.be.revertedWith("Invalid choice");
    });

    it("Should track votes correctly", async function () {
      await votingSystem.connect(addr1).castVote(sessionId, 0);
      await votingSystem.connect(addr2).castVote(sessionId, 0);
      await votingSystem.connect(addr3).castVote(sessionId, 1);

      const results = await votingSystem.getResults(sessionId);
      expect(results[0]).to.equal(2);
      expect(results[1]).to.equal(1);
      expect(results[2]).to.equal(0);
    });

    it("Should return hasVoted correctly", async function () {
      expect(await votingSystem.hasVoted(sessionId, addr1.address)).to.equal(false);

      await votingSystem.connect(addr1).castVote(sessionId, 0);

      expect(await votingSystem.hasVoted(sessionId, addr1.address)).to.equal(true);
    });

    it("Should return user vote correctly", async function () {
      await votingSystem.connect(addr1).castVote(sessionId, 2);

      const userVote = await votingSystem.getUserVote(sessionId, addr1.address);
      expect(userVote).to.equal(2);
    });

    it("Should get total votes", async function () {
      await votingSystem.connect(addr1).castVote(sessionId, 0);
      await votingSystem.connect(addr2).castVote(sessionId, 1);

      const totalVotes = await votingSystem.getTotalVotes(sessionId);
      expect(totalVotes).to.equal(2);
    });

    it("Should get vote history", async function () {
      await votingSystem.connect(addr1).castVote(sessionId, 0);
      await votingSystem.connect(addr2).castVote(sessionId, 1);

      const history = await votingSystem.getVoteHistory(sessionId);
      expect(history.length).to.equal(2);
    });
  });

  describe("Session Control", function () {
    let sessionId = 0;

    beforeEach(async function () {
      const now = Math.floor(Date.now() / 1000);
      const startTime = now - 100;
      const endTime = now + 7200;

      await votingSystem.createSession(
        "Session for Control",
        "Test",
        ["A", "B"],
        startTime,
        endTime,
        false
      );
      sessionId = 0;
    });

    it("Should close a session", async function () {
      await expect(votingSystem.closeSession(sessionId))
        .to.emit(votingSystem, "SessionClosed");

      const details = await votingSystem.getSessionDetails(sessionId);
      expect(details.closed).to.equal(true);
    });

    it("Should prevent non-creator from closing session", async function () {
      await expect(
        votingSystem.connect(addr1).closeSession(sessionId)
      ).to.be.revertedWith("Only session creator");
    });

    it("Should cancel a session", async function () {
      await expect(votingSystem.cancelSession(sessionId, "Test cancellation"))
        .to.emit(votingSystem, "SessionCancelled");

      const details = await votingSystem.getSessionDetails(sessionId);
      expect(details.cancelled).to.equal(true);
    });

    it("Should prevent voting in closed session", async function () {
      await votingSystem.closeSession(sessionId);

      await expect(
        votingSystem.connect(addr1).castVote(sessionId, 0)
      ).to.be.revertedWith("Session is not active");
    });

    it("Should prevent voting in cancelled session", async function () {
      await votingSystem.cancelSession(sessionId, "Testing");

      await expect(
        votingSystem.connect(addr1).castVote(sessionId, 0)
      ).to.be.revertedWith("Session is not active");
    });
  });

  describe("User Verification", function () {
    it("Should verify a user", async function () {
      await expect(votingSystem.verifyUser(addr1.address))
        .to.emit(votingSystem, "UserVerified");

      expect(await votingSystem.isUserVerified(addr1.address)).to.equal(true);
    });

    it("Should prevent non-owner from verifying", async function () {
      await expect(
        votingSystem.connect(addr1).verifyUser(addr2.address)
      ).to.be.revertedWith("Only owner can call this");
    });

    it("Should prevent double verification", async function () {
      await votingSystem.verifyUser(addr1.address);

      await expect(
        votingSystem.verifyUser(addr1.address)
      ).to.be.revertedWith("User already verified");
    });

    it("Should enforce verification requirement", async function () {
      const now = Math.floor(Date.now() / 1000);
      const startTime = now - 100;
      const endTime = now + 7200;

      await votingSystem.createSession(
        "Verified Only",
        "Test",
        ["A", "B"],
        startTime,
        endTime,
        true // Requires verification
      );

      // Unverified user cannot vote
      await expect(
        votingSystem.connect(addr1).castVote(0, 0)
      ).to.be.revertedWith("Human verification required");

      // Verified user can vote
      await votingSystem.verifyUser(addr1.address);
      await expect(
        votingSystem.connect(addr1).castVote(0, 0)
      ).not.to.be.reverted;
    });
  });

  describe("User Reputation", function () {
    let sessionId = 0;

    beforeEach(async function () {
      const now = Math.floor(Date.now() / 1000);
      const startTime = now - 100;
      const endTime = now + 7200;

      await votingSystem.createSession(
        "Reputation Test",
        "Test",
        ["A", "B"],
        startTime,
        endTime,
        false
      );
      sessionId = 0;
    });

    it("Should increase reputation on voting", async function () {
      const reputationBefore = await votingSystem.getUserReputation(addr1.address);
      expect(reputationBefore).to.equal(0);

      await votingSystem.connect(addr1).castVote(sessionId, 0);

      const reputationAfter = await votingSystem.getUserReputation(addr1.address);
      expect(reputationAfter).to.equal(1);
    });

    it("Should accumulate reputation", async function () {
      const now = Math.floor(Date.now() / 1000);
      const startTime = now - 100;
      const endTime = now + 7200;

      // Create multiple sessions
      for (let i = 0; i < 3; i++) {
        await votingSystem.createSession(
          `Session ${i}`,
          "Test",
          ["A", "B"],
          startTime,
          endTime,
          false
        );
      }

      // Vote in each session
      await votingSystem.connect(addr1).castVote(0, 0);
      await votingSystem.connect(addr1).castVote(1, 0);
      await votingSystem.connect(addr1).castVote(2, 0);

      const reputation = await votingSystem.getUserReputation(addr1.address);
      expect(reputation).to.equal(3);
    });
  });

  describe("Double Vote Protection", function () {
    let sessionId = 0;

    beforeEach(async function () {
      const now = Math.floor(Date.now() / 1000);
      const startTime = now - 100;
      const endTime = now + 7200;

      await votingSystem.createSession(
        "Double Vote Test",
        "Test",
        ["A", "B"],
        startTime,
        endTime,
        false
      );
      sessionId = 0;
    });

    it("Should detect attempted double voting", async function () {
      await votingSystem.connect(addr1).castVote(sessionId, 0);

      await expect(
        votingSystem.connect(addr1).attemptDoubleVote(sessionId)
      ).to.be.revertedWith("Double voting attempted and blocked");
    });

    it("Should emit VoterDoubleVoteAttempted event", async function () {
      await votingSystem.connect(addr1).castVote(sessionId, 0);

      await expect(
        votingSystem.connect(addr1).attemptDoubleVote(sessionId)
      ).to.emit(votingSystem, "VoterDoubleVoteAttempted");
    });
  });

  describe("Admin Functions", function () {
    it("Should transfer ownership", async function () {
      await votingSystem.transferOwnership(addr1.address);

      const newOwner = await votingSystem.contractOwner();
      expect(newOwner).to.equal(addr1.address);
    });

    it("Should prevent non-owner from transferring ownership", async function () {
      await expect(
        votingSystem.connect(addr1).transferOwnership(addr2.address)
      ).to.be.revertedWith("Only owner can call this");
    });

    it("Should prevent invalid address transfer", async function () {
      await expect(
        votingSystem.transferOwnership(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid address");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle session not found", async function () {
      await expect(
        votingSystem.getSessionDetails(999)
      ).to.be.revertedWith("Session does not exist");
    });

    it("Should handle non-existent voting check", async function () {
      const now = Math.floor(Date.now() / 1000);
      await votingSystem.createSession(
        "Test",
        "Test",
        ["A", "B"],
        now + 3600,
        now + 7200,
        false
      );

      const hasVoted = await votingSystem.hasVoted(0, addr1.address);
      expect(hasVoted).to.equal(false);
    });

    it("Should handle empty vote history", async function () {
      const now = Math.floor(Date.now() / 1000);
      await votingSystem.createSession(
        "Test",
        "Test",
        ["A", "B"],
        now + 3600,
        now + 7200,
        false
      );

      const history = await votingSystem.getVoteHistory(0);
      expect(history.length).to.equal(0);
    });
  });
});
