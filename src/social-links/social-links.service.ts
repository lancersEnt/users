import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { User as PUser } from '@prisma/client';
import { DiscoverInput, FollowInput, UnfollowInput, User } from 'src/graphql';
import { Neo4jService } from '@nhogs/nestjs-neo4j';
import { KafkaService } from 'src/kafka/kafka.service';
import { FollowNotification } from './interfaces/follow-notification.interface';
import { capitalize } from 'lodash';
import getSender from 'src/utils/getSender';
import { log } from 'console';

@Injectable()
export class SocialLinksService {
  constructor(
    private prisma: PrismaService,
    private readonly neo4j: Neo4jService,
    private readonly kafkaService: KafkaService,
  ) {}
  async createUserNode(user: PUser) {
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
      return 'user node created Created.';
    }
  }

  async createPageNode(page: PUser, ownerId: string) {
    const addPage = await this.neo4j.run(
      {
        cypher: 'create (user:Page {id: $id, email:$email}) return user',
        parameters: {
          id: page.id,
          email: page.email,
        },
      },
      { write: true },
    );
    if (addPage.records.length === 0) {
      throw new InternalServerErrorException('Could not create user node.');
    }
    if (addPage.records.length === 1) {
      const queryResult = await this.neo4j.run(
        {
          cypher: `
                  MATCH
                    (a:User),
                    (b:Page)
                  WHERE a.id =$user_id AND b.id = $target_id AND NOT (a)-[:MANAGES]->(b)
                  CREATE (a)-[r:MANAGES {createdAt: dateTime()}]->(b)
                  RETURN type(r)
                  `,
          parameters: {
            user_id: ownerId,
            target_id: page.id,
          },
        },
        { write: true },
      );
    }
  }

  async userFollowers(id: string): Promise<User[]> {
    const queryResult = await this.neo4j.run(
      {
        cypher: `MATCH (user)
        WHERE (user:User OR user:Page) AND user.id = $user_id
        MATCH (user)<-[r:FOLLOW]-(n)
        WHERE (n:User OR n:Page)
        RETURN n`,
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
        cypher: `MATCH (user)
          WHERE (user:User OR user:Page) AND user.id = $user_id
          MATCH (user)-[r:FOLLOW]->(n)
          WHERE (n:User OR n:Page)
          RETURN n`,
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

  async userPages(id: string): Promise<User[]> {
    const queryResult = await this.neo4j.run(
      {
        cypher: `MATCH (user)
          WHERE (user:User) AND user.id = $user_id
          MATCH (user)-[r:MANAGES]->(n)
          WHERE (n:Page)
          RETURN n`,
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

  async pageManagers(id: string): Promise<User[]> {
    const queryResult = await this.neo4j.run(
      {
        cypher: `MATCH (user)
          WHERE (user:Page) AND user.id = $page_id
          MATCH (user)<-[r:MANAGES]-(n)
          WHERE (n:User)
          RETURN n`,
        parameters: {
          page_id: id,
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
  async userFollowingIds(id: string): Promise<string[]> {
    const queryResult = await this.neo4j.run(
      {
        cypher: `MATCH (user)
          WHERE (user:User OR user:Page) AND user.id = $user_id
          MATCH (user)-[r:FOLLOW]->(n)
          WHERE (n:User OR n:Page)
          RETURN n`,
        parameters: {
          user_id: id,
        },
      },
      { write: true },
    );
    const ids = queryResult.records.map((elem) => {
      return elem.get('n').properties.id;
    });
    ids.push(id);
    return ids;
  }

  async follow(followInput: FollowInput) {
    const queryResult = await this.neo4j.run(
      {
        cypher: `
        MATCH (a)
        WHERE (a:User OR a:Page) AND a.id = $user_id
        WITH a
        MATCH (b)
        WHERE (b:User OR b:Page) AND b.id = $target_id AND NOT (a)-[:FOLLOW]->(b)
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
    if (queryResult.summary.counters.updates().relationshipsCreated == 0) {
      throw new BadRequestException('Already following');
    }
    if (queryResult.records.length === 0) {
      throw new InternalServerErrorException(
        'Could not create follow relation',
      );
    }

    const result =
      queryResult.summary.counters.updates().relationshipsCreated > 0;
    const sender = await getSender(followInput.userId);
    const followNotification: FollowNotification = {
      payload: {
        title: `nouveau abonnée - ${followInput.targetUserId}`,
        body: `
          ${capitalize(sender.firstname)} 
          ${capitalize(sender.lastname)} 
          vous a abonné
        `,
        createdBy: followInput.userId,
        targetUserId: followInput.targetUserId,
        action: `/klader/${sender.username}`,
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
        MATCH (a)
        WHERE (a:User OR a:Page) AND a.id = $user_id
        MATCH (b)
        WHERE (b:User OR b:Page) AND b.id = $target_id
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

  async discoverUser(discoverInput: DiscoverInput) {
    const usersToDiscover = await this.neo4j.run({
      cypher: `
      MATCH (me)
      WHERE (me:User OR me:Page) AND me.id = $user_id
      MATCH (me)-[:FOLLOW]->(following)
      WHERE following:User OR following:Page
      MATCH (following)<-[:FOLLOW*1..2]-(follower)
      WHERE (follower:User OR follower:Page) AND NOT (me)-[:FOLLOW]->(follower) AND me <> follower
      WITH DISTINCT follower AS result, COUNT(DISTINCT following) AS common_followers
      RETURN result, common_followers
      ORDER BY common_followers DESC LIMIT 5


          // MATCH (me:User {id: $user_id})
          // MATCH (me)-[:FOLLOW]->(following:User)
          // MATCH (following)-[:FOLLOW*1]->(follower:User)
          // WHERE NOT (me)-[:FOLLOW]->(follower) AND me <> follower
          // RETURN DISTINCT follower as result, count (DISTINCT follower) as score
          // UNION
          // MATCH (me:User {id: $user_id})
          // MATCH (me)-[:FOLLOW]->(following:User)
          // MATCH (following)<-[:FOLLOW*1]-(follow:User)
          // WHERE NOT (me)-[:FOLLOW]->(follow) AND me <> follow
          // RETURN DISTINCT follow as result, count (DISTINCT follow) as score
          // ORDER BY score DESC
        `,
      parameters: { user_id: discoverInput.userId },
    });
    const ids = usersToDiscover.records.map((elem) => {
      return elem.get('result').properties.id;
    });
    // const filteredIds = ids.filter((id) => !followingIds.includes(id));
    if (ids.length > 0) {
      const suggestedUsers = await this.prisma.user.findMany({
        where: {
          id: { in: ids },
        },
      });
      const sortedUsers = ids.map((id) =>
        suggestedUsers.find((user) => user.id === id),
      );
      return sortedUsers;
    }
  }
}
