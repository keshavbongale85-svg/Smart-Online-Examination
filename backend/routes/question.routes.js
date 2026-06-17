import express from "express";
import {
  addQuestion,
  addQuestionsBulk,
  getQuestionsByExam,
  updateQuestion,
  deleteQuestion,
} from "../controllers/question.controller.js";
import { protect, admin } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect, admin); // all question management is admin-only

router.get("/exam/:examId", getQuestionsByExam);
router.post("/exam/:examId", addQuestion);
router.post("/exam/:examId/bulk", addQuestionsBulk);

router.route("/:id").put(updateQuestion).delete(deleteQuestion);

export default router;
