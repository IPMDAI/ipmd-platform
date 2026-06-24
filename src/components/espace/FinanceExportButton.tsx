"use client";

type Row = Record<string, string | number>;

export function FinanceExportButton({
  rows,
  columns,
  filename,
}: {
  rows: Row[];
  columns: string[];
  filename: string;
}) {
  const onClick = () => {
    const body = rows.map((r) => columns.map((c) => r[c] ?? ""));
    const csv = [columns, ...body]
      .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
      .join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ipmd-black ring-1 ring-black/10 transition-colors hover:ring-ipmd-red/40 print:hidden"
    >
      ⬇️ Exporter CSV
    </button>
  );
}
