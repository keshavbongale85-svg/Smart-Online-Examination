import User from "../models/User.model.js";
import Result from "../models/Result.model.js";
import asyncHandler from "../utils/asyncHandler.js";

// @route GET /api/users  (admin) — list users, optional ?role= & ?search=
export const getUsers = asyncHandler(async (req, res) => {
  const { role, search } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { college: { $regex: search, $options: "i" } },
    ];
  }
  const users = await User.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, count: users.length, users });
});

// @route GET /api/users/:id  (admin)
export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  const results = await Result.find({ student: user._id })
    .populate("exam", "title")
    .sort({ createdAt: -1 });
  res.json({ success: true, user, results });
});

// @route PATCH /api/users/:id/status  (admin) — activate/deactivate
export const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  if (user._id.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error("You cannot change your own status");
  }
  user.isActive =
    req.body.isActive !== undefined ? req.body.isActive : !user.isActive;
  await user.save();
  res.json({ success: true, user });
});

// @route PATCH /api/users/:id/role  (admin) — promote/demote
export const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!["student", "admin"].includes(role)) {
    res.status(400);
    throw new Error("Invalid role");
  }
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  user.role = role;
  await user.save();
  res.json({ success: true, user });
});

// @route DELETE /api/users/:id  (admin)
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  if (user._id.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error("You cannot delete your own account");
  }
  await Result.deleteMany({ student: user._id });
  await user.deleteOne();
  res.json({ success: true, message: "User deleted" });
});

// @route GET /api/users/stats/overview  (admin) — dashboard counters
export const getUserStats = asyncHandler(async (req, res) => {
  const [students, admins, active] = await Promise.all([
    User.countDocuments({ role: "student" }),
    User.countDocuments({ role: "admin" }),
    User.countDocuments({ isActive: true }),
  ]);
  res.json({
    success: true,
    stats: { students, admins, active, total: students + admins },
  });
});
