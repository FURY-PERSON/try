import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { generateUniqueNickname } from '@/utils/generate-nickname';

@Injectable()
export class DeviceAuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const deviceId = request.headers['x-device-id'] as string;

    if (!deviceId || deviceId.length < 8 || deviceId.length > 256) {
      throw new UnauthorizedException(
        'Missing or invalid x-device-id header. Please register your device first.',
      );
    }

    const existing = await this.prisma.user.findUnique({
      where: { deviceId },
    });

    let user;
    if (existing) {
      user = existing;
    } else {
      const { nickname, avatarEmoji } = await generateUniqueNickname(
        this.prisma,
      );
      try {
        user = await this.prisma.user.create({
          data: { deviceId, nickname, avatarEmoji },
        });
      } catch {
        // Race condition: another request created the user between findUnique and create
        user = await this.prisma.user.findUnique({
          where: { deviceId },
        });
        if (!user) {
          throw new UnauthorizedException('Failed to resolve device user.');
        }
      }
    }

    (request as any).user = user;
    return true;
  }
}
