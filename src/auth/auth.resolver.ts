import { Resolver, Args, Query, Context } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { LoginResult, LoginUserInput } from 'src/graphql';
import { AuthenticationError } from '@nestjs/apollo';
import { User } from '@prisma/client';

@Resolver('Auth')
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @Query('login')
  async login(
    @Context() context: any,
    @Args('user') user: LoginUserInput,
  ): Promise<LoginResult> {
    const { res } = context;
    try {
      const result = await this.authService.validateUserByPassword(user);

      if (result) {
        res.cookie('token', result.token, {
          httpOnly: true,
          maxAge: 1.8e6,
        });
        return result;
      }
      throw new AuthenticationError(
        'Could not log-in with the provided credentials',
      );
    } catch (err) {
      throw err;
    }
  }

  @Query('refreshToken')
  @UseGuards(JwtAuthGuard)
  async refreshToken(@Context() context: any): Promise<string> {
    const { req: request, res } = context;
    const user: User = request.user;
    if (!user)
      throw new AuthenticationError(
        'Could not log-in with the provided credentials',
      );
    const result = await this.authService.createJwt(user);
    if (result) {
      res.cookie('token', result.token, {
        httpOnly: true,
        maxAge: 1.8e6,
      });
      return result.token;
    }
    throw new AuthenticationError(
      'Could not log-in with the provided credentials',
    );
  }
}
