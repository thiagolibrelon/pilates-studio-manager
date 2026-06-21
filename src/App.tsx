import { useEffect, useState, useCallback } from "react";
import type {
  Route, ThemeKey, Student, Plan, Schedule, Enrollment, Session,
  Evolution, Payment, Expense, Presence, Anamnese, PendingEvolution,
  StudioConfig, ToastItem, Professional,
} from "./types";
import {
  THEMES, INIT_STUDENTS, INIT_PLANS, INIT_SCHEDULES, INIT_ENROLLMENTS,
  INIT_SESSIONS, INIT_EVOLUTIONS, INIT_PAYMENTS, INIT_EXPENSES,
  INIT_PRESENCE, INIT_CLASS_TYPES, DEFAULT_STUDIO_CONFIG,
} from "./data";
import { uid, TODAY, WD } from "./utils";
import { Av, ToastContainer } from "./components/ui";
import { EvoForm, ReciboModal } from "./components/modals";
import { Dashboard } from "./components/Dashboard";
import { Turmas } from "./components/Turmas";
import { Alunos } from "./components/Alunos";
import { Evolucoes } from "./components/Evolucoes";
import { Relatorios } from "./components/Relatorios";
import { Aula } from "./components/Aula";
import { Ficha } from "./components/Ficha";
import { Financeiro } from "./components/Financeiro";
import { Login } from "./components/Login";
import { Configuracoes } from "./components/Configuracoes";

const loadStored = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const useStoredState = <T,>(key: string, fallback: T) => {
  const [value, setValue] = useState<T>(() => loadStored(key, fallback));
  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue] as const;
};

export default function App() {
  // ── Auth ─────────────────────────────────────────────────────────────────────
  const [config, setConfig] = useStoredState<StudioConfig | null>("pilates.config", null);
  const [isLoggedIn, setIsLoggedIn] = useState(() => sessionStorage.getItem("pilates.session") === "1");

  const handleSetup = (cfg: StudioConfig) => {
    setConfig(cfg);
    setIsLoggedIn(true);
    sessionStorage.setItem("pilates.session", "1");
  };

  const handleLogin = (username: string, password: string): boolean => {
    if (!config) return false;
    if (username === config.username && password === config.password) {
      setIsLoggedIn(true);
      sessionStorage.setItem("pilates.session", "1");
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    sessionStorage.removeItem("pilates.session");
    setRoute("dashboard");
  };

  const handleUpdateConfig = (cfg: StudioConfig) => {
    setConfig(cfg);
  };

  // ── Theme & Navigation ────────────────────────────────────────────────────────
  const [themeKey, setThemeKey] = useStoredState<ThemeKey>("pilates.theme", "sage");
  const t = THEMES[themeKey];
  const [route, setRoute] = useState<Route>("dashboard");
  const [routeParam, setRouteParam] = useState<string | null>(null);

  // ── State ─────────────────────────────────────────────────────────────────────
  const [students, setStudents] = useStoredState<Student[]>("pilates.students", INIT_STUDENTS as Student[]);
  const [anamneses, setAnamneses] = useStoredState<Record<string, Anamnese>>("pilates.anamneses", {});
  const [plans, setPlans] = useStoredState<Plan[]>("pilates.plans", INIT_PLANS);
  const [classTypes, setClassTypes] = useStoredState<string[]>("pilates.classTypes", INIT_CLASS_TYPES);
  const [schedules, setSchedules] = useStoredState<Schedule[]>("pilates.schedules", INIT_SCHEDULES);
  const [enrollments, setEnrollments] = useStoredState<Enrollment[]>("pilates.enrollments", INIT_ENROLLMENTS as Enrollment[]);
  const [sessions, setSessions] = useStoredState<Session[]>("pilates.sessions", INIT_SESSIONS as Session[]);
  const [evolutions, setEvolutions] = useStoredState<Evolution[]>("pilates.evolutions", INIT_EVOLUTIONS as Evolution[]);
  const [payments, setPayments] = useStoredState<Payment[]>("pilates.payments", INIT_PAYMENTS as Payment[]);
  const [expenses, setExpenses] = useStoredState<Expense[]>("pilates.expenses", INIT_EXPENSES as Expense[]);
  const [presence, setPresence] = useStoredState<Presence[]>("pilates.presence", INIT_PRESENCE as Presence[]);
  const [professionals, setProfessionals] = useStoredState<Professional[]>("pilates.professionals", []);

  useEffect(() => {
    if (config && professionals.length === 0) {
      setProfessionals([{
        id: "prof0",
        name: config.professionalName || "Profissional",
        crefito: config.crefito || "",
        active: true,
      }]);
    }
  }, []);

  // ── Toasts ────────────────────────────────────────────────────────────────────
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((message: string, type: ToastItem["type"] = "success") => {
    const id = uid();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const removeToast = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  // ── Modals ────────────────────────────────────────────────────────────────────
  const [evoModal, setEvoModal] = useState<{ pending: PendingEvolution; existingEvo?: Evolution } | null>(null);
  const [reciboModal, setReciboModal] = useState<{ payment: Payment; student: Student; plan: Plan | undefined } | null>(null);

  // ── Navigation ────────────────────────────────────────────────────────────────
  const nav = (r: string, p: string | null = null) => {
    setRoute(r as Route);
    setRouteParam(p);
  };

  // ── Computed Values ───────────────────────────────────────────────────────────
  const gS = (id: string) => students.find((s) => s.id === id);
  const gSc = (id: string) => schedules.find((s) => s.id === id);
  const gP = (id: string) => plans.find((p) => p.id === id);

  const allPending: PendingEvolution[] = sessions.flatMap((ses) =>
    (ses.pendingEvos || [])
      .filter((sid) => !(ses.evolved || []).includes(sid))
      .map((sid) => ({
        sessionId: ses.id,
        studentId: sid,
        schedule: gSc(ses.scheduleId),
        day: ses.day,
      }))
  );

  const pendingCount = allPending.length;

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleSaveEvo = (data: any) => {
    const { sessionId, studentId, existingEvoId, day, ...rest } = data;
    if (existingEvoId) {
      setEvolutions((prev) =>
        prev.map((e) =>
          e.id === existingEvoId
            ? { ...e, day: day || e.day, ...rest, editHistory: [...(e.editHistory || []), e.createdAt] }
            : e
        )
      );
      addToast("Evolução atualizada com sucesso!");
    } else {
      const ses = sessionId ? sessions.find((s) => s.id === sessionId) : null;
      setEvolutions((prev) => [
        {
          id: "ev" + uid(),
          scheduleId: ses?.scheduleId || "",
          day: day || ses?.day || TODAY,
          studentId,
          ...rest,
          editHistory: [],
        },
        ...prev,
      ]);
      if (ses && sessionId) {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === sessionId
              ? { ...s, evolved: [...(s.evolved || []), studentId], pendingEvos: (s.pendingEvos || []).filter((id) => id !== studentId) }
              : s
          )
        );
      }
      addToast("Evolução registrada com sucesso!");
    }
    setEvoModal(null);
  };

  const handlePayment = (payId: string, method: string, amount?: number) => {
    setPayments((prev) =>
      prev.map((p) =>
        p.id === payId
          ? { ...p, status: "Pago", method, paidAt: TODAY, ...(amount !== undefined ? { amount } : {}) }
          : p
      )
    );
    const pay = payments.find((p) => p.id === payId);
    if (pay) {
      setStudents((prev) =>
        prev.map((s) => (s.id === pay.studentId && !s.firstPaymentDate ? { ...s, firstPaymentDate: TODAY } : s))
      );
    }
    addToast("Pagamento confirmado!");
  };

  const handleUpdateStudent = (student: Student) => {
    setStudents((prev) => prev.map((s) => (s.id === student.id ? student : s)));
  };

  const handleAddStudent = (student: Student) => {
    setStudents((prev) => [...prev, student]);
    const plan = gP(student.planId);
    const currentMonth = TODAY.slice(0, 7);
    const newPayment: Payment = {
      id: "pay" + uid(),
      studentId: student.id,
      month: currentMonth,
      amount: plan?.value || 0,
      status: "Em dia",
      method: null,
      paidAt: null,
    };
    setPayments((prev) => [...prev, newPayment]);
  };

  const handleUpdateAnamnese = (studentId: string, anam: Anamnese) => {
    setAnamneses((prev) => ({ ...prev, [studentId]: anam }));
  };

  const handleUpdateSession = (session: Session) => {
    const oldSession = sessions.find((s) => s.id === session.id);
    setSessions((prev) => prev.map((s) => (s.id === session.id ? session : s)));
    if (!oldSession) return;
    const changed: Presence[] = [];
    Object.entries(session.presences).forEach(([studentId, entry]) => {
      const oldStatus = oldSession.presences[studentId]?.status;
      if (entry.status !== null && entry.status !== oldStatus) {
        changed.push({
          id: "ph" + uid(),
          studentId,
          day: session.day,
          scheduleId: session.scheduleId,
          status: entry.status as Presence["status"],
          type: entry.type,
        });
      }
    });
    if (changed.length > 0) {
      setPresence((prev) => {
        let updated = [...prev];
        changed.forEach((c) => {
          const idx = updated.findIndex(
            (p) => p.studentId === c.studentId && p.day === c.day && p.scheduleId === c.scheduleId
          );
          if (idx >= 0) updated[idx] = { ...updated[idx], status: c.status };
          else updated.push(c);
        });
        return updated;
      });
    }
  };

  const dateForWeekday = (weekday: string) => {
    const weekdayIndex = WD.indexOf(weekday as (typeof WD)[number]);
    const today = new Date(TODAY + "T12:00:00");
    const targetDay = weekdayIndex + 1;
    const diff = targetDay - today.getDay();
    today.setDate(today.getDate() + diff);
    return today.toISOString().slice(0, 10);
  };

  const handleOpenScheduleSession = (scheduleId: string, weekday: string) => {
    const day = dateForWeekday(weekday);
    const enrolled = enrollments.filter((e) => e.scheduleId === scheduleId && e.days.includes(weekday));
    const basePresences = Object.fromEntries(enrolled.map((e) => [e.studentId, { status: null, type: "fixo" as const }]));
    const existing = sessions.find((s) => s.scheduleId === scheduleId && s.day === day);

    if (existing) {
      setSessions((prev) =>
        prev.map((s) => (s.id === existing.id ? { ...s, presences: { ...basePresences, ...s.presences } } : s))
      );
      nav("aula", existing.id);
      return;
    }

    const id = "ses" + uid();
    setSessions((prev) => [
      ...prev,
      { id, scheduleId, day, presences: basePresences, pendingEvos: [], evolved: [], finalized: false },
    ]);
    nav("aula", id);
  };

  const handleDeleteStudent = (studentId: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    setEnrollments((prev) => prev.filter((e) => e.studentId !== studentId));
    setEvolutions((prev) => prev.filter((e) => e.studentId !== studentId));
    setPayments((prev) => prev.filter((p) => p.studentId !== studentId));
    setPresence((prev) => prev.filter((p) => p.studentId !== studentId));
    setAnamneses((prev) => {
      const { [studentId]: _, ...rest } = prev;
      return rest;
    });
    setSessions((prev) =>
      prev.map((s) => {
        if (!s.presences[studentId]) return s;
        const newPresences = { ...s.presences };
        delete newPresences[studentId];
        return {
          ...s,
          presences: newPresences,
          pendingEvos: (s.pendingEvos || []).filter((id) => id !== studentId),
          evolved: (s.evolved || []).filter((id) => id !== studentId),
        };
      })
    );
    nav("alunos");
    addToast("Aluno removido com sucesso.", "warning");
  };

  const handleClearData = () => {
    const keys = [
      "pilates.students", "pilates.anamneses", "pilates.schedules",
      "pilates.enrollments", "pilates.sessions", "pilates.evolutions",
      "pilates.payments", "pilates.expenses", "pilates.presence",
    ];
    keys.forEach((k) => localStorage.removeItem(k));
    setStudents([]);
    setAnamneses({});
    setSchedules([]);
    setEnrollments([]);
    setSessions([]);
    setEvolutions([]);
    setPayments([]);
    setExpenses([]);
    setPresence([]);
    nav("dashboard");
    addToast("Dados apagados com sucesso.", "warning");
  };

  // ── Login gate ────────────────────────────────────────────────────────────────
  if (!isLoggedIn || !config?.password) {
    return <Login config={config} onLogin={handleLogin} onSetup={handleSetup} />;
  }

  // ── Nav ───────────────────────────────────────────────────────────────────────
  const NAV = [
    { id: "dashboard" as Route, icon: "🏠", label: "Início" },
    { id: "turmas" as Route, icon: "🗓", label: "Turmas" },
    { id: "alunos" as Route, icon: "👥", label: "Alunos" },
    { id: "evolucoes" as Route, icon: "📋", label: "Evoluções" },
    { id: "relatorios" as Route, icon: "📊", label: "Relatórios" },
    { id: "financeiro" as Route, icon: "💰", label: "Financeiro" },
  ];

  const instructorName = config.professionalName || "Instrutor";

  return (
    <div className="min-h-screen" style={{ background: t.bg }}>
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm" style={{ borderColor: t.border }}>
        <button onClick={() => nav("dashboard")} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ background: t.p[500] }}>
            P
          </div>
          <div>
            <p className="font-bold text-sm leading-tight" style={{ color: t.p[800] }}>
              {config.studioName || "Pilates Studio"}
            </p>
            <p className="text-xs text-gray-400">Manager</p>
          </div>
        </button>

        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <div className="relative cursor-pointer" onClick={() => nav("evolucoes")}>
              <span className="text-lg">🔔</span>
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-xs flex items-center justify-center font-bold" style={{ background: t.p[500] }}>
                {pendingCount}
              </span>
            </div>
          )}
          <button
            onClick={() => nav("configuracoes")}
            className="w-8 h-8 flex items-center justify-center rounded-xl border transition-all hover:opacity-80"
            style={{ borderColor: t.p[200], background: t.p[50] }}
            title="Configurações"
          >
            <span className="text-base">⚙️</span>
          </button>
          <Av name={instructorName} size={8} t={t} />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-5 pb-28">
        {route === "dashboard" && (
          <Dashboard
            t={t}
            config={config}
            students={students}
            payments={payments}
            expenses={expenses}
            schedules={schedules}
            sessions={sessions}
            enrollments={enrollments}
            presence={presence}
            plans={plans}
            pendingCount={pendingCount}
            onNavigate={nav}
            onOpenScheduleSession={handleOpenScheduleSession}
            onToast={addToast}
          />
        )}

        {route === "turmas" && (
          <Turmas
            t={t}
            schedules={schedules}
            enrollments={enrollments}
            classTypes={classTypes}
            onUpdateSchedules={setSchedules}
            onUpdateEnrollments={setEnrollments}
            onUpdateClassTypes={setClassTypes}
            onToast={addToast}
          />
        )}

        {route === "alunos" && (
          <Alunos
            t={t}
            students={students}
            payments={payments}
            plans={plans}
            presence={presence}
            onSelectStudent={(id) => nav("ficha", id)}
          />
        )}

        {route === "evolucoes" && (
          <Evolucoes
            t={t}
            evolutions={evolutions}
            allPending={allPending}
            students={students}
            schedules={schedules}
            onOpenEvoModal={(pend) => setEvoModal({ pending: pend })}
            onViewFicha={(id) => nav("ficha", id)}
          />
        )}

        {route === "relatorios" && (
          <Relatorios
            t={t}
            presence={presence}
            students={students}
            plans={plans}
            schedules={schedules}
            payments={payments}
            onToast={addToast}
          />
        )}

        {route === "aula" && routeParam && (
          <Aula
            t={t}
            sessionId={routeParam}
            sessions={sessions}
            schedules={schedules}
            students={students}
            presence={presence}
            onUpdateSession={handleUpdateSession}
            onUpdateStudent={handleUpdateStudent}
            onNavigate={nav}
            onToast={addToast}
          />
        )}

        {route === "ficha" && (
          <Ficha
            t={t}
            studentId={routeParam}
            students={students}
            plans={plans}
            payments={payments}
            evolutions={evolutions}
            presence={presence}
            enrollments={enrollments}
            schedules={schedules}
            allPending={allPending}
            anamneses={anamneses}
            onUpdateStudent={handleUpdateStudent}
            onAddStudent={handleAddStudent}
            onUpdateAnamnese={handleUpdateAnamnese}
            onUpdateEnrollments={setEnrollments}
            onNavigate={nav}
            onOpenEvoModal={(pend, existingEvo) => setEvoModal({ pending: pend, existingEvo })}
            onOpenReciboModal={setReciboModal}
            onPayment={handlePayment}
            onDeleteStudent={handleDeleteStudent}
            onToast={addToast}
          />
        )}

        {route === "financeiro" && (
          <Financeiro
            t={t}
            payments={payments}
            expenses={expenses}
            students={students}
            plans={plans}
            onPayment={handlePayment}
            onOpenReciboModal={setReciboModal}
            onUpdatePlans={setPlans}
            onUpdateExpenses={setExpenses}
            onToast={addToast}
          />
        )}

        {route === "configuracoes" && config && (
          <Configuracoes
            t={t}
            themeKey={themeKey}
            config={config}
            professionals={professionals}
            onUpdateConfig={handleUpdateConfig}
            onUpdateProfessionals={setProfessionals}
            onChangeTheme={(k) => setThemeKey(k)}
            onNavigate={nav}
            onClearData={handleClearData}
            onLogout={handleLogout}
            onToast={addToast}
          />
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-40" style={{ borderColor: t.border }}>
        <div className="max-w-2xl mx-auto flex">
          {NAV.map((item) => (
            <button key={item.id} onClick={() => nav(item.id)} className="flex-1 flex flex-col items-center py-2 gap-0.5 relative">
              <span className="text-base">{item.icon}</span>
              {item.id === "evolucoes" && pendingCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full text-white flex items-center justify-center font-bold" style={{ background: "#ef4444", fontSize: 9 }}>
                  {pendingCount}
                </span>
              )}
              <span className="font-medium" style={{ fontSize: 9, color: route === item.id ? t.p[600] : "#9ca3af" }}>
                {item.label}
              </span>
              {route === item.id && <div className="w-4 h-0.5 rounded-full" style={{ background: t.p[500] }} />}
            </button>
          ))}
        </div>
      </div>

      {/* Modals */}
      {evoModal && (
        <EvoForm
          pending={evoModal.pending}
          existingEvo={evoModal.existingEvo}
          student={gS(evoModal.pending.studentId)}
          schedule={evoModal.pending.schedule}
          classTypes={classTypes}
          instructorName={instructorName}
          professionals={professionals}
          onSave={handleSaveEvo}
          onClose={() => setEvoModal(null)}
          onToast={addToast}
          t={t}
        />
      )}

      {reciboModal && (
        <ReciboModal
          payment={reciboModal.payment}
          student={reciboModal.student}
          plan={reciboModal.plan}
          studioName={config.studioName || "Pilates Studio"}
          t={t}
          onClose={() => setReciboModal(null)}
        />
      )}
    </div>
  );
}
