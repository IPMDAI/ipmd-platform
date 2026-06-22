"use client";

import { useActionState } from "react";
import { generateExamQuestions } from "@/lib/exam-actions";
import { Field, inputBase } from "@/components/forms/FormField";
import { ActionButton } from "@/components/ui/Button";
import type { FormResult } from "@/types";

export function GenerateQuestionsForm({
  courseId,
  examId,
}: {
  courseId: string;
  examId: string;
}) {
  const bound = generateExamQuestions.bind(null, courseId, examId);
  const [state, action, pending] = useActionState<FormResult | null, FormData>(
    bound,
    null
  );

  return (
    <form
      action={action}
      className="space-y-3 rounded-2xl bg-ipmd-black p-6 text-white shadow-sm"
    >
      <h2 className="flex items-center gap-2 text-lg font-bold">
        🤖 Générer avec l&apos;IA
      </h2>
      <p className="text-sm text-white/60">
        Donne un thème, l&apos;IA propose des questions prêtes à l&apos;emploi.
      </p>

      <Field label="Thème" htmlFor="g-topic" required>
        <input
          id="g-topic"
          name="topic"
          required
          placeholder="Ex. Bases du référencement (SEO)"
          className={`${inputBase} text-ipmd-black`}
        />
      </Field>
      <Field label="Nombre de questions" htmlFor="g-count">
        <input
          id="g-count"
          name="count"
          type="number"
          min="1"
          max="10"
          defaultValue="5"
          className={`${inputBase} text-ipmd-black`}
        />
      </Field>

      <ActionButton
        type="submit"
        variant="white"
        disabled={pending}
        className="w-full"
      >
        {pending ? "Génération…" : "Générer les questions"}
      </ActionButton>

      {state && (
        <p
          className={`text-sm font-medium ${
            state.ok ? "text-green-400" : "text-red-300"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
