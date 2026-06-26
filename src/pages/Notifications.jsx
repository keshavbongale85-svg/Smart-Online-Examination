import { useEffect, useState } from "react";
import api from "../api/axios.js";
import Loader from "../components/Loader.jsx";
import { PageHeader, EmptyState, Badge } from "../components/ui.jsx";

const toneByType = { info: "blue", exam: "amber", result: "green", warning: "red" };

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () =>
    api
      .get("/notifications")
      .then((res) => setItems(res.data.notifications))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const markAll = async () => {
    await api.patch("/notifications/read-all");
    load();
  };

  const markOne = async (id) => {
    await api.patch(`/notifications/${id}/read`);
    setItems((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
  };

  if (loading) return <Loader />;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Notifications"
        action={
          items.some((n) => !n.isRead) && (
            <button onClick={markAll} className="btn-secondary">
              Mark all read
            </button>
          )
        }
      />
      {items.length === 0 ? (
        <EmptyState icon="🔔" title="No notifications yet" />
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <div
              key={n._id}
              onClick={() => !n.isRead && markOne(n._id)}
              className={`card cursor-pointer transition ${
                n.isRead ? "opacity-70" : "border-brand-200 bg-brand-50/40"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{n.title}</span>
                    <Badge tone={toneByType[n.type] || "slate"}>{n.type}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{n.message}</p>
                </div>
                {!n.isRead && (
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                )}
              </div>
              <div className="mt-2 text-xs text-slate-400">
                {new Date(n.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
