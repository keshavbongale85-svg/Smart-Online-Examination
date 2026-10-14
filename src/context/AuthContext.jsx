import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, if we have a token, fetch the current user
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then((res) => setUser(res.data.user))
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setLoading(false));
  }, []);

  const persist = (token, userData) => {
    if (token) localStorage.setItem("token", token);
    setUser(userData);
  };

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    persist(res.data.token, res.data.user);
    return res.data.user;
  };

  const register = async (payload) => {
    const res = await api.post("/auth/register", payload);
    persist(res.data.token, res.data.user);
    return res.data.user;
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      /* ignore network errors on logout */
    }
    localStorage.removeItem("token");
    setUser(null);
  };

  const updateUser = (partial) => setUser((u) => ({ ...u, ...partial }));

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
