import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import toast from "react-hot-toast";
import api from "../../api/axios.js";
import Loader from "../../components/Loader.jsx";
import { StatCard, Badge } from "../../components/ui.jsx";

const COLORS = ["#22c55e", "#ef4444", "#94a3b8"];

export default function ResultDetail() {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/results/${id}`)
      .then((res) => setResult(res.data.result))
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loader />;
  if (!result)
    return (
      <div className="card text-center">
        Result not available.{" "}
        <Link to="/results" className="text-brand-600 hover:underline">
          Back
        </Link>
      </div>
    );

  const pie = [
    { name: "Correct", value: result.correctCount },
    { name: "Wrong", value: result.wrongCount },
    { name: "Skipped", value: result.unattempted },
  ];
  const subjectData = (result.subjectWise || []).map((s) => ({
    subject: s.subject,
    accuracy: s.total ? Math.round((s.correct / s.total) * 100) : 0,
  }));

  return (
    <div>
      <Link to="/results" className="text-sm text-brand-600 hover:underline">
        ← Back to results
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{result.exam?.title}</h1>
          <p className="text-sm text-slate-500">
            Submitted {new Date(result.submittedAt).toLocaleString()}
          </p>
        </div>
        <Badge tone={result.status === "pass" ? "green" : "red"}>
          {result.status === "pass" ? "✓ Passed" : "✗ Failed"}
        </Badge>
      </div>

      {result.flagged && (
        <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          ⚠️ This attempt was flagged for proctoring violations (
          {result.tabSwitches} tab switches).
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Score" value={`${result.score}/${result.totalMarks}`} />
        <StatCard label="Percentage" value={`${result.percentage}%`} color="green" />
        <StatCard label="Correct" value={result.correctCount} color="green" />
        <StatCard label="Wrong" value={result.wrongCount} color="red" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-3 font-semibold">Answer breakdown</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={pie} dataKey="value" nameKey="name" outerRadius={90} label>
                {pie.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {subjectData.length > 0 && (
          <div className="card">
            <h3 className="mb-3 font-semibold">Subject-wise accuracy</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={subjectData}>
                <XAxis dataKey="subject" fontSize={12} />
                <YAxis domain={[0, 100]} fontSize={12} unit="%" />
                <Tooltip />
                <Bar dataKey="accuracy" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Per-question review (present when backend populates answers.question) */}
      {Array.isArray(result.answers) && result.answers[0]?.question?.questionText && (
        <div className="mt-6">
          <h3 className="mb-3 font-semibold">Question review</h3>
          <div className="space-y-3">
            {result.answers.map((a, i) => {
              const q = a.question;
              return (
                <div key={i} className="card">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium">
                      {i + 1}. {q.questionText}
                    </p>
                    <Badge tone={a.isCorrect ? "green" : a.selectedOption === -1 ? "slate" : "red"}>
                      {a.isCorrect ? "Correct" : a.selectedOption === -1 ? "Skipped" : "Wrong"}
                    </Badge>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    {q.options.map((opt, oi) => {
                      const isCorrect = oi === q.correctOption;
                      const isPicked = oi === a.selectedOption;
                      return (
                        <div
                          key={oi}
                          className={`rounded-lg border px-3 py-2 text-sm ${
                            isCorrect
                              ? "border-emerald-300 bg-emerald-50"
                              : isPicked
                              ? "border-red-300 bg-red-50"
                              : "border-slate-200"
                          }`}
                        >
                          {String.fromCharCode(65 + oi)}. {opt}
                          {isCorrect && " ✓"}
                          {isPicked && !isCorrect && " ✗ (your answer)"}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
