import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { Prisma, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { log } from 'console';
import { SocialLinksService } from 'src/social-links/social-links.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private socialLinksService: SocialLinksService,
  ) {}

  async create(createUserInput: Prisma.UserCreateInput) {
    const pass = await this.hashPassword(createUserInput.password);

    createUserInput.password = pass;
    try {
      // **create user entity in mongodb */
      const user: User = await this.prisma.user.create({
        data: createUserInput,
      });
      //**create user node in neo4j db */
      await this.socialLinksService.createUserNode(user);
      /**
       * TODO: PUBLISH USER.CREATED EVENT FOR OTHER SERVICES
       */
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

  update(
    userWhereUniqueInput: Prisma.UserWhereUniqueInput,
    updateUserInput: Prisma.UserUpdateInput,
  ) {
    const now = new Date().toISOString();
    updateUserInput.updatedAt = now;
    try {
      return this.prisma.user.update({
        where: userWhereUniqueInput,
        data: updateUserInput,
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

  findOneByEmail(email: string) {
    try {
      return this.prisma.user.findFirst({
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
      return this.prisma.user.findFirst({
        where: {
          username: username,
        },
      });
    } catch (error) {
      throw new Error(error.message);
    }
  }

  isAdmin(permissions: string[]) {
    return permissions.includes('admin');
  }

  async activate(uniqueUser: Prisma.UserWhereUniqueInput) {
    try {
      return await this.prisma.user.update({
        where: uniqueUser,
        data: {
          isActive: true,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async hashPassword(password: string) {
    if (password.length < 8)
      throw new Error('password length should be at least 8');
    const hash = await bcrypt.hash(password, 10);
    return hash;
  }
}
