import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { Prisma, User } from '@prisma/client';
import { SocialLinksService } from 'src/social-links/social-links.service';
import { PasswordUtils } from '../utils/password.utils';
import { UserCreated } from './event-payload/user-created.event';
import { v4 as uuid } from 'uuid';
import { ForgotPassword } from './event-payload/forgot-password.event.';
import { KafkaService } from 'src/kafka/kafka.service';
import { log } from 'console';
import { UpdatePasswordInput } from 'src/graphql';
import { PasswordChanged } from './event-payload/password-changed.event';
import SearchService from 'src/search/search.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private socialLinksService: SocialLinksService,
    private passwordUtils: PasswordUtils,
    private readonly kafkaService: KafkaService,
    private readonly searchService: SearchService,
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

      this.searchService.indexUser(user);

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

      this.searchService.indexUser(user);

      //**create page node in neo4j db */
      await this.socialLinksService.createPageNode(user, ownerId);

      return user;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async searchForUsers(text: string) {
    const u = await this.prisma.user.findMany({});
    u.forEach((user) => {
      this.searchService.indexUser(user);
    });
    const results: any[] = await this.searchService.search(text);
    log(results);
    const ids = results.map((result) => result.id);
    if (!ids.length) {
      return [];
    }
    const users = await this.prisma.user.findMany({
      where: { id: { in: ids } },
    });

    // Create a map of ids to their corresponding users for efficient lookup
    const usersMap = new Map(users.map((user) => [user.id, user]));

    // Sort the users array based on the order of ids
    const sortedUsers = ids.map((id) => usersMap.get(id));

    return sortedUsers;
  }

  findAll() {
    try {
      return this.prisma.user.findMany();
    } catch (error) {
      throw new Error(error.message);
    }
  }

  experts() {
    try {
      return this.prisma.user.findMany({
        where: {
          permissions: { has: 'expert' },
        },
      });
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

  findAllUsers() {
    return this.prisma.user.findMany({
      where: {
        permissions: { has: 'user' },
      },
    });
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
    userId: string,
  ): Promise<User | undefined> {
    if (!['user', 'expert', 'admin'].includes(permission)) {
      throw new Error(
        'Not a valid permission. Permission should be one of: user, expert, admin',
      );
    }

    const user = await this.findOne({ id: userId });

    if (!user) {
      return undefined; // User not found, return undefined
    }

    const permissions = user.permissions;

    if (permissions.includes(permission)) {
      throw new Error('Already has permission');
    }

    try {
      await this.prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          permissions: [...permissions, permission], // Update permissions in the database
          updatedAt: new Date().toISOString(),
        },
      });

      // Update the local permissions array if the database update is successful
      user.permissions.push(permission);

      return user; // Return the updated user
    } catch (error) {
      throw new Error(error.message);
    }
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
    userId: string,
  ): Promise<User | undefined> {
    const user = await this.findOne({ id: userId });

    if (!user) {
      return undefined; // User not found, return undefined
    }

    if (!user.permissions.includes(permission)) {
      throw new Error('User does not have the permission');
    }

    // Remove the permission from the user's permissions array
    user.permissions = user.permissions.filter(
      (userPermission) => userPermission !== permission,
    );

    try {
      await this.prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          permissions: user.permissions,
          updatedAt: new Date().toISOString(),
        },
      });

      return user; // Return the updated user
    } catch (error) {
      throw new Error(error.message);
    }
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

  /**
   * changes logged in user password
   * checks if provided userId is valid
   * compares old password with the old password provided
   * changes password if the comparison succeeds
   *
   * @param {string} userId userId
   * @param {UpdatePasswordInput} updatePasswordInput contains old and new passwords
   * @returns {string} returns 'success' if password changed,
   * 'old password mismatch' in case of wrong old password
   * and 'user not found' in case bad userId
   * @memberof UsersService
   */
  async updatePassword(
    userId: string,
    updatePasswordInput: UpdatePasswordInput,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (user) {
      const confirmPW = await this.passwordUtils.compare(
        updatePasswordInput.oldPassword,
        user.password,
      );
      if (confirmPW) {
        await this.prisma.user.update({
          where: { id: userId },
          data: {
            password: await this.passwordUtils.hash(
              updatePasswordInput.password,
            ),
          },
        });
        const password_changed: PasswordChanged = {
          payload: {
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
          },
          template: 'password-changed',
        };
        await this.kafkaService.produce(
          'password_changed',
          JSON.stringify(password_changed),
        );
        return 'success';
      } else return 'old password mismatch';
    } else return 'user not found';
  }

  /**
   * Adds balance to logged in user
   * checks if provided userId is valid
   * adds provided amout to user with provided id
   *
   * @param {string} userId userId
   * @param {number} amount contains old and new passwords
   * @returns {string} returns 'success' if balance updated
   * and 'user not found' in case bad userId
   * @memberof UsersService
   */
  async updateBalance(userId: string, amount: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (user) {
      if (user.balance + amount < 0) {
        return 'insufficient funds';
      } else {
        await this.prisma.user.update({
          where: { id: userId },
          data: { balance: user.balance + amount },
        });
        return 'success';
      }
    }
    return 'user not found';
  }

  async blockUnblockUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (user && !user.permissions.includes('admin'))
      return this.prisma.user.update({
        where: { id: userId },
        data: {
          isActive: !user.isActive,
        },
      });
  }
}
