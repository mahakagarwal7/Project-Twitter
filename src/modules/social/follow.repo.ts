import { pg } from "../../db/postgres";
import redisClient from "../../config/redis";
import { isBlocked } from "./block.repo";

import type { FollowStatus } from "./follow.model";


export const followUser = async (followerId: number, followeeId: number): Promise<FollowStatus> => {
  if (await isBlocked(followerId, followeeId)) {
    throw new Error("You cannot follow this user");
  }

  const profile = await pg.query(
    "SELECT account_type FROM user_profiles WHERE user_id=$1",
    [followeeId]
  );

  const type = profile.rows[0]?.account_type || "public";
  const status = type === "private" ? "pending" : "accepted";

  await pg.query(
    "INSERT INTO follows (follower_id, followee_id, status) VALUES ($1,$2,$3)",
    [followerId, followeeId, status]
  );

  if (status === "accepted") {
    await redisClient.sAdd(`followers:${followeeId}`, followerId.toString());
    await redisClient.sAdd(`following:${followerId}`, followeeId.toString());
  }

  return status;
};
export const acceptFollow = async (followeeId: number, followerId: number) => {
  const result = await pg.query(
    `UPDATE follows 
     SET status = 'accepted'
     WHERE follower_id = $1 AND followee_id = $2
     RETURNING follower_id, followee_id`,
    [followerId, followeeId]
  );

  if ((result.rowCount ?? 0) === 0) {
    throw new Error("Follow request not found");
  }

  await redisClient.sAdd(`followers:${followeeId}`, followerId.toString());
  await redisClient.sAdd(`following:${followerId}`, followeeId.toString());

  return true;
};

/*
 * Get people who follow this user
 */
export const getFollowers = async (userId: number) => {
  const redisKey = `followers:${userId}`;

  const cached = await redisClient.sMembers(redisKey);
  if (cached.length > 0) {
    return cached.map(Number);
  }

  const result = await pg.query(
    `SELECT follower_id
     FROM follows
     WHERE followee_id = $1 AND status = 'accepted'`,
    [userId]
  );

  const ids = result.rows.map(r => r.follower_id.toString());

  if (ids.length > 0) {
    await redisClient.sAdd(redisKey, ids);
  }

  return ids.map(Number);
};

/*
 * Get people this user follows
 */
export const getFollowing = async (userId: number) => {
  const key = `following:${userId}`;

  const cached = await redisClient.sMembers(key);
  if (cached.length > 0) return cached.map(Number);

  const result = await pg.query(
    `SELECT followee_id 
     FROM follows 
     WHERE follower_id = $1 AND status = 'accepted'`,
    [userId]
  );

  const ids = result.rows.map(r => r.followee_id.toString());

  if (ids.length > 0) await redisClient.sAdd(key, ids);

  return ids.map(Number);
};


export const getMutualFollowers = async (userId: number) => {
  const followers = await redisClient.sMembers(`followers:${userId}`);
  const following = await redisClient.sMembers(`following:${userId}`);

  if (followers.length === 0 || following.length === 0) return [];

  const followingSet = new Set(following);
  const mutual = followers.filter(id => followingSet.has(id));

  return mutual.map(Number);
};



/*
 * Get pending follow requests for a user
 */
export const getPendingRequests = async (userId: number) => {
  const result = await pg.query(
    `SELECT 
        f.follower_id,
        p.username,
        p.avatar_url
     FROM follows f
     JOIN user_profiles p ON p.user_id = f.follower_id
     WHERE f.followee_id = $1 AND f.status = 'pending'
     ORDER BY f.created_at DESC`,
    [userId]
  );

  return result.rows;
};


export const approveFollow = async (followeeId: number, followerId: number) => {
  const result = await pg.query(
    `UPDATE follows 
     SET status='accepted'
     WHERE follower_id=$1 AND followee_id=$2 AND status='pending'
     RETURNING follower_id, followee_id`,
    [followerId, followeeId]
  );

  if ((result.rowCount ?? 0) === 0) {
    throw new Error("No pending request");
  }

  await redisClient.sAdd(`followers:${followeeId}`, followerId.toString());
  await redisClient.sAdd(`following:${followerId}`, followeeId.toString());

  return true;
};

export const rejectFollow = async (followeeId: number, followerId: number) => {
  const result = await pg.query(
    `DELETE FROM follows 
     WHERE follower_id=$1 AND followee_id=$2 AND status='pending'`,
    [followerId, followeeId]
  );

  if ((result.rowCount ?? 0) === 0) {
    throw new Error("No pending request");
  }

  return true;
};

export const unfollowUser = async (followerId: number, followeeId: number) => {

  const result = await pg.query(
    `DELETE FROM follows
     WHERE follower_id = $1 AND followee_id = $2`,
    [followerId, followeeId]
  );

  if ((result.rowCount ?? 0) === 0) {
    throw new Error("You are not following this user");
  }

  await redisClient.sRem(`followers:${followeeId}`, followerId.toString());
  await redisClient.sRem(`following:${followerId}`, followeeId.toString());

  return true;
};