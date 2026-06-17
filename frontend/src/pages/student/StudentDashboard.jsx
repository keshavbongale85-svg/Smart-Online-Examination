import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios.js";
import { useAuth } from "../../context/AuthContext.jsx";
import Loader from "../../components/Loader.jsx";
import { PageHeader, StatCard, EmptyState, Badge } from "../../components/ui.jsx";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/exams"), api.get("/results/me")])
      .then(([e, r]) => {
        setExams(e.data.exams);
        setResults(r.data.results);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  const available = exams.filter((e) => !e.attempted);
  const published = results.filter((r) => r.resultsPublished !== false);
  const avg =
    published.length > 0
      ? Math.round(
          published.reduce((s, r) => s + (r.percentage || 0), 0) /
            published.length
        )
      : 0;

  return (
    <div>
      <PageHeader
        title={`Hi, ${user.name.split(" ")[0]} 👋`}
        subtitle="Here's your assessment overview"
      />

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Available exams" value={available.length} />
        <StatCard label="Attempted" value={results.length} color="amber" />
        <StatCard label="Avg score" value={`${avg}%`} color="green" />
        <StatCard label="Total exams" value={exams.length} color="brand" />
      </div>

      <h2 className="mb-3 text-lg font-semibold">Available exams</h2>
      {available.length === 0 ? (
        <EmptyState
          icon="✅"
          title="No exams to take right now"
          subtitle="You're all caught up. Check back later."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {available.slice(0, 6).map((exam) => (
            <div key={exam._id} className="card flex flex-col">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold">{exam.title}</h3>
                <Badge tone="blue">{exam.subject}</Badge>
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                {exam.description || "No description"}
              </p>
              <div className="mt-3 flex gap-4 text-xs text-slate-500">
                <span>⏱ {exam.duration} min</span>
                <span>📝 {exam.questionCount ?? "—"} Qs</span>
                <span>🎯 {exam.totalMarks} marks</span>
              </div>
              <Link
                to={`/exams/${exam._id}`}
                className="btn-primary mt-4"
              >
                View & Start
              </Link>
            </div>
          ))}
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent results</h2>
            <Link to="/results" className="text-sm text-brand-600 hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {results.slice(0, 4).map((r) => (
              <Link
                key={r._id}
                to={`/results/${r._id}`}
                className="card flex items-center justify-between hover:border-brand-200"
              >
                <span className="font-medium">{r.exam?.title}</span>
                {r.resultsPublished === false ? (
                  <Badge tone="amber">Pending</Badge>
                ) : (
                  <span className="flex items-center gap-2">
                    <span className="font-semibold">{r.percentage}%</span>
                    <Badge tone={r.status === "pass" ? "green" : "red"}>
                      {r.status}
                    </Badge>
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
