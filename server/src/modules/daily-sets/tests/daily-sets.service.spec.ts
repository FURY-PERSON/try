import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DailySetsService } from '../daily-sets.service';
import { PrismaService } from '@/prisma/prisma.service';

describe('DailySetsService', () => {
  let service: DailySetsService;

  const mockTx = {
    user: { update: jest.fn() },
    leaderboardEntry: { create: jest.fn() },
  };

  const mockPrisma = {
    dailySet: {
      findUnique: jest.fn(),
    },
    leaderboardEntry: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
    question: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn((fn: (tx: typeof mockTx) => Promise<void>) => fn(mockTx)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DailySetsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<DailySetsService>(DailySetsService);
    jest.clearAllMocks();
  });

  describe('getTodaySet', () => {
    it('returns published daily set with questions', async () => {
      const dailySet = {
        id: 'ds-1',
        date: new Date(),
        theme: 'Наука',
        themeEn: 'Science',
        status: 'published',
        questions: [
          {
            sortOrder: 1,
            question: {
              id: 'q-1',
              statement: 'The sun is a star',
              isTrue: true,
              explanation: 'Yes it is',
              source: 'NASA',
              sourceUrl: null,
              language: 'en',
              categoryId: 'cat-1',
              difficulty: 2,
              illustrationUrl: null,
            },
          },
        ],
      };

      mockPrisma.leaderboardEntry.findFirst.mockResolvedValue(null); // no weekly lockout
      mockPrisma.dailySet.findUnique.mockResolvedValue(dailySet);
      mockPrisma.leaderboardEntry.findUnique.mockResolvedValue(null);

      const result = await service.getTodaySet('user-1');

      expect(result.id).toBe('ds-1');
      expect(result.status).toBe('published');
      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].statement).toBe('The sun is a star');
      expect(result.completed).toBe(false);
      expect(result.isLocked).toBe(false);
      expect(result.userEntry).toBeNull();
    });

    it('returns locked status when user played within 7 days', async () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 3);

      const dailySet = {
        id: 'ds-1',
        date: new Date(),
        theme: 'Test',
        themeEn: 'Test',
        status: 'published',
        questions: [],
      };

      mockPrisma.leaderboardEntry.findFirst.mockResolvedValue({
        score: 1200,
        correctAnswers: 12,
        totalTimeSeconds: 120,
        createdAt: recentDate,
        dailySet: { id: 'ds-old', date: recentDate, theme: 'Old', themeEn: 'Old' },
      });
      mockPrisma.dailySet.findUnique.mockResolvedValue(dailySet);

      const result = await service.getTodaySet('user-1');

      expect(result.isLocked).toBe(true);
      expect(result.unlocksAt).toBeTruthy();
      expect(result.completed).toBe(true);
      expect(result.questions).toHaveLength(0);
    });

    it('returns unlocked when 7+ days since last play', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 10);

      mockPrisma.leaderboardEntry.findFirst.mockResolvedValue({
        score: 800,
        correctAnswers: 8,
        totalTimeSeconds: 100,
        createdAt: oldDate,
        dailySet: { id: 'ds-old', date: oldDate, theme: 'Old', themeEn: 'Old' },
      });

      mockPrisma.dailySet.findUnique.mockResolvedValue(null);
      mockPrisma.question.count.mockResolvedValue(20);
      mockPrisma.question.findMany.mockResolvedValue([
        {
          id: 'q-1', statement: 'test', isTrue: true,
          explanation: 'e', source: 's', sourceUrl: null,
          language: 'ru', categoryId: 'c-1', difficulty: 3,
          illustrationUrl: null,
        },
      ]);

      const result = await service.getTodaySet('user-1');

      expect(result.isLocked).toBe(false);
      expect(result.status).toBe('fallback');
    });

    it('ignores non-published daily set and returns fallback', async () => {
      mockPrisma.leaderboardEntry.findFirst.mockResolvedValue(null);
      mockPrisma.dailySet.findUnique.mockResolvedValue({
        id: 'ds-1',
        status: 'draft',
        questions: [],
      });
      mockPrisma.question.count.mockResolvedValue(20);
      mockPrisma.question.findMany.mockResolvedValue([
        {
          id: 'q-1', statement: 'test', isTrue: true,
          explanation: 'e', source: 's', sourceUrl: null,
          language: 'ru', categoryId: 'cat-1', difficulty: 3,
          illustrationUrl: null,
        },
      ]);

      const result = await service.getTodaySet('user-1');

      expect(result.status).toBe('fallback');
      expect(result.id).toBeNull();
      expect(result.completed).toBe(false);
    });

    it('returns fallback when no daily set exists for today', async () => {
      mockPrisma.leaderboardEntry.findFirst.mockResolvedValue(null);
      mockPrisma.dailySet.findUnique.mockResolvedValue(null);
      mockPrisma.question.count.mockResolvedValue(30);
      mockPrisma.question.findMany.mockResolvedValue(
        Array.from({ length: 15 }, (_, i) => ({
          id: `q-${i}`,
          statement: `Statement ${i}`,
          isTrue: i % 2 === 0,
          explanation: `Explanation ${i}`,
          source: 'Source',
          sourceUrl: null,
          language: 'ru',
          categoryId: 'cat-1',
          difficulty: 3,
          illustrationUrl: null,
        })),
      );

      const result = await service.getTodaySet('user-1');

      expect(result.status).toBe('fallback');
      expect(result.questions.length).toBeLessThanOrEqual(15);
      expect(result.theme).toBeNull();
    });
  });

  describe('submitDailySet', () => {
    const makeDto = (overrides: Partial<{ results: any[] }> = {}) => ({
      results: overrides.results ?? [
        { questionId: 'q-1', result: 'correct', timeSpentSeconds: 5 },
        { questionId: 'q-2', result: 'incorrect', timeSpentSeconds: 10 },
      ],
    });

    const dailySet = {
      id: 'ds-1',
      questions: [
        { questionId: 'q-1', question: { id: 'q-1' } },
        { questionId: 'q-2', question: { id: 'q-2' } },
      ],
    };

    it('throws NotFoundException if daily set not found', async () => {
      mockPrisma.dailySet.findUnique.mockResolvedValue(null);

      await expect(
        service.submitDailySet('user-1', 'nonexistent', makeDto()),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException on duplicate submission', async () => {
      mockPrisma.dailySet.findUnique.mockResolvedValue(dailySet);
      mockPrisma.leaderboardEntry.findUnique.mockResolvedValue({ id: 'entry-1' });

      await expect(
        service.submitDailySet('user-1', 'ds-1', makeDto()),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException if question does not belong to set', async () => {
      mockPrisma.dailySet.findUnique.mockResolvedValue(dailySet);
      mockPrisma.leaderboardEntry.findUnique.mockResolvedValue(null);

      const dto = makeDto({
        results: [{ questionId: 'q-999', result: 'correct', timeSpentSeconds: 5 }],
      });

      await expect(
        service.submitDailySet('user-1', 'ds-1', dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException if user played this week (weekly lockout)', async () => {
      mockPrisma.dailySet.findUnique.mockResolvedValue(dailySet);
      mockPrisma.leaderboardEntry.findUnique.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        currentStreak: 1,
        bestStreak: 1,
        lastPlayedDate: new Date(),
      });
      mockPrisma.leaderboardEntry.findFirst.mockResolvedValue({ id: 'recent' });

      await expect(
        service.submitDailySet('user-1', 'ds-1', makeDto()),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException if user not found', async () => {
      mockPrisma.dailySet.findUnique.mockResolvedValue(dailySet);
      mockPrisma.leaderboardEntry.findUnique.mockResolvedValue(null);
      mockPrisma.leaderboardEntry.findFirst.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.submitDailySet('user-1', 'ds-1', makeDto()),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException if user already played today', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      mockPrisma.dailySet.findUnique.mockResolvedValue(dailySet);
      mockPrisma.leaderboardEntry.findUnique.mockResolvedValue(null);
      mockPrisma.leaderboardEntry.findFirst.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        currentStreak: 3,
        bestStreak: 5,
        lastPlayedDate: today,
      });

      await expect(
        service.submitDailySet('user-1', 'ds-1', makeDto()),
      ).rejects.toThrow(BadRequestException);
    });

    it('sets streak to 1 for first-time player', async () => {
      mockPrisma.dailySet.findUnique.mockResolvedValue(dailySet);
      mockPrisma.leaderboardEntry.findUnique.mockResolvedValue(null);
      mockPrisma.leaderboardEntry.findFirst.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        currentStreak: 0,
        bestStreak: 0,
        lastPlayedDate: null,
      });
      mockPrisma.leaderboardEntry.count.mockResolvedValue(0);

      const result = await service.submitDailySet('user-1', 'ds-1', makeDto());

      expect(result.streak).toBe(1);
      expect(result.bestStreak).toBe(1);
    });

    it('increments streak when played within 14 days (weekly cadence)', async () => {
      const eightDaysAgo = new Date();
      eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

      mockPrisma.dailySet.findUnique.mockResolvedValue(dailySet);
      mockPrisma.leaderboardEntry.findUnique.mockResolvedValue(null);
      mockPrisma.leaderboardEntry.findFirst.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        currentStreak: 5,
        bestStreak: 10,
        lastPlayedDate: eightDaysAgo,
      });
      mockPrisma.leaderboardEntry.count.mockResolvedValue(0);

      const result = await service.submitDailySet('user-1', 'ds-1', makeDto());

      expect(result.streak).toBe(6);
      expect(result.bestStreak).toBe(10);
    });

    it('resets streak when gap is more than 14 days', async () => {
      const twentyDaysAgo = new Date();
      twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 20);

      mockPrisma.dailySet.findUnique.mockResolvedValue(dailySet);
      mockPrisma.leaderboardEntry.findUnique.mockResolvedValue(null);
      mockPrisma.leaderboardEntry.findFirst.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        currentStreak: 5,
        bestStreak: 10,
        lastPlayedDate: twentyDaysAgo,
      });
      mockPrisma.leaderboardEntry.count.mockResolvedValue(0);

      const result = await service.submitDailySet('user-1', 'ds-1', makeDto());

      expect(result.streak).toBe(1);
    });

    it('updates bestStreak when new streak exceeds it', async () => {
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

      mockPrisma.dailySet.findUnique.mockResolvedValue(dailySet);
      mockPrisma.leaderboardEntry.findUnique.mockResolvedValue(null);
      mockPrisma.leaderboardEntry.findFirst.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        currentStreak: 9,
        bestStreak: 9,
        lastPlayedDate: tenDaysAgo,
      });
      mockPrisma.leaderboardEntry.count.mockResolvedValue(0);

      const result = await service.submitDailySet('user-1', 'ds-1', makeDto());

      expect(result.streak).toBe(10);
      expect(result.bestStreak).toBe(10);
    });

    it('calculates score correctly (100 + speed bonus per correct)', async () => {
      mockPrisma.dailySet.findUnique.mockResolvedValue(dailySet);
      mockPrisma.leaderboardEntry.findUnique.mockResolvedValue(null);
      mockPrisma.leaderboardEntry.findFirst.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        currentStreak: 0,
        bestStreak: 0,
        lastPlayedDate: null,
      });
      mockPrisma.leaderboardEntry.count.mockResolvedValue(0);

      const dto = makeDto({
        results: [
          { questionId: 'q-1', result: 'correct', timeSpentSeconds: 5 },
          { questionId: 'q-2', result: 'incorrect', timeSpentSeconds: 10 },
        ],
      });

      const result = await service.submitDailySet('user-1', 'ds-1', dto);

      // 100 base + max(0, 50 - 5) = 145 for correct; 0 for incorrect
      expect(result.score).toBe(145);
      expect(result.correctAnswers).toBe(1);
      expect(result.totalTimeSeconds).toBe(15);
    });

    it('calculates correctPercent and percentile', async () => {
      mockPrisma.dailySet.findUnique.mockResolvedValue(dailySet);
      mockPrisma.leaderboardEntry.findUnique.mockResolvedValue(null);
      mockPrisma.leaderboardEntry.findFirst.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        currentStreak: 0,
        bestStreak: 0,
        lastPlayedDate: null,
      });

      // leaderboard position: 0 players scored higher
      mockPrisma.leaderboardEntry.count
        .mockResolvedValueOnce(0)   // higherCorrectCount
        .mockResolvedValueOnce(10)  // totalPlayersToday
        .mockResolvedValueOnce(7);  // lowerCount

      const result = await service.submitDailySet('user-1', 'ds-1', makeDto());

      expect(result.leaderboardPosition).toBe(1);
      expect(result.correctPercent).toBe(50); // 1/2 * 100
      expect(result.percentile).toBe(70); // 7/10 * 100
      expect(result.totalPlayers).toBe(10);
    });

    it('returns 100 percentile when no other players', async () => {
      mockPrisma.dailySet.findUnique.mockResolvedValue(dailySet);
      mockPrisma.leaderboardEntry.findUnique.mockResolvedValue(null);
      mockPrisma.leaderboardEntry.findFirst.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        currentStreak: 0,
        bestStreak: 0,
        lastPlayedDate: null,
      });

      mockPrisma.leaderboardEntry.count
        .mockResolvedValueOnce(0)  // higherCorrectCount
        .mockResolvedValueOnce(0)  // totalPlayersToday
        .mockResolvedValueOnce(0); // lowerCount

      const result = await service.submitDailySet('user-1', 'ds-1', makeDto());

      expect(result.percentile).toBe(100);
    });
  });
});
