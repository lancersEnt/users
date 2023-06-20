import { Module, forwardRef } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { UsersModule } from 'src/users/users.module';
import { UsersService } from 'src/users/users.service';
import { PrismaService } from 'prisma/prisma.service';
import { SocialLinksService } from 'src/social-links/social-links.service';
import { PasswordUtils } from 'src/utils/password.utils';
import { KafkaService } from 'src/kafka/kafka.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt', session: false }),
    JwtModule.registerAsync({
      useFactory: () => {
        const options: JwtModuleOptions = {
          secret: 'secret',
        };
        options.signOptions = {
          expiresIn: 3600,
        };
        return options;
      },
    }),
    forwardRef(() => UsersModule),
  ],
  providers: [
    AuthService,
    AuthResolver,
    JwtStrategy,
    UsersService,
    SocialLinksService,
    PrismaService,
    PasswordUtils,
    KafkaService,
  ],
  exports: [AuthService],
})
export class AuthModule {}
