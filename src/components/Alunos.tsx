import { useState } from "react";
import type { Theme, Student, Payment, Plan, Presence } from "../types";
import { Av, Btn, SBadge, EmptyState } from "./ui";
import { daysUntilDue, TODAY } from "../utils";

interface AlunosProps {
  t: Theme;
  students: Student[];
  payments: Payment[];
  plans: Plan[];
  presence: Presence[];
  onSelectStudent: (id: string) => void;
}

export function Alunos({ t, students, payments, plans, presence, onSelectStudent }: AlunosProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Todos");

  const currentMonth = TODAY.slice(0, 7);

  const filtered = students
    .filter((s) => {
      const term = search.toLowerCase();
      const matchText = s.name.toLowerCase().includes(term) || s.cpf.includes(term);
      const matchStatus = filter === "Todos" || s.status === filter;
      return matchText && matchStatus;
    })
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  const isLowFreq = (s: Student): boolean => {
    const plan = plans.find((p) => p.id === s.planId);
    if (!plan || plan.classesPerMonth === 0 || s.status === "Wellhub") return false;
    const dayOfMonth = new Date(TODAY).getDate();
    if (dayOfMonth < 8) return false;
    const monthPres = presence.filter(
      (p) => p.studentId === s.id && p.day.startsWith(currentMonth) && p.status === "presente"
    ).length;
    const expected = Math.round(plan.classesPerMonth * (dayOfMonth / 30));
    if (expected === 0) return false;
    return (monthPres / expected) * 100 < 60;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: t.p[800] }}>Alunos</h1>
        <Btn t={t} onClick={() => onSelectStudent("novo")} className="shrink-0">
          + Novo Aluno
        </Btn>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="🔍 Buscar por nome ou CPF..."
        className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 transition-all"
        style={{ borderColor: t.border }}
      />

      <div className="flex gap-2 overflow-x-auto pb-1">
        {["Todos", "Ativo", "Trial", "Wellhub", "Inativo", "Desistente"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className="whitespace-nowrap text-xs px-3 py-1.5 rounded-full font-medium transition-all"
            style={
              filter === s
                ? { background: t.p[500], color: "white" }
                : { background: "#f1f5f9", color: "#6b7280" }
            }
          >
            {s}
          </button>
        ))}
      </div>

      {students.length === 0 ? (
        <EmptyState
          icon="👥"
          title="Nenhum aluno cadastrado"
          description="Clique em '+ Novo Aluno' para começar a cadastrar os alunos da clínica."
          t={t}
        />
      ) : filtered.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-gray-400">Nenhum aluno encontrado para "{search || filter}".</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((s) => {
            const pay = payments.find((p) => p.studentId === s.id && p.month === currentMonth);
            const dv = daysUntilDue(s.firstPaymentDate);
            const urgente = dv !== null && dv <= 5 && pay?.status !== "Pago";
            const baixaFreq = isLowFreq(s);

            return (
              <button
                key={s.id}
                onClick={() => onSelectStudent(s.id)}
                className="w-full rounded-2xl p-4 border shadow-sm text-left transition-all hover:shadow-md"
                style={{
                  background: t.card,
                  borderColor: urgente ? "#fbbf24" : baixaFreq ? "#fb923c" : t.border,
                }}
              >
                <div className="flex items-center gap-3">
                  <Av name={s.name} t={t} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm" style={{ color: t.p[800] }}>
                        {s.name}
                      </p>
                      <SBadge s={s.status} t={t} />
                      {pay && <SBadge s={pay.status} t={t} />}
                      {urgente && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                          ⏰ {dv}d
                        </span>
                      )}
                      {baixaFreq && !urgente && (
                        <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                          📉 Baixa freq.
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {plans.find((p) => p.id === s.planId)?.name}
                    </p>
                  </div>
                  <span style={{ color: t.p[400] }}>›</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
