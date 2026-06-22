"use client";

import { useState, useTransition } from "react";
import { submitExam } from "@/lib/exam-actions";
import { ActionButton } from "@/components/ui/Button";

type Question = {
  id: string;
  question: string;
  options: string[];
  points: number;
};

export function ExamTaker({
  examId,
  questions,
}: {
  examId: string;
  questions: Question[];
}) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    score: number;
    max: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (result) {
    const pct = result.max > 0 ? (result.score / result.max) * 20 : 0;
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-black/5">
        <p className="text-4xl">🎉</p>
        <h2 className="mt-3 text-xl font-extrabold text-ipmd-black">
          Examen terminé !
        </h2>
        <p className="mt-2 text-lg">
          Ta note :{" "}
          <span className="font-extrabold text-ipmd-red">
            {result.score}/{result.max}
          </span>{" "}
          <span className="text-black/50">
            ({Math.round(pct * 100) / 100}/20)
          </span>
        </p>
        <p className="mt-2 text-sm text-black/55">
          Elle est ajoutée à tes notes automatiquement.
        </p>
      </div>
    );
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await submitExam(examId, answers);
      if (res.ok && res.score != null && res.max != null) {
        setResult({ score: res.score, max: res.max });
      } else {
        setError(res.message);
      }
    });
  }

  const allAnswered = questions.every((q) => answers[q.id] != null);

  return (
    <div className="space-y-5">
      {questions.map((q, qi) => (
        <div
          key={q.id}
          className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5"
        >
          <p className="font-semibold text-ipmd-black">
            <span className="text-ipmd-red">{qi + 1}.</span> {q.question}
            <span className="ml-2 text-xs font-normal text-black/40">
              ({Number(q.points)} pt)
            </span>
          </p>
          <div className="mt-3 space-y-2">
            {q.options.map((opt, oi) => (
              <label
                key={oi}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition-colors ${
                  answers[q.id] === oi
                    ? "border-ipmd-red bg-ipmd-red/5"
                    : "border-black/10 hover:bg-ipmd-light"
                }`}
              >
                <input
                  type="radio"
                  name={`q-${q.id}`}
                  checked={answers[q.id] === oi}
                  onChange={() =>
                    setAnswers((prev) => ({ ...prev, [q.id]: oi }))
                  }
                  className="h-4 w-4 accent-ipmd-red"
                />
                <span className="text-ipmd-black">{opt}</span>
              </label>
            ))}
          </div>
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-3">
        <ActionButton
          type="button"
          size="lg"
          onClick={submit}
          disabled={pending || !allAnswered}
        >
          {pending ? "Correction…" : "Soumettre l'examen"}
        </ActionButton>
        {!allAnswered && (
          <span className="text-sm text-black/45">
            Réponds à toutes les questions.
          </span>
        )}
        {error && (
          <span className="text-sm font-medium text-ipmd-red">{error}</span>
        )}
      </div>
    </div>
  );
}
