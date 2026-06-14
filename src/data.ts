import type { Plan, Schedule, Themes, StudioConfig } from "./types";

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
    name: "Clássico Premium",
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

// ── Default Studio Config ─────────────────────────────────────────────────────────────────

export const DEFAULT_STUDIO_CONFIG: StudioConfig = {
  studioName: "",
  professionalName: "",
  crefito: "",
  username: "admin",
  password: "",
};

// ── Initial Data (production-clean defaults) ──────────────────────────────────────────────

export const INIT_CLASS_TYPES = ["Reformer", "Mat", "Cadillac", "Chair", "Barrel", "Funcional", "Solo"];

export const INIT_PLANS: Plan[] = [
  { id: "p0", name: "Mensal 1x/semana", value: 180, classesPerMonth: 4, tenure: "mensal" },
  { id: "p1", name: "Mensal 2x/semana", value: 280, classesPerMonth: 8, tenure: "mensal" },
  { id: "p2", name: "Mensal 3x/semana", value: 380, classesPerMonth: 12, tenure: "mensal" },
  { id: "p3", name: "Mensal Ilimitado", value: 480, classesPerMonth: 20, tenure: "mensal" },
  { id: "p4", name: "Wellhub", value: 0, classesPerMonth: 20, tenure: "mensal" },
];

export const INIT_SCHEDULES: Schedule[] = [];

export const INIT_STUDENTS = [] as never[];
export const INIT_ENROLLMENTS = [] as never[];
export const INIT_PAYMENTS = [] as never[];
export const INIT_PRESENCE = [] as never[];
export const INIT_EVOLUTIONS = [] as never[];
export const INIT_SESSIONS = [] as never[];
export const INIT_EXPENSES = [] as never[];
