import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios.js";
import { AuthShell } from "./Login.jsx";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
      toast.success("If that email exists, a reset link was sent");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Reset password" subtitle="We'll email you a reset link">
      {sent ? (
        <div className="text-center text-sm text-slate-600">
          <p className="mb-4">
            Check your inbox for a reset link. It expires in 15 minutes.
          </p>
          <Link to="/login" className="btn-primary w-full">
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? "Sending…" : "Send reset link"}
          </button>
          <Link to="/login" className="block text-center text-sm text-brand-600 hover:underline">
            Back to sign in
          </Link>
        </form>
      )}
    </AuthShell>
  );
}
