import mongoose from "mongoose";

const examSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    subject: { type: String, default: "General" },
    duration: { type: Number, required: true, default: 30 }, // minutes
    totalMarks: { type: Number, default: 0 },
    passingMarks: { type: Number, default: 0 },

    // number of questions served to each student (randomized subset)
    questionsPerAttempt: { type: Number, default: 0 }, // 0 = all questions

    negativeMarking: { type: Boolean, default: false },
    negativeMarkValue: { type: Number, default: 0.25 }, // fraction per wrong answer

    startDate: { type: Date },
    endDate: { type: Date },

    isPublished: { type: Boolean, default: false }, // exam visible to students
    resultsPublished: { type: Boolean, default: false }, // scores visible

    proctoring: {
      webcam: { type: Boolean, default: true },
      tabSwitchLimit: { type: Number, default: 3 },
      snapshotInterval: { type: Number, default: 30 }, // seconds
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

examSchema.virtual("questionCount", {
  ref: "Question",
  localField: "_id",
  foreignField: "exam",
  count: true,
});

examSchema.set("toJSON", { virtuals: true });
examSchema.set("toObject", { virtuals: true });

const Exam = mongoose.model("Exam", examSchema);
export default Exam;
