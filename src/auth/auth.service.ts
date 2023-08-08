/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { LoginResult, LoginUserInput } from 'src/graphql';
import { User } from '@prisma/client';
import { PasswordUtils } from 'src/utils/password.utils';
import { log } from 'console';

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    private jwtService: JwtService,
    private passwordUtils: PasswordUtils,
  ) {}

  /**
   * Checks if a user's password is valid
   *
   * @param {LoginUserInput} loginAttempt Include username or email. If both are provided only
   * username will be used. Password must be provided.
   * @returns {(Promise<LoginResult | undefined>)} returns the User and token if successful, undefined if not
   * @memberof AuthService
   */
  async validateUserByPassword(
    loginAttempt: LoginUserInput,
  ): Promise<LoginResult | undefined> {
    // This will be used for the initial login
    let userToAttempt: User | undefined;
    if (loginAttempt.email) {
      userToAttempt = await this.usersService.findOneByEmail(
        loginAttempt.email,
      );
    }
    if (loginAttempt.username) {
      userToAttempt = await this.usersService.findOneByUsername(
        loginAttempt.username,
      );
    }
    // Check the supplied password against the hash stored for this email address
    let isMatch = false;
    try {
      isMatch = await this.passwordUtils.compare(
        loginAttempt.password,
        userToAttempt.password,
      );
    } catch (error) {
      return undefined;
    }
    const isActive = userToAttempt.isActive;

    if (isMatch) {
      if (isActive) {
        const token = this.createJwt(userToAttempt!).token;
        const result: any = {
          user: userToAttempt!,
          token,
        };
        await this.usersService.update(
          { id: userToAttempt.id },
          { updatedAt: new Date() },
        );
        return result;
      } else throw new Error('user not active, activate your account first');
    }
    return null;
  }

  async validateJwtPayload(payload: JwtPayload): Promise<User | undefined> {
    const user = await this.usersService.findOneByEmail(payload.email);
    if (user) {
      await this.usersService.update(
        { id: user.id },
        { updatedAt: new Date() },
      );
      return user;
    }

    return undefined;
  }

  async switchAccount(id: string, targetId: string) {
    const old = await this.usersService.findOne({ id });
    const target = await this.usersService.findOne({ id: targetId });

    if (!old.permissions.includes('user')) {
      throw new Error("can't switch profiles when logges as page");
    }

    const result: any = {
      user: target,
      token: this.createJwt(target).token,
      old_token: this.createJwt(old).token,
    };

    log(result);

    return result;
  }

  createJwt(user: User): { data: JwtPayload; token: string } {
    const expiresIn = 720000;
    let expiration: Date | undefined;
    if (expiresIn) {
      expiration = new Date();
      expiration.setTime(expiration.getTime() + expiresIn * 1000);
    }
    const data: JwtPayload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      permissions: user.permissions,
      expiration,
    };

    const jwt = this.jwtService.sign(data);

    return {
      data,
      token: jwt,
    };
  }
}
