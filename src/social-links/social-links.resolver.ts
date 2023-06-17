import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { SocialLinksService } from './social-links.service';
import { FollowInput, UnfollowInput } from 'src/graphql';

@Resolver('SocialLink')
export class SocialLinksResolver {
  constructor(private readonly socialLinksService: SocialLinksService) {}

  @Mutation('follow')
  follow(@Args('followInput') followInput: FollowInput) {
    return this.socialLinksService.follow(followInput);
  }
  @Mutation('unfollow')
  unfollow(@Args('unfollowInput') UnfollowInput: UnfollowInput) {
    return this.socialLinksService.unfollow(UnfollowInput);
  }
}
