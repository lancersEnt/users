import {
  Resolver,
  Query,
  Mutation,
  Args,
  ResolveReference,
  Parent,
  ResolveField,
} from '@nestjs/graphql';
import { UsersService } from './users.service';
import { Prisma } from '@prisma/client';
import { User } from '../graphql';
import { SocialLinksService } from 'src/social-links/social-links.service';

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
  @Mutation('activateUserAccount')
  activateUserAccount(@Args('activationToken') activationToken: string) {
    return this.usersService.activate({ activationToken });
  }

  @Query('users')
  findAll() {
    return this.usersService.findAll();
  }

  @Query('user')
  findOne(@Args('id') id: string) {
    return this.usersService.findOne({ id });
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

  @ResolveReference()
  resolveReference(reference: {
    __typename: string;
    id: string;
  }): Promise<User> {
    const id = reference.id;

    return this.usersService.findOne({ id });
  }

  @ResolveField('followers', (returns) => [User])
  followers(@Parent() user: User): Promise<User[]> {
    return this.socialLinksService.userFollowers(user.id);
  }

  @ResolveField('following', (returns) => [User])
  following(@Parent() user: User): Promise<User[]> {
    return this.socialLinksService.userFollowing(user.id);
  }
}
