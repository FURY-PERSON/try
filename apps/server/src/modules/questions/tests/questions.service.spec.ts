import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { QuestionsService } from '../questions.service';
import { PrismaService } from '@/prisma/prisma.service';

describe('QuestionsService', () => {
  let service: QuestionsService;

  const mockPrisma = {
    question: {
      count: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
    userQuestionHistory: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<QuestionsService>(QuestionsService);
    jest.clearAllMocks();
  });

  describe('getRandomQuestion', () => {
    it('throws NotFoundException when no questions available', async () => {
      mockPrisma.question.count.mockResolvedValue(0);

      await expect(
        service.getRandomQuestion('user-1', {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('returns a question when available', async () => {
      const question = {
        id: 'q-1',
        type: 'anagram',
        status: 'approved',
        category: { id: 'c-1', name: 'Science' },
      };

      mockPrisma.question.count.mockResolvedValue(1);
      mockPrisma.question.findFirst.mockResolvedValue(question);

      const result = await service.getRandomQuestion('user-1', {});

      expect(result).toEqual(question);
    });

    it('applies language filter', async () => {
      mockPrisma.question.count.mockResolvedValue(1);
      mockPrisma.question.findFirst.mockResolvedValue({ id: 'q-1' });

      await service.getRandomQuestion('user-1', { language: 'ru' });

      expect(mockPrisma.question.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ language: 'ru' }),
        }),
      );
    });

    it('applies type filter', async () => {
      mockPrisma.question.count.mockResolvedValue(1);
      mockPrisma.question.findFirst.mockResolvedValue({ id: 'q-1' });

      await service.getRandomQuestion('user-1', { type: 'anagram' });

      expect(mockPrisma.question.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'anagram' }),
        }),
      );
    });
  });

  describe('answerQuestion', () => {
    const mockQuestion = {
      id: 'q-1',
      difficulty: 3,
      timesShown: 10,
      timesCorrect: 7,
      avgTimeSeconds: 15,
      fact: 'Interesting fact',
      factSource: 'Wikipedia',
      factSourceUrl: 'https://en.wikipedia.org/wiki/Test',
    };

    it('throws NotFoundException if question not found', async () => {
      mockPrisma.question.findUnique.mockResolvedValue(null);

      await expect(
        service.answerQuestion('user-1', 'nonexistent', {
          result: 'correct',
          timeSpentSeconds: 10,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('creates history record', async () => {
      mockPrisma.question.findUnique.mockResolvedValue(mockQuestion);
      mockPrisma.question.update.mockResolvedValue({});
      mockPrisma.user.update.mockResolvedValue({});

      await service.answerQuestion('user-1', 'q-1', {
        result: 'correct',
        timeSpentSeconds: 10,
      });

      expect(mockPrisma.userQuestionHistory.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          questionId: 'q-1',
          result: 'correct',
          timeSpentSeconds: 10,
        },
      });
    });

    it('updates question statistics', async () => {
      mockPrisma.question.findUnique.mockResolvedValue(mockQuestion);
      mockPrisma.question.update.mockResolvedValue({});
      mockPrisma.user.update.mockResolvedValue({});

      await service.answerQuestion('user-1', 'q-1', {
        result: 'correct',
        timeSpentSeconds: 20,
      });

      expect(mockPrisma.question.update).toHaveBeenCalledWith({
        where: { id: 'q-1' },
        data: {
          timesShown: 11,
          timesCorrect: 8,
          avgTimeSeconds: expect.any(Number),
        },
      });
    });

    it('returns fact data on correct answer', async () => {
      mockPrisma.question.findUnique.mockResolvedValue(mockQuestion);
      mockPrisma.question.update.mockResolvedValue({});
      mockPrisma.user.update.mockResolvedValue({});

      const result = await service.answerQuestion('user-1', 'q-1', {
        result: 'correct',
        timeSpentSeconds: 10,
      });

      expect(result.correct).toBe(true);
      expect(result.score).toBeGreaterThan(0);
      expect(result.fact).toBe('Interesting fact');
      expect(result.factSource).toBe('Wikipedia');
    });

    it('returns 0 score for incorrect answer', async () => {
      mockPrisma.question.findUnique.mockResolvedValue(mockQuestion);
      mockPrisma.question.update.mockResolvedValue({});
      mockPrisma.user.update.mockResolvedValue({});

      const result = await service.answerQuestion('user-1', 'q-1', {
        result: 'incorrect',
        timeSpentSeconds: 10,
      });

      expect(result.correct).toBe(false);
      expect(result.score).toBe(0);
    });

    it('increments correct answers count for correct result', async () => {
      mockPrisma.question.findUnique.mockResolvedValue(mockQuestion);
      mockPrisma.question.update.mockResolvedValue({});
      mockPrisma.user.update.mockResolvedValue({});

      await service.answerQuestion('user-1', 'q-1', {
        result: 'correct',
        timeSpentSeconds: 10,
      });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: expect.objectContaining({
          totalGamesPlayed: { increment: 1 },
          totalCorrectAnswers: { increment: 1 },
        }),
      });
    });
  });
});
