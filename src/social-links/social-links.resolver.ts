import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { SocialLinksService } from './social-links.service';
import { FollowInput, UnfollowInput } from 'src/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Resolver('SocialLink')
export class SocialLinksResolver {
  constructor(private readonly socialLinksService: SocialLinksService) {}

  @UseGuards(JwtAuthGuard)
  @Mutation('follow')
  follow(
    @Args('followInput') followInput: FollowInput,
    @Context() context: any,
  ) {
    const { req: request, res } = context;
    const id: string = request.user.id;
    followInput.userId = id;
    return this.socialLinksService.follow(followInput);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation('unfollow')
  unfollow(
    @Args('unfollowInput') UnfollowInput: UnfollowInput,
    @Context() context: any,
  ) {
    const { req: request, res } = context;
    const id: string = request.user.id;
    UnfollowInput.userId = id;
    return this.socialLinksService.unfollow(UnfollowInput);
  }
}
