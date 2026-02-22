import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

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

    let user = await this.prisma.user.findUnique({
      where: { deviceId },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: { deviceId },
      });
    }

    (request as any).user = user;
    return true;
  }
}
