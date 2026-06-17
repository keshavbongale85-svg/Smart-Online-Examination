import Question from "../models/Question.model.js";
import Exam from "../models/Exam.model.js";
import asyncHandler from "../utils/asyncHandler.js";

// Recompute an exam's totalMarks from its questions
const recalcExamMarks = async (examId) => {
  const agg = await Question.aggregate([
    { $match: { exam: examId } },
    { $group: { _id: "$exam", total: { $sum: "$marks" }, count: { $sum: 1 } } },
  ]);
  const total = agg[0]?.total || 0;
  await Exam.findByIdAndUpdate(examId, { totalMarks: total });
  return total;
};

const validateQuestion = (q) => {
  if (!q.questionText) throw new Error("questionText is required");
  if (!Array.isArray(q.options) || q.options.length < 2)
    throw new Error("At least 2 options are required");
  if (
    q.correctOption === undefined ||
    q.correctOption < 0 ||
    q.correctOption >= q.options.length
  )
    throw new Error("correctOption must be a valid option index");
};

// @route POST /api/questions/exam/:examId  (admin)
export const addQuestion = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.examId);
  if (!exam) {
    res.status(404);
    throw new Error("Exam not found");
  }
  validateQuestion(req.body);
  const question = await Question.create({ ...req.body, exam: exam._id });
  await recalcExamMarks(exam._id);
  res.status(201).json({ success: true, question });
});

// @route POST /api/questions/exam/:examId/bulk  (admin) — array of questions
export const addQuestionsBulk = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.examId);
  if (!exam) {
    res.status(404);
    throw new Error("Exam not found");
  }
  const list = Array.isArray(req.body) ? req.body : req.body.questions;
  if (!Array.isArray(list) || list.length === 0) {
    res.status(400);
    throw new Error("Provide an array of questions");
  }
  list.forEach(validateQuestion);
  const docs = await Question.insertMany(
    list.map((q) => ({ ...q, exam: exam._id }))
  );
  await recalcExamMarks(exam._id);
  res.status(201).json({ success: true, count: docs.length, questions: docs });
});

// @route GET /api/questions/exam/:examId  (admin) — includes answers
export const getQuestionsByExam = asyncHandler(async (req, res) => {
  const questions = await Question.find({ exam: req.params.examId }).sort({
    createdAt: 1,
  });
  res.json({ success: true, count: questions.length, questions });
});

// @route PUT /api/questions/:id  (admin)
export const updateQuestion = asyncHandler(async (req, res) => {
  const existing = await Question.findById(req.params.id);
  if (!existing) {
    res.status(404);
    throw new Error("Question not found");
  }
  const merged = { ...existing.toObject(), ...req.body };
  validateQuestion(merged);
  const question = await Question.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  await recalcExamMarks(question.exam);
  res.json({ success: true, question });
});

// @route DELETE /api/questions/:id  (admin)
export const deleteQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);
  if (!question) {
    res.status(404);
    throw new Error("Question not found");
  }
  const examId = question.exam;
  await question.deleteOne();
  await recalcExamMarks(examId);
  res.json({ success: true, message: "Question deleted" });
});
