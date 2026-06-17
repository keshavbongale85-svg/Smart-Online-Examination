import express from "express";
import {
  submitExam,
  getMyResults,
  getResult,
  getExamResults,
  getLeaderboard,
  getExamAnalytics,
} from "../controllers/result.controller.js";
import { protect, admin } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.post("/exam/:examId/submit", submitExam);
router.get("/me", getMyResults);

router.get("/exam/:examId/leaderboard", getLeaderboard);
router.get("/exam/:examId/analytics", admin, getExamAnalytics);
router.get("/exam/:examId", admin, getExamResults);

router.get("/:id", getResult);

export default router;
