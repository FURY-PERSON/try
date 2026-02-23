import { Test, TestingModule } from '@nestjs/testing';
import { HomeService } from '../home.service';
import { PrismaService } from '@/prisma/prisma.service';

describe('HomeService', () => {
  let service: HomeService;

  const mockPrisma = {
    dailySet: {
      findUnique: jest.fn(),
    },
    leaderboardEntry: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
    },
    question: {
      count: jest.fn(),
    },
    collection: {
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HomeService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<HomeService>(HomeService);
    jest.clearAllMocks();
  });

  describe('getFeed', () => {
    it('returns full feed with all sections', async () => {
      // Daily set
      mockPrisma.dailySet.findUnique.mockResolvedValue({
        id: 'ds-1',
        date: new Date(),
        theme: 'Наука',
        themeEn: 'Science',
        status: 'published',
      });
      mockPrisma.leaderboardEntry.findUnique.mockResolvedValue(null);
      mockPrisma.leaderboardEntry.findFirst.mockResolvedValue(null);

      // Categories
      mockPrisma.category.findMany.mockResolvedValue([
        {
          id: 'cat-1', name: 'Наука', nameEn: 'Science',
          slug: 'science', icon: '🔬', color: '#34C759',
          description: '', descriptionEn: '', imageUrl: null,
        },
      ]);
      mockPrisma.question.count.mockResolvedValue(25);

      // Collections
      mockPrisma.collection.findMany.mockResolvedValue([
        {
          id: 'col-1', title: 'Мифы', titleEn: 'Myths',
          description: '', descriptionEn: '',
          icon: '💊', imageUrl: null, type: 'featured',
          _count: { questions: 10 },
        },
      ]);

      // User
      mockPrisma.user.findUnique.mockResolvedValue({ currentStreak: 3 });

      const result = await service.getFeed('user-1');

      expect(result.daily.set).toBeTruthy();
      expect(result.daily.isLocked).toBe(false);
      expect(result.categories).toHaveLength(1);
      expect(result.categories[0].availableCount).toBe(25);
      expect(result.collections).toHaveLength(1);
      expect(result.userProgress.streak).toBe(3);
    });

    it('returns locked daily when user played recently', async () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      mockPrisma.dailySet.findUnique.mockResolvedValue({
        id: 'ds-1', date: new Date(), theme: 'T', themeEn: 'T', status: 'published',
      });
      mockPrisma.leaderboardEntry.findUnique.mockResolvedValue({
        score: 800,
        correctAnswers: 10,
        totalTimeSeconds: 120,
        createdAt: threeDaysAgo,
      });

      mockPrisma.category.findMany.mockResolvedValue([]);
      mockPrisma.collection.findMany.mockResolvedValue([]);
      mockPrisma.user.findUnique.mockResolvedValue({ currentStreak: 1 });

      const result = await service.getFeed('user-1');

      expect(result.daily.isLocked).toBe(true);
      expect(result.daily.unlocksAt).toBeTruthy();
      expect(result.daily.lastResult).toBeTruthy();
    });

    it('returns null daily set when none exists', async () => {
      mockPrisma.dailySet.findUnique.mockResolvedValue(null);
      mockPrisma.leaderboardEntry.findFirst.mockResolvedValue(null);

      mockPrisma.category.findMany.mockResolvedValue([]);
      mockPrisma.collection.findMany.mockResolvedValue([]);
      mockPrisma.user.findUnique.mockResolvedValue({ currentStreak: 0 });

      const result = await service.getFeed('user-1');

      expect(result.daily.set).toBeNull();
      expect(result.daily.isLocked).toBe(false);
    });

    it('returns empty collections when none are published', async () => {
      mockPrisma.dailySet.findUnique.mockResolvedValue(null);
      mockPrisma.leaderboardEntry.findFirst.mockResolvedValue(null);

      mockPrisma.category.findMany.mockResolvedValue([]);
      mockPrisma.collection.findMany.mockResolvedValue([]);
      mockPrisma.user.findUnique.mockResolvedValue({ currentStreak: 0 });

      const result = await service.getFeed('user-1');

      expect(result.collections).toHaveLength(0);
    });
  });
});
