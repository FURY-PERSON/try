import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AdminAuthService } from '../admin-auth.service';
import { PrismaService } from '@/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

describe('AdminAuthService', () => {
  let service: AdminAuthService;

  const mockPrisma = {
    adminUser: {
      findUnique: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-token'),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('15m'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminAuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AdminAuthService>(AdminAuthService);
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('returns tokens on valid credentials', async () => {
      mockPrisma.adminUser.findUnique.mockResolvedValue({
        id: 'admin-1',
        email: 'admin@test.com',
        passwordHash: 'hashed',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      const result = await service.login({
        email: 'admin@test.com',
        password: 'password',
      });

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
    });

    it('throws UnauthorizedException for non-existent email', async () => {
      mockPrisma.adminUser.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'wrong@test.com', password: 'pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for wrong password', async () => {
      mockPrisma.adminUser.findUnique.mockResolvedValue({
        id: 'admin-1',
        email: 'admin@test.com',
        passwordHash: 'hashed',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'admin@test.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('returns new access token on valid refresh token', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'admin-1',
        email: 'admin@test.com',
        type: 'admin',
      });
      mockPrisma.adminUser.findUnique.mockResolvedValue({
        id: 'admin-1',
        email: 'admin@test.com',
      });
      mockJwtService.sign.mockReturnValue('new-access-token');

      const result = await service.refresh('valid-refresh-token');

      expect(result.accessToken).toBe('new-access-token');
    });

    it('throws BadRequestException for non-admin token type', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'user-1',
        type: 'user',
      });

      await expect(service.refresh('user-token')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws UnauthorizedException if admin not found', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'admin-deleted',
        email: 'deleted@test.com',
        type: 'admin',
      });
      mockPrisma.adminUser.findUnique.mockResolvedValue(null);

      await expect(service.refresh('valid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException for expired/invalid token', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await expect(service.refresh('expired-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
