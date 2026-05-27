import { useState } from "react";
import type { Theme, Student, Payment, Expense, Schedule, Session, Enrollment } from "../types";
import { Card, Btn, Av } from "./ui";
import { fmtM, WD, daysUntilDue, TODAY } from "../utils";

interface DashboardProps {
  t: Theme;
  students: Student[];
  payments: Payment[];
  expenses: Expense[];
  schedules: Schedule[];
  sessions: Session[];
  enrollments: Enrollment[];
  pendingCount: number;
  onNavigate: (route: string, id?: string | null) => void;
  onOpenScheduleSession: (scheduleId: string, weekday: string) => void;
}

export function Dashboard({ t, students, payments, expenses, schedules, sessions, enrollments, pendingCount, onNavigate, onOpenScheduleSession }: DashboardProps) {
  const [showInadModal, setShowInadModal] = useState(false);

  const activeStudents = students.filter((s) => ["Ativo", "Trial", "Wellhub"].includes(s.status));
  const inadList = payments
    .filter((p) => p.status === "Atrasado")
    .map((p) => ({ ...p, student: students.find((s) => s.id === p.studentId) }))
    .filter((p) => p.student);

  const currentMonth = TODAY.slice(0, 7);
  const monthPayments = payments.filter((p) => p.month === currentMonth);
  const fatP = monthPayments.reduce((a, p) => a + p.amount, 0);
  const fatR = monthPayments.filter((p) => p.status === "Pago").reduce((a, p) => a + p.amount, 0);
  const despesas = expenses.filter((e) => e.month === currentMonth).reduce((a, e) => a + e.amount, 0);
  const margem = fatR - despesas;

  const vencendoBreve = students.filter((s) => {
    const d = daysUntilDue(s.firstPaymentDate);
    if (d === null || d > 5) return false;
    const pay = payments.find((p) => p.studentId === s.id && p.month === TODAY.slice(0, 7));
    return pay && pay.status !== "Pago";
  });

  const occ = (scId: string, day: string) => {
    const sc = schedules.find((s) => s.id === scId);
    if (!sc || !sc.days.includes(day)) return null;
    return {
      occupied: enrollments.filter((e) => e.scheduleId === scId && e.days.includes(day)).length,
      max: sc.maxCapacity,
    };
  };

  const todaySessions = sessions
    .filter((s) => s.day === TODAY)
    .map((ses) => {
      const schedule = schedules.find((s) => s.id === ses.scheduleId);
      return {
        ...ses,
        schedule,
        students: Object.entries(ses.presences).map(([sid, v]) => ({
          ...students.find((s) => s.id === sid)!,
          presenceStatus: v.status,
          presType: v.type,
        })),
      };
    });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: t.p[800] }}>
          Olá, Camila 4\238121-F! {t.emoji}
        </h1>
        <p className="text-sm text-gray-400">
          {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {vencendoBreve.length > 0 && (
        <div className="rounded-2xl p-4 border-2" style={{ borderColor: "#fbbf24", background: "#fffbeb" }}>
          <p className="text-sm font-bold text-amber-700 mb-2">⏰ Vencimentos nos próximos 5 dias</p>
          {vencendoBreve.map((s) => {
            const d = daysUntilDue(s.firstPaymentDate)!;
            const pay = payments.find((p) => p.studentId === s.id && p.month === TODAY.slice(0, 7));
            return (
              <div key={s.id} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <Av name={s.name} size={7} t={t} />
                  <div>
                    <p className="text-xs font-semibold text-amber-800">{s.name}</p>
                    <p className="text-xs text-amber-600">
                      Vence em {d} dia{d !== 1 ? "s" : ""} · {fmtM(pay?.amount || 0)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate("ficha", s.id)}
                  className="text-xs px-2 py-1 rounded-lg text-white transition-all"
                  style={{ background: "#f59e0b" }}
                >
                  Ver
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Alunos Ativos", value: activeStudents.length, icon: "👥", sub: "+3 este mês" },
          { label: "Evoluções Pendentes", value: pendingCount, icon: "📋", sub: "Aguardando", click: () => onNavigate("evolucoes") },
          { label: "Inadimplentes", value: inadList.length, icon: "⚠️", sub: "Clique para ver", warn: inadList.length > 0, click: () => setShowInadModal(true) },
          { label: "Venc. em breve", value: vencendoBreve.length, icon: "🔔", sub: "Próx. 5 dias", warn: vencendoBreve.length > 0 },
        ].map((m, i) => (
          <button
            key={i}
            onClick={m.click}
            disabled={!m.click}
            className={`rounded-2xl p-4 border shadow-sm text-left w-full transition-all ${m.click ? "hover:opacity-80" : ""}`}
            style={{ background: t.card, borderColor: t.border }}
          >
            <div className="flex items-start justify-between mb-1">
              <p className="text-xs text-gray-400 leading-tight">{m.label}</p>
              <span className="text-lg">{m.icon}</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: m.warn && m.value > 0 ? "#d97706" : t.p[600] }}>
              {m.value}
            </p>
            <p className="text-xs text-gray-400 mt-1">{m.sub}</p>
          </button>
        ))}
      </div>

      <Card t={t}>
        <h2 className="font-semibold mb-3" style={{ color: t.p[800] }}>
          💰 Faturamento — {TODAY.slice(0, 7)}
        </h2>
        <div className="flex gap-4">
          {[["Previsto", fatP, t.p[600]], ["Realizado", fatR, "#16a34a"], ["Despesas", -despesas, "#dc2626"], ["Margem", margem, margem >= 0 ? t.p[600] : "#dc2626"]].map(([l, v, c]) => (
            <div key={l}>
              <p className="text-xs text-gray-400">{l}</p>
              <p className="text-xl font-bold" style={{ color: c as string }}>
                {fmtM(v as number)}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card t={t}>
        <h2 className="font-semibold mb-1" style={{ color: t.p[800] }}>
          Matriz de Vagas
        </h2>
        <p className="text-xs text-gray-400 mb-3">Clique para abrir a turma</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left text-xs text-gray-400 py-1 pr-2" style={{ minWidth: 50 }}>
                  Hora
                </th>
                {WD.map((d) => (
                  <th key={d} className="text-center text-xs text-gray-400 py-1 px-1">
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {schedules.map((sc) => (
                <tr key={sc.id}>
                  <td className="py-1 pr-2">
                    <span className="text-xs font-bold" style={{ color: t.p[700] }}>
                      {sc.time}
                    </span>
                  </td>
                  {WD.map((day) => {
                    const o = occ(sc.id, day);
                    if (!o)
                      return (
                        <td key={day} className="py-1 px-1">
                          <div className="rounded-xl py-1 text-center text-xs text-gray-200">—</div>
                        </td>
                      );
                    const full = o.occupied >= o.max;
                    const half = o.occupied > o.max / 2;
                    const bg = full ? t.occ.full : half ? t.occ.half : t.occ.avail;
                    const col = full ? t.occ.fullT : half ? t.occ.halfT : t.occ.availT;
                    return (
                      <td key={day} className="py-1 px-1">
                        <button
                          onClick={() => onOpenScheduleSession(sc.id, day)}
                          className="w-full rounded-xl py-1 px-1 text-center text-xs font-semibold transition-all hover:opacity-75"
                          style={{ background: bg, color: col }}
                        >
                          {o.occupied}/{o.max}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex gap-4 mt-3">
          {[["avail", "availT", "Disponível"], ["half", "halfT", "Quase lotado"], ["full", "fullT", "Lotado"]].map(([b, c, l]) => (
            <div key={l} className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm" style={{ background: t.occ[b as keyof typeof t.occ], border: `1px solid ${t.occ[c as keyof typeof t.occ]}` }} />
              <span className="text-xs text-gray-400">{l}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card t={t}>
        <h2 className="font-semibold mb-3" style={{ color: t.p[800] }}>
          Aulas de Hoje
        </h2>
        {todaySessions.map((ses) => (
          <button
            key={ses.id}
            onClick={() => onNavigate("aula", ses.id)}
            className="w-full flex items-center justify-between p-3 rounded-xl text-left mb-2 transition-all hover:opacity-80"
            style={{ background: t.p[50] }}
          >
            <div>
              <p className="font-semibold text-sm" style={{ color: t.p[800] }}>
                {ses.schedule?.time} — {ses.schedule?.type}
              </p>
              <p className="text-xs text-gray-400">
                {ses.students.length} alunos · {ses.schedule?.instructor}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: t.p[100], color: t.p[600] }}>
                {ses.students.filter((s) => s.presenceStatus === "presente").length}/{ses.students.length} ✓
              </span>
              <span style={{ color: t.p[400] }}>›</span>
            </div>
          </button>
        ))}
        {todaySessions.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Nenhuma aula para hoje.</p>}
      </Card>

      {showInadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="p-5 border-b" style={{ borderColor: t.p[100] }}>
              <h2 className="font-bold text-lg" style={{ color: t.p[800] }}>
                ⚠️ Inadimplentes
              </h2>
            </div>
            <div className="p-5 space-y-2 max-h-72 overflow-y-auto">
              {inadList.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setShowInadModal(false);
                    onNavigate("ficha", p.studentId);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all hover:opacity-80"
                  style={{ background: t.p[50] }}
                >
                  <Av name={(p.student as Student).name} t={t} />
                  <div className="flex-1">
                    <p className="font-semibold text-sm" style={{ color: t.p[800] }}>
                      {(p.student as Student).name}
                    </p>
                    <p className="text-xs text-red-400">Atrasado · {fmtM(p.amount)}</p>
                  </div>
                  <span style={{ color: t.p[400] }}>›</span>
                </button>
              ))}
            </div>
            <div className="p-5 border-t" style={{ borderColor: t.p[100] }}>
              <Btn outline t={t} className="w-full" onClick={() => setShowInadModal(false)}>
                Fechar
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
