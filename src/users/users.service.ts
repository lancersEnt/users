import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { Prisma, User } from '@prisma/client';
import { SocialLinksService } from 'src/social-links/social-links.service';
import { PasswordUtils } from '../utils/password.utils';
import { UserCreated } from './event-payload/user-created.event';
import { v4 as uuid } from 'uuid';
import { ForgotPassword } from './event-payload/forgot-password.event.';
import { KafkaService } from 'src/kafka/kafka.service';
import { error, log } from 'console';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private socialLinksService: SocialLinksService,
    private passwordUtils: PasswordUtils,
    private readonly kafkaService: KafkaService,
  ) {}

  async create(createUserInput: Prisma.UserCreateInput) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    try {
      // **create user entity in mongodb */
      const user: User = await this.prisma.user.create({
        data: {
          ...createUserInput,
          permissions: ['user'],
          password: await this.passwordUtils.hash(createUserInput.password),
          activationTokenExp: tomorrow,
        },
      });

      //**create user node in neo4j db */
      await this.socialLinksService.createUserNode(user);

      //**Send page_created event to kafka */
      const user_created: UserCreated = {
        payload: {
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          activationToken: user.activationToken,
        },
        template: 'signup',
      };

      await this.kafkaService.produce(
        'user_created',
        JSON.stringify(user_created),
      );

      return user;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async createPgae(createUserInput: Prisma.UserCreateInput, ownerId: string) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    log(createUserInput);
    try {
      // **create user entity in mongodb */
      const user: User = await this.prisma.user.create({
        data: {
          ...createUserInput,
          permissions: ['page'],
          isActive: true,
          password: await this.passwordUtils.hash(createUserInput.password),
          activationTokenExp: tomorrow,
        },
      });

      //**create page node in neo4j db */
      await this.socialLinksService.createPageNode(user, ownerId);

      return user;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  findAll() {
    try {
      return this.prisma.user.findMany();
    } catch (error) {
      throw new Error(error.message);
    }
  }

  findOne(userWhereUniqueInput: Prisma.UserWhereUniqueInput) {
    try {
      return this.prisma.user.findUnique({
        where: userWhereUniqueInput,
      });
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async findOneByEmail(email: string) {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          email: {
            equals: email,
            mode: 'insensitive',
          },
        },
      });
      return user;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async findOneByUsername(username: string) {
    try {
      return await this.prisma.user.findFirstOrThrow({
        where: {
          username: username,
          permissions: { has: 'user' },
        },
      });
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async findPageByUsername(username: string) {
    try {
      return await this.prisma.user.findFirstOrThrow({
        where: {
          username: username,
          permissions: { has: 'page' },
        },
      });
    } catch (error) {
      throw new Error(error.message);
    }
  }

  update(
    userWhereUniqueInput: Prisma.UserWhereUniqueInput,
    updateUserInput: Prisma.UserUpdateInput,
  ) {
    try {
      return this.prisma.user.update({
        where: userWhereUniqueInput,
        data: { ...updateUserInput, updatedAt: new Date().toISOString() },
      });
    } catch (error) {
      throw new Error(error.message);
    }
  }

  remove(userWhereUniqueInput: Prisma.UserWhereUniqueInput) {
    try {
      return this.prisma.user.delete({
        where: userWhereUniqueInput,
      });
    } catch (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Test if the user has 'admin' on the permissions array
   *
   * @param {string[]} permissions permissions property on a User
   * @returns {boolean}
   * @memberof UsersService
   */
  isAdmin(permissions: string[]): boolean {
    return permissions.includes('admin');
  }

  /**
   * Adds permission string to the user's permissions array property.
   * Checks if the permission is valid
   * Checks if that value exists before adding it.
   *
   *
   * @param {string} permission The permission to add to the user
   * @param {string} username The user's username
   * @returns {(Promise<User | undefined>)} The user Document with the updated permission. Undefined if the
   * user does not exist
   * @memberof UsersService
   */
  async addPermission(
    permission: string,
    username: string,
  ): Promise<User | undefined> {
    if (!(permission in ['user', 'expert', 'admin']))
      throw new Error(
        'not a valid permission, permission should be one of; user, expert & admin',
      );
    const user = await this.findOneByUsername(username);
    if (!user) throw new Error('user not found');
    if (user.permissions.includes(permission))
      throw new Error('already has permission');
    try {
      user.permissions.push(permission);
      this.prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          permissions: user.permissions,
          updatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      throw new Error(error.message);
    }
    return user;
  }

  /**
   * Removes permission string from the user's permissions array property.
   * Checks if the user has the permission
   *
   * @param {string} permission The permission to remove from the user
   * @param {string} username The username of the user to remove the permission from
   * @returns {(Promise<User | undefined>)} Returns undefined if the user does not exist
   * @memberof UsersService
   */
  async removePermission(
    permission: string,
    username: string,
  ): Promise<User | undefined> {
    const user = await this.findOneByUsername(username);
    if (!user) throw new Error('user not found');
    if (!(permission in user.permissions))
      throw new Error('user does not have the permission');
    user.permissions = user.permissions.filter(
      (userPermission) => userPermission !== permission,
    );
    this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        permissions: user.permissions,
        updatedAt: new Date().toISOString(),
      },
    });
    return user;
  }

  /**
   * Activates a user with a token sent to his email
   * Checks if the user is already activate
   * Checks if the token expired
   * Generates a new activation token if the token is expired and send a new user_created event with the new token
   *
   * @param {Prisma.UserWhereUniqueInput} uniqueUser unique User prisma input
   * @returns {(Promise<User | undefined>)} Returns undefined if the user does not exist
   * @memberof UsersService
   */
  async activate(
    uniqueUser: Prisma.UserWhereUniqueInput,
  ): Promise<User | undefined> {
    const user = await this.prisma.user.findUnique({
      where: uniqueUser,
    });
    if (!user) throw new Error('user not found');

    if (user.isActive) throw new Error('user already activated');

    if (new Date() > user.activationTokenExp) {
      //regenerate token and sends a new user_created event to mailer service and throws token expired error
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const nUser = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          activationToken: uuid(),
          activationTokenExp: tomorrow,
        },
      });

      const user_created: UserCreated = {
        payload: {
          firstname: nUser.firstname,
          lastname: nUser.lastname,
          email: nUser.email,
          activationToken: nUser.activationToken,
        },
        template: 'signup',
      };

      await this.kafkaService.produce(
        'user_created',
        JSON.stringify(user_created),
      );

      throw new Error(
        'Activation token expired, a new one is generated and id being sent to your email, check your inbox',
      );
    }

    return this.prisma.user.update({
      where: { id: user.id },
      data: {
        isActive: true,
        updatedAt: new Date().toISOString(),
      },
    });
  }

  /**
   * Send an email with a password reset code and sets the reset token and expiration on the user.
   *
   * @param {string} email address associated with an account to reset
   * @returns {Promise<User | undefined> } returns user
   * @memberof UsersService
   */
  async forgotPassword(email: string): Promise<User | undefined> {
    const user = await this.findOneByEmail(email);

    if (!user) throw new Error('user not found');

    const token = uuid();
    const tokenExp = new Date();
    tokenExp.setHours(new Date().getHours() + 1);

    const nUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordReset: token,
        passwordResetExp: tokenExp,
        updatedAt: new Date(),
      },
    });

    const forgot_password: ForgotPassword = {
      payload: {
        firstname: nUser.firstname,
        lastname: nUser.lastname,
        email: nUser.email,
        passwordReset: nUser.passwordReset,
      },
      template: 'forgot-password',
    };

    await this.kafkaService.produce(
      'forgot_password',
      JSON.stringify(forgot_password),
    );

    return nUser;
  }

  /**
   * changes user password if the user provides the reset token sent to his email
   * checks if token exists
   * checks if token is expired
   *
   * @param {string} token reset token
   * @param {string} password new password
   * @returns {Promise<User | undefined> } returns user
   * @memberof UsersService
   */
  async resetPassword(
    token: string,
    password: string,
  ): Promise<User | undefined> {
    const now = new Date();
    const user = await this.prisma.user.findFirst({
      where: {
        passwordReset: token,
      },
    });

    if (!user) throw new Error('invalid token');
    if (user.passwordResetExp < now) throw new Error('token expired');

    return this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        passwordReset: null,
        passwordResetExp: null,
        password: await this.passwordUtils.hash(password),
      },
    });
  }
}
