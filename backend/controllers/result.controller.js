import Result from "../models/Result.model.js";
import Exam from "../models/Exam.model.js";
import Question from "../models/Question.model.js";
import Notification from "../models/Notification.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { emitTo } from "../utils/socket.js";

// @route POST /api/results/exam/:examId/submit  (student)
// body: { answers: [{ question, selectedOption }], tabSwitches, warnings, timeTaken }
export const submitExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.examId);
  if (!exam) {
    res.status(404);
    throw new Error("Exam not found");
  }

  const already = await Result.findOne({
    exam: exam._id,
    student: req.user._id,
  });
  if (already) {
    res.status(409);
    throw new Error("You have already submitted this exam");
  }

  const submitted = Array.isArray(req.body.answers) ? req.body.answers : [];

  // Load only the questions the student was served (by id)
  const questionIds = submitted.map((a) => a.question).filter(Boolean);
  const questions = await Question.find({
    _id: { $in: questionIds },
    exam: exam._id,
  });
  const qMap = new Map(questions.map((q) => [q._id.toString(), q]));

  let score = 0;
  let totalMarks = 0;
  let correctCount = 0;
  let wrongCount = 0;
  let unattempted = 0;
  const subjects = {}; // subject -> { correct, total, score }
  const gradedAnswers = [];

  for (const ans of submitted) {
    const q = qMap.get(String(ans.question));
    if (!q) continue;

    const subj = q.subject || "General";
    subjects[subj] = subjects[subj] || { correct: 0, total: 0, score: 0 };
    subjects[subj].total += 1;
    totalMarks += q.marks;

    const selected = ans.selectedOption;
    const answered = selected !== undefined && selected !== null && selected >= 0;

    let isCorrect = false;
    let marksAwarded = 0;

    if (!answered) {
      unattempted += 1;
    } else if (selected === q.correctOption) {
      isCorrect = true;
      marksAwarded = q.marks;
      score += q.marks;
      correctCount += 1;
      subjects[subj].correct += 1;
      subjects[subj].score += q.marks;
    } else {
      wrongCount += 1;
      if (exam.negativeMarking) {
        const penalty = q.marks * exam.negativeMarkValue;
        marksAwarded = -penalty;
        score -= penalty;
        subjects[subj].score -= penalty;
      }
    }

    gradedAnswers.push({
      question: q._id,
      selectedOption: answered ? selected : -1,
      isCorrect,
      marksAwarded,
      subject: subj,
    });
  }

  if (score < 0) score = 0; // never report a negative total
  const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0;
  const status = score >= (exam.passingMarks || 0) ? "pass" : "fail";

  const subjectWise = Object.entries(subjects).map(([subject, s]) => ({
    subject,
    correct: s.correct,
    total: s.total,
    score: Math.max(0, s.score),
  }));

  const flagged =
    exam.proctoring?.tabSwitchLimit > 0 &&
    (req.body.tabSwitches || 0) > exam.proctoring.tabSwitchLimit;

  const result = await Result.create({
    exam: exam._id,
    student: req.user._id,
    answers: gradedAnswers,
    score: Math.round(score * 100) / 100,
    totalMarks,
    percentage: Math.round(percentage * 100) / 100,
    correctCount,
    wrongCount,
    unattempted,
    status,
    subjectWise,
    tabSwitches: req.body.tabSwitches || 0,
    warnings: req.body.warnings || 0,
    flagged,
    timeTaken: req.body.timeTaken || 0,
  });

  // Notify the student that results are available (if published)
  await Notification.create({
    user: req.user._id,
    title: "Exam submitted",
    message: `Your submission for "${exam.title}" has been recorded.`,
    type: "result",
    link: `/results/${result._id}`,
  });

  // Tell admins watching the live feed that this student finished
  emitTo(`exam:${exam._id}`, "monitor:submitted", {
    studentId: req.user._id,
    name: req.user.name,
    flagged,
    at: Date.now(),
  });

  // Hide score from the response until results are published
  const payload = exam.resultsPublished
    ? result
    : {
        _id: result._id,
        exam: result.exam,
        submittedAt: result.submittedAt,
        resultsPublished: false,
        message: "Submitted. Results will be available once published.",
      };

  res.status(201).json({ success: true, result: payload });
});

// @route GET /api/results/me  (student) — own results
export const getMyResults = asyncHandler(async (req, res) => {
  const results = await Result.find({ student: req.user._id })
    .populate("exam", "title subject resultsPublished totalMarks passingMarks")
    .sort({ createdAt: -1 });

  // Mask scores for exams whose results aren't published
  const data = results.map((r) => {
    const obj = r.toObject();
    if (!r.exam?.resultsPublished) {
      return {
        _id: obj._id,
        exam: obj.exam,
        submittedAt: obj.submittedAt,
        resultsPublished: false,
      };
    }
    return obj;
  });

  res.json({ success: true, count: data.length, results: data });
});

// @route GET /api/results/:id  — single result (owner or admin)
export const getResult = asyncHandler(async (req, res) => {
  const result = await Result.findById(req.params.id)
    .populate("exam", "title subject resultsPublished totalMarks passingMarks negativeMarking")
    .populate("student", "name email college branch")
    .populate("answers.question", "questionText options correctOption");

  if (!result) {
    res.status(404);
    throw new Error("Result not found");
  }

  const isOwner = result.student._id.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Not authorized to view this result");
  }

  if (req.user.role !== "admin" && !result.exam?.resultsPublished) {
    res.status(403);
    throw new Error("Results for this exam have not been published yet");
  }

  res.json({ success: true, result });
});

// @route GET /api/results/exam/:examId  (admin) — all results for an exam
export const getExamResults = asyncHandler(async (req, res) => {
  const results = await Result.find({ exam: req.params.examId })
    .populate("student", "name email college branch")
    .sort({ score: -1 });
  res.json({ success: true, count: results.length, results });
});

// @route GET /api/results/exam/:examId/leaderboard — ranked by score
export const getLeaderboard = asyncHandler(async (req, res) => {
  const results = await Result.find({ exam: req.params.examId })
    .populate("student", "name college branch avatar")
    .sort({ score: -1, timeTaken: 1 })
    .limit(50);

  const board = results.map((r, i) => ({
    rank: i + 1,
    student: r.student,
    score: r.score,
    percentage: r.percentage,
    timeTaken: r.timeTaken,
    status: r.status,
  }));
  res.json({ success: true, leaderboard: board });
});

// @route GET /api/results/exam/:examId/analytics  (admin) — aggregate stats
export const getExamAnalytics = asyncHandler(async (req, res) => {
  const examId = req.params.examId;
  const results = await Result.find({ exam: examId });

  if (results.length === 0) {
    return res.json({
      success: true,
      analytics: {
        attempts: 0,
        avgScore: 0,
        highest: 0,
        lowest: 0,
        passRate: 0,
        flaggedCount: 0,
        scoreDistribution: [],
        subjectAverages: [],
      },
    });
  }

  const scores = results.map((r) => r.percentage);
  const attempts = results.length;
  const avgScore = scores.reduce((a, b) => a + b, 0) / attempts;
  const highest = Math.max(...scores);
  const lowest = Math.min(...scores);
  const passRate =
    (results.filter((r) => r.status === "pass").length / attempts) * 100;
  const flaggedCount = results.filter((r) => r.flagged).length;

  // Distribution buckets of 10%
  const buckets = Array.from({ length: 10 }, (_, i) => ({
    range: `${i * 10}-${i * 10 + 10}%`,
    count: 0,
  }));
  scores.forEach((p) => {
    const idx = Math.min(9, Math.floor(p / 10));
    buckets[idx].count += 1;
  });

  // Subject averages across all attempts
  const subjAgg = {};
  results.forEach((r) =>
    r.subjectWise.forEach((s) => {
      subjAgg[s.subject] = subjAgg[s.subject] || { correct: 0, total: 0 };
      subjAgg[s.subject].correct += s.correct;
      subjAgg[s.subject].total += s.total;
    })
  );
  const subjectAverages = Object.entries(subjAgg).map(([subject, s]) => ({
    subject,
    accuracy: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
  }));

  res.json({
    success: true,
    analytics: {
      attempts,
      avgScore: Math.round(avgScore * 100) / 100,
      highest: Math.round(highest * 100) / 100,
      lowest: Math.round(lowest * 100) / 100,
      passRate: Math.round(passRate * 100) / 100,
      flaggedCount,
      scoreDistribution: buckets,
      subjectAverages,
    },
  });
});
