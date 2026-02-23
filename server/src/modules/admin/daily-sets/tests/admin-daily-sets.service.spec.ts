import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { AdminDailySetsService } from '../admin-daily-sets.service';
import { PrismaService } from '@/prisma/prisma.service';

describe('AdminDailySetsService', () => {
  let service: AdminDailySetsService;

  const mockPrisma = {
    dailySet: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    question: {
      findMany: jest.fn(),
    },
    dailySetQuestion: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminDailySetsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AdminDailySetsService>(AdminDailySetsService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns paginated daily sets', async () => {
      mockPrisma.dailySet.findMany.mockResolvedValue([{ id: 'ds-1' }]);
      mockPrisma.dailySet.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 20 } as any);

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('applies status filter', async () => {
      mockPrisma.dailySet.findMany.mockResolvedValue([]);
      mockPrisma.dailySet.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 20, status: 'published' } as any);

      expect(mockPrisma.dailySet.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'published' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('returns daily set with questions', async () => {
      const ds = { id: 'ds-1', questions: [], _count: { leaderboardEntries: 5 } };
      mockPrisma.dailySet.findUnique.mockResolvedValue(ds);

      const result = await service.findOne('ds-1');

      expect(result).toEqual(ds);
    });

    it('throws NotFoundException if not found', async () => {
      mockPrisma.dailySet.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('creates daily set with questions', async () => {
      mockPrisma.dailySet.findUnique.mockResolvedValue(null);
      mockPrisma.question.findMany.mockResolvedValue([
        { id: 'q-1' },
        { id: 'q-2' },
      ]);
      mockPrisma.dailySet.create.mockResolvedValue({
        id: 'ds-new',
        date: new Date('2026-03-01'),
      });

      const result = await service.create({
        date: '2026-03-01',
        theme: 'Тест',
        themeEn: 'Test',
        questionIds: ['q-1', 'q-2'],
      } as any);

      expect(result.id).toBe('ds-new');
    });

    it('throws ConflictException for duplicate date', async () => {
      mockPrisma.dailySet.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.create({
          date: '2026-03-01',
          theme: 'T',
          themeEn: 'T',
          questionIds: ['q-1'],
        } as any),
      ).rejects.toThrow(ConflictException);
    });

    it('throws BadRequestException if some questions not found/approved', async () => {
      mockPrisma.dailySet.findUnique.mockResolvedValue(null);
      mockPrisma.question.findMany.mockResolvedValue([{ id: 'q-1' }]); // only 1 of 2 found

      await expect(
        service.create({
          date: '2026-03-01',
          theme: 'T',
          themeEn: 'T',
          questionIds: ['q-1', 'q-missing'],
        } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('updates theme fields', async () => {
      mockPrisma.dailySet.findUnique.mockResolvedValue({ id: 'ds-1' });
      mockPrisma.dailySet.update.mockResolvedValue({ id: 'ds-1', theme: 'Новая' });

      const result = await service.update('ds-1', { theme: 'Новая' } as any);

      expect(result.theme).toBe('Новая');
    });

    it('throws NotFoundException if not found', async () => {
      mockPrisma.dailySet.findUnique.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { theme: 'X' } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException for duplicate date on update', async () => {
      mockPrisma.dailySet.findUnique.mockResolvedValue({ id: 'ds-1' });
      mockPrisma.dailySet.findFirst.mockResolvedValue({ id: 'ds-other' });

      await expect(
        service.update('ds-1', { date: '2026-03-01' } as any),
      ).rejects.toThrow(ConflictException);
    });

    it('replaces questions when questionIds provided', async () => {
      mockPrisma.dailySet.findUnique.mockResolvedValue({ id: 'ds-1' });
      mockPrisma.question.findMany.mockResolvedValue([{ id: 'q-3' }, { id: 'q-4' }]);
      mockPrisma.dailySetQuestion.deleteMany.mockResolvedValue({});
      mockPrisma.dailySetQuestion.createMany.mockResolvedValue({});
      mockPrisma.dailySet.update.mockResolvedValue({ id: 'ds-1' });

      await service.update('ds-1', { questionIds: ['q-3', 'q-4'] } as any);

      expect(mockPrisma.dailySetQuestion.deleteMany).toHaveBeenCalledWith({
        where: { dailySetId: 'ds-1' },
      });
      expect(mockPrisma.dailySetQuestion.createMany).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deletes daily set', async () => {
      mockPrisma.dailySet.findUnique.mockResolvedValue({ id: 'ds-1' });
      mockPrisma.dailySet.delete.mockResolvedValue({});

      const result = await service.remove('ds-1');

      expect(result).toEqual({ deleted: true });
    });

    it('throws NotFoundException if not found', async () => {
      mockPrisma.dailySet.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
