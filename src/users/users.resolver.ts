import {
  Resolver,
  Query,
  Mutation,
  Args,
  ResolveReference,
  Parent,
  ResolveField,
  Context,
} from '@nestjs/graphql';
import { UsersService } from './users.service';
import { Prisma } from '@prisma/client';
import { UpdatePasswordInput, User } from '../graphql';
import { SocialLinksService } from 'src/social-links/social-links.service';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { log } from 'console';
import { UserGuard } from 'src/auth/guards/user.guard';
import { AdminGuard } from 'src/auth/guards/admin.guard';

@Resolver('User')
export class UsersResolver {
  constructor(
    private readonly usersService: UsersService,
    private readonly socialLinksService: SocialLinksService,
  ) {}

  @Mutation('signup')
  async signup(
    @Args('createUserInput') createUserInput: Prisma.UserCreateInput,
  ) {
    const exists = await this.usersService.findOneByEmail(
      createUserInput.email,
    );
    if (exists === null) return this.usersService.create(createUserInput);
    throw new Error('User with given email already exists');
  }

  @Mutation('createPage')
  @UseGuards(JwtAuthGuard, UserGuard)
  async createPage(
    @Args('createUserInput') createUserInput: Prisma.UserCreateInput,
    @Context() context: any,
  ) {
    log(createUserInput);
    const { req } = context;
    const id: string = req.user.id;
    log(id);
    const exists = await this.usersService.findOneByEmail(
      createUserInput.email,
    );
    if (exists === null)
      return this.usersService.createPgae(createUserInput, id);
    throw new Error('User/Page with given email already exists');
  }

  @Query('searchForUsers')
  searchForUsers(@Args('text') text: string) {
    return this.usersService.searchForUsers(text);
  }

  @Mutation('activateUserAccount')
  activateUserAccount(@Args('activationToken') activationToken: string) {
    return this.usersService.activate({ activationToken });
  }

  @Mutation('forgotPassword')
  forgotPassword(@Args('email') email: string) {
    return this.usersService.forgotPassword(email);
  }

  @Mutation('resetPassword')
  resetPassword(
    @Args('token') token: string,
    @Args('password') password: string,
  ) {
    return this.usersService.resetPassword(token, password);
  }

  @Query('findByUsername')
  findByUsername(@Args('username') username: string) {
    return this.usersService.findOneByUsername(username);
  }

  @Query('findPageByUsername')
  findPageByUsername(@Args('username') username: string) {
    return this.usersService.findPageByUsername(username);
  }

  @Query('users')
  @UseGuards(JwtAuthGuard, AdminGuard)
  findAll() {
    return this.usersService.findAllUsers();
  }

  @Query('experts')
  experts() {
    return this.usersService.experts();
  }

  @Query('user')
  findOne(@Args('id') id: string) {
    return this.usersService.findOne({ id });
  }

  @Query('me')
  @UseGuards(JwtAuthGuard)
  async me(@Context() context: any) {
    const { req: request } = context;
    const id: string = request.user.id;
    return await this.usersService.findOne({ id });
  }

  @Mutation('updatePassword')
  @UseGuards(JwtAuthGuard)
  async updatePassword(
    @Context() context: any,
    @Args('updatePasswordInput') updatePasswordInput: UpdatePasswordInput,
  ) {
    const { req: request } = context;
    const id: string = request.user.id;
    log(id);
    const d = await this.usersService.updatePassword(id, updatePasswordInput);
    log(d);
    return d;
  }

  @Mutation('updateBalance')
  @UseGuards(JwtAuthGuard)
  async updateBalance(@Context() context: any, @Args('amount') amount: number) {
    const { req: request } = context;
    const id: string = request.user.id;
    return await this.usersService.updateBalance(id, amount);
  }

  @Mutation('updateUser')
  update(
    @Args('id') id: string,
    @Args('updateUserInput') updateUserInput: Prisma.UserUpdateInput,
  ) {
    return this.usersService.update({ id }, updateUserInput);
  }

  @Mutation('removeUser')
  remove(@Args('id') id: string) {
    return this.usersService.remove({ id });
  }

  @Mutation('blockUnblockUser')
  @UseGuards(JwtAuthGuard, AdminGuard)
  blockUnblockUser(@Args('userId') userId: string) {
    return this.usersService.blockUnblockUser(userId);
  }

  @Mutation('addExpertPermission')
  @UseGuards(JwtAuthGuard, AdminGuard)
  addExpertPermission(@Args('userId') userId: string) {
    return this.usersService.addPermission('expert', userId);
  }

  @Mutation('removeExpertPermission')
  @UseGuards(JwtAuthGuard, AdminGuard)
  removeExpertPermission(@Args('userId') userId: string) {
    return this.usersService.removePermission('expert', userId);
  }

  @ResolveReference()
  resolveReference(reference: {
    __typename: string;
    id: string;
  }): Promise<User> {
    const id = reference.id;

    return this.usersService.findOne({ id });
  }

  @ResolveField('followers', () => [User])
  followers(@Parent() user: User): Promise<User[]> {
    return this.socialLinksService.userFollowers(user.id);
  }

  @ResolveField('following', () => [User])
  following(@Parent() user: User): Promise<User[]> {
    return this.socialLinksService.userFollowing(user.id);
  }

  @ResolveField('pages', () => [User])
  pages(@Parent() user: User): Promise<User[]> {
    return this.socialLinksService.userPages(user.id);
  }

  @ResolveField('managers', () => [User])
  managers(@Parent() user: User): Promise<User[]> {
    return this.socialLinksService.pageManagers(user.id);
  }
}
