import { Test, TestingModule } from '@nestjs/testing';
import { LeaderboardService } from '../leaderboard.service';
import { PrismaService } from '@/prisma/prisma.service';

describe('LeaderboardService', () => {
  let service: LeaderboardService;

  const mockPrisma = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    userQuestionHistory: {
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    $queryRaw: jest.fn(),
    $queryRawUnsafe: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaderboardService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<LeaderboardService>(LeaderboardService);
    jest.clearAllMocks();
  });

  describe('getAllTimeLeaderboard', () => {
    it('returns empty when no users with score', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(0);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await service.getAllTimeLeaderboard('user-1');

      expect(result.entries).toEqual([]);
      expect(result.userPosition).toBeNull();
      expect(result.totalPlayers).toBe(0);
    });

    it('returns top users sorted by correctAnswers', async () => {
      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'u-1', nickname: 'Alice', avatarEmoji: '🦊', totalCorrectAnswers: 20, totalScore: 500 },
        { id: 'u-2', nickname: 'Bob', avatarEmoji: '🐱', totalCorrectAnswers: 15, totalScore: 400 },
      ]);
      mockPrisma.user.count.mockResolvedValue(2);

      const result = await service.getAllTimeLeaderboard('u-2');

      expect(result.entries).toHaveLength(2);
      expect(result.entries[0].userId).toBe('u-1');
      expect(result.entries[0].rank).toBe(1);
      expect(result.entries[1].userId).toBe('u-2');
      expect(result.entries[1].rank).toBe(2);
      expect(result.userPosition).toBe(2);
      expect(result.totalPlayers).toBe(2);
    });

    it('returns null userPosition when user has no entries', async () => {
      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'u-1', nickname: 'A', avatarEmoji: null, totalCorrectAnswers: 10, totalScore: 100 },
      ]);
      mockPrisma.user.count.mockResolvedValue(1);
      mockPrisma.user.findUnique.mockResolvedValue({ totalCorrectAnswers: 0, totalScore: 0 });

      const result = await service.getAllTimeLeaderboard('u-999');

      expect(result.userPosition).toBeNull();
    });

    it('handles null nickname gracefully', async () => {
      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'u-1', nickname: null, avatarEmoji: null, totalCorrectAnswers: 5, totalScore: 200 },
      ]);
      mockPrisma.user.count.mockResolvedValue(1);

      const result = await service.getAllTimeLeaderboard('u-1');

      expect(result.entries[0].nickname).toBeNull();
    });
  });

  describe('getWeeklyLeaderboard', () => {
    it('returns aggregated results from UserQuestionHistory', async () => {
      mockPrisma.$queryRawUnsafe.mockResolvedValue([]);
      mockPrisma.$queryRaw.mockResolvedValue([{ count: BigInt(0) }]);
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await service.getWeeklyLeaderboard('u-1');

      expect(result.entries).toEqual([]);
      expect(result.totalPlayers).toBe(0);
    });
  });

  describe('getMonthlyLeaderboard', () => {
    it('returns empty when no activity in current month', async () => {
      mockPrisma.$queryRawUnsafe.mockResolvedValue([]);
      mockPrisma.$queryRaw.mockResolvedValue([{ count: BigInt(0) }]);
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await service.getMonthlyLeaderboard('u-1');

      expect(result.entries).toEqual([]);
      expect(result.totalPlayers).toBe(0);
    });
  });

  describe('getYearlyLeaderboard', () => {
    it('returns empty when no activity in current year', async () => {
      mockPrisma.$queryRawUnsafe.mockResolvedValue([]);
      mockPrisma.$queryRaw.mockResolvedValue([{ count: BigInt(0) }]);
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await service.getYearlyLeaderboard('u-1');

      expect(result.entries).toEqual([]);
      expect(result.totalPlayers).toBe(0);
    });
  });

  describe('getStreakLeaderboard', () => {
    it('returns top users by streak', async () => {
      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'u-1', nickname: 'A', avatarEmoji: '🦊', currentAnswerStreak: 5, bestAnswerStreak: 10 },
      ]);
      mockPrisma.user.count.mockResolvedValue(1);

      const result = await service.getStreakLeaderboard('u-1');

      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].bestStreak).toBe(10);
      expect(result.totalPlayers).toBe(1);
    });
  });
});
