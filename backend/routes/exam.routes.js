import express from "express";
import {
  createExam,
  getExams,
  getExam,
  updateExam,
  deleteExam,
  togglePublish,
  togglePublishResults,
  startExam,
} from "../controllers/exam.controller.js";
import { protect, admin } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.route("/").get(getExams).post(admin, createExam);

router.get("/:id/start", startExam); // student
router.patch("/:id/publish", admin, togglePublish);
router.patch("/:id/publish-results", admin, togglePublishResults);

router
  .route("/:id")
  .get(getExam)
  .put(admin, updateExam)
  .delete(admin, deleteExam);

export default router;
