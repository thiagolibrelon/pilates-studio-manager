import { useState, useRef, useEffect } from "react";
import type { Theme, Student, Plan, Payment, Evolution, Presence, Enrollment, Schedule, Anamnese, PendingEvolution } from "../types";
import { Card, Btn, Av, Inp, TA, Sl, Sec, SBadge, TabSwitcher } from "./ui";
import { fmt, fmtM, WD, vencStr, TODAY, BLANK_ANAM } from "../utils";

interface FichaProps {
  t: Theme;
  studentId: string | null;
  students: Student[];
  plans: Plan[];
  payments: Payment[];
  evolutions: Evolution[];
  presence: Presence[];
  enrollments: Enrollment[];
  schedules: Schedule[];
  allPending: PendingEvolution[];
  anamneses: Record<string, Anamnese>;
  onUpdateStudent: (student: Student) => void;
  onAddStudent: (student: Student) => void;
  onUpdateAnamnese: (studentId: string, anam: Anamnese) => void;
  onUpdateEnrollments: (enrollments: Enrollment[]) => void;
  onNavigate: (route: string, id?: string | null) => void;
  onOpenEvoModal: (pend: PendingEvolution) => void;
  onOpenReciboModal: (data: { payment: Payment; student: Student; plan: Plan | undefined }) => void;
  onPayment: (paymentId: string, method: string) => void;
}

export function Ficha({
  t,
  studentId,
  students,
  plans,
  payments,
  evolutions,
  presence,
  enrollments,
  schedules,
  allPending,
  anamneses,
  onUpdateStudent,
  onAddStudent,
  onUpdateAnamnese,
  onUpdateEnrollments,
  onNavigate,
  onOpenEvoModal,
  onOpenReciboModal,
  onPayment,
}: FichaProps) {
  const [tab, setTab] = useState<"evolucoes" | "presencas" | "anamnese" | "horarios" | "financeiro" | "dados">("evolucoes");
  const [form, setForm] = useState<Student | null>(null);
  const lastId = useRef<string | null>(null);
  const [showEnrF, setShowEnrF] = useState(false);
  const [enrForm, setEnrForm] = useState({ scheduleId: "", days: [] as string[] });

  const isNew = studentId === "novo";

  useEffect(() => {
    if (studentId && studentId !== lastId.current) {
      lastId.current = studentId;
      if (isNew) {
        setForm({
          id: "",
          name: "",
          cpf: "",
          dob: "",
          whatsapp: "",
          emergency: "",
          email: "",
          address: "",
          enrolled: TODAY,
          firstPaymentDate: null,
          planId: "p1",
          status: "Ativo",
          notes: "",
          healthNotes: "",
          hasRestriction: false,
          repCredits: 0,
        });
        setTab("dados");
      } else {
        const st = students.find((s) => s.id === studentId);
        if (st) {
          setForm(st);
          setTab("evolucoes");
        }
      }
    }
  }, [studentId, students, isNew]);

  if (!form) return <div className="text-center py-12 text-gray-400">Carregando...</div>;

  const gP = (id: string) => plans.find((p) => p.id === id);
  const gSc = (id: string) => schedules.find((s) => s.id === id);

  const myEnrs = isNew ? [] : enrollments.filter((e) => e.studentId === form.id);
  const stEvos = isNew
    ? []
    : evolutions.filter((e) => e.studentId === form.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const stPays = isNew ? [] : payments.filter((p) => p.studentId === form.id);
  const stPend = isNew ? [] : allPending.filter((p) => p.studentId === form.id);
  const stHist = isNew ? [] : presence.filter((h) => h.studentId === form.id);

  const anam = anamneses[form.id] || { ...BLANK_ANAM };
  const updA = (k: string, v: any) => onUpdateAnamnese(form.id, { ...anam, [k]: v });

  const saveForm = () => {
    if (!form.name || !form.cpf) {
      alert("Nome e CPF obrigatórios.");
      return;
    }
    if (isNew) {
      const id = "s" + Math.random().toString(36).slice(2, 9);
      const newStudent = { ...form, id };
      onAddStudent(newStudent);
      onNavigate("ficha", id);
      alert("✅ Cadastrado!");
    } else {
      onUpdateStudent(form);
      alert("✅ Salvo!");
    }
  };

  const occ = (scId: string, day: string) => {
    const sc = gSc(scId);
    if (!sc || !sc.days.includes(day)) return null;
    return {
      occupied: enrollments.filter((e) => e.scheduleId === scId && e.days.includes(day)).length,
      max: sc.maxCapacity,
    };
  };

  const saveEnr = () => {
    if (!enrForm.scheduleId || enrForm.days.length === 0) {
      alert("Selecione turma e ao menos um dia.");
      return;
    }
    const sc = gSc(enrForm.scheduleId);
    for (const day of enrForm.days) {
      const o = occ(enrForm.scheduleId, day);
      if (o && o.occupied >= o.max) {
        alert(`${sc?.time} em ${day} lotada.`);
        return;
      }
    }
    if (enrollments.find((e) => e.studentId === form.id && e.scheduleId === enrForm.scheduleId)) {
      alert("Já vinculado.");
      return;
    }
    onUpdateEnrollments([
      ...enrollments,
      { id: "en" + Math.random().toString(36).slice(2, 9), scheduleId: enrForm.scheduleId, studentId: form.id, days: enrForm.days },
    ]);
    setShowEnrF(false);
    setEnrForm({ scheduleId: "", days: [] });
  };

  const tabs: [string, string][] = isNew
    ? [["dados", "👤 Dados"]]
    : [
        ["evolucoes", "📋 Evoluções"],
        ["presencas", "📅 Presenças"],
        ["anamnese", "🩺 Anamnese"],
        ["horarios", "🗓 Horários"],
        ["financeiro", "💰 Financeiro"],
        ["dados", "👤 Dados"],
      ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => onNavigate("alunos")} className="text-sm transition-all" style={{ color: t.p[600] }}>
          ← Voltar
        </button>
        <h1 className="text-xl font-bold" style={{ color: t.p[800] }}>
          {isNew ? "Novo Aluno" : form.name}
        </h1>
      </div>

      {!isNew && (
        <Card t={t} className="flex items-center gap-4">
          <Av name={form.name} size={14} t={t} />
          <div>
            <h2 className="font-bold text-lg" style={{ color: t.p[800] }}>
              {form.name}
            </h2>
            <div className="flex gap-2 mt-1 flex-wrap">
              <SBadge s={form.status} t={t} />
              {form.hasRestriction && <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">⚠ Restrição</span>}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {gP(form.planId)?.name} · Rep: {form.repCredits}
            </p>
          </div>
        </Card>
      )}

      <div className="overflow-x-auto pb-1">
        <TabSwitcher tabs={tabs} active={tab} onChange={(k) => setTab(k as any)} t={t} />
      </div>

      {/* ── Dados ────────────────────────────────────────────────────────────── */}
      {tab === "dados" && (
        <div className="rounded-2xl p-5 border shadow-sm space-y-3" style={{ background: t.card, borderColor: t.border }}>
          <Inp label="Nome *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Inp label="CPF *" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} placeholder="000.000.000-00" />
          <Inp label="Data de Nascimento" type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
          <Inp label="WhatsApp" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
          <Inp label="Telefone Emergência" value={form.emergency} onChange={(e) => setForm({ ...form, emergency: e.target.value })} />
          <Inp label="E-mail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Inp label="Endereço" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <Inp label="Data de Matrícula" type="date" value={form.enrolled} onChange={(e) => setForm({ ...form, enrolled: e.target.value })} />
          <Inp
            label="Data do Primeiro Pagamento"
            type="date"
            value={form.firstPaymentDate || ""}
            onChange={(e) => setForm({ ...form, firstPaymentDate: e.target.value || null })}
          />
          <p className="text-xs text-gray-400">Define o dia de vencimento mensal</p>
          <Sl label="Plano" value={form.planId} onChange={(e) => setForm({ ...form, planId: e.target.value })}>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.value > 0 ? ` — ${fmtM(p.value)}/mês` : ""}
              </option>
            ))}
          </Sl>
          <Sl label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })}>
            {["Ativo", "Inativo", "Trial", "Desistente", "Wellhub"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Sl>
          <TA label="Obs. de Saúde" value={form.healthNotes} onChange={(e) => setForm({ ...form, healthNotes: e.target.value })} placeholder="Lesões, restrições..." />
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.hasRestriction} onChange={(e) => setForm({ ...form, hasRestriction: e.target.checked })} className="w-4 h-4" />
            <span className="text-sm text-gray-600">Possui restrição de saúde?</span>
          </label>
          <TA label="Observações Internas" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notas para instrutores..." />
          <Btn t={t} className="w-full" onClick={saveForm}>
            {isNew ? "Cadastrar Aluno" : "Salvar Alterações"}
          </Btn>
        </div>
      )}

      {/* ── Presenças ─────────────────────────────────────────────────────────── */}
      {tab === "presencas" && !isNew && <TabPresencasFicha history={stHist} planId={form.planId} plans={plans} schedules={schedules} t={t} />}

      {/* ── Anamnese ──────────────────────────────────────────────────────────── */}
      {tab === "anamnese" && !isNew && (
        <div className="space-y-5">
          <Sec title="Queixa Principal" col={t.p[600]}>
            <TA value={anam.queixaPrincipal} onChange={(e) => updA("queixaPrincipal", e.target.value)} rows={3} placeholder="Queixa principal..." />
          </Sec>
          <Sec title="História" col={t.p[600]}>
            <Inp label="01) Início da dor" value={anam.inicioDor} onChange={(e) => updA("inicioDor", e.target.value)} placeholder="Quando e como iniciou..." />
            <TA label="02) Lesões / Patologias" value={anam.lesoes} onChange={(e) => updA("lesoes", e.target.value)} placeholder="Lesões e patologias..." />
            <TA label="03) Cirurgias" value={anam.cirurgias} onChange={(e) => updA("cirurgias", e.target.value)} placeholder="Histórico de cirurgias..." />
            <TA label="04) Medicamentos" value={anam.medicamentos} onChange={(e) => updA("medicamentos", e.target.value)} placeholder="Medicamentos em uso..." />
          </Sec>
          <Sec title="Escala de Dor" col={t.p[600]}>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-xs text-gray-400">Pontuação</span>
                <span className="font-bold text-lg" style={{ color: anam.escalaDor > 6 ? "#dc2626" : anam.escalaDor > 3 ? "#f59e0b" : t.p[600] }}>
                  {anam.escalaDor}/10
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={10}
                value={anam.escalaDor}
                onChange={(e) => updA("escalaDor", +e.target.value)}
                className="w-full"
                style={{ accentColor: t.p[500] }}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0 — Sem dor</span>
                <span>10 — Máxima</span>
              </div>
            </div>
            <Inp label="Local da dor" value={anam.localDor} onChange={(e) => updA("localDor", e.target.value)} placeholder="Ex: lombar direita..." />
          </Sec>
          <Sec title="Avaliação Física / Funcional" col={t.p[600]}>
            <TA value={anam.avaliacaoFisica} onChange={(e) => updA("avaliacaoFisica", e.target.value)} rows={4} placeholder="Postura, mobilidade, força..." />
          </Sec>
          <Sec title="Objetivo" col={t.p[600]}>
            <TA value={anam.objetivo} onChange={(e) => updA("objetivo", e.target.value)} rows={2} placeholder="Objetivo do aluno..." />
          </Sec>
          <Sec title="Conduta" col={t.p[600]}>
            <TA value={anam.conduta} onChange={(e) => updA("conduta", e.target.value)} rows={3} placeholder="Plano de tratamento..." />
          </Sec>
          <Sec title="Observações" col={t.p[600]}>
            <TA value={anam.observacoes} onChange={(e) => updA("observacoes", e.target.value)} rows={3} placeholder="Observações gerais..." />
          </Sec>
          <Btn t={t} className="w-full" onClick={() => alert("Anamnese salva!")}>
            Salvar Anamnese
          </Btn>
        </div>
      )}

      {/* ── Evoluções ────────────────────────────────────────────────────────── */}
      {tab === "evolucoes" && !isNew && (
        <div className="space-y-3">
          {stPend.length > 0 && (
            <div className="rounded-2xl p-4 border-2 border-amber-200 bg-amber-50">
              <p className="text-xs font-bold text-amber-700 mb-2">⏳ {stPend.length} pendente(s)</p>
              {stPend.map((pend, i) => (
                <div key={i} className="flex items-center justify-between mt-1">
                  <p className="text-xs text-amber-600">
                    {pend.schedule?.time} · {fmt(pend.day)}
                  </p>
                  <button onClick={() => onOpenEvoModal(pend)} className="text-xs px-2 py-1 rounded-lg text-white transition-all" style={{ background: t.p[500] }}>
                    Registrar
                  </button>
                </div>
              ))}
            </div>
          )}
          {stEvos.length === 0 && stPend.length === 0 && <p className="text-sm text-gray-400 text-center py-6">Nenhuma evolução.</p>}
          {stEvos.map((ev) => (
            <Card key={ev.id} t={t}>
              <div className="flex justify-between mb-2">
                <p className="font-semibold text-sm" style={{ color: t.p[800] }}>
                  {fmt(ev.day)}
                </p>
                <span className="text-xs text-gray-400">{ev.instructor}</span>
              </div>
              {ev.exercises.map((ex, i) => (
                <div key={i} className="flex items-center gap-2 text-xs p-2 rounded-lg mb-1" style={{ background: t.p[50] }}>
                  <span className="font-medium" style={{ color: t.p[700] }}>
                    {ex.name}
                  </span>
                  <span className="text-gray-400">
                    {ex.series}×{ex.reps} · {ex.equipment}
                  </span>
                </div>
              ))}
              {ev.clinicalNotes && <p className="text-xs text-gray-500 mt-1 italic">"{ev.clinicalNotes}"</p>}
            </Card>
          ))}
        </div>
      )}

      {/* ── Horários ────────────────────────────────────────────────────────── */}
      {tab === "horarios" && !isNew && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">Turmas vinculadas</p>
            <Btn t={t} onClick={() => { setEnrForm({ scheduleId: schedules[0]?.id || "", days: [] }); setShowEnrF(true); }}>
              + Vincular
            </Btn>
          </div>
          {myEnrs.length === 0 && <p className="text-sm text-gray-400 text-center py-6">Nenhuma turma vinculada.</p>}
          {myEnrs.map((en) => {
            const sc = gSc(en.scheduleId);
            if (!sc) return null;
            return (
              <Card key={en.id} t={t}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm" style={{ color: t.p[700] }}>
                        {sc.time}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: t.p[100], color: t.p[600] }}>
                        {sc.type}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{sc.instructor}</p>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {WD.map((d) => (
                        <span
                          key={d}
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={en.days.includes(d) ? { background: t.p[400], color: "white" } : { background: "#f1f5f9", color: "#cbd5e1" }}
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => onUpdateEnrollments(enrollments.filter((e) => e.id !== en.id))}
                    className="text-xs text-red-400 border border-red-200 px-2 py-1 rounded-lg transition-all hover:bg-red-50"
                  >
                    Remover
                  </button>
                </div>
              </Card>
            );
          })}

          {/* Vincular Modal */}
          {showEnrF && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
              <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
                <div className="p-5 border-b" style={{ borderColor: t.p[100] }}>
                  <h2 className="font-bold" style={{ color: t.p[800] }}>
                    Vincular Turma
                  </h2>
                </div>
                <div className="p-5 space-y-4">
                  <Sl label="Turma" value={enrForm.scheduleId} onChange={(e) => setEnrForm({ ...enrForm, scheduleId: e.target.value, days: [] })}>
                    {schedules.map((sc) => (
                      <option key={sc.id} value={sc.id}>
                        {sc.time} — {sc.type}
                      </option>
                    ))}
                  </Sl>
                  {enrForm.scheduleId && <DiasPicker scheduleId={enrForm.scheduleId} days={enrForm.days} setEnrForm={setEnrForm} enrollments={enrollments} schedules={schedules} t={t} />}
                </div>
                <div className="p-5 border-t flex gap-3" style={{ borderColor: t.p[100] }}>
                  <Btn outline t={t} className="flex-1" onClick={() => setShowEnrF(false)}>
                    Cancelar
                  </Btn>
                  <Btn t={t} className="flex-1" onClick={saveEnr}>
                    Vincular
                  </Btn>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Financeiro ──────────────────────────────────────────────────────── */}
      {tab === "financeiro" && !isNew && (
        <div className="space-y-3">
          {stPays.map((p) => (
            <Card key={p.id} t={t}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm" style={{ color: t.p[800] }}>
                    {p.month}
                  </p>
                  <p className="text-xs" style={{ color: t.p[600] }}>
                    Venc: {vencStr(form.firstPaymentDate)}
                  </p>
                  <p className="text-xs text-gray-400">{p.method || "Não pago"}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold" style={{ color: t.p[700] }}>
                    {fmtM(p.amount)}
                  </p>
                  <SBadge s={p.status} t={t} />
                </div>
              </div>
              {p.status === "Pago" ? (
                <Btn
                  outline
                  t={t}
                  className="mt-3 w-full"
                  style={{ fontSize: 12 }}
                  onClick={() => onOpenReciboModal({ payment: p, student: form, plan: gP(form.planId) })}
                >
                  🧾 Gerar Recibo / WhatsApp
                </Btn>
              ) : (
                <div className="mt-3 flex gap-2">
                  {["PIX", "Dinheiro", "Cartão"].map((m) => (
                    <button key={m} onClick={() => onPayment(p.id, m)} className="flex-1 py-1.5 text-xs rounded-lg font-medium text-white transition-all" style={{ background: t.p[500] }}>
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Tab Presenças ────────────────────────────────────────────────────────────────────────

function TabPresencasFicha({
  history,
  planId,
  plans,
  schedules,
  t,
}: {
  history: Presence[];
  planId: string;
  plans: Plan[];
  schedules: Schedule[];
  t: Theme;
}) {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [y, m] = month.split("-").map(Number);

  const rows = history
    .filter((h) => {
      const [hy, hm] = h.day.split("-").map(Number);
      return hy === y && hm === m;
    })
    .sort((a, b) => b.day.localeCompare(a.day));

  const pres = rows.filter((h) => h.status === "presente").length;
  const falt = rows.filter((h) => h.status === "falta").length;
  const rep = rows.filter((h) => h.status === "reposicao").length;
  const plan = plans.find((p) => p.id === planId);
  const tot = plan?.classesPerMonth || 0;
  const pct = tot > 0 ? Math.round((pres / tot) * 100) : 0;
  const bc = pct >= 75 ? "#4a9e6e" : pct >= 50 ? "#f59e0b" : "#ef4444";

  const gSc = (id: string) => schedules.find((s) => s.id === id);

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-gray-400 block mb-1">Mês</label>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-full border rounded-xl px-3 py-2 text-sm" style={{ borderColor: "#e5e7eb" }} />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[["Presenças", pres, "#16a34a"], ["Faltas", falt, "#ef4444"], ["Repos.", rep, "#f59e0b"], ["Frequência", pct + "%", bc]].map(([l, v, c]) => (
          <div key={l} className="text-center p-3 rounded-xl border" style={{ borderColor: "#e5e7eb", background: "#f9fafb" }}>
            <p className="text-xl font-bold" style={{ color: c as string }}>{v}</p>
            <p className="text-xs text-gray-400 mt-0.5">{l}</p>
          </div>
        ))}
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: bc }} />
      </div>
      {rows.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Nenhum registro neste mês.</p>}
      {rows.map((h) => {
        const sc = gSc(h.scheduleId);
        const icon = h.status === "presente" ? "✅" : h.status === "falta" ? "❌" : "🔄";
        const col = h.status === "presente" ? "text-emerald-600" : h.status === "falta" ? "text-red-400" : "text-amber-500";
        return (
          <div key={h.id} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: "#e5e7eb" }}>
            <div className="flex items-center gap-3">
              <span>{icon}</span>
              <div>
                <p className="text-sm font-medium">{fmt(h.day)}</p>
                <p className="text-xs text-gray-400">{sc?.time} — {sc?.type}</p>
              </div>
            </div>
            <span className={`text-xs font-medium capitalize ${col}`}>{h.status}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Dias Picker ───────────────────────────────────────────────────────────────────────────

function DiasPicker({
  scheduleId,
  days,
  setEnrForm,
  enrollments,
  schedules,
  t,
}: {
  scheduleId: string;
  days: string[];
  setEnrForm: React.Dispatch<React.SetStateAction<{ scheduleId: string; days: string[] }>>;
  enrollments: Enrollment[];
  schedules: Schedule[];
  t: Theme;
}) {
  const sc = schedules.find((s) => s.id === scheduleId);
  if (!sc) return null;

  const occ = (day: string) => ({
    occupied: enrollments.filter((e) => e.scheduleId === scheduleId && e.days.includes(day)).length,
    max: sc.maxCapacity,
  });

  return (
    <div>
      <label className="text-xs text-gray-400 block mb-2">Dias de frequência</label>
      <div className="flex gap-2 flex-wrap">
        {sc.days.map((d) => {
          const o = occ(d);
          const lot = o.occupied >= o.max;
          const sel = days.includes(d);
          return (
            <button
              key={d}
              disabled={lot && !sel}
              onClick={() => setEnrForm((f) => ({ ...f, days: f.days.includes(d) ? f.days.filter((x) => x !== d) : [...f.days, d] }))}
              className="px-3 py-1.5 rounded-xl text-sm font-medium disabled:opacity-40 transition-all"
              style={sel ? { background: t.p[500], color: "white" } : lot ? { background: "#fee2e2", color: "#dc2626" } : { background: t.p[50], color: t.p[600] }}
            >
              {d}
              {o && !lot ? <span className="text-xs opacity-60 ml-0.5">({o.max - o.occupied})</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
