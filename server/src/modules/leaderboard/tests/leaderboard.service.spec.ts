import { Test, TestingModule } from '@nestjs/testing';
import { LeaderboardService } from '../leaderboard.service';
import { PrismaService } from '@/prisma/prisma.service';

describe('LeaderboardService', () => {
  let service: LeaderboardService;

  const mockPrisma = {
    dailySet: {
      findMany: jest.fn(),
    },
    leaderboardEntry: {
      groupBy: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
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
    it('returns empty when no entries', async () => {
      mockPrisma.leaderboardEntry.groupBy.mockResolvedValue([]);
      mockPrisma.user.findMany.mockResolvedValue([]);

      const result = await service.getAllTimeLeaderboard('user-1');

      expect(result.entries).toEqual([]);
      expect(result.userPosition).toBeNull();
      expect(result.totalPlayers).toBe(0);
    });

    it('sorts by correctAnswers DESC then totalTimeSeconds ASC', async () => {
      mockPrisma.leaderboardEntry.groupBy.mockResolvedValue([
        { userId: 'u-1', _sum: { correctAnswers: 10, score: 500, totalTimeSeconds: 200 }, _count: { _all: 2 } },
        { userId: 'u-2', _sum: { correctAnswers: 10, score: 500, totalTimeSeconds: 100 }, _count: { _all: 2 } },
        { userId: 'u-3', _sum: { correctAnswers: 15, score: 700, totalTimeSeconds: 300 }, _count: { _all: 3 } },
      ]);
      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'u-1', nickname: 'Alice' },
        { id: 'u-2', nickname: 'Bob' },
        { id: 'u-3', nickname: 'Charlie' },
      ]);

      const result = await service.getAllTimeLeaderboard('u-2');

      expect(result.entries[0].userId).toBe('u-3'); // 15 correct
      expect(result.entries[1].userId).toBe('u-2'); // 10 correct, 100s (faster)
      expect(result.entries[2].userId).toBe('u-1'); // 10 correct, 200s (slower)
      expect(result.entries[0].rank).toBe(1);
      expect(result.entries[1].rank).toBe(2);
      expect(result.entries[2].rank).toBe(3);
    });

    it('returns correct user position', async () => {
      mockPrisma.leaderboardEntry.groupBy.mockResolvedValue([
        { userId: 'u-1', _sum: { correctAnswers: 20, score: 900, totalTimeSeconds: 100 }, _count: { _all: 2 } },
        { userId: 'u-2', _sum: { correctAnswers: 10, score: 500, totalTimeSeconds: 200 }, _count: { _all: 2 } },
      ]);
      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'u-1', nickname: 'A' },
        { id: 'u-2', nickname: 'B' },
      ]);

      const result = await service.getAllTimeLeaderboard('u-2');

      expect(result.userPosition).toBe(2);
      expect(result.totalPlayers).toBe(2);
    });

    it('returns null userPosition when user has no entries', async () => {
      mockPrisma.leaderboardEntry.groupBy.mockResolvedValue([
        { userId: 'u-1', _sum: { correctAnswers: 10, score: 500, totalTimeSeconds: 100 }, _count: { _all: 1 } },
      ]);
      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'u-1', nickname: 'A' },
      ]);

      const result = await service.getAllTimeLeaderboard('u-999');

      expect(result.userPosition).toBeNull();
    });

    it('calculates totalQuestions from count * 15', async () => {
      mockPrisma.leaderboardEntry.groupBy.mockResolvedValue([
        { userId: 'u-1', _sum: { correctAnswers: 30, score: 1500, totalTimeSeconds: 300 }, _count: { _all: 3 } },
      ]);
      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'u-1', nickname: 'A' },
      ]);

      const result = await service.getAllTimeLeaderboard('u-1');

      expect(result.entries[0].totalQuestions).toBe(45); // 3 * 15
    });

    it('handles null nickname gracefully', async () => {
      mockPrisma.leaderboardEntry.groupBy.mockResolvedValue([
        { userId: 'u-1', _sum: { correctAnswers: 5, score: 200, totalTimeSeconds: 50 }, _count: { _all: 1 } },
      ]);
      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'u-1', nickname: null },
      ]);

      const result = await service.getAllTimeLeaderboard('u-1');

      expect(result.entries[0].nickname).toBeNull();
    });
  });

  describe('getWeeklyLeaderboard', () => {
    it('returns empty when no daily sets in current week', async () => {
      mockPrisma.dailySet.findMany.mockResolvedValue([]);

      const result = await service.getWeeklyLeaderboard('u-1');

      expect(result.entries).toEqual([]);
      expect(result.totalPlayers).toBe(0);
    });

    it('filters by daily sets in date range', async () => {
      mockPrisma.dailySet.findMany.mockResolvedValue([
        { id: 'ds-1' },
        { id: 'ds-2' },
      ]);
      mockPrisma.leaderboardEntry.groupBy.mockResolvedValue([]);
      mockPrisma.user.findMany.mockResolvedValue([]);

      await service.getWeeklyLeaderboard('u-1');

      expect(mockPrisma.leaderboardEntry.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { dailySetId: { in: ['ds-1', 'ds-2'] } },
        }),
      );
    });
  });

  describe('getMonthlyLeaderboard', () => {
    it('returns empty when no daily sets in current month', async () => {
      mockPrisma.dailySet.findMany.mockResolvedValue([]);

      const result = await service.getMonthlyLeaderboard('u-1');

      expect(result.entries).toEqual([]);
      expect(result.totalPlayers).toBe(0);
    });
  });

  describe('getYearlyLeaderboard', () => {
    it('returns empty when no daily sets in current year', async () => {
      mockPrisma.dailySet.findMany.mockResolvedValue([]);

      const result = await service.getYearlyLeaderboard('u-1');

      expect(result.entries).toEqual([]);
      expect(result.totalPlayers).toBe(0);
    });
  });
});
