import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/axios.js";
import Loader from "../../components/Loader.jsx";
import { Badge } from "../../components/ui.jsx";

export default function ExamDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [agree, setAgree] = useState(false);

  useEffect(() => {
    api
      .get(`/exams/${id}`)
      .then((res) => setExam(res.data.exam))
      .catch((err) => {
        toast.error(err.message);
        navigate("/exams");
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loader />;
  if (!exam) return null;

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/exams" className="text-sm text-brand-600 hover:underline">
        ← Back to exams
      </Link>
      <div className="card mt-3">
        <div className="flex items-start justify-between">
          <h1 className="text-2xl font-bold">{exam.title}</h1>
          <Badge tone="blue">{exam.subject}</Badge>
        </div>
        <p className="mt-2 text-slate-600">
          {exam.description || "No description provided."}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Info label="Duration" value={`${exam.duration} min`} />
          <Info label="Questions" value={exam.questionCount ?? "—"} />
          <Info label="Total marks" value={exam.totalMarks} />
          <Info label="Passing" value={exam.passingMarks} />
        </div>

        <div className="mt-6 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
          <p className="mb-2 font-semibold">⚠️ Before you begin</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>The exam is timed ({exam.duration} minutes). It auto-submits when time runs out.</li>
            {exam.negativeMarking && (
              <li>
                Negative marking applies: {exam.negativeMarkValue} × marks
                deducted per wrong answer.
              </li>
            )}
            {exam.proctoring?.webcam && (
              <li>Your webcam will be used for proctoring. Allow camera access.</li>
            )}
            {exam.proctoring?.tabSwitchLimit > 0 && (
              <li>
                Switching tabs is monitored. More than{" "}
                {exam.proctoring.tabSwitchLimit} switches flags your attempt.
              </li>
            )}
            <li>You can attempt this exam only once.</li>
          </ul>
        </div>

        <label className="mt-5 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
          />
          I have read the instructions and agree to the proctoring rules.
        </label>

        <button
          className="btn-primary mt-4 w-full"
          disabled={!agree}
          onClick={() => navigate(`/exams/${id}/take`)}
        >
          Start Exam
        </button>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3 text-center">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}
