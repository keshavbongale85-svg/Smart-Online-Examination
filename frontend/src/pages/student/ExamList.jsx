import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios.js";
import Loader from "../../components/Loader.jsx";
import { PageHeader, EmptyState, Badge } from "../../components/ui.jsx";

export default function ExamList() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    api
      .get("/exams")
      .then((res) => setExams(res.data.exams))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  const filtered = exams.filter(
    (e) =>
      e.title.toLowerCase().includes(q.toLowerCase()) ||
      e.subject.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div>
      <PageHeader title="Exams" subtitle="Browse and take available assessments" />
      <input
        className="input mb-5 max-w-sm"
        placeholder="Search by title or subject…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {filtered.length === 0 ? (
        <EmptyState icon="🔍" title="No exams found" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((exam) => (
            <div key={exam._id} className="card flex flex-col">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold">{exam.title}</h3>
                <Badge tone="blue">{exam.subject}</Badge>
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                {exam.description || "No description"}
              </p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                <span>⏱ {exam.duration} min</span>
                <span>📝 {exam.questionCount ?? "—"} questions</span>
                <span>🎯 {exam.totalMarks} marks</span>
                {exam.negativeMarking && (
                  <span className="text-red-500">➖ negative marking</span>
                )}
              </div>
              <div className="mt-4">
                {exam.attempted ? (
                  <button className="btn-secondary w-full" disabled>
                    ✓ Already attempted
                  </button>
                ) : (
                  <Link to={`/exams/${exam._id}`} className="btn-primary w-full">
                    View & Start
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
