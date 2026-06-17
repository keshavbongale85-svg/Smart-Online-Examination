import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import connectDB from "../config/db.js";
import { seedDatabase } from "./seedData.js";

// Standalone seed script: `npm run seed`
const run = async () => {
  await connectDB();
  console.log("🌱 Seeding database (wiping existing data)…");
  const info = await seedDatabase({ fresh: true });

  console.log("\n✅ Seed complete!");
  console.log(`   Admin   → ${info.admin}`);
  console.log(`   Student → ${info.student}`);
  console.log(`   Exam    → "${info.exam}" (${info.questions} questions, ${info.totalMarks} marks)\n`);

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
