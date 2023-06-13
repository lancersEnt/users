import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserInput: Prisma.UserCreateInput) {
    const pass = await this.hashPassword(createUserInput.password);

    createUserInput.password = pass;
    try {
      return this.prisma.user.create({
        data: createUserInput,
      });
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
