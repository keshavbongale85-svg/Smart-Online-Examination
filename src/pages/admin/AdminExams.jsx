import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/axios.js";
import Loader from "../../components/Loader.jsx";
import { PageHeader, EmptyState, Badge } from "../../components/ui.jsx";

export default function AdminExams() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () =>
    api
      .get("/exams")
      .then((res) => setExams(res.data.exams))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const togglePublish = async (exam) => {
    try {
      await api.patch(`/exams/${exam._id}/publish`, {
        isPublished: !exam.isPublished,
      });
      toast.success(exam.isPublished ? "Unpublished" : "Published");
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const toggleResults = async (exam) => {
    try {
      await api.patch(`/exams/${exam._id}/publish-results`, {
        resultsPublished: !exam.resultsPublished,
      });
      toast.success("Updated");
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const remove = async (exam) => {
    if (!confirm(`Delete "${exam.title}" and all its questions/results?`)) return;
    try {
      await api.delete(`/exams/${exam._id}`);
      toast.success("Exam deleted");
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <Loader />;

  return (
    <div>
      <PageHeader
        title="Manage Exams"
        action={
          <Link to="/admin/exams/new" className="btn-primary">
            + New Exam
          </Link>
        }
      />
      {exams.length === 0 ? (
        <EmptyState
          icon="📝"
          title="No exams yet"
          action={
            <Link to="/admin/exams/new" className="btn-primary">
              Create your first exam
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {exams.map((e) => (
            <div key={e._id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{e.title}</h3>
                    <Badge tone={e.isPublished ? "green" : "slate"}>
                      {e.isPublished ? "Published" : "Draft"}
                    </Badge>
                    {e.resultsPublished && <Badge tone="blue">Results live</Badge>}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {e.subject} · {e.questionCount ?? 0} questions · {e.totalMarks}{" "}
                    marks · {e.duration} min
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link to={`/admin/exams/${e._id}`} className="btn-secondary">
                    Questions
                  </Link>
                  <Link to={`/admin/exams/${e._id}/edit`} className="btn-secondary">
                    Edit
                  </Link>
                  <Link to={`/admin/exams/${e._id}/results`} className="btn-secondary">
                    Results
                  </Link>
                  <button onClick={() => togglePublish(e)} className="btn-secondary">
                    {e.isPublished ? "Unpublish" : "Publish"}
                  </button>
                  <button onClick={() => toggleResults(e)} className="btn-secondary">
                    {e.resultsPublished ? "Hide results" : "Show results"}
                  </button>
                  <button onClick={() => remove(e)} className="btn-danger">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
