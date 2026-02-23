import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from '../users.service';
import { PrismaService } from '@/prisma/prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    userQuestionHistory: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    leaderboardEntry: {
      aggregate: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('register', () => {
    it('returns existing user if deviceId already registered', async () => {
      const existingUser = { id: '1', deviceId: 'device-123' };
      mockPrisma.user.findUnique.mockResolvedValue(existingUser);

      const result = await service.register('device-123');

      expect(result).toEqual(existingUser);
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('creates new user if deviceId not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const newUser = { id: '2', deviceId: 'device-new' };
      mockPrisma.user.create.mockResolvedValue(newUser);

      const result = await service.register('device-new');

      expect(result).toEqual(newUser);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: { deviceId: 'device-new' },
      });
    });
  });

  describe('updateUser', () => {
    it('throws NotFoundException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.updateUser('nonexistent', { nickname: 'test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('updates only provided fields', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1' });
      mockPrisma.user.update.mockResolvedValue({ id: '1', nickname: 'newname' });

      await service.updateUser('1', { nickname: 'newname' });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { nickname: 'newname' },
      });
    });

    it('updates multiple fields', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1' });
      mockPrisma.user.update.mockResolvedValue({});

      await service.updateUser('1', {
        nickname: 'test',
        language: 'en',
        pushEnabled: false,
      });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          nickname: 'test',
          language: 'en',
          pushEnabled: false,
        },
      });
    });
  });

  describe('getUserStats', () => {
    it('throws NotFoundException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getUserStats('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns correct stats', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        totalGamesPlayed: 50,
        bestStreak: 14,
      });

      mockPrisma.userQuestionHistory.count
        .mockResolvedValueOnce(50) // total
        .mockResolvedValueOnce(40); // correct

      mockPrisma.leaderboardEntry.aggregate.mockResolvedValue({
        _avg: { score: 85.5 },
      });

      mockPrisma.leaderboardEntry.findMany.mockResolvedValue([
        { dailySet: { date: new Date('2026-02-20') } },
        { dailySet: { date: new Date('2026-02-21') } },
      ]);

      mockPrisma.userQuestionHistory.findMany.mockResolvedValue([
        { answeredAt: new Date('2026-02-20T10:00:00Z') },
        { answeredAt: new Date('2026-02-21T15:00:00Z') },
      ]);

      const stats = await service.getUserStats('user-1');

      expect(stats.totalGames).toBe(50);
      expect(stats.correctPercent).toBe(80);
      expect(stats.bestStreak).toBe(14);
      expect(stats.avgScore).toBe(85.5);
      expect(stats.activityMap).toBeDefined();
    });

    it('returns 0% when no games played', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        totalGamesPlayed: 0,
        bestStreak: 0,
      });

      mockPrisma.userQuestionHistory.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      mockPrisma.leaderboardEntry.aggregate.mockResolvedValue({
        _avg: { score: null },
      });

      mockPrisma.leaderboardEntry.findMany.mockResolvedValue([]);
      mockPrisma.userQuestionHistory.findMany.mockResolvedValue([]);

      const stats = await service.getUserStats('user-1');

      expect(stats.correctPercent).toBe(0);
      expect(stats.avgScore).toBe(0);
      expect(stats.activityMap).toEqual({});
    });
  });

  describe('findByDeviceId', () => {
    it('returns user if found', async () => {
      const user = { id: '1', deviceId: 'device-1' };
      mockPrisma.user.findUnique.mockResolvedValue(user);

      const result = await service.findByDeviceId('device-1');

      expect(result).toEqual(user);
    });

    it('returns null if not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await service.findByDeviceId('unknown');

      expect(result).toBeNull();
    });
  });
});
