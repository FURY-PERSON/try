import { Test, TestingModule } from '@nestjs/testing';
import { AdminStatsService } from '../admin-stats.service';
import { PrismaService } from '@/prisma/prisma.service';

describe('AdminStatsService', () => {
  let service: AdminStatsService;

  const mockPrisma = {
    user: {
      count: jest.fn(),
    },
    question: {
      count: jest.fn(),
      aggregate: jest.fn(),
      findMany: jest.fn(),
    },
    dailySet: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminStatsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AdminStatsService>(AdminStatsService);
    jest.clearAllMocks();
  });

  describe('getDashboard', () => {
    it('returns all dashboard stats', async () => {
      mockPrisma.user.count
        .mockResolvedValueOnce(100)  // totalUsers
        .mockResolvedValueOnce(15)   // DAU
        .mockResolvedValueOnce(60);  // MAU

      mockPrisma.question.count
        .mockResolvedValueOnce(20)   // moderation
        .mockResolvedValueOnce(80)   // approved
        .mockResolvedValueOnce(10);  // rejected

      mockPrisma.dailySet.count.mockResolvedValue(30);

      mockPrisma.question.aggregate.mockResolvedValue({
        _avg: { timesCorrect: 5, timesShown: 10 },
        _sum: { timesCorrect: 500, timesShown: 1000 },
      });

      const result = await service.getDashboard();

      expect(result.totalUsers).toBe(100);
      expect(result.activeToday).toBe(15);
      expect(result.totalQuestions).toBe(110); // 20 + 80 + 10
      expect(result.approvedQuestions).toBe(80);
      expect(result.pendingQuestions).toBe(20);
      expect(result.totalDailySets).toBe(30);
    });

    it('handles zero questions gracefully', async () => {
      mockPrisma.user.count.mockResolvedValue(0);
      mockPrisma.question.count.mockResolvedValue(0);
      mockPrisma.dailySet.count.mockResolvedValue(0);
      mockPrisma.question.aggregate.mockResolvedValue({
        _avg: { timesCorrect: null, timesShown: null },
        _sum: { timesCorrect: null, timesShown: null },
      });

      const result = await service.getDashboard();

      expect(result.totalUsers).toBe(0);
      expect(result.totalQuestions).toBe(0);
    });
  });

  describe('getQuestionStats', () => {
    it('returns hardest, easiest, and most shown with correctRate', async () => {
      const questionBase = {
        id: 'q-1',
        statement: 'Test',
        timesShown: 100,
        timesCorrect: 30,
        category: { name: 'Science' },
      };

      mockPrisma.question.findMany
        .mockResolvedValueOnce([{ ...questionBase, timesCorrect: 10 }])  // hardest
        .mockResolvedValueOnce([{ ...questionBase, timesCorrect: 90 }])  // easiest
        .mockResolvedValueOnce([questionBase]);                          // mostShown

      const result = await service.getQuestionStats();

      expect(result.hardest[0].correctRate).toBe(10); // 10/100 * 100
      expect(result.easiest[0].correctRate).toBe(90); // 90/100 * 100
      expect(result.mostShown[0].correctRate).toBe(30); // 30/100 * 100
    });

    it('returns 0 correctRate when timesShown is 0', async () => {
      const question = {
        id: 'q-1',
        statement: 'Test',
        timesShown: 0,
        timesCorrect: 0,
        category: { name: 'Science' },
      };

      mockPrisma.question.findMany
        .mockResolvedValueOnce([question])
        .mockResolvedValueOnce([question])
        .mockResolvedValueOnce([question]);

      const result = await service.getQuestionStats();

      expect(result.hardest[0].correctRate).toBe(0);
    });
  });
});
