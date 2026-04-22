import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import {
  DailyLoginBonusService,
  lookupReward,
  parseLocalDate,
  sameDay,
  isConsecutiveDay,
} from '../daily-login-bonus.service';

type MockUserRow = {
  shields: number;
  currentStreak: number;
  loginStreak: number;
  bestLoginStreak: number;
  lastLoginDate: Date | null;
};

describe('DailyLoginBonusService', () => {
  let service: DailyLoginBonusService;

  const mockUser: MockUserRow = {
    shields: 5,
    currentStreak: 3,
    loginStreak: 0,
    bestLoginStreak: 0,
    lastLoginDate: null,
  };

  let storedUser: MockUserRow;

  const mockPrisma: any = {
    featureFlag: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  mockPrisma.$transaction.mockImplementation((cb: any) => cb(mockPrisma));

  const enabledPayload = {
    isEnabled: true,
    payload: {
      rewards: [
        { day: 1, shields: 1, streak: 0 },
        { day: 2, shields: 1, streak: 1 },
        { day: 3, shields: 2, streak: 1 },
        { day: 4, shields: 2, streak: 2 },
      ],
      capShields: 10,
      capStreak: 10,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DailyLoginBonusService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<DailyLoginBonusService>(DailyLoginBonusService);
    jest.clearAllMocks();

    storedUser = { ...mockUser };
    mockPrisma.featureFlag.findUnique.mockResolvedValue(enabledPayload);
    mockPrisma.user.findUnique.mockImplementation(async () => ({ ...storedUser }));
    mockPrisma.user.update.mockImplementation(async ({ data }: any) => {
      if (data.shields?.increment !== undefined)
        storedUser.shields += data.shields.increment;
      if (data.currentStreak?.increment !== undefined)
        storedUser.currentStreak += data.currentStreak.increment;
      if (data.loginStreak !== undefined) storedUser.loginStreak = data.loginStreak;
      if (data.bestLoginStreak !== undefined)
        storedUser.bestLoginStreak = data.bestLoginStreak;
      if (data.lastLoginDate !== undefined) storedUser.lastLoginDate = data.lastLoginDate;
      return {
        shields: storedUser.shields,
        currentStreak: storedUser.currentStreak,
      };
    });
    mockPrisma.$transaction.mockImplementation((cb: any) => cb(mockPrisma));
  });

  describe('claim', () => {
    it('начисляет день 1 при первом заходе', async () => {
      const result = await service.claim('u1', '2026-04-22');

      expect(result.claimed).toBe(true);
      expect(result.dayInStreak).toBe(1);
      expect(result.rewardToday).toEqual({ shields: 1, streak: 0 });
      expect(result.rewardTomorrow).toEqual({ shields: 1, streak: 1 });
      expect(storedUser.shields).toBe(6);
      expect(storedUser.currentStreak).toBe(3);
      expect(storedUser.loginStreak).toBe(1);
      expect(storedUser.bestLoginStreak).toBe(1);
    });

    it('увеличивает streak, если пользователь заходил вчера', async () => {
      storedUser.lastLoginDate = parseLocalDate('2026-04-21');
      storedUser.loginStreak = 1;
      storedUser.bestLoginStreak = 1;

      const result = await service.claim('u1', '2026-04-22');

      expect(result.claimed).toBe(true);
      expect(result.dayInStreak).toBe(2);
      expect(result.rewardToday).toEqual({ shields: 1, streak: 1 });
      expect(storedUser.loginStreak).toBe(2);
      expect(storedUser.currentStreak).toBe(4); // +1 от награды
    });

    it('сбрасывает streak после пропуска дня', async () => {
      storedUser.lastLoginDate = parseLocalDate('2026-04-19');
      storedUser.loginStreak = 5;
      storedUser.bestLoginStreak = 5;

      const result = await service.claim('u1', '2026-04-22');

      expect(result.claimed).toBe(true);
      expect(result.dayInStreak).toBe(1);
      expect(storedUser.loginStreak).toBe(1);
      expect(storedUser.bestLoginStreak).toBe(5); // best не уменьшается
    });

    it('при повторном claim в тот же день возвращает claimed:false и не меняет state', async () => {
      storedUser.lastLoginDate = parseLocalDate('2026-04-22');
      storedUser.loginStreak = 3;
      storedUser.shields = 7;
      storedUser.currentStreak = 4;

      const result = await service.claim('u1', '2026-04-22');

      expect(result.claimed).toBe(false);
      expect(result.disabled).toBe(false);
      expect(result.dayInStreak).toBe(3);
      expect(result.shields).toBe(7);
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('возвращает disabled:true, если feature flag выключен', async () => {
      mockPrisma.featureFlag.findUnique.mockResolvedValue({
        isEnabled: false,
        payload: enabledPayload.payload,
      });

      const result = await service.claim('u1', '2026-04-22');

      expect(result.claimed).toBe(false);
      expect(result.disabled).toBe(true);
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('бросает BadRequest при некорректной дате', async () => {
      await expect(service.claim('u1', '22.04.2026')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('при дне вне таблицы применяет капы (последняя запись)', async () => {
      storedUser.lastLoginDate = parseLocalDate('2026-04-21');
      storedUser.loginStreak = 20; // после инкремента будет 21 — вне таблицы

      const result = await service.claim('u1', '2026-04-22');

      expect(result.dayInStreak).toBe(21);
      // последняя запись в payload — день 4 (2/2), но capShields=10 / capStreak=10 не срежут их
      expect(result.rewardToday).toEqual({ shields: 2, streak: 2 });
    });
  });

  describe('sameDay', () => {
    it('true для одинаковых дат', () => {
      expect(sameDay(parseLocalDate('2026-04-22'), parseLocalDate('2026-04-22'))).toBe(
        true,
      );
    });
    it('false для разных', () => {
      expect(sameDay(parseLocalDate('2026-04-22'), parseLocalDate('2026-04-23'))).toBe(
        false,
      );
    });
  });

  describe('isConsecutiveDay', () => {
    it('true для последовательных дней', () => {
      expect(
        isConsecutiveDay(parseLocalDate('2026-04-21'), parseLocalDate('2026-04-22')),
      ).toBe(true);
    });
    it('false при пропуске', () => {
      expect(
        isConsecutiveDay(parseLocalDate('2026-04-20'), parseLocalDate('2026-04-22')),
      ).toBe(false);
    });
    it('false при заходе в тот же день', () => {
      expect(
        isConsecutiveDay(parseLocalDate('2026-04-22'), parseLocalDate('2026-04-22')),
      ).toBe(false);
    });
    it('корректно работает через месяц', () => {
      expect(
        isConsecutiveDay(parseLocalDate('2026-04-30'), parseLocalDate('2026-05-01')),
      ).toBe(true);
    });
  });

  describe('lookupReward', () => {
    const config = {
      isEnabled: true,
      rewards: [
        { day: 1, shields: 1, streak: 0 },
        { day: 2, shields: 1, streak: 1 },
      ],
      capShields: 10,
      capStreak: 10,
    };

    it('возвращает точную запись дня', () => {
      expect(lookupReward(config, 1)).toEqual({ shields: 1, streak: 0 });
      expect(lookupReward(config, 2)).toEqual({ shields: 1, streak: 1 });
    });

    it('при дне больше массива — возвращает последнюю запись', () => {
      expect(lookupReward(config, 5)).toEqual({ shields: 1, streak: 1 });
    });

    it('режет значения по капам', () => {
      const capped = { ...config, capShields: 0, capStreak: 0 };
      expect(lookupReward(capped, 1)).toEqual({ shields: 0, streak: 0 });
    });

    it('использует fallback-формулу если rewards пуст', () => {
      const empty = {
        isEnabled: true,
        rewards: [],
        capShields: 10,
        capStreak: 10,
      };
      expect(lookupReward(empty, 1)).toEqual({ shields: 1, streak: 0 });
      expect(lookupReward(empty, 4)).toEqual({ shields: 2, streak: 2 });
    });
  });
});
