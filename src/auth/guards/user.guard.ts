import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthService } from '../auth.service';
import { AuthenticationError } from '@nestjs/apollo';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UserGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private jwtService: JwtService,
  ) {}

  isPage(roles: string[]) {
    if (roles.includes('user')) {
      return true;
    }
    throw new AuthenticationError("You don't have user permission");
  }
  canActivate(context: ExecutionContext): boolean {
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;
    if (request.cookies.token) {
      const decodedJwtAccessToken = this.jwtService.decode(
        request.cookies.token,
      ) as JwtPayload;
      if (this.isPage(decodedJwtAccessToken.permissions)) return true;
    }
    throw new AuthenticationError(
      'Could not authenticate with token or user does not have permissions',
    );
  }
}
