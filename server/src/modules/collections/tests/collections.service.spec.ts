import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CollectionsService } from '../collections.service';
import { PrismaService } from '@/prisma/prisma.service';

describe('CollectionsService', () => {
  let service: CollectionsService;

  const mockTx = {
    userQuestionHistory: { createMany: jest.fn() },
    question: { findUnique: jest.fn(), update: jest.fn() },
    user: { update: jest.fn() },
    userCollectionProgress: { create: jest.fn() },
  };

  const mockPrisma = {
    category: { findUnique: jest.fn() },
    collection: { findUnique: jest.fn() },
    question: { findMany: jest.fn() },
    userQuestionHistory: { findMany: jest.fn().mockResolvedValue([]), createMany: jest.fn() },
    user: { update: jest.fn() },
    userCollectionProgress: { create: jest.fn() },
    $transaction: jest.fn((fn: (tx: typeof mockTx) => Promise<void>) => fn(mockTx)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CollectionsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CollectionsService>(CollectionsService);
    jest.clearAllMocks();
  });

  describe('start — by category', () => {
    it('returns questions for a valid category', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({
        id: 'cat-1',
        isActive: true,
      });
      mockPrisma.question.findMany.mockResolvedValue([
        { id: 'q-1', statement: 'S1', language: 'ru', categoryId: 'cat-1', difficulty: 2, illustrationUrl: null },
        { id: 'q-2', statement: 'S2', language: 'ru', categoryId: 'cat-1', difficulty: 3, illustrationUrl: null },
      ]);

      const result = await service.start('user-1', {
        type: 'category',
        categoryId: 'cat-1',
        count: 10,
      });

      expect(result.sessionId).toBeTruthy();
      expect(result.questions).toHaveLength(2);
      expect(result.questions[0]).not.toHaveProperty('isTrue');
    });

    it('throws NotFoundException if category not found', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);

      await expect(
        service.start('user-1', { type: 'category', categoryId: 'bad' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException if no questions available', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({
        id: 'cat-1',
        isActive: true,
      });
      mockPrisma.question.findMany.mockResolvedValue([]);

      await expect(
        service.start('user-1', { type: 'category', categoryId: 'cat-1' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('start — by difficulty', () => {
    it('returns questions for easy difficulty', async () => {
      mockPrisma.question.findMany.mockResolvedValue([
        { id: 'q-1', statement: 'S1', language: 'ru', categoryId: 'c1', difficulty: 1, illustrationUrl: null },
      ]);

      const result = await service.start('user-1', {
        type: 'difficulty',
        difficulty: 'easy',
      });

      expect(result.sessionId).toBeTruthy();
      expect(result.questions).toHaveLength(1);
    });

    it('throws BadRequestException for invalid difficulty', async () => {
      await expect(
        service.start('user-1', { type: 'difficulty', difficulty: 'extreme' as any }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('start — by collection', () => {
    it('returns questions for a published collection', async () => {
      mockPrisma.collection.findUnique.mockResolvedValue({
        id: 'col-1',
        status: 'published',
        startDate: null,
        endDate: null,
        questions: [
          { sortOrder: 1, question: { id: 'q-1', statement: 'S1', language: 'en', categoryId: 'c', difficulty: 3, illustrationUrl: null } },
        ],
      });

      const result = await service.start('user-1', {
        type: 'collection',
        collectionId: 'col-1',
      });

      expect(result.sessionId).toBeTruthy();
      expect(result.questions).toHaveLength(1);
    });

    it('throws NotFoundException if collection is draft', async () => {
      mockPrisma.collection.findUnique.mockResolvedValue({
        id: 'col-1',
        status: 'draft',
        questions: [],
      });

      await expect(
        service.start('user-1', { type: 'collection', collectionId: 'col-1' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('submit', () => {
    it('records results and returns score', async () => {
      // First start a session
      mockPrisma.category.findUnique.mockResolvedValue({ id: 'cat-1', isActive: true });
      mockPrisma.question.findMany.mockResolvedValue([
        { id: 'q-1', statement: 'S1', language: 'ru', categoryId: 'cat-1', difficulty: 2, illustrationUrl: null },
      ]);

      const { sessionId } = await service.start('user-1', {
        type: 'category',
        categoryId: 'cat-1',
      });

      // Setup transaction mocks
      mockTx.question.findUnique.mockResolvedValue({
        id: 'q-1',
        timesShown: 10,
        timesCorrect: 5,
        avgTimeSeconds: 8,
      });

      const result = await service.submit('user-1', sessionId, {
        results: [
          { questionId: 'q-1', result: 'correct', timeSpentSeconds: 5 },
        ],
      });

      expect(result.correctAnswers).toBe(1);
      expect(result.totalQuestions).toBe(1);
      expect(result.score).toBe(145); // 100 + max(0, 50-5)
      expect(mockTx.userQuestionHistory.createMany).toHaveBeenCalled();
      expect(mockTx.userCollectionProgress.create).toHaveBeenCalled();
    });

    it('throws NotFoundException for invalid session', async () => {
      await expect(
        service.submit('user-1', 'invalid-session', {
          results: [{ questionId: 'q-1', result: 'correct', timeSpentSeconds: 5 }],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException if session belongs to different user', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({ id: 'cat-1', isActive: true });
      mockPrisma.question.findMany.mockResolvedValue([
        { id: 'q-1', statement: 'S1', language: 'ru', categoryId: 'cat-1', difficulty: 2, illustrationUrl: null },
      ]);

      const { sessionId } = await service.start('user-1', {
        type: 'category',
        categoryId: 'cat-1',
      });

      await expect(
        service.submit('user-2', sessionId, {
          results: [{ questionId: 'q-1', result: 'correct', timeSpentSeconds: 5 }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException for question not in session', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({ id: 'cat-1', isActive: true });
      mockPrisma.question.findMany.mockResolvedValue([
        { id: 'q-1', statement: 'S1', language: 'ru', categoryId: 'cat-1', difficulty: 2, illustrationUrl: null },
      ]);

      const { sessionId } = await service.start('user-1', {
        type: 'category',
        categoryId: 'cat-1',
      });

      await expect(
        service.submit('user-1', sessionId, {
          results: [{ questionId: 'q-999', result: 'correct', timeSpentSeconds: 5 }],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
