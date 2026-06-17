import crypto from "crypto";
import User from "../models/User.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendTokenCookie } from "../utils/generateToken.js";
import { sendEmail } from "../utils/email.js";

const publicUser = (u) => ({
  _id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  avatar: u.avatar,
  phone: u.phone,
  college: u.college,
  branch: u.branch,
  createdAt: u.createdAt,
});

// @route POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, college, branch, phone } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Name, email and password are required");
  }

  const exists = await User.findOne({ email });
  if (exists) {
    res.status(400);
    throw new Error("Email already registered");
  }

  // Only allow admin self-registration if no admin exists yet (bootstrap)
  let finalRole = "student";
  if (role === "admin") {
    const adminCount = await User.countDocuments({ role: "admin" });
    if (adminCount === 0) finalRole = "admin";
  }

  const user = await User.create({
    name,
    email,
    password,
    role: finalRole,
    college,
    branch,
    phone,
  });

  const token = sendTokenCookie(res, user._id);
  res.status(201).json({ success: true, token, user: publicUser(user) });
});

// @route POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }
  if (!user.isActive) {
    res.status(403);
    throw new Error("Account is deactivated");
  }

  const token = sendTokenCookie(res, user._id);
  res.json({ success: true, token, user: publicUser(user) });
});

// @route POST /api/auth/logout
export const logout = asyncHandler(async (req, res) => {
  res.cookie("token", "", { httpOnly: true, expires: new Date(0) });
  res.json({ success: true, message: "Logged out" });
});

// @route GET /api/auth/me
export const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: publicUser(req.user) });
});

// @route PUT /api/auth/profile
export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("+password");
  const { name, phone, college, branch, avatar, password } = req.body;

  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (college !== undefined) user.college = college;
  if (branch !== undefined) user.branch = branch;
  if (avatar !== undefined) user.avatar = avatar;
  if (password) user.password = password; // re-hashed by pre-save hook

  await user.save();
  res.json({ success: true, user: publicUser(user) });
});

// @route POST /api/auth/forgot-password
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Always respond success to avoid email enumeration
  if (!user) {
    return res.json({
      success: true,
      message: "If that email exists, a reset link has been sent",
    });
  }

  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${
    process.env.CLIENT_URL?.split(",")[0] || "http://localhost:5173"
  }/reset-password/${resetToken}`;

  try {
    await sendEmail({
      to: user.email,
      subject: "Smart Exam — Password Reset",
      html: `<p>You requested a password reset.</p>
             <p>Click <a href="${resetUrl}">here</a> to reset (valid 15 min).</p>
             <p>If you didn't request this, ignore this email.</p>`,
      text: `Reset your password: ${resetUrl}`,
    });
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    res.status(500);
    throw new Error("Email could not be sent");
  }

  res.json({ success: true, message: "Reset link sent to email" });
});

// @route PUT /api/auth/reset-password/:token
export const resetPassword = asyncHandler(async (req, res) => {
  const hashed = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashed,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error("Invalid or expired reset token");
  }
  if (!req.body.password) {
    res.status(400);
    throw new Error("New password is required");
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  const token = sendTokenCookie(res, user._id);
  res.json({ success: true, token, user: publicUser(user) });
});
