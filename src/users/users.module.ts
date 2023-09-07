import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersResolver } from './users.resolver';
import { PrismaService } from 'prisma/prisma.service';
import { SocialLinksModule } from 'src/social-links/social-links.module';
import { SocialLinksService } from 'src/social-links/social-links.service';
import { PasswordUtils } from 'src/utils/password.utils';
import { KafkaService } from 'src/kafka/kafka.service';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from 'src/auth/auth.module';
import { SearchModule } from 'src/search/search.module';

@Module({
  imports: [SocialLinksModule, AuthModule, SearchModule, JwtModule],
  providers: [
    UsersResolver,
    UsersService,
    PrismaService,
    SocialLinksService,
    PasswordUtils,
    KafkaService,
  ],
})
export class UsersModule {}
