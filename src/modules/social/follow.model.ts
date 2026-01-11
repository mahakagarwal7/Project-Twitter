export type FollowStatus = "pending" | "accepted";

export interface Follow {
  followerId: number;
  followeeId: number;
  status: FollowStatus;
  createdAt: Date;
}

export interface FollowRequest {
  followerId: number;
  followeeId: number;
}

export interface FollowResponse {
  status: FollowStatus;
}
