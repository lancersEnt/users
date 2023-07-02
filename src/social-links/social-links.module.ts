import { Module } from '@nestjs/common';
import { SocialLinksService } from './social-links.service';
import { SocialLinksResolver } from './social-links.resolver';
import { PrismaService } from 'prisma/prisma.service';
import { KafkaService } from 'src/kafka/kafka.service';

@Module({
  providers: [
    SocialLinksResolver,
    SocialLinksService,
    PrismaService,
    KafkaService,
  ],
})
export class SocialLinksModule {}
