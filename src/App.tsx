import { useEffect, useState } from "react";
import type { Route, ThemeKey, Student, Plan, Schedule, Enrollment, Session, Evolution, Payment, Expense, Presence, Anamnese, PendingEvolution } from "./types";
import { THEMES, INIT_STUDENTS, INIT_PLANS, INIT_SCHEDULES, INIT_ENROLLMENTS, INIT_SESSIONS, INIT_EVOLUTIONS, INIT_PAYMENTS, INIT_EXPENSES, INIT_PRESENCE, INIT_CLASS_TYPES } from "./data";
import { uid, TODAY, WD } from "./utils";
import { Av } from "./components/ui";
import { EvoForm, ReciboModal, ThemeModal } from "./components/modals";
import { Dashboard } from "./components/Dashboard";
import { Turmas } from "./components/Turmas";
import { Alunos } from "./components/Alunos";
import { Evolucoes } from "./components/Evolucoes";
import { Relatorios } from "./components/Relatorios";
import { Aula } from "./components/Aula";
import { Ficha } from "./components/Ficha";
import { Financeiro } from "./components/Financeiro";

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
  // ── Theme & Navigation ──────────────────────────────────────────────────────
  const [themeKey, setThemeKey] = useStoredState<ThemeKey>("pilates.theme", "sage");
  const t = THEMES[themeKey];
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [route, setRoute] = useState<Route>("dashboard");
  const [routeParam, setRouteParam] = useState<string | null>(null);

  // ── State ────────────────────────────────────────────────────────────────────
  const [students, setStudents] = useStoredState<Student[]>("pilates.students", INIT_STUDENTS);
  const [anamneses, setAnamneses] = useStoredState<Record<string, Anamnese>>("pilates.anamneses", {});
  const [plans, setPlans] = useStoredState<Plan[]>("pilates.plans", INIT_PLANS);
  const [classTypes, setClassTypes] = useStoredState<string[]>("pilates.classTypes", INIT_CLASS_TYPES);
  const [schedules, setSchedules] = useStoredState<Schedule[]>("pilates.schedules", INIT_SCHEDULES);
  const [enrollments, setEnrollments] = useStoredState<Enrollment[]>("pilates.enrollments", INIT_ENROLLMENTS);
  const [sessions, setSessions] = useStoredState<Session[]>("pilates.sessions", INIT_SESSIONS);
  const [evolutions, setEvolutions] = useStoredState<Evolution[]>("pilates.evolutions", INIT_EVOLUTIONS);
  const [payments, setPayments] = useStoredState<Payment[]>("pilates.payments", INIT_PAYMENTS);
  const [expenses, setExpenses] = useStoredState<Expense[]>("pilates.expenses", INIT_EXPENSES);
  const [presence, setPresence] = useStoredState<Presence[]>("pilates.presence", INIT_PRESENCE);

  // ── Modals ──────────────────────────────────────────────────────────────────
  const [evoModal, setEvoModal] = useState<{ pending: PendingEvolution; existingEvo?: Evolution } | null>(null);
  const [reciboModal, setReciboModal] = useState<{ payment: Payment; student: Student; plan: Plan | undefined } | null>(null);

  // ── Navigation Helper ───────────────────────────────────────────────────────
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

  // ── Handlers ────────────────────────────────────────────────────────────────

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

    // Update student's firstPaymentDate if this is their first payment
    const pay = payments.find((p) => p.id === payId);
    if (pay) {
      setStudents((prev) =>
        prev.map((s) => (s.id === pay.studentId && !s.firstPaymentDate ? { ...s, firstPaymentDate: TODAY } : s))
      );
    }
  };

  const handleUpdateStudent = (student: Student) => {
    setStudents((prev) => prev.map((s) => (s.id === student.id ? student : s)));
  };

  const handleAddStudent = (student: Student) => {
    setStudents((prev) => [...prev, student]);

    // Create initial payment for the current month
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
      {
        id,
        scheduleId,
        day,
        presences: basePresences,
        pendingEvos: [],
        evolved: [],
        finalized: false,
      },
    ]);
    nav("aula", id);
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  const NAV = [
    { id: "dashboard" as Route, icon: "🏠", label: "Início" },
    { id: "turmas" as Route, icon: "🗓", label: "Turmas" },
    { id: "alunos" as Route, icon: "👥", label: "Alunos" },
    { id: "evolucoes" as Route, icon: "📋", label: "Evoluções" },
    { id: "relatorios" as Route, icon: "📊", label: "Relatórios" },
    { id: "financeiro" as Route, icon: "💰", label: "Financeiro" },
  ];

  return (
    <div className="min-h-screen" style={{ background: t.bg }}>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm" style={{ borderColor: t.border }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ background: t.p[500] }}>
            P
          </div>
          <div>
            <p className="font-bold text-sm leading-tight" style={{ color: t.p[800] }}>
              Pilates Studio
            </p>
            <p className="text-xs text-gray-400">Manager</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowThemeModal(true)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all" style={{ borderColor: t.p[200], color: t.p[600], background: t.p[50] }}>
            🎨 <span className="hidden sm:inline">{t.name}</span>
          </button>
          {pendingCount > 0 && (
            <div className="relative cursor-pointer" onClick={() => nav("evolucoes")}>
              <span className="text-lg">🔔</span>
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-xs flex items-center justify-center font-bold" style={{ background: t.p[500] }}>
                {pendingCount}
              </span>
            </div>
          )}
          <Av name="Maria Costa" size={8} t={t} />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-5 pb-28">
        {route === "dashboard" && (
          <Dashboard
            t={t}
            students={students}
            payments={payments}
            expenses={expenses}
            schedules={schedules}
            sessions={sessions}
            enrollments={enrollments}
            pendingCount={pendingCount}
            onNavigate={nav}
            onOpenScheduleSession={handleOpenScheduleSession}
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
          />
        )}

        {route === "alunos" && (
          <Alunos
            t={t}
            students={students}
            payments={payments}
            plans={plans}
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
      {showThemeModal && <ThemeModal current={themeKey} onChange={(k) => setThemeKey(k as ThemeKey)} onClose={() => setShowThemeModal(false)} t={t} themes={THEMES as unknown as Record<string, import("./types").Theme>} />}

      {evoModal && (
        <EvoForm
          pending={evoModal.pending}
          existingEvo={evoModal.existingEvo}
          student={gS(evoModal.pending.studentId)}
          schedule={evoModal.pending.schedule}
          classTypes={classTypes}
          onSave={handleSaveEvo}
          onClose={() => setEvoModal(null)}
          t={t}
        />
      )}

      {reciboModal && <ReciboModal payment={reciboModal.payment} student={reciboModal.student} plan={reciboModal.plan} t={t} onClose={() => setReciboModal(null)} />}
    </div>
  );
}
