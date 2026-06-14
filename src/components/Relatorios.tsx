import { useState } from "react";
import type { Theme, Presence, Student, Plan, Schedule, Payment } from "../types";
import { Card, Av, TabSwitcher, EmptyState } from "./ui";
import { fmt, fmtMonth, MONTHS, daysUntilDue, vencStr, fmtM, downloadCSV, TODAY } from "../utils";

interface RelatoriosProps {
  t: Theme;
  presence: Presence[];
  students: Student[];
  plans: Plan[];
  schedules: Schedule[];
  payments?: Payment[];
  onToast: (msg: string, type?: "success" | "error" | "warning") => void;
}

export function Relatorios({ t, presence, students, plans, schedules, payments = [], onToast }: RelatoriosProps) {
  const [tab, setTab] = useState<"presenca" | "vencimentos">("presenca");
  const [relMonth, setRelMonth] = useState(TODAY.slice(0, 7));
  const [relStudent, setRelStudent] = useState<string>("todos");

  const gP = (id: string) => plans.find((p) => p.id === id);
  const gSc = (id: string) => schedules.find((s) => s.id === id);

  const activeStudents = students.filter((s) => ["Ativo", "Trial", "Wellhub"].includes(s.status));

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold" style={{ color: t.p[800] }}>Relatórios</h1>

      <TabSwitcher
        tabs={[["presenca", "👥 Presença"], ["vencimentos", "🔔 Vencimentos"]]}
        active={tab}
        onChange={(k) => setTab(k as "presenca" | "vencimentos")}
        t={t}
      />

      {tab === "presenca" &&
        (relStudent === "todos" ? (
          <RelResumo
            presence={presence}
            activeStudents={activeStudents}
            plans={plans}
            relMonth={relMonth}
            setRelMonth={setRelMonth}
            setRelStudent={setRelStudent}
            gP={gP}
            t={t}
            onToast={onToast}
          />
        ) : (
          <RelDetalhe
            studentId={relStudent}
            presence={presence}
            students={students}
            plans={plans}
            schedules={schedules}
            setRelStudent={setRelStudent}
            gP={gP}
            gSc={gSc}
            t={t}
            onToast={onToast}
          />
        ))}

      {tab === "vencimentos" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold" style={{ color: t.p[700] }}>
              Vencimentos — {fmtMonth(relMonth)}
            </p>
            <input
              type="month"
              value={relMonth}
              onChange={(e) => setRelMonth(e.target.value)}
              className="border rounded-xl px-2 py-1 text-xs bg-white outline-none focus:ring-2 transition-all"
              style={{ borderColor: "#e5e7eb" }}
            />
          </div>

          {activeStudents.length === 0 ? (
            <EmptyState icon="🔔" title="Nenhum aluno ativo" t={t} />
          ) : (
            activeStudents.map((s) => {
              const dv = daysUntilDue(s.firstPaymentDate);
              const pay = payments.find((p) => p.studentId === s.id && p.month === relMonth);
              const status = pay?.status || "—";
              const urgente = dv !== null && dv <= 5 && status !== "Pago";

              return (
                <Card key={s.id} t={t} className={urgente ? "border-amber-300" : ""}>
                  <div className="flex items-center gap-3">
                    <Av name={s.name} t={t} />
                    <div className="flex-1">
                      <p className="font-semibold text-sm" style={{ color: t.p[800] }}>{s.name}</p>
                      <p className="text-xs" style={{ color: urgente ? "#d97706" : "#6b7280" }}>
                        {vencStr(s.firstPaymentDate)}{urgente ? ` · ⏰ ${dv}d` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${t.badge[status] || "bg-gray-100 text-gray-500"}`}>
                        {status}
                      </span>
                      <p className="text-xs text-gray-400 mt-1">{fmtM(pay?.amount || 0)}</p>
                    </div>
                  </div>
                  {urgente && (
                    <a
                      href={`https://wa.me/55${(s.whatsapp || "").replace(/\D/g, "")}?text=${encodeURIComponent(
                        `Olá ${s.name}! Sua mensalidade vence em ${dv} dia${dv !== 1 ? "s" : ""}. Qualquer dúvida estamos à disposição! 🌿`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-1 mt-2 w-full py-1.5 text-xs rounded-xl font-medium text-white transition-all hover:opacity-90"
                      style={{ background: "#25D366" }}
                    >
                      📱 Lembrete via WhatsApp
                    </a>
                  )}
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ── Resumo de Presença ────────────────────────────────────────────────────────────────────

interface RelResumoProps {
  presence: Presence[];
  activeStudents: Student[];
  plans: Plan[];
  relMonth: string;
  setRelMonth: (m: string) => void;
  setRelStudent: (id: string) => void;
  gP: (id: string) => Plan | undefined;
  t: Theme;
  onToast: (msg: string, type?: "success" | "error" | "warning") => void;
}

function RelResumo({ presence, activeStudents, plans, relMonth, setRelMonth, setRelStudent, gP, t, onToast }: RelResumoProps) {
  const [y, m] = relMonth.split("-").map(Number);

  const byStudent = activeStudents
    .map((s) => {
      const hist = presence.filter((h) => {
        const [hy, hm] = h.day.split("-").map(Number);
        return h.studentId === s.id && hy === y && hm === m;
      });
      const pres = hist.filter((h) => h.status === "presente").length;
      const falt = hist.filter((h) => ["falta", "falta_justificada", "falta_nao_justificada"].includes(h.status)).length;
      const rep = hist.filter((h) => h.status === "reposicao").length;
      const plan = gP(s.planId);
      const tot = plan?.classesPerMonth || 0;
      const pct = tot > 0 ? Math.round((pres / tot) * 100) : 0;
      return { s, pres, falt, rep, tot, pct, hist };
    })
    .filter((r) => r.hist.length > 0);

  const exportCSV = () => {
    const headers = ["Aluno", "Plano", "Presenças", "Faltas", "Reposições", "Frequência (%)", "Meta (aulas/mês)"];
    const rows = byStudent.map(({ s, pres, falt, rep, tot, pct }) => [
      s.name, gP(s.planId)?.name || "", pres, falt, rep, pct, tot,
    ]);
    downloadCSV(`presencas-${relMonth}.csv`, [headers, ...rows]);
    onToast("Relatório exportado com sucesso!");
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-xs text-gray-500 block mb-1 font-medium">Mês</label>
          <input
            type="month"
            value={relMonth}
            onChange={(e) => setRelMonth(e.target.value)}
            className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 transition-all"
            style={{ borderColor: "#e5e7eb" }}
          />
        </div>
        <div className="flex-1">
          <label className="text-xs text-gray-500 block mb-1 font-medium">Aluno</label>
          <select
            onChange={(e) => { if (e.target.value !== "todos") setRelStudent(e.target.value); }}
            className="w-full border rounded-xl px-3 py-2 text-sm bg-white outline-none focus:ring-2 transition-all"
            style={{ borderColor: "#e5e7eb" }}
          >
            <option value="todos">Todos</option>
            {[...activeStudents].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")).map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold" style={{ color: t.p[700] }}>
          Resumo — {fmtMonth(relMonth)}
        </p>
        {byStudent.length > 0 && (
          <button
            onClick={exportCSV}
            className="text-xs px-3 py-1.5 rounded-xl border font-medium transition-all hover:opacity-80"
            style={{ borderColor: t.p[200], color: t.p[600] }}
          >
            ⬇ Exportar CSV
          </button>
        )}
      </div>

      {byStudent.length === 0 ? (
        <EmptyState
          icon="📊"
          title="Sem registros neste mês"
          description="As presenças aparecem aqui conforme forem registradas nas aulas."
          t={t}
        />
      ) : (
        byStudent.map(({ s, pres, falt, rep, tot, pct }) => {
          const bc = pct >= 75 ? t.p[500] : pct >= 50 ? "#f59e0b" : "#ef4444";
          return (
            <Card key={s.id} t={t}>
              <div className="flex items-center gap-3 mb-3">
                <Av name={s.name} t={t} />
                <div className="flex-1">
                  <p className="font-semibold text-sm" style={{ color: t.p[800] }}>{s.name}</p>
                  <p className="text-xs text-gray-400">{gP(s.planId)?.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold" style={{ color: bc }}>{pct}%</p>
                  <p className="text-xs text-gray-400">frequência</p>
                </div>
              </div>
              <div className="h-2 rounded-full bg-gray-100 mb-2 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: bc }} />
              </div>
              <div className="flex gap-3 text-xs">
                <span className="text-emerald-600 font-medium">✅ {pres} pres.</span>
                <span className="text-red-400 font-medium">❌ {falt} falt.</span>
                {rep > 0 && <span className="text-amber-500 font-medium">🔄 {rep} rep.</span>}
                <span className="text-gray-400 ml-auto">Meta: {tot}</span>
              </div>
              <button onClick={() => setRelStudent(s.id)} className="mt-2 text-xs font-medium transition-all" style={{ color: t.p[500] }}>
                Ver detalhes →
              </button>
            </Card>
          );
        })
      )}
    </div>
  );
}

// ── Detalhe de Presença ───────────────────────────────────────────────────────────────────

interface RelDetalheProps {
  studentId: string;
  presence: Presence[];
  students: Student[];
  plans: Plan[];
  schedules: Schedule[];
  setRelStudent: (id: string) => void;
  gP: (id: string) => Plan | undefined;
  gSc: (id: string) => Schedule | undefined;
  t: Theme;
  onToast: (msg: string, type?: "success" | "error" | "warning") => void;
}

function RelDetalhe({ studentId, presence, students, plans, schedules, setRelStudent, gP, gSc, t, onToast }: RelDetalheProps) {
  const [month, setMonth] = useState(TODAY.slice(0, 7));
  const [y, m] = month.split("-").map(Number);

  const s = students.find((x) => x.id === studentId);
  const plan = s ? gP(s.planId) : undefined;

  const rows = presence
    .filter((h) => {
      const [hy, hm] = h.day.split("-").map(Number);
      return h.studentId === studentId && hy === y && hm === m;
    })
    .sort((a, b) => b.day.localeCompare(a.day));

  const pres = rows.filter((h) => h.status === "presente").length;
  const falt = rows.filter((h) => ["falta", "falta_justificada", "falta_nao_justificada"].includes(h.status)).length;
  const rep = rows.filter((h) => h.status === "reposicao").length;
  const pct = plan && plan.classesPerMonth > 0 ? Math.round((pres / plan.classesPerMonth) * 100) : 0;
  const bc = pct >= 75 ? t.p[500] : pct >= 50 ? "#f59e0b" : "#ef4444";

  const exportCSV = () => {
    const headers = ["Data", "Status", "Tipo", "Turma", "Horário"];
    const rowData = rows.map((h) => {
      const sc = h.scheduleId ? gSc(h.scheduleId) : undefined;
      return [h.day, h.status, h.type, sc?.type || "", sc?.time || ""];
    });
    downloadCSV(`presenca-${s?.name?.replace(/\s+/g, "-")}-${month}.csv`, [headers, ...rowData]);
    onToast("Relatório exportado!");
  };

  if (!s) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button onClick={() => setRelStudent("todos")} className="text-sm transition-all" style={{ color: t.p[600] }}>
          ← Todos os alunos
        </button>
        {rows.length > 0 && (
          <button
            onClick={exportCSV}
            className="text-xs px-3 py-1.5 rounded-xl border font-medium transition-all hover:opacity-80"
            style={{ borderColor: t.p[200], color: t.p[600] }}
          >
            ⬇ CSV
          </button>
        )}
      </div>

      <div>
        <label className="text-xs text-gray-500 block mb-1 font-medium">Mês</label>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 transition-all"
          style={{ borderColor: "#e5e7eb" }}
        />
      </div>

      <Card t={t}>
        <div className="flex items-center gap-3 mb-3">
          <Av name={s.name} t={t} />
          <div>
            <p className="font-bold" style={{ color: t.p[800] }}>{s.name}</p>
            <p className="text-xs text-gray-400">{plan?.name} · {fmtMonth(month)}</p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 mb-3">
          {[["Presenças", pres, "#16a34a"], ["Faltas", falt, "#ef4444"], ["Repos.", rep, "#f59e0b"], ["Frequência", `${pct}%`, bc]].map(([l, v, c]) => (
            <div key={l as string} className="text-center p-2 rounded-xl" style={{ background: t.p[50] }}>
              <p className="text-lg font-bold" style={{ color: c as string }}>{v}</p>
              <p className="text-xs text-gray-400">{l as string}</p>
            </div>
          ))}
        </div>
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: bc }} />
        </div>
      </Card>

      <p className="text-sm font-semibold" style={{ color: t.p[700] }}>Histórico detalhado</p>

      {rows.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">Nenhum registro neste mês.</p>
      ) : (
        rows.map((h) => {
          const sc = h.scheduleId ? gSc(h.scheduleId) : undefined;
          const isPres = h.status === "presente";
          const isRep = h.status === "reposicao";
          const isFaltaJust = h.status === "falta_justificada";
          const icon = isPres ? "✅" : isRep ? "🔄" : isFaltaJust ? "⚠️" : "❌";
          const col = isPres ? "text-emerald-600" : isRep ? "text-amber-500" : isFaltaJust ? "text-amber-600" : "text-red-400";
          const label = isPres ? "Presente" : isRep ? "Reposição" : isFaltaJust ? "F. Justificada" : "Falta";
          return (
            <div key={h.id} className="flex items-center justify-between p-3 rounded-xl mb-1 border" style={{ borderColor: "#e5e7eb" }}>
              <div className="flex items-center gap-3">
                <span>{icon}</span>
                <div>
                  <p className="text-sm font-medium" style={{ color: t.p[800] }}>{fmt(h.day)}</p>
                  <p className="text-xs text-gray-400">{sc?.time} — {sc?.type}</p>
                </div>
              </div>
              <span className={`text-xs font-medium ${col}`}>{label}</span>
            </div>
          );
        })
      )}
    </div>
  );
}
