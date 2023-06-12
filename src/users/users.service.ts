import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { Prisma, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserInput: Prisma.UserCreateInput) {
    const now = new Date().toISOString();
    const pass = await this.hashPassword(createUserInput.password);

    createUserInput.password = pass;
    createUserInput.createdAt = now;
    return this.prisma.user.create({
      data: createUserInput,
    });
  }

  findAll() {
    return this.prisma.user.findMany();
  }

  findOne(userWhereUniqueInput: Prisma.UserWhereUniqueInput) {
    return this.prisma.user.findUnique({
      where: userWhereUniqueInput,
    });
  }

  update(
    userWhereUniqueInput: Prisma.UserWhereUniqueInput,
    updateUserInput: Prisma.UserUpdateInput,
  ) {
    const now = new Date().toISOString();
    updateUserInput.updatedAt = now;
    return this.prisma.user.update({
      where: userWhereUniqueInput,
      data: updateUserInput,
    });
  }

  remove(userWhereUniqueInput: Prisma.UserWhereUniqueInput) {
    return this.prisma.user.delete({
      where: userWhereUniqueInput,
    });
  }

  findOneByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: {
        email: email,
      },
    });
  }

  findOneByUsername(username: string) {
    return this.prisma.user.findFirst({
      where: {
        username: username,
      },
    });
  }

  isAdmin(permissions: string[]) {
    return permissions.includes('admin');
  }

  private async hashPassword(password) {
    const hash = await bcrypt.hash(password, 10);
    return hash;
  }
}
