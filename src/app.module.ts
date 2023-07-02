import {
  ApolloFederationDriver,
  ApolloFederationDriverConfig,
} from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { DateTimeResolver, EmailAddressResolver } from 'graphql-scalars';
import { Neo4jModule } from '@nhogs/nestjs-neo4j';
import { PrismaService } from 'prisma/prisma.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { SocialLinksModule } from './social-links/social-links.module';
import { KafkaService } from './kafka/kafka.service';

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
    EventEmitterModule.forRoot(),
    Neo4jModule.forRoot({
      scheme: 'neo4j',
      host: 'localhost',
      port: '7687',
      database: 'myklad',
      username: 'neo4j',
      password: 'test',
      global: true,
    }),
    UsersModule,
    AuthModule,
    SocialLinksModule,
  ],
  providers: [PrismaService, KafkaService],
})
export class AppModule {}
