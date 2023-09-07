import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { log } from 'console';
import { User } from 'src/graphql';
import { UserSearchBody } from 'src/social-links/interfaces/UserSearchBody.interface';
import { UserSearchResult } from 'src/social-links/interfaces/userSearchResult.interface';
@Injectable()
export default class SearchService {
  index = 'users';

  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  async indexUser(user: User) {
    // Check if a document with the same user.id exists
    const existingUser = await this.elasticsearchService.search({
      index: this.index,
      body: {
        query: {
          match: {
            id: user.id,
          },
        },
      },
    });
    if (existingUser.body.hits.total.value > 0) {
      // Document with user.id exists, update it
      const existingDocumentId = existingUser.body.hits.hits[0]._id;
      return this.elasticsearchService.update<UserSearchResult>({
        index: this.index,
        id: existingDocumentId,
        body: {
          doc: {
            firstname: user.firstname,
            lastname: user.lastname,
            username: user.username,
          },
        },
      });
    } else {
      // Document with user.id does not exist, create a new one
      return this.elasticsearchService.index<UserSearchResult, UserSearchBody>({
        index: this.index,
        body: {
          id: user.id,
          firstname: user.firstname,
          lastname: user.lastname,
          username: user.username,
        },
      });
    }
  }

  async search(text: string) {
    try {
      const keywords = text.split(' '); // Split the input text into keywords
      const shouldFirstnameQueries = keywords.map((keyword) => ({
        wildcard: {
          firstname: `*${keyword}*`,
        },
      }));
      const shouldLastnameQueries = keywords.map((keyword) => ({
        wildcard: {
          lastname: `*${keyword}*`,
        },
      }));
      const shouldUsernameQueries = keywords.map((keyword) => ({
        wildcard: {
          username: `*${keyword}*`,
        },
      }));

      const response = await this.elasticsearchService.search<UserSearchResult>(
        {
          index: this.index,
          body: {
            query: {
              bool: {
                should: [
                  ...shouldFirstnameQueries,
                  ...shouldLastnameQueries,
                  ...shouldUsernameQueries,
                ],
              },
            },
            sort: [
              {
                _score: { order: 'desc' }, // Sort by _score in descending order (closest match first)
              },
            ],
          },
        },
      );

      // Check if the search request was successful
      if (response.statusCode === 200) {
        // Extract and return search results from the response data
        log(response.body.hits);
        return response.body.hits.hits.map((hit) => hit._source);
      } else {
        // Handle search error
        console.error('Failed to execute the search query:', response.body);
        return [];
      }
    } catch (error) {
      // Handle exceptions
      console.error('Error executing the search query:', error);
      return [];
    }
  }
}
