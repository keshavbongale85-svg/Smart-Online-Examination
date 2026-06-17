import Notification from "../models/Notification.model.js";
import User from "../models/User.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { emitTo } from "../utils/socket.js";

// @route GET /api/notifications  (auth) — own + broadcast notifications
export const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({
    $or: [{ user: req.user._id }, { user: null }],
  })
    .sort({ createdAt: -1 })
    .limit(100);

  const unread = notifications.filter((n) => !n.isRead).length;
  res.json({ success: true, unread, notifications });
});

// @route PATCH /api/notifications/:id/read  (auth)
export const markRead = asyncHandler(async (req, res) => {
  const n = await Notification.findById(req.params.id);
  if (!n) {
    res.status(404);
    throw new Error("Notification not found");
  }
  // Only the owner can mark a personal notification read
  if (n.user && n.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized");
  }
  n.isRead = true;
  await n.save();
  res.json({ success: true, notification: n });
});

// @route PATCH /api/notifications/read-all  (auth)
export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { user: req.user._id, isRead: false },
    { isRead: true }
  );
  res.json({ success: true, message: "All notifications marked read" });
});

// @route DELETE /api/notifications/:id  (auth)
export const deleteNotification = asyncHandler(async (req, res) => {
  const n = await Notification.findById(req.params.id);
  if (!n) {
    res.status(404);
    throw new Error("Notification not found");
  }
  if (n.user && n.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Not authorized");
  }
  await n.deleteOne();
  res.json({ success: true, message: "Notification deleted" });
});

// @route POST /api/notifications/broadcast  (admin)
// body: { title, message, type, link } — null user = everyone
export const broadcast = asyncHandler(async (req, res) => {
  const { title, message, type, link } = req.body;
  if (!title || !message) {
    res.status(400);
    throw new Error("Title and message are required");
  }
  const notification = await Notification.create({
    user: null,
    title,
    message,
    type: type || "info",
    link: link || "",
  });
  // Push to anyone connected (clients can filter)
  emitTo("global", "notification:new", notification);
  res.status(201).json({ success: true, notification });
});

// @route POST /api/notifications/user/:userId  (admin) — target one user
export const notifyUser = asyncHandler(async (req, res) => {
  const { title, message, type, link } = req.body;
  const user = await User.findById(req.params.userId);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  const notification = await Notification.create({
    user: user._id,
    title,
    message,
    type: type || "info",
    link: link || "",
  });
  res.status(201).json({ success: true, notification });
});
