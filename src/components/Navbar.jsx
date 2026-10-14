import { Link, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/axios.js";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    api
      .get("/notifications")
      .then((res) => setUnread(res.data.unread || 0))
      .catch(() => {});
  }, [user]);

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isAdmin = user.role === "admin";
  const links = isAdmin
    ? [
        { to: "/admin", label: "Dashboard", end: true },
        { to: "/admin/exams", label: "Exams" },
        { to: "/admin/users", label: "Users" },
        { to: "/admin/monitoring", label: "Monitoring" },
      ]
    : [
        { to: "/dashboard", label: "Dashboard", end: true },
        { to: "/exams", label: "Exams" },
        { to: "/results", label: "My Results" },
      ];

  return (
    <nav className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to={isAdmin ? "/admin" : "/dashboard"} className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white font-bold">
            S
          </span>
          <span className="text-lg font-semibold">Smart Exam</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-600 hover:bg-slate-100"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/notifications"
            className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            title="Notifications"
          >
            🔔
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unread}
              </span>
            )}
          </Link>
          <Link
            to="/profile"
            className="hidden text-right sm:block"
            title="Profile"
          >
            <div className="text-sm font-medium leading-tight">{user.name}</div>
            <div className="text-xs capitalize text-slate-500">{user.role}</div>
          </Link>
          <button onClick={handleLogout} className="btn-secondary">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
