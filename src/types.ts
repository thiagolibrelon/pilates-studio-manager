// ── Theme Types ───────────────────────────────────────────────────────────────────────────

export type ThemeKey = "sage" | "camila";

export interface ThemeColors {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
}

export interface Theme {
  name: string;
  emoji: string;
  bg: string;
  card: string;
  border: string;
  p: ThemeColors;
  badge: Record<string, string>;
  occ: {
    avail: string;
    availT: string;
    half: string;
    halfT: string;
    full: string;
    fullT: string;
  };
}

export interface Themes {
  sage: Theme;
  camila: Theme;
}

// ── Entity Types ──────────────────────────────────────────────────────────────────────────

export interface Student {
  id: string;
  name: string;
  cpf: string;
  dob: string;
  whatsapp: string;
  emergency: string;
  email: string;
  address: string;
  enrolled: string;
  firstPaymentDate: string | null;
  planId: string;
  status: "Ativo" | "Inativo" | "Trial" | "Desistente" | "Wellhub";
  notes: string;
  healthNotes: string;
  hasRestriction: boolean;
  repCredits: number;
}

export interface Plan {
  id: string;
  name: string;
  value: number;
  classesPerMonth: number;
  tenure: "mensal" | "trimestral" | "semestral" | "anual";
}

export interface Schedule {
  id: string;
  time: string;
  days: string[];
  instructor: string;
  type: string;
  maxCapacity: number;
}

export interface Enrollment {
  id: string;
  scheduleId: string;
  studentId: string;
  days: string[];
}

export interface Presence {
  id: string;
  studentId: string;
  day: string;
  scheduleId: string;
  status: "presente" | "falta" | "reposicao";
  type: "fixo" | "reposicao" | "wellhub";
}

export interface Payment {
  id: string;
  studentId: string;
  month: string;
  amount: number;
  status: "Pago" | "Em dia" | "Atrasado";
  method: string | null;
  paidAt: string | null;
}

export interface Expense {
  id: string;
  description: string;
  category: string;
  date: string;
  month: string;
  amount: number;
}

export interface Exercise {
  name: string;
  series?: number;
  reps?: number;
  equipment?: string;
}

export interface Evolution {
  id: string;
  scheduleId: string;
  day: string;
  studentId: string;
  instructor: string;
  exercises: Exercise[];
  clinicalNotes: string;
  signature: string;
  createdAt: string;
  editHistory?: string[];
}

export interface PresenceEntry {
  status: "presente" | "falta" | null;
  type: "fixo" | "reposicao" | "wellhub";
}

export interface Session {
  id: string;
  scheduleId: string;
  day: string;
  presences: Record<string, PresenceEntry>;
  pendingEvos: string[];
  evolved: string[];
  finalized: boolean;
}

export interface Anamnese {
  queixaPrincipal: string;
  inicioDor: string;
  lesoes: string;
  cirurgias: string;
  medicamentos: string;
  escalaDor: number;
  localDor: string;
  avaliacaoFisica: string;
  objetivo: string;
  conduta: string;
  observacoes: string;
}

// ── Form Types ────────────────────────────────────────────────────────────────────────────

export interface ScheduleForm {
  editing: string | null;
  form: {
    time: string;
    days: string[];
    instructor: string;
    type: string;
    maxCapacity: number;
  };
}

export interface PlanForm {
  id: string | null;
  name: string;
  value: string;
  classesPerMonth: string;
  tenure: "mensal" | "trimestral" | "semestral" | "anual";
}

export interface PendingEvolution {
  sessionId: string;
  studentId: string;
  schedule?: Schedule;
  day: string;
}

// ── Route Types ───────────────────────────────────────────────────────────────────────────

export type Route =
  | "dashboard"
  | "turmas"
  | "alunos"
  | "evolucoes"
  | "relatorios"
  | "aula"
  | "ficha"
  | "financeiro";
