import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/axios.js";
import Loader from "../../components/Loader.jsx";
import { PageHeader, Badge } from "../../components/ui.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

export default function AdminUsers() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const load = () =>
    api.get("/users").then((res) => setUsers(res.data.users));

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const toggleStatus = async (u) => {
    try {
      await api.patch(`/users/${u._id}/status`, { isActive: !u.isActive });
      toast.success(u.isActive ? "Deactivated" : "Activated");
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const changeRole = async (u, role) => {
    try {
      await api.patch(`/users/${u._id}/role`, { role });
      toast.success("Role updated");
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const remove = async (u) => {
    if (!confirm(`Delete ${u.name}? This removes their results too.`)) return;
    try {
      await api.delete(`/users/${u._id}`);
      toast.success("User deleted");
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <Loader />;

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(q.toLowerCase()) ||
      u.email.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div>
      <PageHeader title="Users" subtitle={`${users.length} registered`} />
      <input
        className="input mb-5 max-w-sm"
        placeholder="Search name or email…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">College</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((u) => {
              const isMe = u._id === me._id;
              return (
                <tr key={u._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">
                    {u.name} {isMe && <span className="text-xs text-slate-400">(you)</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{u.email}</td>
                  <td className="px-4 py-3 text-slate-500">{u.college || "—"}</td>
                  <td className="px-4 py-3">
                    <select
                      className="rounded border border-slate-200 px-2 py-1 text-xs disabled:opacity-50"
                      value={u.role}
                      disabled={isMe}
                      onChange={(e) => changeRole(u, e.target.value)}
                    >
                      <option value="student">student</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={u.isActive ? "green" : "red"}>
                      {u.isActive ? "active" : "inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => toggleStatus(u)}
                        disabled={isMe}
                        className="text-brand-600 hover:underline disabled:opacity-40"
                      >
                        {u.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => remove(u)}
                        disabled={isMe}
                        className="text-red-600 hover:underline disabled:opacity-40"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
