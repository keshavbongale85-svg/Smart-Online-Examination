import { useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import { PageHeader } from "../components/ui.jsx";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user.name || "",
    phone: user.phone || "",
    college: user.college || "",
    branch: user.branch || "",
    password: "",
  });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      const res = await api.put("/auth/profile", payload);
      updateUser(res.data.user);
      setForm({ ...form, password: "" });
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="My Profile" subtitle={user.email} />
      <form onSubmit={submit} className="card space-y-4">
        <div>
          <label className="label">Name</label>
          <input className="input" value={form.name} onChange={set("name")} />
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
        <div>
          <label className="label">New password</label>
          <input
            type="password"
            className="input"
            value={form.password}
            onChange={set("password")}
            placeholder="Leave blank to keep current"
          />
        </div>
        <button className="btn-primary" disabled={busy}>
          {busy ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
