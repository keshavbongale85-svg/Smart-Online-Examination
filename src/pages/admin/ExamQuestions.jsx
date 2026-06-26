import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/axios.js";
import Loader from "../../components/Loader.jsx";
import { PageHeader, EmptyState, Badge, Modal } from "../../components/ui.jsx";

const blankQ = {
  questionText: "",
  options: ["", "", "", ""],
  correctOption: 0,
  marks: 1,
  subject: "General",
  difficulty: "medium",
};

export default function ExamQuestions() {
  const { id } = useParams();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // {mode, data}

  const load = () =>
    Promise.all([
      api.get(`/exams/${id}`),
      api.get(`/questions/exam/${id}`),
    ]).then(([e, q]) => {
      setExam(e.data.exam);
      setQuestions(q.data.questions);
    });

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [id]);

  const save = async (q) => {
    // validate
    if (!q.questionText.trim()) return toast.error("Question text required");
    const opts = q.options.map((o) => o.trim()).filter(Boolean);
    if (opts.length < 2) return toast.error("At least 2 non-empty options");
    if (q.correctOption >= opts.length)
      return toast.error("Correct option is out of range");

    const payload = { ...q, options: opts, marks: Number(q.marks) };
    try {
      if (q._id) {
        await api.put(`/questions/${q._id}`, payload);
        toast.success("Question updated");
      } else {
        await api.post(`/questions/exam/${id}`, payload);
        toast.success("Question added");
      }
      setModal(null);
      await load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const remove = async (q) => {
    if (!confirm("Delete this question?")) return;
    try {
      await api.delete(`/questions/${q._id}`);
      toast.success("Deleted");
      await load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <Loader />;

  return (
    <div>
      <Link to="/admin/exams" className="text-sm text-brand-600 hover:underline">
        ← Back to exams
      </Link>
      <PageHeader
        title={exam?.title}
        subtitle={`${questions.length} questions · ${exam?.totalMarks} total marks`}
        action={
          <button
            className="btn-primary"
            onClick={() => setModal({ mode: "new", data: { ...blankQ } })}
          >
            + Add Question
          </button>
        }
      />

      {questions.length === 0 ? (
        <EmptyState
          icon="❓"
          title="No questions yet"
          subtitle="Add questions so students can take this exam."
        />
      ) : (
        <div className="space-y-3">
          {questions.map((q, i) => (
            <div key={q._id} className="card">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="font-medium">
                    {i + 1}. {q.questionText}
                  </p>
                  <div className="mt-2 grid gap-1 sm:grid-cols-2">
                    {q.options.map((o, oi) => (
                      <div
                        key={oi}
                        className={`text-sm ${
                          oi === q.correctOption
                            ? "font-medium text-emerald-600"
                            : "text-slate-500"
                        }`}
                      >
                        {String.fromCharCode(65 + oi)}. {o}
                        {oi === q.correctOption && " ✓"}
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Badge tone="blue">{q.subject}</Badge>
                    <Badge tone="slate">{q.difficulty}</Badge>
                    <Badge tone="amber">{q.marks} mark{q.marks > 1 ? "s" : ""}</Badge>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-2">
                  <button
                    className="btn-secondary"
                    onClick={() => setModal({ mode: "edit", data: { ...q } })}
                  >
                    Edit
                  </button>
                  <button className="btn-danger" onClick={() => remove(q)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <QuestionModal
          initial={modal.data}
          onClose={() => setModal(null)}
          onSave={save}
        />
      )}
    </div>
  );
}

function QuestionModal({ initial, onClose, onSave }) {
  const [q, setQ] = useState({
    ...initial,
    options: [...initial.options, "", "", "", ""].slice(0, Math.max(4, initial.options.length)),
  });

  const setOpt = (i, v) => {
    const options = [...q.options];
    options[i] = v;
    setQ({ ...q, options });
  };
  const addOpt = () =>
    q.options.length < 6 && setQ({ ...q, options: [...q.options, ""] });
  const removeOpt = (i) => {
    if (q.options.length <= 2) return;
    const options = q.options.filter((_, idx) => idx !== i);
    const correctOption =
      q.correctOption === i ? 0 : q.correctOption > i ? q.correctOption - 1 : q.correctOption;
    setQ({ ...q, options, correctOption });
  };

  return (
    <Modal open onClose={onClose} title={q._id ? "Edit Question" : "Add Question"} wide>
      <div className="space-y-4">
        <div>
          <label className="label">Question</label>
          <textarea
            className="input"
            rows={2}
            value={q.questionText}
            onChange={(e) => setQ({ ...q, questionText: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Options (select the correct one)</label>
          <div className="space-y-2">
            {q.options.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="correct"
                  checked={q.correctOption === i}
                  onChange={() => setQ({ ...q, correctOption: i })}
                />
                <input
                  className="input"
                  placeholder={`Option ${String.fromCharCode(65 + i)}`}
                  value={o}
                  onChange={(e) => setOpt(i, e.target.value)}
                />
                {q.options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOpt(i)}
                    className="text-slate-400 hover:text-red-500"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          {q.options.length < 6 && (
            <button type="button" onClick={addOpt} className="mt-2 text-sm text-brand-600 hover:underline">
              + Add option
            </button>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">Marks</label>
            <input
              type="number"
              min="1"
              className="input"
              value={q.marks}
              onChange={(e) => setQ({ ...q, marks: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Subject</label>
            <input
              className="input"
              value={q.subject}
              onChange={(e) => setQ({ ...q, subject: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Difficulty</label>
            <select
              className="input"
              value={q.difficulty}
              onChange={(e) => setQ({ ...q, difficulty: e.target.value })}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button onClick={() => onSave(q)} className="btn-primary">
            Save
          </button>
        </div>
      </div>
    </Modal>
  );
}
