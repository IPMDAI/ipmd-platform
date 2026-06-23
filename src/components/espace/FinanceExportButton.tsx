"use client";

type Row = {
  name: string;
  level: string;
  due: number;
  paid: number;
  balance: number;
  status: string;
  nextDue: string;
};

export function FinanceExportButton({
  rows,
  filename,
}: {
  rows: Row[];
  filename: string;
}) {
  const onClick = () => {
    const header = ["Nom", "Niveau", "Dû", "Payé", "Reste", "Statut", "Prochaine échéance"];
    const body = rows.map((r) => [r.name, r.level, r.due, r.paid, r.balance, r.status, r.nextDue]);
    const csv = [header, ...body]
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
