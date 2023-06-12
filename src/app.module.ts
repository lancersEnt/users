import {
  ApolloFederationDriver,
  ApolloFederationDriverConfig,
} from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { Module } from '@nestjs/common';
import { GraphQLISODateTime, GraphQLModule } from '@nestjs/graphql';
// import { AuthModule } from './auth/auth.module';
import { PrismaService } from 'prisma/prisma.service';
import { UsersModule } from './users/users.module';
@Module({
  imports: [
    GraphQLModule.forRoot<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      playground: false,
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
      typePaths: ['./**/*.graphql'],
      resolvers: {
        DateTime: GraphQLISODateTime,
      },
      context: ({ req, res }): any => ({ req, res }),
    }),
    UsersModule,
  ],
  providers: [PrismaService],
})
export class AppModule {}
