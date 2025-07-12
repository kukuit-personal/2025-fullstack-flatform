import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ROLES_KEY } from '@/common/decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '@/common/decorators/public.decorator';

@Injectable()
export class CombinedAuthGuard extends JwtAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // ✅ Nếu route có @Public thì bỏ qua guard
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    // ✅ Bước 1: Xác thực JWT
    const isJwtValid = await super.canActivate(context);
    if (!isJwtValid) return false;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const userRole = user?.role;

    // ✅ Bước 2: Lấy role yêu cầu
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );

    // Nếu không yêu cầu role thì cho qua
    if (!requiredRoles || requiredRoles.length === 0) return true;

    // ✅ Bước 3: So sánh role
    const hasRole = requiredRoles.includes(userRole);

    if (!hasRole) {
      console.log('[ROLE GUARD] Required:', requiredRoles, '| Current:', userRole);
    }

    return hasRole;
  }
}
