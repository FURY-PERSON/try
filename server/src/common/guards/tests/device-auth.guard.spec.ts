import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ExecutionContext } from '@nestjs/common';
import { DeviceAuthGuard } from '../device-auth.guard';
import { PrismaService } from '@/prisma/prisma.service';

describe('DeviceAuthGuard', () => {
  let guard: DeviceAuthGuard;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
    },
    nicknameAdjective: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    nicknameAnimal: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  };

  const createMockContext = (deviceId?: string): ExecutionContext => {
    const request = {
      headers: deviceId ? { 'x-device-id': deviceId } : {},
      user: null,
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeviceAuthGuard,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    guard = module.get<DeviceAuthGuard>(DeviceAuthGuard);
    jest.clearAllMocks();
  });

  it('allows request with valid device-id and existing user', async () => {
    const user = { id: 'user-1', deviceId: 'valid-device-id-12345' };
    mockPrisma.user.findUnique.mockResolvedValue(user);

    const context = createMockContext('valid-device-id-12345');
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    const request = context.switchToHttp().getRequest();
    expect((request as any).user).toEqual(user);
  });

  it('auto-registers new user when device-id not found', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    const newUser = { id: 'user-new', deviceId: 'new-device-12345678', nickname: 'Быстрый Лис', avatarEmoji: '🦊' };
    mockPrisma.user.create.mockResolvedValue(newUser);

    const context = createMockContext('new-device-12345678');
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ deviceId: 'new-device-12345678' }),
    });
  });

  it('throws UnauthorizedException when header missing', async () => {
    const context = createMockContext();

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('throws UnauthorizedException when device-id too short', async () => {
    const context = createMockContext('short');

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('throws UnauthorizedException when device-id too long', async () => {
    const longId = 'a'.repeat(257);
    const context = createMockContext(longId);

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('accepts device-id with exactly 8 characters', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'u', deviceId: '12345678' });

    const context = createMockContext('12345678');
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('accepts device-id with exactly 256 characters', async () => {
    const id256 = 'a'.repeat(256);
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'u', deviceId: id256 });

    const context = createMockContext(id256);
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
  });
});
