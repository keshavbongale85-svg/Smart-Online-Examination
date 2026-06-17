import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import api from "../../api/axios.js";
import Loader from "../../components/Loader.jsx";
import { PageHeader, StatCard, EmptyState, Badge } from "../../components/ui.jsx";

export default function ExamResults() {
  const { id } = useParams();
  const [exam, setExam] = useState(null);
  const [results, setResults] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/exams/${id}`),
      api.get(`/results/exam/${id}`),
      api.get(`/results/exam/${id}/analytics`),
    ])
      .then(([e, r, a]) => {
        setExam(e.data.exam);
        setResults(r.data.results);
        setAnalytics(a.data.analytics);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loader />;

  return (
    <div>
      <Link to="/admin/exams" className="text-sm text-brand-600 hover:underline">
        ← Back to exams
      </Link>
      <PageHeader title={`Results — ${exam?.title}`} subtitle={`${analytics.attempts} attempts`} />

      {analytics.attempts === 0 ? (
        <EmptyState icon="📊" title="No attempts yet" />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
            <StatCard label="Attempts" value={analytics.attempts} />
            <StatCard label="Avg score" value={`${analytics.avgScore}%`} color="brand" />
            <StatCard label="Highest" value={`${analytics.highest}%`} color="green" />
            <StatCard label="Pass rate" value={`${analytics.passRate}%`} color="green" />
            <StatCard label="Flagged" value={analytics.flaggedCount} color="red" />
          </div>

          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            <div className="card">
              <h3 className="mb-3 font-semibold">Score distribution</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={analytics.scoreDistribution}>
                  <XAxis dataKey="range" fontSize={10} angle={-30} textAnchor="end" height={50} />
                  <YAxis allowDecimals={false} fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {analytics.subjectAverages.length > 0 && (
              <div className="card">
                <h3 className="mb-3 font-semibold">Subject accuracy</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={analytics.subjectAverages}>
                    <XAxis dataKey="subject" fontSize={12} />
                    <YAxis domain={[0, 100]} fontSize={12} unit="%" />
                    <Tooltip />
                    <Bar dataKey="accuracy" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <h3 className="mb-3 font-semibold">All attempts</h3>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Score</th>
                  <th className="px-4 py-3 font-medium">%</th>
                  <th className="px-4 py-3 font-medium">Result</th>
                  <th className="px-4 py-3 font-medium">Proctoring</th>
                  <th className="px-4 py-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium">{r.student?.name}</div>
                      <div className="text-xs text-slate-400">{r.student?.email}</div>
                    </td>
                    <td className="px-4 py-3">{r.score}/{r.totalMarks}</td>
                    <td className="px-4 py-3">{r.percentage}%</td>
                    <td className="px-4 py-3">
                      <Badge tone={r.status === "pass" ? "green" : "red"}>{r.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {r.flagged ? (
                        <Badge tone="red">⚠ {r.tabSwitches} switches</Badge>
                      ) : (
                        <span className="text-slate-400">clean</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {Math.floor(r.timeTaken / 60)}m {r.timeTaken % 60}s
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
