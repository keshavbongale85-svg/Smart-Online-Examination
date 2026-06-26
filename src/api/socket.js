import { io } from "socket.io-client";

let socket = null;

// Lazily create a single shared socket connection, authed with the JWT.
export const getSocket = () => {
  if (socket) return socket;
  const token = localStorage.getItem("token");
  // Dev: "/" is proxied to the backend by Vite. Production (Vercel): set
  // VITE_SOCKET_URL to the backend origin, e.g. https://your-backend.up.railway.app
  const url = import.meta.env.VITE_SOCKET_URL || "/";
  socket = io(url, {
    auth: { token },
    autoConnect: true,
    transports: ["websocket", "polling"],
  });
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
