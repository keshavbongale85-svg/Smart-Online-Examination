import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import toast from "react-hot-toast";
import api from "../../api/axios.js";
import { getSocket } from "../../api/socket.js";
import { useAuth } from "../../context/AuthContext.jsx";
import Loader from "../../components/Loader.jsx";

export default function TakeExam() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // questionId -> selectedOption
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const webcamRef = useRef(null);
  const startRef = useRef(null);
  const tabSwitches = useRef(0);
  const submittedRef = useRef(false);

  // ---- Load exam questions ----
  useEffect(() => {
    api
      .get(`/exams/${id}/start`)
      .then((res) => {
        setExam(res.data.exam);
        setQuestions(res.data.questions);
        setTimeLeft(res.data.exam.duration * 60);
        startRef.current = Date.now();
      })
      .catch((err) => {
        toast.error(err.message);
        navigate("/exams");
      })
      .finally(() => setLoading(false));
  }, [id]);

  // ---- Submit (declared early so timers/effects can use it) ----
  const submit = useCallback(
    async (auto = false) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      setSubmitting(true);

      const timeTaken = Math.round((Date.now() - startRef.current) / 1000);
      const payload = {
        answers: questions.map((q) => ({
          question: q._id,
          selectedOption: answers[q._id] ?? -1,
        })),
        tabSwitches: tabSwitches.current,
        warnings: tabSwitches.current,
        timeTaken,
      };

      try {
        const res = await api.post(`/results/exam/${id}/submit`, payload);
        toast.success(auto ? "Time up — exam submitted" : "Exam submitted!");
        navigate(`/results/${res.data.result._id}`, { replace: true });
      } catch (err) {
        toast.error(err.message);
        submittedRef.current = false;
        setSubmitting(false);
      }
    },
    [answers, questions, id, navigate]
  );

  // ---- Countdown timer ----
  useEffect(() => {
    if (loading || timeLeft <= 0) return;
    const t = setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          submit(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [loading, timeLeft === 0, submit]);

  // ---- Proctoring: tab-switch detection ----
  useEffect(() => {
    if (loading || !exam) return;
    const onHidden = () => {
      if (document.hidden && !submittedRef.current) {
        tabSwitches.current += 1;
        const limit = exam.proctoring?.tabSwitchLimit || 0;
        toast.error(
          `Tab switch detected (${tabSwitches.current}${
            limit ? `/${limit}` : ""
          })`,
          { icon: "⚠️" }
        );
        try {
          getSocket().emit("student:violation", {
            examId: id,
            studentId: user._id,
            name: user.name,
            type: "tab-switch",
          });
        } catch {
          /* socket optional */
        }
      }
    };
    document.addEventListener("visibilitychange", onHidden);
    return () => document.removeEventListener("visibilitychange", onHidden);
  }, [loading, exam, id, user]);

  // ---- Proctoring: periodic webcam snapshots ----
  useEffect(() => {
    if (loading || !exam?.proctoring?.webcam) return;
    const interval = (exam.proctoring.snapshotInterval || 30) * 1000;
    const t = setInterval(() => {
      const shot = webcamRef.current?.getScreenshot();
      if (!shot) return;
      try {
        getSocket().emit("student:snapshot", {
          examId: id,
          studentId: user._id,
          name: user.name,
          image: shot,
        });
      } catch {
        /* socket optional */
      }
    }, interval);
    return () => clearInterval(t);
  }, [loading, exam, id, user]);

  // ---- Warn on refresh / close ----
  useEffect(() => {
    const beforeUnload = (e) => {
      if (!submittedRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, []);

  if (loading) return <Loader full label="Preparing your exam…" />;
  if (!exam) return null;

  const q = questions[current];
  const answeredCount = Object.keys(answers).length;
  const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");
  const lowTime = timeLeft <= 60;

  const choose = (optIdx) => setAnswers({ ...answers, [q._id]: optIdx });

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="truncate font-semibold">{exam.title}</div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">
              {answeredCount}/{questions.length} answered
            </span>
            <span
              className={`rounded-lg px-3 py-1 font-mono text-lg font-bold ${
                lowTime ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-700"
              }`}
            >
              {mm}:{ss}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:grid-cols-[1fr_260px]">
        {/* Question area */}
        <div>
          <div className="card">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">
                Question {current + 1} of {questions.length}
              </span>
              <span className="badge bg-slate-100 text-slate-600">
                {q.marks} mark{q.marks > 1 ? "s" : ""}
              </span>
            </div>
            <h2 className="text-lg font-medium">{q.questionText}</h2>

            <div className="mt-5 space-y-3">
              {q.options.map((opt, i) => {
                const selected = answers[q._id] === i;
                return (
                  <button
                    key={i}
                    onClick={() => choose(i)}
                    className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition ${
                      selected
                        ? "border-brand-500 bg-brand-50"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs font-semibold ${
                        selected
                          ? "border-brand-500 bg-brand-500 text-white"
                          : "border-slate-300 text-slate-500"
                      }`}
                    >
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button
                className="btn-secondary"
                disabled={current === 0}
                onClick={() => setCurrent((c) => c - 1)}
              >
                ← Previous
              </button>
              {answers[q._id] !== undefined && (
                <button
                  className="text-sm text-slate-400 hover:text-slate-600"
                  onClick={() => {
                    const copy = { ...answers };
                    delete copy[q._id];
                    setAnswers(copy);
                  }}
                >
                  Clear
                </button>
              )}
              {current < questions.length - 1 ? (
                <button
                  className="btn-primary"
                  onClick={() => setCurrent((c) => c + 1)}
                >
                  Next →
                </button>
              ) : (
                <button
                  className="btn-primary"
                  onClick={() => submit(false)}
                  disabled={submitting}
                >
                  {submitting ? "Submitting…" : "Submit Exam"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: webcam + navigator */}
        <div className="space-y-4">
          {exam.proctoring?.webcam && (
            <div className="card p-3">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-500">
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                Proctoring active
              </div>
              <Webcam
                ref={webcamRef}
                audio={false}
                mirrored
                screenshotFormat="image/jpeg"
                className="w-full rounded-lg"
              />
            </div>
          )}

          <div className="card">
            <div className="mb-3 text-sm font-medium text-slate-600">
              Questions
            </div>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((qq, i) => {
                const done = answers[qq._id] !== undefined;
                const isCurrent = i === current;
                return (
                  <button
                    key={qq._id}
                    onClick={() => setCurrent(i)}
                    className={`grid h-9 place-items-center rounded-lg text-sm font-medium ${
                      isCurrent
                        ? "ring-2 ring-brand-500"
                        : ""
                    } ${
                      done
                        ? "bg-brand-500 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <button
              className="btn-primary mt-4 w-full"
              onClick={() => submit(false)}
              disabled={submitting}
            >
              {submitting ? "Submitting…" : "Submit Exam"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
