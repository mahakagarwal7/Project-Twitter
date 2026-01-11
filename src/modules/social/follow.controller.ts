import { getFollowers, getFollowing } from "./follow.repo";
import { getPendingRequests } from "./follow.repo";
import type { Request, Response } from "express";
import { approveFollow, rejectFollow, getMutualFollowers } from "./follow.repo";
import { getBlockList } from "./block.repo";


export const getFollowersController = async (req: Request, res: Response) => {
    const userId = Number(req.params.userId);
    const followers = await getFollowers(userId);

    res.json({
        userId,
        count: followers.length,
        followers,
    });
};

export const getFollowingController = async (req: Request, res: Response) => {
    const userId = Number(req.params.userId);
    const following = await getFollowing(userId);

    res.json({
        userId,
        count: following.length,
        following,
    });
};


export const getPendingRequestsController = async (req: Request,res: Response) => {
    const userId = Number(req.params.userId);
    const requests = await getPendingRequests(userId);

    res.json({
        userId,
        count: requests.length,
        requests,
    });
};

export const approveController = async (req: Request,res: Response) => {
    const { userId, followerId } = req.params;
    await approveFollow(Number(userId), Number(followerId));
    res.json({ message: "Follow approved" });
};

export const rejectController = async (req: Request,res: Response) => {
    const { userId, followerId } = req.params;
    await rejectFollow(Number(userId), Number(followerId));
    res.json({ message: "Follow rejected" });
};

export const mutualController = async (req: Request,res: Response) => {
    const userId = Number(req.params.userId);
    const mutual = await getMutualFollowers(userId);
    res.json({ userId, count: mutual.length, mutual });
};

export const blockListController = async (req: Request,res: Response) => {
    const userId = Number(req.params.userId);
    const blocked = await getBlockList(userId);
    res.json({ userId, count: blocked.length, blocked });
};