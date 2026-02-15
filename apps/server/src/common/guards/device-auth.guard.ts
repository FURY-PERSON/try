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

    const user = await this.prisma.user.findUnique({
      where: { deviceId },
    });

    if (!user) {
      throw new UnauthorizedException(
        'No user found for the provided device ID. Please register first.',
      );
    }

    (request as any).user = user;
    return true;
  }
}
