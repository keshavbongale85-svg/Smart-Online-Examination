import Result from "../models/Result.model.js";
import Exam from "../models/Exam.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { emitTo } from "../utils/socket.js";

// @route POST /api/monitoring/exam/:examId/snapshot  (student)
// multipart/form-data with field "snapshot" — stores file & broadcasts URL
export const uploadSnapshot = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("No snapshot uploaded");
  }
  const url = `/uploads/snapshots/${req.file.filename}`;

  emitTo(`exam:${req.params.examId}`, "monitor:snapshot", {
    studentId: req.user._id,
    name: req.user.name,
    url,
    at: Date.now(),
  });

  res.status(201).json({ success: true, url });
});

// @route POST /api/monitoring/exam/:examId/violation  (student)
// body: { type } e.g. "tab-switch", "fullscreen-exit", "no-face"
export const reportViolation = asyncHandler(async (req, res) => {
  const { type } = req.body;
  emitTo(`exam:${req.params.examId}`, "monitor:violation", {
    studentId: req.user._id,
    name: req.user.name,
    type: type || "unknown",
    at: Date.now(),
  });
  res.json({ success: true, message: "Violation recorded" });
});

// @route GET /api/monitoring/exam/:examId/live  (admin)
// Snapshot of who has submitted / been flagged so far
export const getLiveStatus = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.examId);
  if (!exam) {
    res.status(404);
    throw new Error("Exam not found");
  }
  const results = await Result.find({ exam: exam._id })
    .populate("student", "name email college")
    .select("student status flagged tabSwitches warnings submittedAt");

  res.json({
    success: true,
    submitted: results.length,
    flagged: results.filter((r) => r.flagged).length,
    students: results,
  });
});

// @route GET /api/monitoring/flagged  (admin) — all flagged results
export const getFlagged = asyncHandler(async (req, res) => {
  const results = await Result.find({ flagged: true })
    .populate("student", "name email college")
    .populate("exam", "title")
    .sort({ createdAt: -1 });
  res.json({ success: true, count: results.length, results });
});
