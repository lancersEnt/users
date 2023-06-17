import { Module } from '@nestjs/common';
import { SocialLinksService } from './social-links.service';
import { SocialLinksResolver } from './social-links.resolver';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  providers: [SocialLinksResolver, SocialLinksService, PrismaService],
})
export class SocialLinksModule {}
