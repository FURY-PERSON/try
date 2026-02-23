import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CategoriesService } from '../categories.service';
import { PrismaService } from '@/prisma/prisma.service';

describe('CategoriesService', () => {
  let service: CategoriesService;

  const mockPrisma = {
    category: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    question: {
      count: jest.fn(),
    },
    userQuestionHistory: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    userCollectionProgress: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    jest.clearAllMocks();
  });

  describe('findAllActive', () => {
    it('returns only active categories ordered by sortOrder', async () => {
      const categories = [
        { id: '1', name: 'Наука', isActive: true, sortOrder: 0 },
        { id: '2', name: 'Спорт', isActive: true, sortOrder: 1 },
      ];
      mockPrisma.category.findMany.mockResolvedValue(categories);

      const result = await service.findAllActive();

      expect(result).toEqual(categories);
      expect(mockPrisma.category.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      });
    });

    it('returns empty array when no active categories', async () => {
      mockPrisma.category.findMany.mockResolvedValue([]);

      const result = await service.findAllActive();

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('returns category detail with counts', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({
        id: 'cat-1',
        name: 'Наука',
        isActive: true,
      });
      mockPrisma.question.count
        .mockResolvedValueOnce(20) // totalCount
        .mockResolvedValueOnce(15); // availableCount
      mockPrisma.userCollectionProgress.findFirst.mockResolvedValue(null);

      const result = await service.findById('cat-1', 'user-1');

      expect(result.id).toBe('cat-1');
      expect(result.totalCount).toBe(20);
      expect(result.availableCount).toBe(15);
      expect(result.lastResult).toBeNull();
    });

    it('returns lastResult when user has played', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({
        id: 'cat-1',
        name: 'Наука',
        isActive: true,
      });
      mockPrisma.question.count.mockResolvedValue(10);
      mockPrisma.userCollectionProgress.findFirst.mockResolvedValue({
        correctAnswers: 7,
        totalQuestions: 10,
        completedAt: new Date(),
      });

      const result = await service.findById('cat-1', 'user-1');

      expect(result.lastResult).toBeTruthy();
      expect(result.lastResult!.correctAnswers).toBe(7);
    });

    it('throws NotFoundException if category not found', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);

      await expect(service.findById('nonexistent', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException if category is inactive', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({
        id: 'cat-1',
        isActive: false,
      });

      await expect(service.findById('cat-1', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
