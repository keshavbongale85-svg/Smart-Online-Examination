import express from "express";
import {
  uploadSnapshot,
  reportViolation,
  getLiveStatus,
  getFlagged,
} from "../controllers/monitoring.controller.js";
import { protect, admin } from "../middleware/auth.middleware.js";
import { uploadSnapshot as uploadMw } from "../middleware/upload.middleware.js";

const router = express.Router();

router.use(protect);

// Student-side proctoring events
router.post(
  "/exam/:examId/snapshot",
  uploadMw.single("snapshot"),
  uploadSnapshot
);
router.post("/exam/:examId/violation", reportViolation);

// Admin-side monitoring
router.get("/flagged", admin, getFlagged);
router.get("/exam/:examId/live", admin, getLiveStatus);

export default router;
