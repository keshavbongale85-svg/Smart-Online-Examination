import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios.js";
import Loader from "../../components/Loader.jsx";
import { PageHeader, StatCard, Badge } from "../../components/ui.jsx";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [exams, setExams] = useState([]);
  const [flagged, setFlagged] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/users/stats/overview"),
      api.get("/exams"),
      api.get("/monitoring/flagged"),
    ])
      .then(([s, e, f]) => {
        setStats(s.data.stats);
        setExams(e.data.exams);
        setFlagged(f.data.results);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  const published = exams.filter((e) => e.isPublished).length;

  return (
    <div>
      <PageHeader
        title="Admin Dashboard"
        subtitle="Overview of exams, users and proctoring"
        action={
          <Link to="/admin/exams/new" className="btn-primary">
            + New Exam
          </Link>
        }
      />

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total exams" value={exams.length} hint={`${published} published`} />
        <StatCard label="Students" value={stats.students} color="green" />
        <StatCard label="Active users" value={stats.active} color="brand" />
        <StatCard label="Flagged attempts" value={flagged.length} color="red" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent exams</h2>
            <Link to="/admin/exams" className="text-sm text-brand-600 hover:underline">
              Manage all
            </Link>
          </div>
          <div className="space-y-2">
            {exams.slice(0, 5).map((e) => (
              <Link
                key={e._id}
                to={`/admin/exams/${e._id}`}
                className="card flex items-center justify-between hover:border-brand-200"
              >
                <div>
                  <div className="font-medium">{e.title}</div>
                  <div className="text-xs text-slate-500">
                    {e.questionCount ?? 0} questions · {e.totalMarks} marks
                  </div>
                </div>
                <Badge tone={e.isPublished ? "green" : "slate"}>
                  {e.isPublished ? "Published" : "Draft"}
                </Badge>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold">Flagged attempts</h2>
          {flagged.length === 0 ? (
            <div className="card text-sm text-slate-500">
              No flagged attempts. 🎉
            </div>
          ) : (
            <div className="space-y-2">
              {flagged.slice(0, 5).map((r) => (
                <div key={r._id} className="card">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{r.student?.name}</span>
                    <Badge tone="red">{r.tabSwitches} switches</Badge>
                  </div>
                  <div className="text-xs text-slate-500">{r.exam?.title}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
