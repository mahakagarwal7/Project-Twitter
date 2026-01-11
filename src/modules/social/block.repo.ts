import { pg } from "../../db/postgres";
import redisClient from "../../config/redis";


export const isBlocked = async (a: number, b: number): Promise<boolean> => {
  const blocked1 = await redisClient.sIsMember(`blocked:${a}`, b.toString());
  const blocked2 = await redisClient.sIsMember(`blocked:${b}`, a.toString());

  if (blocked1 || blocked2) return true;

  const result = await pg.query(
    `SELECT 1 FROM blocks
     WHERE (blocker_id=$1 AND blocked_id=$2)
        OR (blocker_id=$2 AND blocked_id=$1)`,
    [a, b]
  );

  return (result.rowCount ?? 0) > 0;
};


export const getBlockList = async (userId: number) => {
  const cached = await redisClient.sMembers(`blocked:${userId}`);
  if (cached.length > 0) return cached.map(Number);

  const result = await pg.query(
    `SELECT blocked_id FROM blocks WHERE blocker_id=$1`,
    [userId]
  );

  const ids = result.rows.map(r => r.blocked_id.toString());
  if (ids.length > 0) await redisClient.sAdd(`blocked:${userId}`, ids);

  return ids.map(Number);
};


export const blockUser = async (blocker: number, blocked: number) => {
  await pg.query(
    `INSERT INTO blocks (blocker_id, blocked_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [blocker, blocked]
  );

  await pg.query(
    `DELETE FROM follows
     WHERE (follower_id = $1 AND followee_id = $2)
        OR (follower_id = $2 AND followee_id = $1)`,
    [blocker, blocked]
  );

  await redisClient.sAdd(`blocked:${blocker}`, blocked.toString());

  await redisClient.sRem(`followers:${blocker}`, blocked.toString());
  await redisClient.sRem(`followers:${blocked}`, blocker.toString());

  await redisClient.sRem(`following:${blocker}`, blocked.toString());
  await redisClient.sRem(`following:${blocked}`, blocker.toString());

  return true;
};
