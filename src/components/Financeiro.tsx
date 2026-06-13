import { useState } from "react";
import type { Theme, Payment, Expense, Student, Plan } from "../types";
import { Card, Btn, Av, SBadge, Inp, Sl, TabSwitcher } from "./ui";
import { fmtM, vencStr, daysUntilDue, TODAY } from "../utils";

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
}

type FinanceiroTab = "pagamentos" | "despesas" | "planos";

type ExpenseForm = {
  id: string | null;
  description: string;
  category: string;
  amount: string;
  date: string;
};

const EXPENSE_CATEGORIES = ["Fixo", "Material", "Limpeza", "Marketing", "Manutencao", "Impostos", "Geral"];

export function Financeiro({
  t,
  payments,
  expenses,
  students,
  plans,
  onPayment,
  onOpenReciboModal,
  onUpdatePlans,
  onUpdateExpenses,
}: FinanceiroProps) {
  const [tab, setTab] = useState<FinanceiroTab>("pagamentos");
  const [month, setMonth] = useState(TODAY.slice(0, 7));
  const [expenseForm, setExpenseForm] = useState<ExpenseForm | null>(null);
  const [payConfirm, setPayConfirm] = useState<{ payId: string; method: string; amount: string; studentName: string } | null>(null);
  const [planForm, setPlanForm] = useState<{
    id: string | null;
    name: string;
    value: string;
    classesPerMonth: string;
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

  const saveExpense = () => {
    if (!expenseForm) return;
    if (!expenseForm.description || !expenseForm.amount || !expenseForm.date) {
      alert("Descricao, valor e data sao obrigatorios.");
      return;
    }

    const amount = Math.abs(+expenseForm.amount);
    if (!amount) {
      alert("Informe um valor maior que zero.");
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
      onUpdateExpenses(expenses.map((expense) => (expense.id === expenseForm.id ? payload : expense)));
    } else {
      onUpdateExpenses([payload, ...expenses]);
    }
    setExpenseForm(null);
  };

  const savePlan = () => {
    if (!planForm) return;
    if (!planForm.name || !planForm.value) {
      alert("Nome e valor obrigatorios.");
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
    } else {
      onUpdatePlans([...plans, { id: "p" + Math.random().toString(36).slice(2, 9), ...pl }]);
    }
    setPlanForm(null);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold" style={{ color: t.p[800] }}>
        Financeiro
      </h1>

      <TabSwitcher
        tabs={[
          ["pagamentos", "Pagamentos"],
          ["despesas", "Despesas"],
          ["planos", "Planos"],
        ]}
        active={tab}
        onChange={(k) => setTab(k as FinanceiroTab)}
        t={t}
      />

      {(tab === "pagamentos" || tab === "despesas") && (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Mes de referencia</label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full border rounded-xl px-3 py-2 text-sm bg-white outline-none"
              style={{ borderColor: t.border }}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              ["Realizado", pago, "#16a34a"],
              ["Despesas", -despesas, "#dc2626"],
              ["Margem", margem, margem >= 0 ? t.p[600] : "#dc2626"],
              ["Pendente", prev - pago, "#f59e0b"],
            ].map(([l, v, c]) => (
              <div key={l} className="rounded-2xl p-3 border shadow-sm text-center" style={{ background: t.card, borderColor: t.border }}>
                <p className="text-xs text-gray-400">{l}</p>
                <p className="text-sm font-bold mt-1" style={{ color: c as string }}>
                  {fmtM(v as number)}
                </p>
              </div>
            ))}
          </div>

          <Card t={t}>
            <div className="flex items-end gap-2 h-32">
              {chartData.map((item) => {
                const height = Math.max(6, Math.round((Math.abs(item.margin) / chartMax) * 96));
                return (
                  <div key={item.month} className="flex-1 flex flex-col justify-end items-center gap-1 min-w-0">
                    <div
                      title={`${item.month}: ${fmtM(item.margin)}`}
                      className="w-full rounded-t-md"
                      style={{
                        height,
                        background: item.margin >= 0 ? t.p[500] : "#dc2626",
                        opacity: item.month === month ? 1 : 0.45,
                      }}
                    />
                    <span className="text-[10px] text-gray-400">{item.month.slice(5)}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 mt-3">Margem dos ultimos 6 meses</p>
          </Card>
        </div>
      )}

      {tab === "pagamentos" && (
        <div className="space-y-3">
          {mp.map((p) => {
            const s = gS(p.studentId);
            if (!s) return null;
            const dv = daysUntilDue(s.firstPaymentDate);
            const urgente = dv !== null && dv <= 5 && p.status !== "Pago";

            return (
              <Card key={p.id} t={t} className={urgente ? "border-amber-300" : ""}>
                <div className="flex items-center gap-3">
                  <Av name={s.name} t={t} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm" style={{ color: t.p[800] }}>
                        {s.name}
                      </p>
                      <SBadge s={p.status} t={t} />
                    </div>
                    <p className="text-xs" style={{ color: urgente ? "#d97706" : t.p[600] }}>
                      Venc: {vencStr(s.firstPaymentDate)}
                      {urgente ? ` - ${dv}d` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm" style={{ color: t.p[700] }}>
                      {fmtM(p.amount)}
                    </p>
                    {p.paidAt && <p className="text-xs text-gray-400">{fmt(p.paidAt)}</p>}
                  </div>
                </div>
                {p.status === "Pago" ? (
                  <Btn outline t={t} className="mt-3 w-full" style={{ fontSize: 12 }} onClick={() => onOpenReciboModal({ payment: p, student: s, plan: gP(s.planId) })}>
                    Gerar Recibo / WhatsApp
                  </Btn>
                ) : (
                  <div className="mt-3 flex gap-2">
                    {["PIX", "Dinheiro", "Cartão"].map((m) => (
                      <button
                        key={m}
                        onClick={() => setPayConfirm({ payId: p.id, method: m, amount: String(p.amount), studentName: s.name })}
                        className="flex-1 py-1.5 text-xs rounded-lg font-medium text-white transition-all"
                        style={{ background: t.p[500] }}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {tab === "despesas" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Btn t={t} onClick={() => setExpenseForm({ id: null, description: "", category: "Geral", amount: "", date: month + "-01" })}>
              + Nova Despesa
            </Btn>
          </div>

          {currentExpenses.length === 0 && (
            <Card t={t}>
              <p className="text-sm text-gray-400 text-center py-4">Nenhuma despesa cadastrada neste mes.</p>
            </Card>
          )}

          {currentExpenses.map((e) => (
            <Card key={e.id} t={t}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-sm" style={{ color: t.p[800] }}>
                    {e.description}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {e.category} - {fmt(e.date)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-sm text-red-500">{fmtM(-e.amount)}</p>
                  <div className="flex justify-end gap-2 mt-1">
                    <button
                      onClick={() => setExpenseForm({ id: e.id, description: e.description, category: e.category, amount: String(e.amount), date: e.date })}
                      className="text-xs"
                      style={{ color: t.p[600] }}
                    >
                      Editar
                    </button>
                    <button onClick={() => onUpdateExpenses(expenses.filter((x) => x.id !== e.id))} className="text-xs text-red-400">
                      Remover
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {expenseForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
              <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
                <div className="p-5 border-b" style={{ borderColor: t.p[100] }}>
                  <h2 className="font-bold text-lg" style={{ color: t.p[800] }}>
                    {expenseForm.id ? "Editar" : "Nova"} Despesa
                  </h2>
                </div>
                <div className="p-5 space-y-4">
                  <Inp label="Descricao *" value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} placeholder="Ex: Aluguel" />
                  <Sl label="Categoria" value={expenseForm.category} onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}>
                    {EXPENSE_CATEGORIES.map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                  </Sl>
                  <Inp label="Valor (R$) *" type="number" min="0" step="0.01" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} placeholder="350" />
                  <Inp label="Data *" type="date" value={expenseForm.date} onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })} />
                </div>
                <div className="p-5 border-t flex gap-3" style={{ borderColor: t.p[100] }}>
                  <Btn outline t={t} className="flex-1" onClick={() => setExpenseForm(null)}>
                    Cancelar
                  </Btn>
                  <Btn t={t} className="flex-1" onClick={saveExpense}>
                    Salvar
                  </Btn>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {payConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="p-5 border-b" style={{ borderColor: t.p[100] }}>
              <h2 className="font-bold text-lg" style={{ color: t.p[800] }}>
                Confirmar Pagamento
              </h2>
              <p className="text-sm text-gray-400">
                {payConfirm.studentName} · {payConfirm.method}
              </p>
            </div>
            <div className="p-5 space-y-4">
              <Inp
                label="Valor recebido (R$) *"
                type="number"
                min="0"
                step="0.01"
                value={payConfirm.amount}
                onChange={(e) => setPayConfirm({ ...payConfirm, amount: e.target.value })}
              />
            </div>
            <div className="p-5 border-t flex gap-3" style={{ borderColor: t.p[100] }}>
              <Btn outline t={t} className="flex-1" onClick={() => setPayConfirm(null)}>
                Cancelar
              </Btn>
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

      {tab === "planos" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Btn t={t} onClick={() => setPlanForm({ id: null, name: "", value: "", classesPerMonth: "", tenure: "mensal" })}>
              + Novo Plano
            </Btn>
          </div>

          {plans.map((p: Plan) => (
            <Card key={p.id} t={t}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-sm" style={{ color: t.p[800] }}>
                    {p.name}
                  </p>
                  <p className="text-sm mt-0.5" style={{ color: t.p[600] }}>
                    {fmtM(p.value)}
                    <span className="text-gray-400 text-xs">/mes</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {p.classesPerMonth} aulas/mes - {p.tenure}
                  </p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Btn outline t={t} onClick={() => setPlanForm({ ...p, value: String(p.value), classesPerMonth: String(p.classesPerMonth) })}>
                    Editar
                  </Btn>
                  <button onClick={() => onUpdatePlans(plans.filter((x) => x.id !== p.id))} className="text-xs px-3 py-1.5 rounded-xl border border-red-200 text-red-400 transition-all hover:bg-red-50">
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
                  <h2 className="font-bold text-lg" style={{ color: t.p[800] }}>
                    {planForm.id ? "Editar" : "Novo"} Plano
                  </h2>
                </div>
                <div className="p-5 space-y-4">
                  <Inp label="Nome *" value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} placeholder="Ex: Mensal 3x/semana" />
                  <Inp label="Valor mensal (R$) *" type="number" value={planForm.value} onChange={(e) => setPlanForm({ ...planForm, value: e.target.value })} placeholder="380" />
                  <Inp label="Aulas por mes" type="number" value={planForm.classesPerMonth} onChange={(e) => setPlanForm({ ...planForm, classesPerMonth: e.target.value })} placeholder="12" />
                  <Sl label="Vigencia" value={planForm.tenure} onChange={(e) => setPlanForm({ ...planForm, tenure: e.target.value as any })}>
                    {["mensal", "trimestral", "semestral", "anual"].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </Sl>
                </div>
                <div className="p-5 border-t flex gap-3" style={{ borderColor: t.p[100] }}>
                  <Btn outline t={t} className="flex-1" onClick={() => setPlanForm(null)}>
                    Cancelar
                  </Btn>
                  <Btn t={t} className="flex-1" onClick={savePlan}>
                    Salvar
                  </Btn>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function fmt(d: string): string {
  return d ? new Date(d + "T12:00:00").toLocaleDateString("pt-BR") : "-";
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
