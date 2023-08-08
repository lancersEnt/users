import { Resolver, Args, Query, Context, Mutation } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { LoginResult, LoginUserInput } from 'src/graphql';
import { AuthenticationError } from '@nestjs/apollo';
import { User } from '@prisma/client';
import { log } from 'console';

@Resolver('Auth')
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @Mutation('login')
  async login(
    @Context() context: any,
    @Args('user') user: LoginUserInput,
  ): Promise<LoginResult> {
    const { res } = context;
    try {
      const result = await this.authService.validateUserByPassword(user);

      if (result) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        res.cookie('token', result.token, {
          httpOnly: true,
          expires: tomorrow,
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
    const result = this.authService.createJwt(user);
    if (result) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      res.cookie('token', result.token, {
        httpOnly: true,
        expires: tomorrow,
      });
      return result.token;
    }
    throw new AuthenticationError(
      'Could not log-in with the provided credentials',
    );
  }

  @Mutation()
  async logout(@Context() ctx) {
    // Clear the authentication cookie
    ctx.res.clearCookie('token');
    return true; // Return a response indicating successful logout
  }

  @Mutation()
  @UseGuards(JwtAuthGuard)
  async switchAccount(
    @Context() context: any,
    @Args('targetId') targetId: string,
  ) {
    const { req, res } = context;
    const user: User = req.user;
    log(user);
    try {
      const result = await this.authService.switchAccount(user.id, targetId);
      if (result) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        res.cookie('old_token', result.old_token, {
          httpOnly: true,
          expires: tomorrow,
        });
        res.cookie('token', result.token, {
          httpOnly: true,
          expires: tomorrow,
        });
        return result;
      }
      throw new AuthenticationError(
        'Could not log-in with the provided credentials',
      );
    } catch (error) {
      throw new Error(error.message);
    }
  }

  @Mutation()
  @UseGuards(JwtAuthGuard)
  async switchBack(@Context() context: any) {
    const { req, res } = context;
    const old_token = req.cookies['old_token'];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    res.cookie('token', old_token, {
      httpOnly: true,
      expires: tomorrow,
    });
    res.clearCookie('old_token');
    return true;
  }
}
