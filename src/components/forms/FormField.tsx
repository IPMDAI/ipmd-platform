import type { ReactNode } from "react";

const inputBase =
  "w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-ipmd-black shadow-sm transition-colors placeholder:text-black/35 focus:border-ipmd-red focus:outline-none focus:ring-2 focus:ring-ipmd-red/20";

interface FieldWrapProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: ReactNode;
}

export function Field({ label, htmlFor, required, children }: FieldWrapProps) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-sm font-semibold text-ipmd-black"
      >
        {label}
        {required && <span className="ml-0.5 text-ipmd-red">*</span>}
      </label>
      {children}
    </div>
  );
}

export { inputBase };
