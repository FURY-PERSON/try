import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/**
 * Parameter decorator that extracts the authenticated user from the request object.
 *
 * Usage:
 *   @Get('profile')
 *   getProfile(@CurrentUser() user: User) { ... }
 *
 *   @Get('profile')
 *   getUserId(@CurrentUser('id') userId: string) { ... }
 *
 * Requires DeviceAuthGuard (or another guard that attaches user to request).
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = (request as any).user;

    // If a specific property is requested, return just that property
    if (data && user) {
      return user[data];
    }

    return user;
  },
);
