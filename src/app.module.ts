import {
  ApolloFederationDriver,
  ApolloFederationDriverConfig,
} from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { DateTimeResolver, EmailAddressResolver } from 'graphql-scalars';
import { PrismaService } from 'prisma/prisma.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      playground: false,
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
      typePaths: ['./**/*.graphql'],
      resolvers: {
        DateTime: DateTimeResolver,
        EmailAddress: EmailAddressResolver,
      },
      context: ({ req, res }): any => ({ req, res }),
    }),
    UsersModule,
    AuthModule,
  ],
  providers: [PrismaService],
})
export class AppModule {}
