import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { Prisma, User } from '@prisma/client';
import { SocialLinksService } from 'src/social-links/social-links.service';
import { KafkaProducerService } from 'src/kafka-producer/kafka-producer.service';
import { PasswordUtils } from '../utils/password.utils';
import { UserCreated } from './event-payload/userCreated.event';
import { v4 as uuid } from 'uuid';
import { log } from 'console';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private socialLinksService: SocialLinksService,
    private passwordUtils: PasswordUtils,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  async create(createUserInput: Prisma.UserCreateInput) {
    const pass = await this.passwordUtils.hash(createUserInput.password);
    const tomorrow = new Date();
    // Tomorrow's date
    tomorrow.setDate(tomorrow.getDate() + 1);

    createUserInput.password = pass;
    try {
      // **create user entity in mongodb */
      const user: User = await this.prisma.user.create({
        data: {
          ...createUserInput,
          password: await this.passwordUtils.hash(createUserInput.password),
          activationTokenExp: tomorrow,
        },
      });

      //**create user node in neo4j db */
      await this.socialLinksService.createUserNode(user);

      //**Send user_created event to kafka */
      const user_created: UserCreated = {
        payload: {
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          activationToken: user.activationToken,
        },
        template: 'signup',
      };

      this.kafkaProducer.sendMessage('user_created', user_created);

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

  findOneByEmail(email: string) {
    try {
      return this.prisma.user.findUnique({
        where: {
          email: email,
        },
      });
    } catch (error) {
      throw new Error(error.message);
    }
  }

  findOneByUsername(username: string) {
    try {
      return this.prisma.user.findUnique({
        where: {
          username: username,
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
   * Returns if the user has 'admin' set on the permissions array
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

      this.kafkaProducer.sendMessage('user_created', user_created);

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
   * EMAIL_ENABLED must be true for this to run.
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

    const nUser = this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordReset: token,
        passwordResetExp: tokenExp,
        updatedAt: new Date(),
      },
    });
    //TODO: Emit forgot_password event
    return nUser;
  }
}
