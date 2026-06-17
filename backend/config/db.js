import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let memoryServer = null;

// Resolve the MongoDB connection string.
// - If MONGO_URI is set in .env, use it (e.g. Atlas or a local mongod).
// - Otherwise spin up an in-process MongoDB that runs entirely on this
//   machine (no cloud, no API keys). Data persists to backend/.localdb so
//   it survives restarts.
const resolveUri = async () => {
  if (process.env.MONGO_URI && process.env.MONGO_URI.trim()) {
    return process.env.MONGO_URI.trim();
  }

  console.log("ℹ️  No MONGO_URI set — starting a local in-process MongoDB…");
  // Dynamic import so this heavy dep only loads in local mode.
  const { MongoMemoryServer } = await import("mongodb-memory-server");
  const dbPath = path.join(__dirname, "..", ".localdb");
  const fs = await import("fs");
  fs.mkdirSync(dbPath, { recursive: true });

  memoryServer = await MongoMemoryServer.create({
    instance: {
      dbName: "smart_exam",
      dbPath,
      storageEngine: "wiredTiger", // persists data to disk
    },
  });
  return memoryServer.getUri();
};

const connectDB = async () => {
  try {
    const uri = await resolveUri();
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);

    // Auto-seed demo data on first run (empty DB) so login works immediately.
    const { default: User } = await import("../models/User.model.js");
    const count = await User.countDocuments();
    if (count === 0) {
      console.log("🌱 Empty database — seeding demo data…");
      const { seedDatabase } = await import("../utils/seedData.js");
      const info = await seedDatabase();
      console.log(`   Admin   → ${info.admin}`);
      console.log(`   Student → ${info.student}`);
    }
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

// Stop the in-process server cleanly on shutdown (without wiping data).
const shutdown = async () => {
  try {
    await mongoose.connection.close();
    if (memoryServer) await memoryServer.stop({ doCleanup: false });
  } catch {
    /* ignore */
  }
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

export default connectDB;
