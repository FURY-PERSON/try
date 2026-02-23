import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { AdminCategoriesService } from '../admin-categories.service';
import { PrismaService } from '@/prisma/prisma.service';

describe('AdminCategoriesService', () => {
  let service: AdminCategoriesService;

  const mockPrisma = {
    category: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminCategoriesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AdminCategoriesService>(AdminCategoriesService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns all categories with question count', async () => {
      const categories = [
        { id: '1', name: 'Наука', _count: { questions: 10 } },
      ];
      mockPrisma.category.findMany.mockResolvedValue(categories);

      const result = await service.findAll();

      expect(result).toEqual(categories);
      expect(mockPrisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { sortOrder: 'asc' },
          include: { _count: { select: { questions: true } } },
        }),
      );
    });
  });

  describe('create', () => {
    it('creates category successfully', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);
      mockPrisma.category.create.mockResolvedValue({
        id: '1',
        name: 'Наука',
        slug: 'science',
      });

      const result = await service.create({
        name: 'Наука',
        nameEn: 'Science',
        slug: 'science',
        icon: '🔬',
      } as any);

      expect(result.slug).toBe('science');
    });

    it('throws ConflictException for duplicate slug', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.create({
          name: 'Наука',
          nameEn: 'Science',
          slug: 'science',
          icon: '🔬',
        } as any),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('updates existing category', async () => {
      mockPrisma.category.findUnique
        .mockResolvedValueOnce({ id: '1', slug: 'science' })  // existing check
        .mockResolvedValueOnce(null);  // slug uniqueness check (not called since slug unchanged)

      mockPrisma.category.update.mockResolvedValue({ id: '1', name: 'Updated' });

      const result = await service.update('1', { name: 'Updated' } as any);

      expect(result.name).toBe('Updated');
    });

    it('throws NotFoundException if category not found', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { name: 'X' } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException for duplicate slug on update', async () => {
      mockPrisma.category.findUnique
        .mockResolvedValueOnce({ id: '1', slug: 'old-slug' })
        .mockResolvedValueOnce({ id: '2', slug: 'taken-slug' });

      await expect(
        service.update('1', { slug: 'taken-slug' } as any),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('deletes category with no questions', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({
        id: '1',
        name: 'Empty',
        _count: { questions: 0 },
      });
      mockPrisma.category.delete.mockResolvedValue({});

      const result = await service.remove('1');

      expect(result).toEqual({ deleted: true });
    });

    it('throws NotFoundException if category not found', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ConflictException if category has questions', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({
        id: '1',
        name: 'Science',
        _count: { questions: 5 },
      });

      await expect(service.remove('1')).rejects.toThrow(ConflictException);
    });
  });
});
