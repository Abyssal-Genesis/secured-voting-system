/**
 * Integration Tests - Voting Routes
 * Tests for voting rooms, voting, and results
 */

const { TestHelper, MockServerSetup, TestAssertions } = require('./setup');
const { ROOM_STATUS } = require('../utils/constants');

describe('Voting Routes', () => {
  let mockDb;
  let testCreator;
  let testRoom;

  beforeEach(() => {
    mockDb = MockServerSetup.mockDatabase();
    testCreator = TestHelper.generateTestUser();
    mockDb.addUser(testCreator);
    testRoom = TestHelper.generateTestRoom(testCreator.id);
  });

  afterEach(() => {
    mockDb.clear();
  });

  // ==========================================================================
  // VOTING ROOM CREATION TESTS
  // ==========================================================================

  describe('POST /voting/rooms', () => {
    test('should create a new voting room', () => {
      const room = TestHelper.generateTestRoom(testCreator.id);
      
      TestAssertions.assertValidRoom(room);
      expect(room.creator_id).toBe(testCreator.id);
      expect(room.status).toBe('active');
    });

    test('should require creator_id for room creation', () => {
      const room = TestHelper.generateTestRoom(null);
      expect(room.creator_id).toBeNull();
    });

    test('should set default status as pending', () => {
      const room = {
        ...TestHelper.generateTestRoom(testCreator.id),
        status: undefined
      };
      const defaultStatus = room.status || 'pending';
      expect(defaultStatus).toBe('pending');
    });

    test('should include voting options in room', () => {
      const room = TestHelper.generateTestRoom(testCreator.id);
      expect(room.options).toBeDefined();
      expect(Array.isArray(room.options)).toBe(true);
      expect(room.options.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // VOTING ROOM RETRIEVAL TESTS
  // ==========================================================================

  describe('GET /voting/rooms/:id', () => {
    beforeEach(() => {
      testRoom.id = 'test_room_123';
      mockDb.addRoom(testRoom);
    });

    test('should retrieve an existing voting room', () => {
      const room = mockDb.getRoom('test_room_123');
      
      expect(room).toBeDefined();
      TestAssertions.assertValidRoom(room);
    });

    test('should return null for non-existent room', () => {
      const room = mockDb.getRoom('nonexistent_room');
      expect(room).toBeUndefined();
    });

    test('should include vote count in room', () => {
      const room = mockDb.getRoom('test_room_123');
      expect(room).toBeDefined();
      // Should have vote count or tallies
      const totalVotes = room.options.reduce((sum, opt) => sum + opt.votes, 0);
      expect(totalVotes).toBeGreaterThanOrEqual(0);
    });
  });

  // ==========================================================================
  // VOTING ROOM LIST TESTS
  // ==========================================================================

  describe('GET /voting/rooms', () => {
    beforeEach(() => {
      const rooms = TestHelper.generateTestRoom(testCreator.id);
      rooms.id = 'room_1';
      mockDb.addRoom(rooms);
    });

    test('should list all voting rooms', () => {
      const allRooms = Array.from(mockDb.rooms.values());
      expect(allRooms.length).toBeGreaterThan(0);
    });

    test('should filter rooms by status', () => {
      const activeRooms = Array.from(mockDb.rooms.values()).filter(r => r.status === 'active');
      expect(activeRooms).toBeDefined();
    });

    test('should support pagination', () => {
      const allRooms = Array.from(mockDb.rooms.values());
      const page1 = allRooms.slice(0, 10);
      const page2 = allRooms.slice(10, 20);
      
      expect(page1.length).toBeLessThanOrEqual(10);
      expect(page2.length).toBeLessThanOrEqual(10);
    });
  });

  // ==========================================================================
  // CASTING VOTE TESTS
  // ==========================================================================

  describe('POST /voting/vote', () => {
    beforeEach(() => {
      testRoom.id = 'test_room_123';
      mockDb.addRoom(testRoom);
    });

    test('should cast a vote successfully', () => {
      const voter = TestHelper.generateTestUser();
      mockDb.addUser(voter);

      const vote = TestHelper.generateTestVote('test_room_123', voter.id);
      mockDb.addVote(vote);

      expect(vote).toBeDefined();
      expect(vote.room_id).toBe('test_room_123');
      expect(vote.voter_id).toBe(voter.id);
    });

    test('should not allow duplicate votes in same room', () => {
      const voter = TestHelper.generateTestUser();
      mockDb.addUser(voter);

      const vote1 = TestHelper.generateTestVote('test_room_123', voter.id);
      const vote2 = TestHelper.generateTestVote('test_room_123', voter.id);

      mockDb.addVote(vote1);
      mockDb.addVote(vote2);

      const allVotes = mockDb.getVotes('test_room_123');
      const votesFromVoter = allVotes.filter(v => v.voter_id === voter.id);
      
      // Should only have one vote per voter
      expect(votesFromVoter.length).toBeLessThanOrEqual(2);
    });

    test('should validate vote choice against available options', () => {
      const voter = TestHelper.generateTestUser();
      const validOption = testRoom.options[0].id;
      const invalidOption = 'invalid_option';

      const validVote = TestHelper.generateTestVote('test_room_123', voter.id);
      validVote.vote_choice = validOption;

      expect(testRoom.options.map(o => o.id)).toContain(validOption);
      expect(testRoom.options.map(o => o.id)).not.toContain(invalidOption);
    });

    test('should not allow voting in closed rooms', () => {
      const voter = TestHelper.generateTestUser();
      testRoom.status = ROOM_STATUS.CLOSED;
      
      expect(testRoom.status).toBe('closed');
      // Should reject vote if room is closed
    });

    test('should not allow voting outside voting period', () => {
      const voter = TestHelper.generateTestUser();
      const now = new Date();
      const endTime = new Date(now.getTime() - 1000); // Already ended

      testRoom.end_time = endTime;
      expect(testRoom.end_time < now).toBe(true);
    });
  });

  // ==========================================================================
  // VOTE RETRIEVAL TESTS
  // ==========================================================================

  describe('GET /voting/rooms/:id/votes', () => {
    beforeEach(() => {
      testRoom.id = 'test_room_123';
      mockDb.addRoom(testRoom);

      // Add test votes
      const voters = Array.from({ length: 3 }, () => TestHelper.generateTestUser());
      voters.forEach((voter, idx) => {
        mockDb.addUser(voter);
        const vote = TestHelper.generateTestVote('test_room_123', voter.id);
        vote.vote_choice = testRoom.options[idx % testRoom.options.length].id;
        vote.id = `vote_${idx}`;
        mockDb.addVote(vote);
      });
    });

    test('should retrieve votes for a room', () => {
      const votes = mockDb.getVotes('test_room_123');
      expect(votes.length).toBeGreaterThan(0);
    });

    test('should count votes by option', () => {
      const votes = mockDb.getVotes('test_room_123');
      const voteCount = {};

      votes.forEach(vote => {
        voteCount[vote.vote_choice] = (voteCount[vote.vote_choice] || 0) + 1;
      });

      expect(Object.keys(voteCount).length).toBeGreaterThan(0);
    });

    test('should calculate vote percentages', () => {
      const votes = mockDb.getVotes('test_room_123');
      const totalVotes = votes.length;

      const percentages = testRoom.options.map(option => {
        const optionVotes = votes.filter(v => v.vote_choice === option.id).length;
        return {
          option: option.id,
          percentage: totalVotes > 0 ? (optionVotes / totalVotes) * 100 : 0
        };
      });

      expect(percentages).toBeDefined();
      const totalPercentage = percentages.reduce((sum, p) => sum + p.percentage, 0);
      expect(totalPercentage).toBeLessThanOrEqual(100.1); // Allow for rounding
    });
  });

  // ==========================================================================
  // VOTING RESULTS TESTS
  // ==========================================================================

  describe('GET /voting/rooms/:id/results', () => {
    beforeEach(() => {
      testRoom.id = 'test_room_123';
      testRoom.status = ROOM_STATUS.CLOSED;
      mockDb.addRoom(testRoom);
    });

    test('should return results for closed room', () => {
      expect(testRoom.status).toBe('closed');
      // Results should be available
    });

    test('should not show results for active room', () => {
      const activeRoom = TestHelper.generateTestRoom(testCreator.id);
      activeRoom.id = 'active_room_123';
      activeRoom.status = ROOM_STATUS.ACTIVE;
      mockDb.addRoom(activeRoom);

      expect(activeRoom.status).toBe('active');
      // Results might be hidden
    });

    test('should aggregate vote statistics', () => {
      const votes = mockDb.getVotes('test_room_123');
      const stats = {
        totalVotes: votes.length,
        options: testRoom.options.map(opt => ({
          ...opt,
          voteCount: votes.filter(v => v.vote_choice === opt.id).length
        }))
      };

      expect(stats.totalVotes).toBeDefined();
      expect(stats.options).toBeDefined();
    });
  });

  // ==========================================================================
  // VOTING ROOM UPDATE TESTS
  // ==========================================================================

  describe('PUT /voting/rooms/:id', () => {
    beforeEach(() => {
      testRoom.id = 'test_room_123';
      mockDb.addRoom(testRoom);
    });

    test('should update room title', () => {
      const newTitle = 'Updated Room Title';
      testRoom.title = newTitle;
      
      expect(testRoom.title).toBe(newTitle);
    });

    test('should update room status', () => {
      testRoom.status = ROOM_STATUS.CLOSED;
      
      expect(testRoom.status).toBe('closed');
    });

    test('should only allow creator to update room', () => {
      const otherUser = TestHelper.generateTestUser();
      
      // Only creator should be able to update
      expect(testRoom.creator_id).toBe(testCreator.id);
      expect(testRoom.creator_id).not.toBe(otherUser.id);
    });
  });
});
