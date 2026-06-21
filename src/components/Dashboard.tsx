import { useState } from "react";
import type { Theme, Student, Payment, Expense, Schedule, Session, Enrollment, Presence, Plan, StudioConfig } from "../types";
import { Card, Btn, Av } from "./ui";
import { fmtM, fmtMonth, WD, daysUntilDue, TODAY, MONTHS } from "../utils";

interface DashboardProps {
  t: Theme;
  config: StudioConfig;
  students: Student[];
  payments: Payment[];
  expenses: Expense[];
  schedules: Schedule[];
  sessions: Session[];
  enrollments: Enrollment[];
  presence: Presence[];
  plans: Plan[];
  pendingCount: number;
  onNavigate: (route: string, id?: string | null) => void;
  onOpenScheduleSession: (scheduleId: string, weekday: string) => void;
  onToast: (msg: string, type?: "success" | "error" | "warning") => void;
}

export function Dashboard({
  t, config, students, payments, expenses, schedules, sessions,
  enrollments, presence, plans, pendingCount, onNavigate, onOpenScheduleSession,
}: DashboardProps) {
  const [showInadModal, setShowInadModal] = useState(false);
  const [showLowFreqModal, setShowLowFreqModal] = useState(false);

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

  // New students this month
  const newThisMonth = students.filter((s) => s.enrolled && s.enrolled.startsWith(currentMonth)).length;

  const vencendoBreve = students.filter((s) => {
    const d = daysUntilDue(s.firstPaymentDate);
    if (d === null || d > 5) return false;
    const pay = payments.find((p) => p.studentId === s.id && p.month === currentMonth);
    return pay && pay.status !== "Pago";
  });

  // Low frequency alert: students with < 60% attendance this month (only after day 8)
  const dayOfMonth = new Date(TODAY).getDate();
  const lowFreqStudents = dayOfMonth >= 8
    ? activeStudents.filter((s) => {
        const plan = plans.find((p) => p.id === s.planId);
        if (!plan || plan.classesPerMonth === 0 || s.status === "Wellhub") return false;
        const monthPres = presence.filter(
          (p) => p.studentId === s.id && p.day.startsWith(currentMonth) && p.status === "presente"
        ).length;
        const expected = Math.round(plan.classesPerMonth * (dayOfMonth / 30));
        if (expected === 0) return false;
        return (monthPres / expected) * 100 < 60;
      })
    : [];

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

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const firstName = config.professionalName?.split(" ")[0] || "";

  return (
    <div className="space-y-5">
      {/* Saudação */}
      <div>
        <h1 className="text-2xl font-bold leading-snug" style={{ color: t.p[800] }}>
          {greeting}{firstName ? `, ${firstName}` : ""}! {t.emoji}
          {config.crefito && (
            <>
              <br />
              <span className="text-base font-medium text-gray-500">{config.crefito}</span>
            </>
          )}
        </h1>
        <p className="text-sm text-gray-400">
          {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Alertas de vencimento */}
      {vencendoBreve.length > 0 && (
        <div className="rounded-2xl p-4 border-2" style={{ borderColor: "#fbbf24", background: "#fffbeb" }}>
          <p className="text-sm font-bold text-amber-700 mb-2">⏰ Vencimentos nos próximos 5 dias</p>
          {vencendoBreve.map((s) => {
            const d = daysUntilDue(s.firstPaymentDate)!;
            const pay = payments.find((p) => p.studentId === s.id && p.month === currentMonth);
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
                  className="text-xs px-2 py-1 rounded-lg text-white transition-all hover:opacity-80"
                  style={{ background: "#f59e0b" }}
                >
                  Ver
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Alertas de baixa frequência */}
      {lowFreqStudents.length > 0 && (
        <button
          onClick={() => setShowLowFreqModal(true)}
          className="w-full rounded-2xl p-4 border-2 border-orange-200 bg-orange-50 flex items-center justify-between text-left transition-all hover:opacity-80"
        >
          <div>
            <p className="text-sm font-bold text-orange-700">📉 Baixa frequência</p>
            <p className="text-xs text-orange-600 mt-0.5">
              {lowFreqStudents.length} aluno{lowFreqStudents.length !== 1 ? "s" : ""} abaixo de 60% este mês
            </p>
          </div>
          <span className="text-xl text-orange-400">›</span>
        </button>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          {
            label: "Alunos Ativos",
            value: activeStudents.length,
            icon: "👥",
            sub: newThisMonth > 0 ? `+${newThisMonth} este mês` : "Total matriculados",
          },
          {
            label: "Evoluções Pendentes",
            value: pendingCount,
            icon: "📋",
            sub: "Aguardando registro",
            click: () => onNavigate("evolucoes"),
          },
          {
            label: "Inadimplentes",
            value: inadList.length,
            icon: "⚠️",
            sub: inadList.length > 0 ? "Clique para ver" : "Em dia",
            warn: inadList.length > 0,
            click: inadList.length > 0 ? () => setShowInadModal(true) : undefined,
          },
          {
            label: "Venc. em breve",
            value: vencendoBreve.length,
            icon: "🔔",
            sub: "Próx. 5 dias",
            warn: vencendoBreve.length > 0,
          },
        ].map((m, i) => (
          <button
            key={i}
            onClick={m.click}
            disabled={!m.click}
            className={`rounded-2xl p-4 border shadow-sm text-left w-full transition-all ${m.click ? "hover:shadow-md" : ""}`}
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

      {/* Faturamento do Mês */}
      <Card t={t}>
        <h2 className="font-semibold mb-3" style={{ color: t.p[800] }}>
          💰 Faturamento — {fmtMonth(currentMonth)}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Previsto", fatP, t.p[600]],
            ["Realizado", fatR, "#16a34a"],
            ["Despesas", despesas, "#dc2626"],
            ["Margem", margem, margem >= 0 ? t.p[600] : "#dc2626"],
          ].map(([l, v, c]) => (
            <div key={l as string} className="rounded-xl p-3 text-center" style={{ background: t.p[50] }}>
              <p className="text-xs text-gray-400 mb-1">{l as string}</p>
              <p className="text-base font-bold leading-tight" style={{ color: c as string }}>
                {fmtM(v as number)}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Matriz de Vagas */}
      <Card t={t}>
        <h2 className="font-semibold mb-1" style={{ color: t.p[800] }}>
          Matriz de Vagas
        </h2>
        <p className="text-xs text-gray-400 mb-3">Clique para abrir a turma</p>

        {schedules.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-sm text-gray-400">Nenhuma turma cadastrada.</p>
            <button onClick={() => onNavigate("turmas")} className="text-xs mt-2 font-medium transition-all" style={{ color: t.p[500] }}>
              Ir para Turmas →
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left text-xs text-gray-400 py-1 pr-2" style={{ minWidth: 50 }}>Hora</th>
                    {WD.map((d) => (
                      <th key={d} className="text-center text-xs text-gray-400 py-1 px-1">{d}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((sc) => (
                    <tr key={sc.id}>
                      <td className="py-1 pr-2">
                        <span className="text-xs font-bold" style={{ color: t.p[700] }}>{sc.time}</span>
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
          </>
        )}
      </Card>

      {/* Aulas de Hoje */}
      <Card t={t}>
        <h2 className="font-semibold mb-3" style={{ color: t.p[800] }}>
          Aulas de Hoje
        </h2>
        {todaySessions.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            Nenhuma aula aberta hoje. Clique em uma célula da Matriz de Vagas para iniciar.
          </p>
        ) : (
          todaySessions.map((ses) => (
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
                  {ses.students.length} aluno{ses.students.length !== 1 ? "s" : ""} · {ses.schedule?.instructor}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: t.p[100], color: t.p[600] }}>
                  {ses.students.filter((s) => s.presenceStatus === "presente").length}/{ses.students.length} ✓
                </span>
                <span style={{ color: t.p[400] }}>›</span>
              </div>
            </button>
          ))
        )}
      </Card>

      {/* Modal Baixa Frequência */}
      {showLowFreqModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="p-5 border-b" style={{ borderColor: t.p[100] }}>
              <h2 className="font-bold text-lg" style={{ color: t.p[800] }}>📉 Baixa Frequência</h2>
              <p className="text-xs text-gray-400">Alunos abaixo de 60% no mês atual</p>
            </div>
            <div className="p-5 space-y-2 max-h-72 overflow-y-auto">
              {lowFreqStudents.map((s) => {
                const plan = plans.find((p) => p.id === s.planId);
                const monthPres = presence.filter(
                  (p) => p.studentId === s.id && p.day.startsWith(currentMonth) && p.status === "presente"
                ).length;
                const expected = Math.round((plan?.classesPerMonth || 0) * (dayOfMonth / 30));
                const pct = expected > 0 ? Math.round((monthPres / expected) * 100) : 0;
                return (
                  <button
                    key={s.id}
                    onClick={() => { setShowLowFreqModal(false); onNavigate("ficha", s.id); }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all hover:opacity-80"
                    style={{ background: t.p[50] }}
                  >
                    <Av name={s.name} t={t} />
                    <div className="flex-1">
                      <p className="font-semibold text-sm" style={{ color: t.p[800] }}>{s.name}</p>
                      <p className="text-xs text-orange-600">
                        {monthPres}/{plan?.classesPerMonth || "?"} aulas · {pct}%
                      </p>
                    </div>
                    <span style={{ color: t.p[400] }}>›</span>
                  </button>
                );
              })}
            </div>
            <div className="p-5 border-t" style={{ borderColor: t.p[100] }}>
              <Btn outline t={t} className="w-full" onClick={() => setShowLowFreqModal(false)}>Fechar</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Modal Inadimplentes */}
      {showInadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="p-5 border-b" style={{ borderColor: t.p[100] }}>
              <h2 className="font-bold text-lg" style={{ color: t.p[800] }}>⚠️ Inadimplentes</h2>
            </div>
            <div className="p-5 space-y-2 max-h-72 overflow-y-auto">
              {inadList.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setShowInadModal(false); onNavigate("ficha", p.studentId); }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all hover:opacity-80"
                  style={{ background: t.p[50] }}
                >
                  <Av name={(p.student as Student).name} t={t} />
                  <div className="flex-1">
                    <p className="font-semibold text-sm" style={{ color: t.p[800] }}>{(p.student as Student).name}</p>
                    <p className="text-xs text-red-400">Atrasado · {fmtM(p.amount)}</p>
                  </div>
                  <span style={{ color: t.p[400] }}>›</span>
                </button>
              ))}
            </div>
            <div className="p-5 border-t" style={{ borderColor: t.p[100] }}>
              <Btn outline t={t} className="w-full" onClick={() => setShowInadModal(false)}>Fechar</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
