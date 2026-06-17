import express from "express";
import {
  getNotifications,
  markRead,
  markAllRead,
  deleteNotification,
  broadcast,
  notifyUser,
} from "../controllers/notification.controller.js";
import { protect, admin } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getNotifications);
router.patch("/read-all", markAllRead);
router.patch("/:id/read", markRead);
router.delete("/:id", deleteNotification);

// Admin
router.post("/broadcast", admin, broadcast);
router.post("/user/:userId", admin, notifyUser);

export default router;
