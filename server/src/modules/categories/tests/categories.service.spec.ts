import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from '../categories.service';
import { PrismaService } from '@/prisma/prisma.service';

describe('CategoriesService', () => {
  let service: CategoriesService;

  const mockPrisma = {
    category: {
      findMany: jest.fn(),
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
});
