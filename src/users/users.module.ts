import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersResolver } from './users.resolver';
import { PrismaService } from 'prisma/prisma.service';
import { SocialLinksModule } from 'src/social-links/social-links.module';
import { SocialLinksService } from 'src/social-links/social-links.service';

@Module({
  imports: [SocialLinksModule],
  providers: [UsersResolver, UsersService, PrismaService, SocialLinksService],
})
export class UsersModule {}
