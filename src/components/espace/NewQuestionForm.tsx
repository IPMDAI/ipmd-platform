"use client";

import { useActionState, useEffect, useRef } from "react";
import { addQuestion } from "@/lib/exam-actions";
import { Field, inputBase } from "@/components/forms/FormField";
import { ActionButton } from "@/components/ui/Button";
import type { FormResult } from "@/types";

export function NewQuestionForm({
  courseId,
  examId,
}: {
  courseId: string;
  examId: string;
}) {
  const bound = addQuestion.bind(null, courseId, examId);
  const [state, action, pending] = useActionState<FormResult | null, FormData>(
    bound,
    null
  );
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);

  return (
    <form
      ref={ref}
      action={action}
      className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5"
    >
      <h2 className="text-lg font-bold text-ipmd-black">Nouvelle question</h2>

      <Field label="Question" htmlFor="q-text" required>
        <textarea
          id="q-text"
          name="question"
          rows={2}
          required
          placeholder="Énoncé de la question…"
          className={inputBase}
        />
      </Field>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-ipmd-black">
          Options{" "}
          <span className="font-normal text-black/45">
            (cochez la bonne réponse)
          </span>
        </p>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="radio"
              name="correct"
              value={i}
              defaultChecked={i === 0}
              className="h-4 w-4 accent-ipmd-red"
              aria-label={`Bonne réponse : option ${i + 1}`}
            />
            <input
              name={`option_${i}`}
              placeholder={`Option ${i + 1}`}
              className={inputBase}
            />
          </div>
        ))}
      </div>

      <Field label="Points" htmlFor="q-points">
        <input
          id="q-points"
          name="points"
          type="number"
          step="0.5"
          min="0.5"
          defaultValue="1"
          className={inputBase}
        />
      </Field>

      <ActionButton type="submit" disabled={pending}>
        {pending ? "…" : "Ajouter la question"}
      </ActionButton>

      {state && (
        <p
          className={`text-sm font-medium ${
            state.ok ? "text-green-600" : "text-ipmd-red"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
