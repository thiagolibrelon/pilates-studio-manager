// ── Date & Formatting Utilities ───────────────────────────────────────────────────────────

export const TODAY = new Date().toISOString().slice(0, 10);

export const fmt = (d: string | null | undefined): string =>
  d ? new Date(d + "T12:00:00").toLocaleDateString("pt-BR") : "—";

export const fmtM = (v: number | string): string =>
  (+v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const uid = (): string => Math.random().toString(36).slice(2, 9);

export const WD = ["Seg", "Ter", "Qua", "Qui", "Sex"] as const;

export const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export const fmtMonth = (yearMonth: string): string => {
  const [year, month] = yearMonth.split("-").map(Number);
  if (!year || !month) return yearMonth;
  return `${MONTHS[month - 1]} ${year}`;
};

// ── CSV Export ────────────────────────────────────────────────────────────────────────────

export const downloadCSV = (filename: string, data: (string | number)[][]): void => {
  const csv = data
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ── Vencimento Logic ──────────────────────────────────────────────────────────────────────

export const vencDay = (firstPaymentDate: string | null | undefined): number | null => {
  if (!firstPaymentDate) return null;
  return new Date(firstPaymentDate + "T12:00:00").getDate();
};

export const vencStr = (firstPaymentDate: string | null | undefined): string => {
  const d = vencDay(firstPaymentDate);
  return d ? `Dia ${d} de cada mês` : "—";
};

export const daysUntilDue = (
  firstPaymentDate: string | null | undefined,
  referenceDate: string = TODAY
): number | null => {
  if (!firstPaymentDate) return null;

  const today = new Date(referenceDate + "T12:00:00");
  const dueDay = new Date(firstPaymentDate + "T12:00:00").getDate();
  const due = new Date(today.getFullYear(), today.getMonth(), dueDay);

  if (due < today) {
    due.setMonth(due.getMonth() + 1);
  }

  return Math.ceil((due.getTime() - today.getTime()) / 86400000);
};

export const getDueDateForMonth = (
  firstPaymentDate: string | null | undefined,
  yearMonth: string
): string | null => {
  if (!firstPaymentDate) return null;

  const dueDay = vencDay(firstPaymentDate);
  if (!dueDay) return null;

  const [year, month] = yearMonth.split("-").map(Number);
  const dueDate = new Date(year, month - 1, dueDay);

  return dueDate.toISOString().slice(0, 10);
};

// ── Blank Form Helpers ────────────────────────────────────────────────────────────────────

export const BLANK_ANAM = {
  queixaPrincipal: "",
  inicioDor: "",
  lesoes: "",
  cirurgias: "",
  medicamentos: "",
  escalaDor: 0,
  localDor: "",
  avaliacaoFisica: "",
  objetivo: "",
  conduta: "",
  observacoes: "",
};

// ── Validation Helpers ────────────────────────────────────────────────────────────────────

export const isValidCPF = (cpf: string): boolean => {
  const clean = cpf.replace(/\D/g, "");
  return clean.length === 11;
};

export const formatCPF = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

export const formatPhone = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};
