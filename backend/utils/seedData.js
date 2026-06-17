import User from "../models/User.model.js";
import Exam from "../models/Exam.model.js";
import Question from "../models/Question.model.js";
import Result from "../models/Result.model.js";
import Notification from "../models/Notification.model.js";

// Populate the database with demo data.
// Assumes a Mongoose connection is already open.
// Pass { fresh: true } to wipe existing data first.
export const seedDatabase = async ({ fresh = false } = {}) => {
  if (fresh) {
    await Promise.all([
      User.deleteMany({}),
      Exam.deleteMany({}),
      Question.deleteMany({}),
      Result.deleteMany({}),
      Notification.deleteMany({}),
    ]);
  }

  const admin = await User.create({
    name: "Admin User",
    email: "admin@smartexam.com",
    password: "admin123",
    role: "admin",
  });

  await User.create([
    { name: "Asha Patel", email: "asha@student.com", password: "student123", college: "MIT", branch: "CSE" },
    { name: "Ravi Kumar", email: "ravi@student.com", password: "student123", college: "MIT", branch: "ECE" },
    { name: "Neha Singh", email: "neha@student.com", password: "student123", college: "VIT", branch: "IT" },
  ]);

  const exam = await Exam.create({
    title: "General Aptitude Test",
    description: "Sample exam covering Math, Reasoning and English.",
    subject: "Aptitude",
    duration: 30,
    passingMarks: 3,
    questionsPerAttempt: 0,
    negativeMarking: true,
    negativeMarkValue: 0.25,
    isPublished: true,
    resultsPublished: true,
    createdBy: admin._id,
  });

  const questions = [
    { questionText: "What is 12 × 8?", options: ["96", "104", "88", "108"], correctOption: 0, subject: "Math", difficulty: "easy" },
    { questionText: "Next number: 2, 4, 8, 16, ?", options: ["24", "32", "30", "20"], correctOption: 1, subject: "Reasoning", difficulty: "easy" },
    { questionText: "Synonym of 'rapid'?", options: ["Slow", "Quick", "Heavy", "Late"], correctOption: 1, subject: "English", difficulty: "easy" },
    { questionText: "If x + 5 = 12, x = ?", options: ["5", "6", "7", "8"], correctOption: 2, subject: "Math", difficulty: "medium" },
    { questionText: "Odd one out: Apple, Mango, Carrot, Banana", options: ["Apple", "Mango", "Carrot", "Banana"], correctOption: 2, subject: "Reasoning", difficulty: "medium" },
  ];
  await Question.insertMany(questions.map((q) => ({ ...q, exam: exam._id })));

  exam.totalMarks = questions.reduce((s, q) => s + (q.marks || 1), 0);
  await exam.save();

  await Notification.create({
    user: null,
    title: "Welcome to Smart Exam",
    message: "A new exam 'General Aptitude Test' is now available.",
    type: "exam",
  });

  return {
    admin: "admin@smartexam.com / admin123",
    student: "asha@student.com / student123",
    exam: exam.title,
    questions: questions.length,
    totalMarks: exam.totalMarks,
  };
};
