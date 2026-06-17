import axios from "axios";

// In dev, baseURL "/api" is proxied to the Express backend by Vite.
// In production (Vercel), set VITE_API_URL to the deployed backend, e.g.
//   VITE_API_URL=https://your-backend.up.railway.app/api
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
});

// Attach the JWT from localStorage to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Normalize error messages so UI can just read err.message
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.message || err.message || "Something went wrong";
    // Auto-logout on auth failure
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
    }
    return Promise.reject(new Error(message));
  }
);

export default api;
