import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { generateUniqueNickname } from '@/utils/generate-nickname';

// Simple LRU cache for deviceId -> user mapping
const CACHE_MAX_SIZE = 5000;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CachedUser {
  user: Record<string, unknown>;
  cachedAt: number;
}

const deviceCache = new Map<string, CachedUser>();

function getCachedUser(deviceId: string): Record<string, unknown> | null {
  const entry = deviceCache.get(deviceId);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
    deviceCache.delete(deviceId);
    return null;
  }
  // Move to end (LRU)
  deviceCache.delete(deviceId);
  deviceCache.set(deviceId, entry);
  return entry.user;
}

function setCachedUser(deviceId: string, user: Record<string, unknown>) {
  // Evict oldest entries if cache is full
  if (deviceCache.size >= CACHE_MAX_SIZE) {
    const firstKey = deviceCache.keys().next().value;
    if (firstKey) deviceCache.delete(firstKey);
  }
  deviceCache.set(deviceId, { user, cachedAt: Date.now() });
}

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

    // Check cache first
    const cached = getCachedUser(deviceId);
    if (cached) {
      (request as any).user = cached;
      return true;
    }

    // TODO: Add `select` to narrow fetched fields once all @CurrentUser() consumers are audited
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

    setCachedUser(deviceId, user);
    (request as any).user = user;
    return true;
  }
}
