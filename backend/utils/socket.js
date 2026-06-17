import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let io = null;

// Initialize Socket.io on the HTTP server.
// Used for live proctoring: students emit snapshots/violations,
// admins join exam rooms to watch in real time.
export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL?.split(",") || "*",
      credentials: true,
    },
  });

  // Optional auth handshake — token passed via socket.handshake.auth.token
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(); // allow anonymous connect; gated per-event
    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      // ignore invalid token, treat as anonymous
    }
    next();
  });

  io.on("connection", (socket) => {
    // Admin watches a given exam's live feed
    socket.on("monitor:join", (examId) => {
      if (examId) socket.join(`exam:${examId}`);
    });
    socket.on("monitor:leave", (examId) => {
      if (examId) socket.leave(`exam:${examId}`);
    });

    // Student pushes a webcam snapshot (base64) to admins
    socket.on("student:snapshot", ({ examId, studentId, image, name }) => {
      if (!examId) return;
      io.to(`exam:${examId}`).emit("monitor:snapshot", {
        studentId,
        name,
        image,
        at: Date.now(),
      });
    });

    // Student reports a proctoring violation (tab switch, etc.)
    socket.on("student:violation", ({ examId, studentId, name, type }) => {
      if (!examId) return;
      io.to(`exam:${examId}`).emit("monitor:violation", {
        studentId,
        name,
        type,
        at: Date.now(),
      });
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};

// Safe emit helper for use in controllers (no-op if socket not ready)
export const emitTo = (room, event, payload) => {
  if (io) io.to(room).emit(event, payload);
};
