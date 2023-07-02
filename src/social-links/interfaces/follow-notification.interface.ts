export interface FollowNotification {
  payload: {
    title: string;
    body: string;
    targetUserId: string;
    createdBy: string;
  };
}
