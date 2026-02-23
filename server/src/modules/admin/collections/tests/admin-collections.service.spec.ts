import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AdminCollectionsService } from '../admin-collections.service';
import { PrismaService } from '@/prisma/prisma.service';

describe('AdminCollectionsService', () => {
  let service: AdminCollectionsService;

  const mockPrisma = {
    collection: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    question: {
      findMany: jest.fn(),
    },
    collectionQuestion: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminCollectionsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AdminCollectionsService>(AdminCollectionsService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns paginated collections', async () => {
      mockPrisma.collection.findMany.mockResolvedValue([{ id: 'col-1' }]);
      mockPrisma.collection.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 20 } as any);

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('applies status filter', async () => {
      mockPrisma.collection.findMany.mockResolvedValue([]);
      mockPrisma.collection.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 20, status: 'published' } as any);

      expect(mockPrisma.collection.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'published' }),
        }),
      );
    });

    it('applies type filter', async () => {
      mockPrisma.collection.findMany.mockResolvedValue([]);
      mockPrisma.collection.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 20, type: 'featured' } as any);

      expect(mockPrisma.collection.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'featured' }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('returns collection with questions', async () => {
      const col = { id: 'col-1', questions: [], title: 'Test' };
      mockPrisma.collection.findUnique.mockResolvedValue(col);

      const result = await service.findOne('col-1');

      expect(result).toEqual(col);
    });

    it('throws NotFoundException if not found', async () => {
      mockPrisma.collection.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('creates collection with questions', async () => {
      mockPrisma.question.findMany.mockResolvedValue([
        { id: 'q-1' },
        { id: 'q-2' },
      ]);
      mockPrisma.collection.create.mockResolvedValue({
        id: 'col-new',
        title: 'Мифы',
        _count: { questions: 2 },
      });

      const result = await service.create({
        title: 'Мифы',
        titleEn: 'Myths',
        questionIds: ['q-1', 'q-2'],
      } as any);

      expect(result.id).toBe('col-new');
    });

    it('throws BadRequestException if some questions not found', async () => {
      mockPrisma.question.findMany.mockResolvedValue([{ id: 'q-1' }]);

      await expect(
        service.create({
          title: 'T',
          titleEn: 'T',
          questionIds: ['q-1', 'q-missing'],
        } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('updates collection fields', async () => {
      mockPrisma.collection.findUnique.mockResolvedValue({ id: 'col-1' });
      mockPrisma.collection.update.mockResolvedValue({
        id: 'col-1',
        title: 'Updated',
        _count: { questions: 2 },
      });

      const result = await service.update('col-1', { title: 'Updated' } as any);

      expect(result.title).toBe('Updated');
    });

    it('throws NotFoundException if not found', async () => {
      mockPrisma.collection.findUnique.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { title: 'X' } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('replaces questions when questionIds provided', async () => {
      mockPrisma.collection.findUnique.mockResolvedValue({ id: 'col-1' });
      mockPrisma.question.findMany.mockResolvedValue([
        { id: 'q-3' },
        { id: 'q-4' },
      ]);
      mockPrisma.collectionQuestion.deleteMany.mockResolvedValue({});
      mockPrisma.collectionQuestion.createMany.mockResolvedValue({});
      mockPrisma.collection.update.mockResolvedValue({ id: 'col-1' });

      await service.update('col-1', { questionIds: ['q-3', 'q-4'] } as any);

      expect(mockPrisma.collectionQuestion.deleteMany).toHaveBeenCalledWith({
        where: { collectionId: 'col-1' },
      });
      expect(mockPrisma.collectionQuestion.createMany).toHaveBeenCalled();
    });

    it('throws BadRequestException if updated questions not found', async () => {
      mockPrisma.collection.findUnique.mockResolvedValue({ id: 'col-1' });
      mockPrisma.question.findMany.mockResolvedValue([{ id: 'q-3' }]);

      await expect(
        service.update('col-1', { questionIds: ['q-3', 'q-missing'] } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('deletes collection', async () => {
      mockPrisma.collection.findUnique.mockResolvedValue({ id: 'col-1' });
      mockPrisma.collection.delete.mockResolvedValue({});

      const result = await service.remove('col-1');

      expect(result).toEqual({ deleted: true });
    });

    it('throws NotFoundException if not found', async () => {
      mockPrisma.collection.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
