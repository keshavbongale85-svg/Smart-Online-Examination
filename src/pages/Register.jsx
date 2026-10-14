import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext.jsx";
import { AuthShell } from "./Login.jsx";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    college: "",
    branch: "",
    phone: "",
  });
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6)
      return toast.error("Password must be at least 6 characters");
    setBusy(true);
    try {
      const user = await register(form);
      toast.success("Account created!");
      navigate(user.role === "admin" ? "/admin" : "/", { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Create account" subtitle="Register to take exams">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Full name</label>
          <input className="input" required value={form.name} onChange={set("name")} />
        </div>
        <div>
          <label className="label">Email</label>
          <input type="email" className="input" required value={form.email} onChange={set("email")} />
        </div>
        <div>
          <label className="label">Password</label>
          <input type="password" className="input" required value={form.password} onChange={set("password")} placeholder="min 6 characters" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">College</label>
            <input className="input" value={form.college} onChange={set("college")} />
          </div>
          <div>
            <label className="label">Branch</label>
            <input className="input" value={form.branch} onChange={set("branch")} />
          </div>
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input" value={form.phone} onChange={set("phone")} />
        </div>
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? "Creating…" : "Create account"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Already registered?{" "}
        <Link to="/login" className="font-medium text-brand-600 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
