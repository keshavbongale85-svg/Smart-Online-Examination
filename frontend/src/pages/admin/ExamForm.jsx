import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/axios.js";
import Loader from "../../components/Loader.jsx";
import { PageHeader } from "../../components/ui.jsx";

const blank = {
  title: "",
  description: "",
  subject: "General",
  duration: 30,
  passingMarks: 0,
  questionsPerAttempt: 0,
  negativeMarking: false,
  negativeMarkValue: 0.25,
  isPublished: false,
  proctoring: { webcam: true, tabSwitchLimit: 3, snapshotInterval: 30 },
};

export default function ExamForm() {
  const { id } = useParams(); // undefined => create
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(blank);
  const [loading, setLoading] = useState(editing);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!editing) return;
    api
      .get(`/exams/${id}`)
      .then((res) => setForm({ ...blank, ...res.data.exam }))
      .catch((err) => {
        toast.error(err.message);
        navigate("/admin/exams");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const set = (k) => (e) => {
    const v =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm({ ...form, [k]: v });
  };
  const setProc = (k) => (e) => {
    const v =
      e.target.type === "checkbox" ? e.target.checked : Number(e.target.value);
    setForm({ ...form, proctoring: { ...form.proctoring, [k]: v } });
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const payload = {
      ...form,
      duration: Number(form.duration),
      passingMarks: Number(form.passingMarks),
      questionsPerAttempt: Number(form.questionsPerAttempt),
      negativeMarkValue: Number(form.negativeMarkValue),
    };
    try {
      if (editing) {
        await api.put(`/exams/${id}`, payload);
        toast.success("Exam updated");
        navigate("/admin/exams");
      } else {
        const res = await api.post("/exams", payload);
        toast.success("Exam created — now add questions");
        navigate(`/admin/exams/${res.data.exam._id}`);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/admin/exams" className="text-sm text-brand-600 hover:underline">
        ← Back to exams
      </Link>
      <PageHeader title={editing ? "Edit Exam" : "New Exam"} />

      <form onSubmit={submit} className="card space-y-4">
        <div>
          <label className="label">Title</label>
          <input className="input" required value={form.title} onChange={set("title")} />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input" rows={3} value={form.description} onChange={set("description")} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Subject</label>
            <input className="input" value={form.subject} onChange={set("subject")} />
          </div>
          <div>
            <label className="label">Duration (minutes)</label>
            <input type="number" min="1" className="input" value={form.duration} onChange={set("duration")} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Passing marks</label>
            <input type="number" min="0" className="input" value={form.passingMarks} onChange={set("passingMarks")} />
          </div>
          <div>
            <label className="label">Questions per attempt</label>
            <input type="number" min="0" className="input" value={form.questionsPerAttempt} onChange={set("questionsPerAttempt")} />
            <p className="mt-1 text-xs text-slate-400">0 = serve all questions</p>
          </div>
        </div>

        <div className="rounded-lg bg-slate-50 p-4">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={form.negativeMarking} onChange={set("negativeMarking")} />
            Enable negative marking
          </label>
          {form.negativeMarking && (
            <div className="mt-3">
              <label className="label">Penalty (fraction of marks per wrong answer)</label>
              <input type="number" step="0.05" min="0" max="1" className="input max-w-[160px]" value={form.negativeMarkValue} onChange={set("negativeMarkValue")} />
            </div>
          )}
        </div>

        <div className="rounded-lg bg-slate-50 p-4">
          <div className="mb-3 text-sm font-semibold">Proctoring</div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.proctoring.webcam} onChange={setProc("webcam")} />
            Require webcam
          </label>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label className="label">Tab-switch limit</label>
              <input type="number" min="0" className="input" value={form.proctoring.tabSwitchLimit} onChange={setProc("tabSwitchLimit")} />
            </div>
            <div>
              <label className="label">Snapshot interval (s)</label>
              <input type="number" min="5" className="input" value={form.proctoring.snapshotInterval} onChange={setProc("snapshotInterval")} />
            </div>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={form.isPublished} onChange={set("isPublished")} />
          Publish immediately (visible to students)
        </label>

        <div className="flex gap-3">
          <button className="btn-primary" disabled={busy}>
            {busy ? "Saving…" : editing ? "Save changes" : "Create exam"}
          </button>
          <Link to="/admin/exams" className="btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
