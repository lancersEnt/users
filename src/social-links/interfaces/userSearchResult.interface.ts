import { UserSearchBody } from './UserSearchBody.interface';

export interface UserSearchResult {
  hits: {
    total: number;
    hits: Array<{
      _source: UserSearchBody;
    }>;
  };
}
