import { Router } from "express";
import {
  getFollowersController,
  getFollowingController,
  getPendingRequestsController,
  approveController,
  rejectController,
  blockListController,
  mutualController,
} from "./follow.controller";

const router = Router();

router.get("/:userId/followers", getFollowersController);
router.get("/:userId/following", getFollowingController);
router.get("/:userId/requests", getPendingRequestsController);

router.post("/:userId/approve/:followerId", approveController);
router.delete("/:userId/reject/:followerId", rejectController);

router.get("/:userId/blocked", blockListController);
router.get("/:userId/mutual", mutualController);

export default router;
