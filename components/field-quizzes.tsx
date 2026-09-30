"use client";

import { useEffect, useState } from "react";
import { Award, CheckCircle2, HelpCircle, RefreshCw, Trophy, X } from "lucide-react";
import { apiClient, type FieldQuizAttemptHistory, type FieldQuizDetail, type FieldQuizSummary } from "@/lib/api-client";

function formatDate(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// Round 19 item 1 — "My Quizzes". QuizModel has no employee/role targeting
// field at all, so every active quiz is shown to every field rep (checked
// the full schema first, per the coordinator's "don't invent a targeting
// scheme that doesn't exist" guidance). Scoring is entirely server-side
// (POST /field/quizzes/:id/attempts) — this component never computes or
// displays a score until the backend returns one.
export function FieldQuizzes() {
  const [quizzes, setQuizzes] = useState<FieldQuizSummary[]>([]);
  const [history, setHistory] = useState<FieldQuizAttemptHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeQuiz, setActiveQuiz] = useState<FieldQuizDetail | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; totalPossible: number } | null>(null);
  const [quizError, setQuizError] = useState("");

  function load() {
    setLoading(true);
    setError("");
    Promise.all([apiClient.quizzes(), apiClient.quizAttempts()])
      .then(([qRes, hRes]) => { setQuizzes(qRes.data); setHistory(hRes.data); })
      .catch((e) => setError(e instanceof Error ? e.message : "Unable to load quizzes"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function openQuiz(id: string) {
    setQuizError("");
    setResult(null);
    setAnswers({});
    // Round 20 follow-up — this exact bug (a literal "undefined" quiz id
    // reaching the backend) has now shown up twice on different quizzes,
    // so this guards the very first step of the chain: never even attempt
    // to open a quiz whose id is missing from the list response, and never
    // trust a detail response that comes back without one either. Both
    // cases now fail loudly and visibly here instead of silently letting
    // an id-less quiz become "active" and only breaking later at submit.
    if (!id) {
      setError("This quiz is missing its reference id — please refresh and try again.");
      return;
    }
    try {
      const res = await apiClient.quiz(id);
      if (!res.data?.id) {
        setError("The server didn't return a valid quiz reference — please refresh and try again.");
        return;
      }
      setActiveQuiz(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load quiz");
    }
  }

  function closeQuiz() {
    setActiveQuiz(null);
    setAnswers({});
    setResult(null);
    setQuizError("");
  }

  async function submitQuiz() {
    if (!activeQuiz) return;
    // Defense in depth alongside the openQuiz guard above — if activeQuiz
    // somehow ended up without a real id, fail with a clear, actionable
    // message instead of posting the literal string "undefined" to the
    // backend (the exact bug this round re-investigated).
    if (!activeQuiz.id) {
      setQuizError("This quiz didn't load its reference id correctly — please close it and reopen it from the list.");
      return;
    }
    const answered = Object.keys(answers).length;
    if (answered < activeQuiz.questions.length) {
      setQuizError(`Please answer all ${activeQuiz.questions.length} question(s) before submitting.`);
      return;
    }
    setSubmitting(true);
    setQuizError("");
    try {
      const payload = Object.entries(answers).map(([questionIndex, selectedOptionIndex]) => ({
        questionIndex: Number(questionIndex),
        selectedOptionIndex
      }));
      const res = await apiClient.submitQuizAttempt(activeQuiz.id, payload);
      setResult({ score: res.data.score, totalPossible: res.data.totalPossible });
      load();
    } catch (e) {
      setQuizError(e instanceof Error ? e.message : "Unable to submit quiz");
    } finally {
      setSubmitting(false);
    }
  }

  if (activeQuiz) {
    return (
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-slate-900">{activeQuiz.title}</h2>
          <button type="button" onClick={closeQuiz} className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700">
            <X size={14} />
          </button>
        </div>
        {activeQuiz.description && <p className="text-xs text-slate-500">{activeQuiz.description}</p>}

        {result ? (
          <div className="bg-white rounded-2xl border border-emerald-200 p-5 shadow-card text-center space-y-2">
            <Trophy className="mx-auto text-emerald-600" size={32} />
            <p className="text-lg font-black text-slate-900">
              {result.score} / {result.totalPossible}
            </p>
            <p className="text-xs text-slate-500">Your attempt has been recorded.</p>
            <button type="button" onClick={closeQuiz} className="mt-2 w-full py-2.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200">
              Back to My Quizzes
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {activeQuiz.questions.map((q, qi) => (
                <div key={qi} className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-card space-y-2">
                  <p className="text-xs font-bold text-slate-900">
                    {qi + 1}. {q.questionText}
                  </p>
                  <div className="space-y-1.5">
                    {q.options.map((opt, oi) => (
                      <button
                        key={oi}
                        type="button"
                        onClick={() => setAnswers((a) => ({ ...a, [qi]: oi }))}
                        className={`w-full text-left px-3 py-2 rounded-lg border text-[12px] font-semibold transition-colors ${
                          answers[qi] === oi
                            ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                            : "bg-white border-slate-200 text-slate-700 hover:border-emerald-200"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {quizError && <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">{quizError}</p>}
            <button
              type="button"
              disabled={submitting}
              onClick={submitQuiz}
              className="w-full py-3 text-sm font-black text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-md disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Submit Quiz"}
            </button>
          </>
        )}
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-slate-600">{quizzes.length} active quiz(zes)</p>
        <button type="button" onClick={load} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">{error}</p>}
      {!loading && quizzes.length === 0 && !error && (
        <p className="text-sm text-slate-500 italic px-1">No quizzes available right now.</p>
      )}

      <div className="space-y-2.5">
        {quizzes.map((q) => (
          <div key={q.id} className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-card space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-700 shrink-0">
                  <HelpCircle size={16} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-extrabold text-slate-900 truncate">{q.title}</h4>
                  <p className="text-[10px] text-slate-500 font-medium">{q.questionCount} question(s) · {q.totalPossible} pts</p>
                </div>
              </div>
              {q.attemptCount > 0 && (
                <span className="shrink-0 px-2 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <CheckCircle2 size={11} /> {q.bestScore}/{q.totalPossible}
                </span>
              )}
            </div>
            {q.description && <p className="text-[11px] text-slate-600">{q.description}</p>}
            <button
              type="button"
              onClick={() => openQuiz(q.id)}
              className="w-full py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200"
            >
              {q.attemptCount > 0 ? "Retake Quiz" : "Take Quiz"}
            </button>
          </div>
        ))}
      </div>

      {history.length > 0 && (
        <div className="pt-1 space-y-2">
          <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5"><Award size={14} /> Attempt History</h3>
          <div className="space-y-1.5">
            {history.map((h) => (
              <div key={h.id} className="bg-white rounded-xl border border-slate-200/90 p-2.5 flex items-center justify-between text-[11px]">
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 truncate">{h.quizTitle}</p>
                  <p className="text-slate-400">{formatDate(h.submittedAt)}</p>
                </div>
                <span className="font-black text-slate-900 shrink-0">{h.score}/{h.totalPossible}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
