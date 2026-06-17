import express from "express";
import {
  getUsers,
  getUser,
  toggleUserStatus,
  updateUserRole,
  deleteUser,
  getUserStats,
} from "../controllers/user.controller.js";
import { protect, admin } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect, admin); // user management is admin-only

router.get("/stats/overview", getUserStats);
router.get("/", getUsers);
router.get("/:id", getUser);
router.patch("/:id/status", toggleUserStatus);
router.patch("/:id/role", updateUserRole);
router.delete("/:id", deleteUser);

export default router;
