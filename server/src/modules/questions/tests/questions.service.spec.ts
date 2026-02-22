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
        statement: 'Test statement',
        isTrue: true,
        language: 'ru',
        categoryId: 'c-1',
        difficulty: 3,
        illustrationUrl: null,
        status: 'approved',
        category: { id: 'c-1', name: 'Science' },
      };

      mockPrisma.question.count.mockResolvedValue(1);
      mockPrisma.question.findFirst.mockResolvedValue(question);

      const result = await service.getRandomQuestion('user-1', {});

      expect(result.id).toBe('q-1');
      expect(result.statement).toBe('Test statement');
    });

    it('applies language filter', async () => {
      mockPrisma.question.count.mockResolvedValue(1);
      mockPrisma.question.findFirst.mockResolvedValue({
        id: 'q-1',
        statement: 'Test',
        isTrue: true,
        language: 'ru',
        categoryId: 'c-1',
        difficulty: 3,
        illustrationUrl: null,
        category: { id: 'c-1' },
      });

      await service.getRandomQuestion('user-1', { language: 'ru' });

      expect(mockPrisma.question.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ language: 'ru' }),
        }),
      );
    });
  });

  describe('answerQuestion', () => {
    const mockQuestion = {
      id: 'q-1',
      statement: 'The Earth is flat',
      isTrue: false,
      explanation: 'The Earth is actually an oblate spheroid',
      source: 'NASA',
      sourceUrl: 'https://nasa.gov',
      difficulty: 3,
      timesShown: 10,
      timesCorrect: 7,
      avgTimeSeconds: 15,
    };

    it('throws NotFoundException if question not found', async () => {
      mockPrisma.question.findUnique.mockResolvedValue(null);

      await expect(
        service.answerQuestion('user-1', 'nonexistent', {
          userAnswer: false,
          timeSpentSeconds: 10,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('creates history record', async () => {
      mockPrisma.question.findUnique.mockResolvedValue(mockQuestion);
      mockPrisma.question.update.mockResolvedValue({});
      mockPrisma.user.update.mockResolvedValue({});

      await service.answerQuestion('user-1', 'q-1', {
        userAnswer: false,
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
        userAnswer: false,
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

    it('returns explanation data on correct answer', async () => {
      mockPrisma.question.findUnique.mockResolvedValue(mockQuestion);
      mockPrisma.question.update.mockResolvedValue({});
      mockPrisma.user.update.mockResolvedValue({});

      // userAnswer=false matches isTrue=false, so correct
      const result = await service.answerQuestion('user-1', 'q-1', {
        userAnswer: false,
        timeSpentSeconds: 10,
      });

      expect(result.correct).toBe(true);
      expect(result.score).toBeGreaterThan(0);
      expect(result.isTrue).toBe(false);
      expect(result.explanation).toBe('The Earth is actually an oblate spheroid');
      expect(result.source).toBe('NASA');
    });

    it('returns 0 score for incorrect answer', async () => {
      mockPrisma.question.findUnique.mockResolvedValue(mockQuestion);
      mockPrisma.question.update.mockResolvedValue({});
      mockPrisma.user.update.mockResolvedValue({});

      // userAnswer=true but isTrue=false, so incorrect
      const result = await service.answerQuestion('user-1', 'q-1', {
        userAnswer: true,
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
        userAnswer: false,
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
