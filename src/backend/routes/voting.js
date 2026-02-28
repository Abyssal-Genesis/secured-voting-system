const express = require("express");
const router = express.Router();
const {
  authenticateJWT,
  requireHumanVerification,
  rateLimit,
  validateInput
} = require("../middleware/auth");

// ============== Mock Database ==============
const sessions = new Map();
let sessionIdCounter = 0;

// ============== Helper Functions ==============

function generateSessionId() {
  return sessionIdCounter++;
}

// ============== Voting Routes ==============

/**
 * POST /api/voting/sessions
 * Create a new voting session
 */
router.post(
  "/sessions",
  authenticateJWT,
  rateLimit(10),
  validateInput([
    "title",
    "description",
    "options",
    "startTime",
    "endTime",
    "requiresHumanVerification"
  ]),
  async (req, res) => {
    try {
      const {
        title,
        description,
        options,
        startTime,
        endTime,
        requiresHumanVerification
      } = req.body;
      const creatorId = req.user.id;

      // Validation
      if (!title || !options || options.length < 2) {
        return res.status(400).json({
          error: "Invalid session data",
          code: "INVALID_DATA"
        });
      }

      if (typeof options !== "object" || !Array.isArray(options)) {
        return res.status(400).json({
          error: "Options must be an array",
          code: "INVALID_OPTIONS"
        });
      }

      const start = new Date(startTime);
      const end = new Date(endTime);

      if (start >= end) {
        return res.status(400).json({
          error: "End time must be after start time",
          code: "INVALID_TIMES"
        });
      }

      if (start < new Date()) {
        return res.status(400).json({
          error: "Start time must be in the future",
          code: "INVALID_START_TIME"
        });
      }

      // Create session
      const sessionId = generateSessionId();
      const session = {
        id: sessionId,
        title,
        description,
        options,
        creator: creatorId,
        startTime: start,
        endTime: end,
        requiresHumanVerification,
        status: "pending",
        closed: false,
        cancelled: false,
        votes: new Map(),
        voters: new Set(),
        results: new Array(options.length).fill(0),
        createdAt: new Date(),
        updatedAt: new Date(),
        blockchainTxHash: null
      };

      sessions.set(sessionId, session);

      console.log(`✓ Voting session created: ${title} (ID: ${sessionId})`);

      res.status(201).json({
        success: true,
        message: "Session created successfully",
        session: {
          id: session.id,
          title: session.title,
          description: session.description,
          options: session.options,
          creator: session.creator,
          startTime: session.startTime,
          endTime: session.endTime,
          status: session.status,
          requiresHumanVerification: session.requiresHumanVerification
        }
      });
    } catch (error) {
      console.error("Session creation error:", error);
      res.status(500).json({
        error: "Failed to create session",
        code: "CREATION_ERROR",
        message: error.message
      });
    }
  }
);

/**
 * GET /api/voting/sessions/:sessionId
 * Get voting session details
 */
router.get("/sessions/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = sessions.get(parseInt(sessionId));

    if (!session) {
      return res.status(404).json({
        error: "Session not found",
        code: "SESSION_NOT_FOUND"
      });
    }

    const isActive =
      session.startTime <= new Date() &&
      new Date() <= session.endTime &&
      !session.closed &&
      !session.cancelled;

    res.json({
      success: true,
      session: {
        id: session.id,
        title: session.title,
        description: session.description,
        options: session.options,
        creator: session.creator,
        startTime: session.startTime,
        endTime: session.endTime,
        status: session.status,
        closed: session.closed,
        cancelled: session.cancelled,
        isActive,
        totalVotes: session.voters.size,
        requiresHumanVerification: session.requiresHumanVerification,
        createdAt: session.createdAt
      }
    });
  } catch (error) {
    console.error("Session fetch error:", error);
    res.status(500).json({
      error: "Failed to fetch session",
      code: "FETCH_ERROR"
    });
  }
});

/**
 * GET /api/voting/sessions
 * List all voting sessions
 */
router.get("/sessions", async (req, res) => {
  try {
    const { status, creator, limit = 50, offset = 0 } = req.query;

    let sessionsList = Array.from(sessions.values());

    // Filter by status
    if (status) {
      sessionsList = sessionsList.filter(s => s.status === status);
    }

    // Filter by creator
    if (creator) {
      sessionsList = sessionsList.filter(s => s.creator === creator);
    }

    // Sort by creation date (newest first)
    sessionsList.sort((a, b) => b.createdAt - a.createdAt);

    // Pagination
    const total = sessionsList.length;
    sessionsList = sessionsList.slice(
      parseInt(offset),
      parseInt(offset) + parseInt(limit)
    );

    const mappedSessions = sessionsList.map(session => {
      const isActive =
        session.startTime <= new Date() &&
        new Date() <= session.endTime &&
        !session.closed &&
        !session.cancelled;

      return {
        id: session.id,
        title: session.title,
        description: session.description,
        optionCount: session.options.length,
        creator: session.creator,
        startTime: session.startTime,
        endTime: session.endTime,
        status: session.status,
        isActive,
        totalVotes: session.voters.size,
        createdAt: session.createdAt
      };
    });

    res.json({
      success: true,
      sessions: mappedSessions,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < total
      }
    });
  } catch (error) {
    console.error("Sessions list error:", error);
    res.status(500).json({
      error: "Failed to fetch sessions",
      code: "LIST_ERROR"
    });
  }
});

/**
 * POST /api/voting/cast
 * Cast a vote
 */
router.post(
  "/cast",
  authenticateJWT,
  rateLimit(50),
  validateInput(["sessionId", "choice"]),
  async (req, res) => {
    try {
      const { sessionId, choice } = req.body;
      const voterId = req.user.id;

      // Validation
      if (sessionId === undefined || choice === undefined) {
        return res.status(400).json({
          error: "Session ID and choice required",
          code: "MISSING_FIELDS"
        });
      }

      const session = sessions.get(parseInt(sessionId));
      if (!session) {
        return res.status(404).json({
          error: "Session not found",
          code: "SESSION_NOT_FOUND"
        });
      }

      // Check if session is active
      const now = new Date();
      if (session.startTime > now) {
        return res.status(400).json({
          error: "Session has not started",
          code: "SESSION_NOT_STARTED"
        });
      }

      if (session.endTime < now) {
        return res.status(400).json({
          error: "Session has ended",
          code: "SESSION_ENDED"
        });
      }

      if (session.closed || session.cancelled) {
        return res.status(400).json({
          error: "Session is not active",
          code: "SESSION_INACTIVE"
        });
      }

      // Check if user is human verified if required
      if (session.requiresHumanVerification) {
        if (!req.user.verifiedHuman) {
          return res.status(403).json({
            error: "Human verification required",
            code: "NOT_VERIFIED"
          });
        }
      }

      // Check if user has already voted
      if (session.voters.has(voterId)) {
        return res.status(400).json({
          error: "Already voted in this session",
          code: "ALREADY_VOTED"
        });
      }

      // Validate choice
      if (choice < 0 || choice >= session.options.length) {
        return res.status(400).json({
          error: "Invalid choice",
          code: "INVALID_CHOICE"
        });
      }

      // Record vote
      session.voters.add(voterId);
      session.votes.set(voterId, choice);
      session.results[choice]++;
      session.updatedAt = new Date();

      console.log(
        `✓ Vote cast: Session ${sessionId}, Choice ${choice}, Voter ${voterId}`
      );

      res.json({
        success: true,
        message: "Vote recorded successfully",
        vote: {
          sessionId,
          choice,
          option: session.options[choice],
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error("Vote casting error:", error);
      res.status(500).json({
        error: "Failed to cast vote",
        code: "VOTE_ERROR",
        message: error.message
      });
    }
  }
);

/**
 * GET /api/voting/results/:sessionId
 * Get voting results for a session
 */
router.get("/results/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = sessions.get(parseInt(sessionId));

    if (!session) {
      return res.status(404).json({
        error: "Session not found",
        code: "SESSION_NOT_FOUND"
      });
    }

    // Calculate percentages
    const total = session.results.reduce((a, b) => a + b, 0);
    const percentages = session.results.map(r =>
      total > 0 ? Math.round((r / total) * 100) : 0
    );

    // Find winning option(s)
    const maxVotes = Math.max(...session.results);
    const winners = session.options
      .map((opt, idx) => (session.results[idx] === maxVotes ? opt : null))
      .filter(opt => opt !== null);

    res.json({
      success: true,
      results: {
        sessionId: session.id,
        title: session.title,
        status: session.status,
        closed: session.closed,
        totalVotes: total,
        options: session.options.map((opt, idx) => ({
          option: opt,
          votes: session.results[idx],
          percentage: percentages[idx]
        })),
        winners,
        createdAt: session.createdAt,
        finalized: session.closed || session.cancelled
      }
    });
  } catch (error) {
    console.error("Results fetch error:", error);
    res.status(500).json({
      error: "Failed to fetch results",
      code: "RESULTS_ERROR"
    });
  }
});

/**
 * POST /api/voting/sessions/:sessionId/close
 * Close a voting session (only creator)
 */
router.post("/sessions/:sessionId/close", authenticateJWT, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const session = sessions.get(parseInt(sessionId));
    if (!session) {
      return res.status(404).json({
        error: "Session not found",
        code: "SESSION_NOT_FOUND"
      });
    }

    if (session.creator !== userId) {
      return res.status(403).json({
        error: "Only session creator can close",
        code: "FORBIDDEN"
      });
    }

    session.closed = true;
    session.status = "completed";
    session.updatedAt = new Date();

    console.log(`✓ Session closed: ${sessionId}`);

    res.json({
      success: true,
      message: "Session closed successfully",
      session: {
        id: session.id,
        title: session.title,
        status: session.status,
        closed: session.closed,
        totalVotes: session.voters.size
      }
    });
  } catch (error) {
    console.error("Session close error:", error);
    res.status(500).json({
      error: "Failed to close session",
      code: "CLOSE_ERROR"
    });
  }
});

/**
 * POST /api/voting/sessions/:sessionId/cancel
 * Cancel a voting session
 */
router.post(
  "/sessions/:sessionId/cancel",
  authenticateJWT,
  validateInput(["reason"]),
  async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { reason } = req.body;
      const userId = req.user.id;

      const session = sessions.get(parseInt(sessionId));
      if (!session) {
        return res.status(404).json({
          error: "Session not found",
          code: "SESSION_NOT_FOUND"
        });
      }

      if (session.creator !== userId) {
        return res.status(403).json({
          error: "Only session creator can cancel",
          code: "FORBIDDEN"
        });
      }

      session.cancelled = true;
      session.status = "cancelled";
      session.cancellationReason = reason;
      session.updatedAt = new Date();

      console.log(`✓ Session cancelled: ${sessionId} - Reason: ${reason}`);

      res.json({
        success: true,
        message: "Session cancelled successfully",
        session: {
          id: session.id,
          title: session.title,
          status: session.status,
          cancelled: session.cancelled,
          cancellationReason: reason
        }
      });
    } catch (error) {
      console.error("Session cancel error:", error);
      res.status(500).json({
        error: "Failed to cancel session",
        code: "CANCEL_ERROR"
      });
    }
  }
);

/**
 * GET /api/voting/sessions/:sessionId/votes
 * Get detailed vote information (creator only)
 */
router.get("/sessions/:sessionId/votes", authenticateJWT, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const session = sessions.get(parseInt(sessionId));
    if (!session) {
      return res.status(404).json({
        error: "Session not found",
        code: "SESSION_NOT_FOUND"
      });
    }

    if (session.creator !== userId) {
      return res.status(403).json({
        error: "Only session creator can view votes",
        code: "FORBIDDEN"
      });
    }

    const voteDetails = Array.from(session.votes.entries()).map(
      ([voterId, choice]) => ({
        voter: voterId,
        choice: choice,
        option: session.options[choice]
      })
    );

    res.json({
      success: true,
      votes: {
        sessionId: session.id,
        totalVotes: voteDetails.length,
        details: voteDetails
      }
    });
  } catch (error) {
    console.error("Votes fetch error:", error);
    res.status(500).json({
      error: "Failed to fetch votes",
      code: "VOTES_ERROR"
    });
  }
});

/**
 * GET /api/voting/user/check
 * Check if user has voted in a session
 */
router.get(
  "/user/check",
  authenticateJWT,
  validateInput(["sessionId"]),
  async (req, res) => {
    try {
      const { sessionId } = req.query;
      const userId = req.user.id;

      const session = sessions.get(parseInt(sessionId));
      if (!session) {
        return res.status(404).json({
          error: "Session not found",
          code: "SESSION_NOT_FOUND"
        });
      }

      const hasVoted = session.voters.has(userId);
      const userChoice = session.votes.get(userId);

      res.json({
        success: true,
        voted: {
          sessionId,
          hasVoted,
          choice: hasVoted ? userChoice : null,
          option: hasVoted ? session.options[userChoice] : null
        }
      });
    } catch (error) {
      console.error("User vote check error:", error);
      res.status(500).json({
        error: "Failed to check vote status",
        code: "CHECK_ERROR"
      });
    }
  }
);

module.exports = router;
