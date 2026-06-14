import { useState } from "react";
import type { Theme, Payment, Expense, Student, Plan } from "../types";
import { Card, Btn, Av, SBadge, Inp, DateInp, Sl, TabSwitcher, EmptyState } from "./ui";
import { fmtM, fmtMonth, vencStr, daysUntilDue, TODAY, downloadCSV, fmt } from "../utils";

interface FinanceiroProps {
  t: Theme;
  payments: Payment[];
  expenses: Expense[];
  students: Student[];
  plans: Plan[];
  onPayment: (paymentId: string, method: string, amount?: number) => void;
  onOpenReciboModal: (data: { payment: Payment; student: Student; plan: Plan | undefined }) => void;
  onUpdatePlans: (plans: Plan[]) => void;
  onUpdateExpenses: (expenses: Expense[]) => void;
  onToast: (msg: string, type?: "success" | "error" | "warning") => void;
}

type FinanceiroTab = "pagamentos" | "despesas" | "planos";

type ExpenseForm = {
  id: string | null;
  description: string;
  category: string;
  amount: string;
  date: string;
};

const EXPENSE_CATEGORIES = ["Fixo", "Material", "Limpeza", "Marketing", "Manutenção", "Impostos", "Geral"];

export function Financeiro({
  t, payments, expenses, students, plans,
  onPayment, onOpenReciboModal, onUpdatePlans, onUpdateExpenses, onToast,
}: FinanceiroProps) {
  const [tab, setTab] = useState<FinanceiroTab>("pagamentos");
  const [month, setMonth] = useState(TODAY.slice(0, 7));
  const [expenseForm, setExpenseForm] = useState<ExpenseForm | null>(null);
  const [payConfirm, setPayConfirm] = useState<{
    payId: string; method: string; amount: string; studentName: string;
  } | null>(null);
  const [planForm, setPlanForm] = useState<{
    id: string | null; name: string; value: string; classesPerMonth: string;
    tenure: "mensal" | "trimestral" | "semestral" | "anual";
  } | null>(null);

  const mp = payments.filter((p) => p.month === month);
  const currentExpenses = expenses.filter((e) => e.month === month);
  const pago = mp.filter((p) => p.status === "Pago").reduce((a, p) => a + p.amount, 0);
  const prev = mp.reduce((a, p) => a + p.amount, 0);
  const despesas = currentExpenses.reduce((a, e) => a + e.amount, 0);
  const margem = pago - despesas;

  const chartMonths = getChartMonths(month);
  const chartData = chartMonths.map((m) => {
    const realized = payments.filter((p) => p.month === m && p.status === "Pago").reduce((a, p) => a + p.amount, 0);
    const out = expenses.filter((e) => e.month === m).reduce((a, e) => a + e.amount, 0);
    return { month: m, realized, expenses: out, margin: realized - out };
  });
  const chartMax = Math.max(1, ...chartData.flatMap((m) => [m.realized, m.expenses, Math.abs(m.margin)]));

  const gS = (id: string) => students.find((s) => s.id === id);
  const gP = (id: string) => plans.find((p) => p.id === id);

  const exportPagamentosCSV = () => {
    const headers = ["Aluno", "Mês", "Valor (R$)", "Status", "Método", "Data Pagamento"];
    const rows = mp.map((p) => {
      const s = gS(p.studentId);
      return [s?.name || "", p.month, p.amount, p.status, p.method || "", p.paidAt || ""];
    });
    downloadCSV(`pagamentos-${month}.csv`, [headers, ...rows]);
    onToast("Relatório exportado com sucesso!");
  };

  const exportDespesasCSV = () => {
    const headers = ["Descrição", "Categoria", "Data", "Valor (R$)"];
    const rows = currentExpenses.map((e) => [e.description, e.category, e.date, e.amount]);
    downloadCSV(`despesas-${month}.csv`, [headers, ...rows]);
    onToast("Relatório exportado com sucesso!");
  };

  const saveExpense = () => {
    if (!expenseForm) return;
    if (!expenseForm.description || !expenseForm.amount || !expenseForm.date) {
      onToast("Descrição, valor e data são obrigatórios.", "warning");
      return;
    }
    const amount = Math.abs(+expenseForm.amount);
    if (!amount) {
      onToast("Informe um valor maior que zero.", "warning");
      return;
    }
    const payload: Expense = {
      id: expenseForm.id || "exp" + Math.random().toString(36).slice(2, 9),
      description: expenseForm.description,
      category: expenseForm.category || "Geral",
      date: expenseForm.date,
      month: expenseForm.date.slice(0, 7),
      amount,
    };
    if (expenseForm.id) {
      onUpdateExpenses(expenses.map((e) => (e.id === expenseForm.id ? payload : e)));
      onToast("Despesa atualizada!");
    } else {
      onUpdateExpenses([payload, ...expenses]);
      onToast("Despesa registrada!");
    }
    setExpenseForm(null);
  };

  const savePlan = () => {
    if (!planForm) return;
    if (!planForm.name || !planForm.value) {
      onToast("Nome e valor são obrigatórios.", "warning");
      return;
    }
    const pl = {
      name: planForm.name,
      value: +planForm.value,
      classesPerMonth: +planForm.classesPerMonth || 0,
      tenure: planForm.tenure,
    };
    if (planForm.id) {
      onUpdatePlans(plans.map((p) => (p.id === planForm.id ? { ...p, ...pl } : p)));
      onToast("Plano atualizado!");
    } else {
      onUpdatePlans([...plans, { id: "p" + Math.random().toString(36).slice(2, 9), ...pl }]);
      onToast("Plano criado!");
    }
    setPlanForm(null);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold" style={{ color: t.p[800] }}>Financeiro</h1>

      <TabSwitcher
        tabs={[["pagamentos", "Pagamentos"], ["despesas", "Despesas"], ["planos", "Planos"]]}
        active={tab}
        onChange={(k) => setTab(k as FinanceiroTab)}
        t={t}
      />

      {(tab === "pagamentos" || tab === "despesas") && (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1 font-medium">Mês de referência</label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full border rounded-xl px-3 py-2 text-sm bg-white outline-none focus:ring-2 transition-all"
              style={{ borderColor: t.border }}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              ["Realizado", pago, "#16a34a"],
              ["Despesas", despesas, "#dc2626"],
              ["Margem", margem, margem >= 0 ? t.p[600] : "#dc2626"],
              ["Pendente", prev - pago, "#f59e0b"],
            ].map(([l, v, c]) => (
              <div key={l as string} className="rounded-2xl p-3 border shadow-sm text-center" style={{ background: t.card, borderColor: t.border }}>
                <p className="text-xs text-gray-400">{l as string}</p>
                <p className="text-sm font-bold mt-1" style={{ color: c as string }}>{fmtM(v as number)}</p>
              </div>
            ))}
          </div>

          <Card t={t}>
            <p className="text-xs text-gray-400 mb-2">Margem — últimos 6 meses</p>
            <div className="flex items-end gap-2 h-28">
              {chartData.map((item) => {
                const height = Math.max(6, Math.round((Math.abs(item.margin) / chartMax) * 88));
                const [y, m] = item.month.split("-").map(Number);
                return (
                  <div key={item.month} className="flex-1 flex flex-col justify-end items-center gap-1 min-w-0">
                    <span className="text-[9px] font-medium" style={{ color: item.margin >= 0 ? t.p[600] : "#dc2626" }}>
                      {item.month === month ? fmtM(item.margin) : ""}
                    </span>
                    <div
                      title={`${item.month}: ${fmtM(item.margin)}`}
                      className="w-full rounded-t-md transition-all"
                      style={{
                        height,
                        background: item.margin >= 0 ? t.p[500] : "#dc2626",
                        opacity: item.month === month ? 1 : 0.45,
                      }}
                    />
                    <span className="text-[9px] text-gray-400 truncate w-full text-center">
                      {["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"][m - 1]}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {tab === "pagamentos" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              onClick={exportPagamentosCSV}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl border font-medium transition-all hover:opacity-80"
              style={{ borderColor: t.p[200], color: t.p[600] }}
            >
              ⬇ Exportar CSV
            </button>
          </div>

          {mp.length === 0 ? (
            <EmptyState
              icon="💳"
              title="Sem pagamentos neste mês"
              description="Os pagamentos são gerados automaticamente ao cadastrar novos alunos."
              t={t}
            />
          ) : (
            mp.map((p) => {
              const s = gS(p.studentId);
              if (!s) return null;
              const dv = daysUntilDue(s.firstPaymentDate);
              const urgente = dv !== null && dv <= 5 && p.status !== "Pago";

              return (
                <Card key={p.id} t={t} className={urgente ? "border-amber-300" : ""}>
                  <div className="flex items-center gap-3">
                    <Av name={s.name} t={t} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm" style={{ color: t.p[800] }}>{s.name}</p>
                        <SBadge s={p.status} t={t} />
                      </div>
                      <p className="text-xs" style={{ color: urgente ? "#d97706" : t.p[600] }}>
                        Venc: {vencStr(s.firstPaymentDate)}{urgente ? ` · ⏰ ${dv}d` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm" style={{ color: t.p[700] }}>{fmtM(p.amount)}</p>
                      {p.paidAt && <p className="text-xs text-gray-400">{fmt(p.paidAt)}</p>}
                    </div>
                  </div>
                  {p.status === "Pago" ? (
                    <Btn
                      outline t={t} className="mt-3 w-full" style={{ fontSize: 12 }}
                      onClick={() => onOpenReciboModal({ payment: p, student: s, plan: gP(s.planId) })}
                    >
                      🧾 Gerar Recibo / WhatsApp
                    </Btn>
                  ) : (
                    <div className="mt-3 flex gap-2">
                      {["PIX", "Dinheiro", "Cartão"].map((m) => (
                        <button
                          key={m}
                          onClick={() => setPayConfirm({ payId: p.id, method: m, amount: String(p.amount), studentName: s.name })}
                          className="flex-1 py-1.5 text-xs rounded-lg font-medium text-white transition-all hover:opacity-90"
                          style={{ background: t.p[500] }}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      )}

      {tab === "despesas" && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <button
              onClick={exportDespesasCSV}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl border font-medium transition-all hover:opacity-80"
              style={{ borderColor: t.p[200], color: t.p[600] }}
            >
              ⬇ Exportar CSV
            </button>
            <Btn t={t} onClick={() => setExpenseForm({ id: null, description: "", category: "Geral", amount: "", date: month + "-01" })}>
              + Nova Despesa
            </Btn>
          </div>

          {currentExpenses.length === 0 ? (
            <EmptyState icon="📄" title="Nenhuma despesa neste mês" t={t} />
          ) : (
            currentExpenses.map((e) => (
              <Card key={e.id} t={t}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm" style={{ color: t.p[800] }}>{e.description}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{e.category} · {fmt(e.date)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-sm text-red-500">{fmtM(-e.amount)}</p>
                    <div className="flex justify-end gap-2 mt-1">
                      <button
                        onClick={() => setExpenseForm({ id: e.id, description: e.description, category: e.category, amount: String(e.amount), date: e.date })}
                        className="text-xs font-medium transition-all" style={{ color: t.p[600] }}
                      >
                        Editar
                      </button>
                      <button onClick={() => { onUpdateExpenses(expenses.filter((x) => x.id !== e.id)); onToast("Despesa removida.", "warning"); }} className="text-xs text-red-400">
                        Remover
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}

          {expenseForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
              <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
                <div className="p-5 border-b" style={{ borderColor: t.p[100] }}>
                  <h2 className="font-bold text-lg" style={{ color: t.p[800] }}>
                    {expenseForm.id ? "Editar" : "Nova"} Despesa
                  </h2>
                </div>
                <div className="p-5 space-y-4">
                  <Inp required label="Descrição" value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} placeholder="Ex: Aluguel" />
                  <Sl label="Categoria" value={expenseForm.category} onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}>
                    {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </Sl>
                  <Inp required label="Valor (R$)" type="number" min="0" step="0.01" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} placeholder="350" />
                  <DateInp required label="Data" value={expenseForm.date} onChange={(v) => setExpenseForm({ ...expenseForm, date: v })} />
                </div>
                <div className="p-5 border-t flex gap-3" style={{ borderColor: t.p[100] }}>
                  <Btn outline t={t} className="flex-1" onClick={() => setExpenseForm(null)}>Cancelar</Btn>
                  <Btn t={t} className="flex-1" onClick={saveExpense}>Salvar</Btn>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "planos" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Btn t={t} onClick={() => setPlanForm({ id: null, name: "", value: "", classesPerMonth: "", tenure: "mensal" })}>
              + Novo Plano
            </Btn>
          </div>

          {plans.length === 0 && (
            <EmptyState icon="📋" title="Nenhum plano cadastrado" description="Crie os planos de mensalidade oferecidos pelo estúdio." t={t} />
          )}

          {plans.map((p: Plan) => (
            <Card key={p.id} t={t}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-sm" style={{ color: t.p[800] }}>{p.name}</p>
                  <p className="text-sm mt-0.5" style={{ color: t.p[600] }}>
                    {fmtM(p.value)}<span className="text-gray-400 text-xs">/mês</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{p.classesPerMonth} aulas/mês · {p.tenure}</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Btn outline t={t} onClick={() => setPlanForm({ ...p, value: String(p.value), classesPerMonth: String(p.classesPerMonth) })}>
                    Editar
                  </Btn>
                  <button
                    onClick={() => { onUpdatePlans(plans.filter((x) => x.id !== p.id)); onToast("Plano removido.", "warning"); }}
                    className="text-xs px-3 py-1.5 rounded-xl border border-red-200 text-red-400 transition-all hover:bg-red-50"
                  >
                    Remover
                  </button>
                </div>
              </div>
            </Card>
          ))}

          {planForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
              <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
                <div className="p-5 border-b" style={{ borderColor: t.p[100] }}>
                  <h2 className="font-bold text-lg" style={{ color: t.p[800] }}>{planForm.id ? "Editar" : "Novo"} Plano</h2>
                </div>
                <div className="p-5 space-y-4">
                  <Inp required label="Nome do plano" value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} placeholder="Ex: Mensal 3x/semana" />
                  <Inp required label="Valor mensal (R$)" type="number" value={planForm.value} onChange={(e) => setPlanForm({ ...planForm, value: e.target.value })} placeholder="380" />
                  <Inp label="Aulas por mês" type="number" value={planForm.classesPerMonth} onChange={(e) => setPlanForm({ ...planForm, classesPerMonth: e.target.value })} placeholder="12" />
                  <Sl label="Vigência" value={planForm.tenure} onChange={(e) => setPlanForm({ ...planForm, tenure: e.target.value as any })}>
                    {["mensal", "trimestral", "semestral", "anual"].map((v) => <option key={v}>{v}</option>)}
                  </Sl>
                </div>
                <div className="p-5 border-t flex gap-3" style={{ borderColor: t.p[100] }}>
                  <Btn outline t={t} className="flex-1" onClick={() => setPlanForm(null)}>Cancelar</Btn>
                  <Btn t={t} className="flex-1" onClick={savePlan}>Salvar</Btn>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmar Pagamento Modal */}
      {payConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="p-5 border-b" style={{ borderColor: t.p[100] }}>
              <h2 className="font-bold text-lg" style={{ color: t.p[800] }}>Confirmar Pagamento</h2>
              <p className="text-sm text-gray-400">{payConfirm.studentName} · {payConfirm.method}</p>
            </div>
            <div className="p-5">
              <Inp
                label="Valor recebido (R$)"
                required
                type="number"
                min="0"
                step="0.01"
                value={payConfirm.amount}
                onChange={(e) => setPayConfirm({ ...payConfirm, amount: e.target.value })}
              />
            </div>
            <div className="p-5 border-t flex gap-3" style={{ borderColor: t.p[100] }}>
              <Btn outline t={t} className="flex-1" onClick={() => setPayConfirm(null)}>Cancelar</Btn>
              <Btn
                t={t}
                className="flex-1"
                onClick={() => {
                  onPayment(payConfirm.payId, payConfirm.method, +payConfirm.amount || undefined);
                  setPayConfirm(null);
                }}
              >
                Confirmar
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getChartMonths(currentMonth: string): string[] {
  const [year, month] = currentMonth.split("-").map(Number);
  const base = new Date(year, month - 1, 1);
  return Array.from({ length: 6 }, (_, index) => {
    const d = new Date(base);
    d.setMonth(base.getMonth() - (5 - index));
    return d.toISOString().slice(0, 7);
  });
}
