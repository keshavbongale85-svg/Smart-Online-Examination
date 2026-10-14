import { useEffect, useRef, useState } from "react";
import api from "../../api/axios.js";
import { getSocket } from "../../api/socket.js";
import Loader from "../../components/Loader.jsx";
import { PageHeader, Badge, EmptyState } from "../../components/ui.jsx";

export default function Monitoring() {
  const [exams, setExams] = useState([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);
  const [snapshots, setSnapshots] = useState({}); // studentId -> {name,url|image,at}
  const [events, setEvents] = useState([]); // recent violations/submits
  const [live, setLive] = useState(null);
  const prevExam = useRef(null);

  useEffect(() => {
    api
      .get("/exams")
      .then((res) => setExams(res.data.exams))
      .finally(() => setLoading(false));
  }, []);

  // Join/leave socket room when the selected exam changes
  useEffect(() => {
    if (!selected) return;
    const socket = getSocket();

    if (prevExam.current) socket.emit("monitor:leave", prevExam.current);
    socket.emit("monitor:join", selected);
    prevExam.current = selected;
    setSnapshots({});
    setEvents([]);

    const onSnap = (d) =>
      setSnapshots((prev) => ({
        ...prev,
        [d.studentId]: { name: d.name, src: d.image || d.url, at: d.at },
      }));
    const onViolation = (d) =>
      setEvents((prev) =>
        [{ kind: "violation", name: d.name, violationType: d.type, at: d.at }, ...prev].slice(0, 30)
      );
    const onSubmit = (d) =>
      setEvents((prev) =>
        [{ kind: "submit", name: d.name, flagged: d.flagged, at: d.at }, ...prev].slice(0, 30)
      );

    socket.on("monitor:snapshot", onSnap);
    socket.on("monitor:violation", onViolation);
    socket.on("monitor:submitted", onSubmit);

    // Poll live submission status
    const fetchLive = () =>
      api
        .get(`/monitoring/exam/${selected}/live`)
        .then((res) => setLive(res.data))
        .catch(() => {});
    fetchLive();
    const poll = setInterval(fetchLive, 8000);

    return () => {
      socket.off("monitor:snapshot", onSnap);
      socket.off("monitor:violation", onViolation);
      socket.off("monitor:submitted", onSubmit);
      clearInterval(poll);
    };
  }, [selected]);

  if (loading) return <Loader />;

  const feed = Object.entries(snapshots);

  return (
    <div>
      <PageHeader
        title="Live Monitoring"
        subtitle="Real-time proctoring feed via Socket.io"
      />

      <select
        className="input mb-5 max-w-sm"
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
      >
        <option value="">Select an exam to monitor…</option>
        {exams.map((e) => (
          <option key={e._id} value={e._id}>
            {e.title}
          </option>
        ))}
      </select>

      {!selected ? (
        <EmptyState icon="🖥️" title="Pick an exam" subtitle="Choose an exam above to watch live activity." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-600">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              Live webcam feed ({feed.length} active)
            </div>
            {feed.length === 0 ? (
              <div className="card text-sm text-slate-500">
                Waiting for student snapshots… (they appear as students take the exam)
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {feed.map(([sid, s]) => (
                  <div key={sid} className="card p-2">
                    <img
                      src={s.src}
                      alt={s.name}
                      className="aspect-video w-full rounded-lg object-cover"
                    />
                    <div className="mt-1 flex items-center justify-between text-xs">
                      <span className="truncate font-medium">{s.name}</span>
                      <span className="text-slate-400">
                        {new Date(s.at).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {live && (
              <div className="mt-5 flex gap-3">
                <Badge tone="blue">{live.submitted} submitted</Badge>
                <Badge tone="red">{live.flagged} flagged</Badge>
              </div>
            )}
          </div>

          <div>
            <div className="mb-3 text-sm font-medium text-slate-600">
              Event log
            </div>
            <div className="card max-h-[480px] space-y-2 overflow-y-auto">
              {events.length === 0 ? (
                <div className="text-sm text-slate-400">No events yet.</div>
              ) : (
                events.map((e, i) => (
                  <div
                    key={i}
                    className={`rounded-lg p-2 text-sm ${
                      e.kind === "violation"
                        ? "bg-red-50 text-red-700"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{e.name}</span>
                      <span className="text-xs opacity-70">
                        {new Date(e.at).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-xs">
                      {e.kind === "violation"
                        ? `⚠️ Violation: ${e.violationType || "unknown"}`
                        : `✓ Submitted${e.flagged ? " (flagged)" : ""}`}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
