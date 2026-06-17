import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
      index: true,
    },
    questionText: { type: String, required: true, trim: true },
    options: {
      type: [String],
      validate: {
        validator: (v) => v.length >= 2 && v.length <= 6,
        message: "A question must have between 2 and 6 options",
      },
      required: true,
    },
    // index (0-based) of the correct option
    correctOption: { type: Number, required: true, min: 0 },
    marks: { type: Number, default: 1 },
    subject: { type: String, default: "General" },
    topic: { type: String, default: "" },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
  },
  { timestamps: true }
);

const Question = mongoose.model("Question", questionSchema);
export default Question;
