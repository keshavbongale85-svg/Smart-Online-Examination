import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios.js";
import Loader from "../../components/Loader.jsx";
import { PageHeader, EmptyState, Badge } from "../../components/ui.jsx";

export default function MyResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/results/me")
      .then((res) => setResults(res.data.results))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  return (
    <div>
      <PageHeader title="My Results" subtitle="Your exam attempts and scores" />
      {results.length === 0 ? (
        <EmptyState
          icon="📊"
          title="No results yet"
          subtitle="Take an exam to see your scores here."
          action={
            <Link to="/exams" className="btn-primary">
              Browse exams
            </Link>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Exam</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Result</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {results.map((r) => (
                <tr key={r._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{r.exam?.title}</td>
                  <td className="px-4 py-3">
                    {r.resultsPublished === false ? (
                      <span className="text-slate-400">—</span>
                    ) : (
                      `${r.score}/${r.totalMarks} (${r.percentage}%)`
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {r.resultsPublished === false ? (
                      <Badge tone="amber">Pending</Badge>
                    ) : (
                      <Badge tone={r.status === "pass" ? "green" : "red"}>
                        {r.status}
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(r.submittedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {r.resultsPublished !== false && (
                      <Link
                        to={`/results/${r._id}`}
                        className="text-brand-600 hover:underline"
                      >
                        View
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
