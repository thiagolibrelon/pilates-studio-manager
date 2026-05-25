import { TODAY } from "./utils";
import type { Student, Plan, Schedule, Enrollment, Payment, Expense, Presence, Session, Evolution, Themes } from "./types";

// ── Themes ───────────────────────────────────────────────────────────────────────────────

export const THEMES: Themes = {
  sage: {
    name: "Verde Sálvia",
    emoji: "🌿",
    bg: "#F8F9FA",
    card: "#ffffff",
    border: "#d9ece1",
    p: {
      50: "#f2f7f4",
      100: "#d9ece1",
      200: "#b3d9c3",
      300: "#8dc6a5",
      400: "#66b386",
      500: "#4a9e6e",
      600: "#3a7d57",
      700: "#2c5e41",
      800: "#1e3f2b",
    },
    badge: {
      Ativo: "bg-emerald-100 text-emerald-700",
      Inativo: "bg-gray-200 text-gray-500",
      Trial: "bg-blue-100 text-blue-700",
      Desistente: "bg-red-100 text-red-600",
      Wellhub: "bg-purple-100 text-purple-700",
      "Em dia": "bg-emerald-100 text-emerald-700",
      Pago: "bg-emerald-100 text-emerald-700",
      Atrasado: "bg-red-100 text-red-600",
      fixo: "bg-slate-100 text-slate-600",
      reposicao: "bg-amber-100 text-amber-700",
      wellhub: "bg-purple-100 text-purple-700",
    },
    occ: {
      avail: "#d9ece1",
      availT: "#3a7d57",
      half: "#fef9c3",
      halfT: "#ca8a04",
      full: "#fee2e2",
      fullT: "#dc2626",
    },
  },
  camila: {
    name: "Camila Storck",
    emoji: "✨",
    bg: "#F7F5F2",
    card: "#ffffff",
    border: "#EAE4DC",
    p: {
      50: "#fdf8f0",
      100: "#f5e9d0",
      200: "#ead5a8",
      300: "#dfc07f",
      400: "#D6B784",
      500: "#C8A46B",
      600: "#b8924e",
      700: "#8a6d3b",
      800: "#2F4057",
    },
    badge: {
      Ativo: "bg-amber-100 text-amber-800",
      Inativo: "bg-gray-200 text-gray-500",
      Trial: "bg-blue-100 text-blue-700",
      Desistente: "bg-red-100 text-red-600",
      Wellhub: "bg-indigo-100 text-indigo-700",
      "Em dia": "bg-amber-100 text-amber-800",
      Pago: "bg-amber-100 text-amber-800",
      Atrasado: "bg-red-100 text-red-600",
      fixo: "bg-stone-100 text-stone-600",
      reposicao: "bg-orange-100 text-orange-700",
      wellhub: "bg-indigo-100 text-indigo-700",
    },
    occ: {
      avail: "#f5e9d0",
      availT: "#8a6d3b",
      half: "#fef3c7",
      halfT: "#b45309",
      full: "#fee2e2",
      fullT: "#dc2626",
    },
  },
};

// ── Initial Data ──────────────────────────────────────────────────────────────────────────

export const INIT_CLASS_TYPES = ["Reformer", "Mat", "Cadillac", "Chair", "Barrel", "Funcional", "Solo"];

export const INIT_PLANS: Plan[] = [
  { id: "p1", name: "Mensal 2x/semana", value: 280, classesPerMonth: 8, tenure: "mensal" },
  { id: "p2", name: "Mensal 3x/semana", value: 380, classesPerMonth: 12, tenure: "mensal" },
  { id: "p3", name: "Mensal Ilimitado", value: 480, classesPerMonth: 20, tenure: "mensal" },
  { id: "p4", name: "Wellhub", value: 0, classesPerMonth: 20, tenure: "mensal" },
];

export const INIT_SCHEDULES: Schedule[] = [
  { id: "sc1", time: "07:00", days: ["Seg", "Ter", "Qua", "Qui", "Sex"], instructor: "Maria Costa", type: "Reformer", maxCapacity: 4 },
  { id: "sc2", time: "08:00", days: ["Seg", "Ter", "Qua", "Qui", "Sex"], instructor: "João Paulo", type: "Mat", maxCapacity: 4 },
  { id: "sc3", time: "09:00", days: ["Seg", "Ter", "Qua", "Qui", "Sex"], instructor: "Maria Costa", type: "Reformer", maxCapacity: 4 },
  { id: "sc4", time: "10:00", days: ["Seg", "Ter", "Qua", "Qui", "Sex"], instructor: "João Paulo", type: "Cadillac", maxCapacity: 4 },
  { id: "sc5", time: "11:00", days: ["Seg", "Ter", "Qua", "Qui", "Sex"], instructor: "Maria Costa", type: "Chair", maxCapacity: 4 },
];

export const INIT_ENROLLMENTS: Enrollment[] = [
  { id: "en1", scheduleId: "sc1", studentId: "s1", days: ["Seg", "Ter", "Qua"] },
  { id: "en2", scheduleId: "sc1", studentId: "s3", days: ["Seg", "Qua", "Sex"] },
  { id: "en3", scheduleId: "sc1", studentId: "s5", days: ["Ter", "Qui"] },
  { id: "en4", scheduleId: "sc2", studentId: "s4", days: ["Seg", "Ter", "Qua", "Qui", "Sex"] },
  { id: "en5", scheduleId: "sc3", studentId: "s1", days: ["Qui", "Sex"] },
  { id: "en6", scheduleId: "sc3", studentId: "s5", days: ["Seg", "Qua"] },
  { id: "en7", scheduleId: "sc4", studentId: "s3", days: ["Ter", "Sex"] },
  { id: "en8", scheduleId: "sc5", studentId: "s4", days: ["Seg", "Qui"] },
];

export const INIT_STUDENTS: Student[] = [
  { id: "s1", name: "Ana Silva", cpf: "111.111.111-11", dob: "1990-03-15", whatsapp: "31999990001", emergency: "31988880001", email: "ana@email.com", address: "Rua A, 100", enrolled: "2025-01-10", firstPaymentDate: "2025-01-10", planId: "p2", status: "Ativo", notes: "Prefere reformer", healthNotes: "Hérnia L4-L5", hasRestriction: true, repCredits: 0 },
  { id: "s2", name: "Carlos Mendes", cpf: "222.222.222-22", dob: "1985-07-22", whatsapp: "31999990002", emergency: "31988880002", email: "carlos@email.com", address: "Rua B, 200", enrolled: "2025-02-01", firstPaymentDate: "2025-02-01", planId: "p4", status: "Wellhub", notes: "", healthNotes: "", hasRestriction: false, repCredits: 0 },
  { id: "s3", name: "Beatriz Lima", cpf: "333.333.333-33", dob: "1995-11-08", whatsapp: "31999990003", emergency: "31988880003", email: "bea@email.com", address: "Rua C, 300", enrolled: "2025-03-15", firstPaymentDate: "2025-03-15", planId: "p1", status: "Ativo", notes: "", healthNotes: "Tendinite joelho", hasRestriction: true, repCredits: 1 },
  { id: "s4", name: "Pedro Santos", cpf: "444.444.444-44", dob: "1988-05-30", whatsapp: "31999990004", emergency: "31988880004", email: "pedro@email.com", address: "Rua D, 400", enrolled: "2025-01-20", firstPaymentDate: "2025-01-20", planId: "p2", status: "Ativo", notes: "", healthNotes: "", hasRestriction: false, repCredits: 0 },
  { id: "s5", name: "Fernanda Rocha", cpf: "555.555.555-55", dob: "1992-09-12", whatsapp: "31999990005", emergency: "31988880005", email: "fer@email.com", address: "Rua E, 500", enrolled: "2025-04-01", firstPaymentDate: "2025-04-01", planId: "p3", status: "Ativo", notes: "", healthNotes: "", hasRestriction: false, repCredits: 0 },
  { id: "s6", name: "Lucas Oliveira", cpf: "666.666.666-66", dob: "1980-12-01", whatsapp: "31999990006", emergency: "31988880006", email: "lucas@email.com", address: "Rua F, 600", enrolled: "2025-02-10", firstPaymentDate: "2025-02-10", planId: "p2", status: "Inativo", notes: "", healthNotes: "", hasRestriction: false, repCredits: 0 },
  { id: "s7", name: "Mariana Costa", cpf: "777.777.777-77", dob: "1997-04-18", whatsapp: "31999990007", emergency: "31988880007", email: "mari@email.com", address: "Rua G, 700", enrolled: TODAY, firstPaymentDate: TODAY, planId: "p1", status: "Trial", notes: "", healthNotes: "", hasRestriction: false, repCredits: 0 },
];

export const INIT_PAYMENTS: Payment[] = [
  { id: "pay1", studentId: "s1", month: "2026-05", amount: 380, status: "Pago", method: "PIX", paidAt: "2026-05-05" },
  { id: "pay2", studentId: "s2", month: "2026-05", amount: 0, status: "Pago", method: "Wellhub", paidAt: "2026-05-01" },
  { id: "pay3", studentId: "s3", month: "2026-05", amount: 280, status: "Atrasado", method: null, paidAt: null },
  { id: "pay4", studentId: "s4", month: "2026-05", amount: 380, status: "Em dia", method: null, paidAt: null },
  { id: "pay5", studentId: "s5", month: "2026-05", amount: 480, status: "Pago", method: "Cartão", paidAt: "2026-05-02" },
  { id: "pay6", studentId: "s7", month: "2026-05", amount: 280, status: "Em dia", method: null, paidAt: null },
];

export const INIT_EXPENSES: Expense[] = [];

export const INIT_PRESENCE: Presence[] = [
  { id: "ph1", studentId: "s1", day: "2026-04-07", scheduleId: "sc1", status: "presente", type: "fixo" },
  { id: "ph2", studentId: "s1", day: "2026-04-09", scheduleId: "sc1", status: "presente", type: "fixo" },
  { id: "ph3", studentId: "s1", day: "2026-04-14", scheduleId: "sc1", status: "falta", type: "fixo" },
  { id: "ph4", studentId: "s1", day: "2026-04-16", scheduleId: "sc1", status: "presente", type: "fixo" },
  { id: "ph5", studentId: "s1", day: "2026-05-05", scheduleId: "sc1", status: "presente", type: "fixo" },
  { id: "ph6", studentId: "s1", day: "2026-05-07", scheduleId: "sc1", status: "presente", type: "fixo" },
  { id: "ph7", studentId: "s1", day: "2026-05-12", scheduleId: "sc1", status: "falta", type: "fixo" },
  { id: "ph8", studentId: "s3", day: "2026-04-07", scheduleId: "sc1", status: "presente", type: "fixo" },
  { id: "ph9", studentId: "s3", day: "2026-04-14", scheduleId: "sc1", status: "falta", type: "fixo" },
  { id: "ph10", studentId: "s3", day: "2026-05-05", scheduleId: "sc1", status: "presente", type: "fixo" },
  { id: "ph11", studentId: "s3", day: "2026-05-12", scheduleId: "sc1", status: "reposicao", type: "reposicao" },
  { id: "ph12", studentId: "s4", day: "2026-04-08", scheduleId: "sc2", status: "presente", type: "fixo" },
  { id: "ph13", studentId: "s4", day: "2026-05-06", scheduleId: "sc2", status: "presente", type: "fixo" },
  { id: "ph14", studentId: "s4", day: "2026-05-13", scheduleId: "sc2", status: "presente", type: "fixo" },
  { id: "ph15", studentId: "s5", day: "2026-04-08", scheduleId: "sc1", status: "presente", type: "fixo" },
  { id: "ph16", studentId: "s5", day: "2026-05-06", scheduleId: "sc1", status: "falta", type: "fixo" },
  { id: "ph17", studentId: "s5", day: "2026-05-08", scheduleId: "sc1", status: "presente", type: "fixo" },
];

export const INIT_SESSIONS: Session[] = [
  { id: "ses1", scheduleId: "sc1", day: TODAY, presences: { s1: { status: null, type: "fixo" }, s3: { status: null, type: "fixo" }, s5: { status: null, type: "fixo" } }, pendingEvos: [], evolved: [], finalized: false },
  { id: "ses2", scheduleId: "sc2", day: TODAY, presences: { s4: { status: null, type: "fixo" } }, pendingEvos: [], evolved: [], finalized: false },
];

export const INIT_EVOLUTIONS: Evolution[] = [
  { id: "ev1", scheduleId: "sc1", day: "2026-05-18", studentId: "s1", instructor: "Maria Costa", exercises: [{ name: "Footwork", series: 3, reps: 10, equipment: "Reformer" }], clinicalNotes: "Leve desconforto na lombar.", signature: "signed", createdAt: "2026-05-18T07:45:00" },
];
