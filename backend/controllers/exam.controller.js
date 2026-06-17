import Exam from "../models/Exam.model.js";
import Question from "../models/Question.model.js";
import Result from "../models/Result.model.js";
import asyncHandler from "../utils/asyncHandler.js";

// Shuffle helper (Fisher–Yates)
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// @route POST /api/exams  (admin)
export const createExam = asyncHandler(async (req, res) => {
  const exam = await Exam.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ success: true, exam });
});

// @route GET /api/exams  (admin: all, student: published & in-window)
export const getExams = asyncHandler(async (req, res) => {
  let filter = {};
  if (req.user.role !== "admin") {
    const now = new Date();
    filter = {
      isPublished: true,
      $and: [
        { $or: [{ startDate: { $exists: false } }, { startDate: null }, { startDate: { $lte: now } }] },
        { $or: [{ endDate: { $exists: false } }, { endDate: null }, { endDate: { $gte: now } }] },
      ],
    };
  }

  const exams = await Exam.find(filter)
    .populate("questionCount")
    .sort({ createdAt: -1 });

  // For students, annotate whether they've already attempted each exam
  if (req.user.role !== "admin") {
    const results = await Result.find({ student: req.user._id }).select("exam");
    const attempted = new Set(results.map((r) => r.exam.toString()));
    const data = exams.map((e) => ({
      ...e.toObject(),
      attempted: attempted.has(e._id.toString()),
    }));
    return res.json({ success: true, count: data.length, exams: data });
  }

  res.json({ success: true, count: exams.length, exams });
});

// @route GET /api/exams/:id
export const getExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id).populate("questionCount");
  if (!exam) {
    res.status(404);
    throw new Error("Exam not found");
  }
  res.json({ success: true, exam });
});

// @route PUT /api/exams/:id  (admin)
export const updateExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!exam) {
    res.status(404);
    throw new Error("Exam not found");
  }
  res.json({ success: true, exam });
});

// @route DELETE /api/exams/:id  (admin)
export const deleteExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) {
    res.status(404);
    throw new Error("Exam not found");
  }
  await Question.deleteMany({ exam: exam._id });
  await Result.deleteMany({ exam: exam._id });
  await exam.deleteOne();
  res.json({ success: true, message: "Exam and related data deleted" });
});

// @route PATCH /api/exams/:id/publish  (admin) — toggle exam visibility
export const togglePublish = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) {
    res.status(404);
    throw new Error("Exam not found");
  }
  exam.isPublished =
    req.body.isPublished !== undefined ? req.body.isPublished : !exam.isPublished;
  await exam.save();
  res.json({ success: true, exam });
});

// @route PATCH /api/exams/:id/publish-results  (admin) — toggle result visibility
export const togglePublishResults = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) {
    res.status(404);
    throw new Error("Exam not found");
  }
  exam.resultsPublished =
    req.body.resultsPublished !== undefined
      ? req.body.resultsPublished
      : !exam.resultsPublished;
  await exam.save();
  res.json({ success: true, exam });
});

// @route GET /api/exams/:id/start  (student) — get questions WITHOUT answers
export const startExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) {
    res.status(404);
    throw new Error("Exam not found");
  }
  if (!exam.isPublished) {
    res.status(403);
    throw new Error("Exam is not available");
  }

  const now = new Date();
  if (exam.startDate && now < exam.startDate) {
    res.status(403);
    throw new Error("Exam has not started yet");
  }
  if (exam.endDate && now > exam.endDate) {
    res.status(403);
    throw new Error("Exam window has closed");
  }

  // Block re-attempts
  const existing = await Result.findOne({ exam: exam._id, student: req.user._id });
  if (existing) {
    res.status(409);
    throw new Error("You have already attempted this exam");
  }

  let questions = await Question.find({ exam: exam._id }).select(
    "questionText options marks subject topic difficulty"
  );

  if (questions.length === 0) {
    res.status(400);
    throw new Error("This exam has no questions yet");
  }

  // Serve a randomized subset if configured
  questions = shuffle(questions);
  if (exam.questionsPerAttempt > 0) {
    questions = questions.slice(0, exam.questionsPerAttempt);
  }

  res.json({
    success: true,
    exam: {
      _id: exam._id,
      title: exam.title,
      description: exam.description,
      duration: exam.duration,
      negativeMarking: exam.negativeMarking,
      negativeMarkValue: exam.negativeMarkValue,
      proctoring: exam.proctoring,
    },
    questions,
  });
});
