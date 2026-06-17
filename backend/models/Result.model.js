import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
  {
    question: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
    selectedOption: { type: Number, default: -1 }, // -1 = not answered
    isCorrect: { type: Boolean, default: false },
    marksAwarded: { type: Number, default: 0 },
    subject: { type: String, default: "General" },
  },
  { _id: false }
);

const resultSchema = new mongoose.Schema(
  {
    exam: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    answers: [answerSchema],

    score: { type: Number, default: 0 },
    totalMarks: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    correctCount: { type: Number, default: 0 },
    wrongCount: { type: Number, default: 0 },
    unattempted: { type: Number, default: 0 },
    status: { type: String, enum: ["pass", "fail"], default: "fail" },

    // subject-wise breakdown for analytics
    subjectWise: [
      {
        subject: String,
        correct: Number,
        total: Number,
        score: Number,
      },
    ],

    // proctoring summary
    tabSwitches: { type: Number, default: 0 },
    warnings: { type: Number, default: 0 },
    flagged: { type: Boolean, default: false },

    timeTaken: { type: Number, default: 0 }, // seconds
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

resultSchema.index({ exam: 1, student: 1 }, { unique: true });

const Result = mongoose.model("Result", resultSchema);
export default Result;
