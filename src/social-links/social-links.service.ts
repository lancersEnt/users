import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { User as PUser } from '@prisma/client';
import { FollowInput, UnfollowInput, User } from 'src/graphql';
import { Neo4jService } from '@nhogs/nestjs-neo4j';
import { log } from 'console';
import { KafkaService } from 'src/kafka/kafka.service';
import { FollowNotification } from './interfaces/follow-notification.interface';

@Injectable()
export class SocialLinksService {
  constructor(
    private prisma: PrismaService,
    private readonly neo4j: Neo4jService,
    private readonly kafkaService: KafkaService,
  ) {}
  // todo: make this function excute on user.created event
  async createUserNode(user: PUser) {
    // handle and process "OrderCreatedEvent"
    const queryResult = await this.neo4j.run(
      {
        cypher: 'create (user:User {id: $id, email:$email}) return user',
        parameters: {
          id: user.id,
          email: user.email,
        },
      },
      { write: true },
    );
    if (queryResult.records.length === 0) {
      throw new InternalServerErrorException('Could not create user node.');
    }
    if (queryResult.records.length === 1) {
      return 'Relationship Created.';
    }
  }

  async userFollowers(id: string): Promise<User[]> {
    const queryResult = await this.neo4j.run(
      {
        cypher: 'MATCH (user:User {id:$user_id})<-[r:FOLLOW]-(n:User) RETURN n',
        parameters: {
          user_id: id,
        },
      },
      { write: true },
    );
    const ids = queryResult.records.map((elem) => {
      return elem.get('n').properties.id;
    });
    return this.prisma.user.findMany({
      where: {
        id: { in: ids },
      },
    });
  }

  async userFollowing(id: string): Promise<User[]> {
    const queryResult = await this.neo4j.run(
      {
        cypher:
          'MATCH (user:User {id:$user_id})-[r:FOLLOW]-> (n:User) RETURN n',
        parameters: {
          user_id: id,
        },
      },
      { write: true },
    );
    const ids = queryResult.records.map((elem) => {
      return elem.get('n').properties.id;
    });
    return this.prisma.user.findMany({
      where: {
        id: { in: ids },
      },
    });
  }

  async follow(followInput: FollowInput) {
    log(followInput);
    const queryResult = await this.neo4j.run(
      {
        cypher: `
                MATCH
                  (a:User),
                  (b:User)
                WHERE a.id =$user_id AND b.id = $target_id
                CREATE (a)-[r:FOLLOW {createdAt: dateTime()}]->(b)
                RETURN type(r)
                `,
        parameters: {
          user_id: followInput.userId,
          target_id: followInput.targetUserId,
        },
      },
      { write: true },
    );
    if (queryResult.records.length === 0) {
      throw new InternalServerErrorException(
        'Could not create follow relation',
      );
    }
    if (
      queryResult.records.length === 1 &&
      queryResult.summary.counters.updates().relationshipsCreated == 0
    ) {
      throw new BadRequestException('Already following');
    }

    const result =
      queryResult.summary.counters.updates().relationshipsCreated > 0;
    const followNotification: FollowNotification = {
      payload: {
        title: 'New follower',
        body: `${followInput.userId} has followed you`,
        createdBy: followInput.userId,
        targetUserId: followInput.targetUserId,
      },
    };

    this.kafkaService.produce(
      'notifications',
      JSON.stringify(followNotification),
    );

    return result
      ? 'Relationship created'
      : 'An error occured while creating the relationship';
  }

  async unfollow(unfollowInput: UnfollowInput) {
    const queryResult = await this.neo4j.run(
      {
        cypher: `
          MATCH
            (a:User),
            (b:User)
          WHERE a.id =$user_id AND b.id = $target_id
          MATCH (a)-[r:FOLLOW]->(b)
          DELETE r
          RETURN r
                `,
        parameters: {
          user_id: unfollowInput.userId,
          target_id: unfollowInput.targetUserId,
        },
      },
      { write: true },
    );
    if (queryResult.records.length === 0) {
      throw new NotFoundException('Follow relation not found');
    }
    const res = queryResult.summary.counters.updates().relationshipsDeleted > 0;
    return res
      ? 'Relationship deleted'
      : 'An error occured whil deleting the relationship';
  }
}
