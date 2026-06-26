import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import { AuthShell } from "./Login.jsx";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const [pw, setPw] = useState({ password: "", confirm: "" });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (pw.password.length < 6)
      return toast.error("Password must be at least 6 characters");
    if (pw.password !== pw.confirm)
      return toast.error("Passwords do not match");
    setBusy(true);
    try {
      const res = await api.put(`/auth/reset-password/${token}`, {
        password: pw.password,
      });
      localStorage.setItem("token", res.data.token);
      updateUser(res.data.user);
      toast.success("Password reset! You are now signed in.");
      navigate(res.data.user.role === "admin" ? "/admin" : "/", {
        replace: true,
      });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Set new password">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">New password</label>
          <input
            type="password"
            className="input"
            required
            value={pw.password}
            onChange={(e) => setPw({ ...pw, password: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Confirm password</label>
          <input
            type="password"
            className="input"
            required
            value={pw.confirm}
            onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
          />
        </div>
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? "Saving…" : "Reset password"}
        </button>
        <Link to="/login" className="block text-center text-sm text-brand-600 hover:underline">
          Back to sign in
        </Link>
      </form>
    </AuthShell>
  );
}
