import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersResolver } from './users.resolver';
import { PrismaService } from 'prisma/prisma.service';
import { SocialLinksModule } from 'src/social-links/social-links.module';
import { SocialLinksService } from 'src/social-links/social-links.service';
import { KafkaProducerService } from 'src/kafka-producer/kafka-producer.service';
import { PasswordUtils } from 'src/utils/password.utils';

@Module({
  imports: [SocialLinksModule],
  providers: [
    UsersResolver,
    UsersService,
    PrismaService,
    SocialLinksService,
    PasswordUtils,
    KafkaProducerService,
  ],
})
export class UsersModule {}
