"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ClipboardList, RefreshCw, X } from "lucide-react";
import { apiClient, type FieldSurveyQuestion, type FieldSurveySummary } from "@/lib/api-client";

// Round 36 Item 2 — "My Surveys". Before this round, Survey/SurveyQuestion
// existed as admin-authored content (Create - Survey / Create - Question)
// but no field rep had any way at all to actually answer one anywhere in
// this app, so Survey > View's "Answer Wise" mode on admin rendered the
// same placeholder as "Question Wise". This is the real answering screen:
// one real question at a time per the question's real controlType
// (Enterable - Text / Enterable - Numeric with its real maxLength /
// Selectable - Single / Selectable- Multiple with its real configured
// options), persisted as real SurveyAnswerModel documents.
export function FieldSurveys() {
  const [surveys, setSurveys] = useState<FieldSurveySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [active, setActive] = useState<FieldSurveySummary | null>(null);
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
  const [numericAnswers, setNumericAnswers] = useState<Record<string, string>>({});
  const [singleAnswers, setSingleAnswers] = useState<Record<string, string>>({});
  const [multiAnswers, setMultiAnswers] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");

  function load() {
    setLoading(true);
    setError("");
    apiClient.surveys()
      .then((r) => setSurveys(r.data))
      .catch((e) => setError(e instanceof Error ? e.message : "Unable to load surveys"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function openSurvey(s: FieldSurveySummary) {
    setActive(s);
    setSubmitError("");
    setSubmitMessage("");
    setTextAnswers({});
    setNumericAnswers({});
    setSingleAnswers({});
    setMultiAnswers({});
  }

  function toggleMulti(questionId: string, option: string) {
    setMultiAnswers((prev) => {
      const current = prev[questionId] || [];
      const next = current.includes(option) ? current.filter((o) => o !== option) : [...current, option];
      return { ...prev, [questionId]: next };
    });
  }

  function isAnswered(q: FieldSurveyQuestion) {
    if (q.controlType === "Enterable - Text") return !!textAnswers[q.questionId]?.trim();
    if (q.controlType === "Enterable - Numeric") return !!numericAnswers[q.questionId]?.trim();
    if (q.controlType === "Selectable - Single") return !!singleAnswers[q.questionId];
    return (multiAnswers[q.questionId] || []).length > 0;
  }

  async function submit() {
    if (!active) return;
    const unanswered = active.questions.filter((q) => !q.answered && !isAnswered(q));
    if (unanswered.length === active.questions.length) {
      setSubmitError("Answer at least one question before submitting.");
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      const payload = active.questions
        .filter((q) => isAnswered(q))
        .map((q) => {
          if (q.controlType === "Enterable - Text") return { questionId: q.questionId, answerText: textAnswers[q.questionId]?.trim() };
          if (q.controlType === "Enterable - Numeric") return { questionId: q.questionId, answerNumeric: Number(numericAnswers[q.questionId]) };
          if (q.controlType === "Selectable - Single") return { questionId: q.questionId, selectedOptions: [singleAnswers[q.questionId]] };
          return { questionId: q.questionId, selectedOptions: multiAnswers[q.questionId] || [] };
        });
      const res = await apiClient.submitSurveyAnswers(active.id, payload);
      setSubmitMessage(`Saved ${res.data.savedCount} answer(s).`);
      load();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Unable to submit answers");
    } finally {
      setSubmitting(false);
    }
  }

  if (active) {
    return (
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-slate-900">{active.title}</h2>
          <button type="button" onClick={() => setActive(null)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700">
            <X size={14} />
          </button>
        </div>

        {submitMessage && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs font-bold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 size={14} /> {submitMessage}
          </div>
        )}

        <div className="space-y-3">
          {active.questions.map((q, qi) => (
            <div key={q.questionId} className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-card space-y-2">
              <p className="text-xs font-bold text-slate-900">
                {qi + 1}. {q.questionText}
                {q.answered && <span className="ml-2 text-[10px] font-black text-emerald-700">Already answered</span>}
              </p>

              {q.controlType === "Enterable - Text" && (
                <input
                  type="text"
                  maxLength={q.maxLength ?? undefined}
                  value={textAnswers[q.questionId] || ""}
                  onChange={(e) => setTextAnswers((a) => ({ ...a, [q.questionId]: e.target.value }))}
                  placeholder={q.maxLength ? `Up to ${q.maxLength} characters` : "Your answer"}
                  className="w-full h-9 px-2.5 rounded-lg border border-slate-200 text-xs"
                />
              )}

              {q.controlType === "Enterable - Numeric" && (
                <input
                  type="number"
                  maxLength={q.maxLength ?? undefined}
                  value={numericAnswers[q.questionId] || ""}
                  onChange={(e) => setNumericAnswers((a) => ({ ...a, [q.questionId]: e.target.value }))}
                  placeholder="Enter a number"
                  className="w-full h-9 px-2.5 rounded-lg border border-slate-200 text-xs"
                />
              )}

              {q.controlType === "Selectable - Single" && (
                <div className="space-y-1.5">
                  {(q.options || []).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setSingleAnswers((a) => ({ ...a, [q.questionId]: opt }))}
                      className={`w-full text-left px-3 py-2 rounded-lg border text-[12px] font-semibold transition-colors ${
                        singleAnswers[q.questionId] === opt
                          ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                          : "bg-white border-slate-200 text-slate-700 hover:border-emerald-200"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {q.controlType === "Selectable- Multiple" && (
                <div className="space-y-1.5">
                  {(q.options || []).map((opt) => {
                    const checked = (multiAnswers[q.questionId] || []).includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => toggleMulti(q.questionId, opt)}
                        className={`w-full text-left px-3 py-2 rounded-lg border text-[12px] font-semibold transition-colors ${
                          checked ? "bg-emerald-50 border-emerald-300 text-emerald-900" : "bg-white border-slate-200 text-slate-700 hover:border-emerald-200"
                        }`}
                      >
                        {checked ? "✓ " : ""}{opt}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {submitError && <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">{submitError}</p>}
        <button
          type="button"
          disabled={submitting}
          onClick={submit}
          className="w-full py-3 text-sm font-black text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-md disabled:opacity-60"
        >
          {submitting ? "Submitting..." : "Submit Answers"}
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-slate-600">{surveys.length} active survey(s)</p>
        <button type="button" onClick={load} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">{error}</p>}
      {!loading && surveys.length === 0 && !error && (
        <p className="text-sm text-slate-500 italic px-1">No surveys available right now.</p>
      )}

      <div className="space-y-2.5">
        {surveys.map((s) => (
          <div key={s.id} className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-card space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-700 shrink-0">
                  <ClipboardList size={16} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-extrabold text-slate-900 truncate">{s.title}</h4>
                  <p className="text-[10px] text-slate-500 font-medium">{s.questionCount} question(s)</p>
                </div>
              </div>
              {s.answeredCount > 0 && (
                <span className="shrink-0 px-2 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-300">
                  {s.answeredCount}/{s.questionCount} answered
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => openSurvey(s)}
              className="w-full py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200"
            >
              {s.answeredCount > 0 ? "Continue Survey" : "Answer Survey"}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
