import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AdminQuestionsService } from '../admin-questions.service';
import { PrismaService } from '@/prisma/prisma.service';

describe('AdminQuestionsService', () => {
  let service: AdminQuestionsService;

  const mockPrisma = {
    question: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      updateMany: jest.fn(),
    },
    category: {
      findUnique: jest.fn(),
    },
    questionCategory: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminQuestionsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AdminQuestionsService>(AdminQuestionsService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns paginated questions', async () => {
      mockPrisma.question.findMany.mockResolvedValue([{ id: 'q-1' }]);
      mockPrisma.question.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 20 } as any);

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('applies status filter', async () => {
      mockPrisma.question.findMany.mockResolvedValue([]);
      mockPrisma.question.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 20, status: 'approved' } as any);

      expect(mockPrisma.question.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'approved' }),
        }),
      );
    });

    it('applies search filter with insensitive mode', async () => {
      mockPrisma.question.findMany.mockResolvedValue([]);
      mockPrisma.question.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 20, search: 'sun' } as any);

      expect(mockPrisma.question.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            statement: { contains: 'sun', mode: 'insensitive' },
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('returns question with relations', async () => {
      const question = { id: 'q-1', statement: 'test', category: {}, dailySets: [] };
      mockPrisma.question.findUnique.mockResolvedValue(question);

      const result = await service.findOne('q-1');

      expect(result).toEqual(question);
    });

    it('throws NotFoundException if not found', async () => {
      mockPrisma.question.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('creates question with moderation status', async () => {
      const createdQuestion = { id: 'q-new', status: 'moderation', category: {}, categories: [], dailySets: [] };
      mockPrisma.category.findUnique.mockResolvedValue({ id: 'cat-1' });
      mockPrisma.question.create.mockResolvedValue({ id: 'q-new', status: 'moderation' });
      mockPrisma.questionCategory.createMany.mockResolvedValue({ count: 1 });
      mockPrisma.question.findUnique.mockResolvedValue(createdQuestion);

      const result = await service.create({
        statement: 'The Earth is round',
        isTrue: true,
        explanation: 'Confirmed by science',
        source: 'NASA',
        language: 'en',
        categoryId: 'cat-1',
        difficulty: 2,
      } as any);

      expect(result.status).toBe('moderation');
      expect(mockPrisma.question.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'moderation' }),
        }),
      );
      expect(mockPrisma.questionCategory.createMany).toHaveBeenCalled();
    });

    it('throws BadRequestException if category not found', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);

      await expect(
        service.create({
          statement: 'test',
          isTrue: true,
          explanation: 'e',
          source: 's',
          language: 'ru',
          categoryId: 'nonexistent',
          difficulty: 3,
        } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('updates existing question', async () => {
      const updatedQuestion = { id: 'q-1', statement: 'updated', category: {}, categories: [], dailySets: [] };
      mockPrisma.question.findUnique
        .mockResolvedValueOnce({ id: 'q-1' }) // existence check
        .mockResolvedValueOnce(updatedQuestion); // findOne after update
      mockPrisma.question.update.mockResolvedValue({ id: 'q-1', statement: 'updated' });

      const result = await service.update('q-1', { statement: 'updated' } as any);

      expect(result.statement).toBe('updated');
    });

    it('throws NotFoundException if question not found', async () => {
      mockPrisma.question.findUnique.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { statement: 'x' } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('validates category when categoryId provided', async () => {
      mockPrisma.question.findUnique.mockResolvedValue({ id: 'q-1' });
      mockPrisma.category.findUnique.mockResolvedValue(null);

      await expect(
        service.update('q-1', { categoryId: 'bad-cat' } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('deletes question and returns confirmation', async () => {
      mockPrisma.question.findUnique.mockResolvedValue({ id: 'q-1' });
      mockPrisma.question.delete.mockResolvedValue({});

      const result = await service.remove('q-1');

      expect(result).toEqual({ deleted: true });
    });

    it('throws NotFoundException if question not found', async () => {
      mockPrisma.question.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('approve', () => {
    it('sets status to approved', async () => {
      mockPrisma.question.findUnique.mockResolvedValue({ id: 'q-1' });
      mockPrisma.question.update.mockResolvedValue({ id: 'q-1', status: 'approved' });

      const result = await service.approve('q-1');

      expect(result.status).toBe('approved');
      expect(mockPrisma.question.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'approved' },
        }),
      );
    });

    it('throws NotFoundException if question not found', async () => {
      mockPrisma.question.findUnique.mockResolvedValue(null);

      await expect(service.approve('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('reject', () => {
    it('sets status to rejected', async () => {
      mockPrisma.question.findUnique.mockResolvedValue({ id: 'q-1' });
      mockPrisma.question.update.mockResolvedValue({ id: 'q-1', status: 'rejected' });

      const result = await service.reject('q-1');

      expect(result.status).toBe('rejected');
    });
  });

  describe('bulkApprove', () => {
    it('approves multiple questions at once', async () => {
      mockPrisma.question.updateMany.mockResolvedValue({ count: 3 });

      const result = await service.bulkApprove(['q-1', 'q-2', 'q-3']);

      expect(result.approvedCount).toBe(3);
      expect(result.requestedCount).toBe(3);
    });

    it('throws BadRequestException for empty ids array', async () => {
      await expect(service.bulkApprove([])).rejects.toThrow(
        BadRequestException,
      );
    });

    it('returns correct count when some ids do not exist', async () => {
      mockPrisma.question.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.bulkApprove(['q-1', 'q-nonexistent']);

      expect(result.approvedCount).toBe(1);
      expect(result.requestedCount).toBe(2);
    });
  });
});
