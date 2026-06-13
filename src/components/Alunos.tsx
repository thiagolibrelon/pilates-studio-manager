import { useState } from "react";
import type { Theme, Student, Payment, Plan } from "../types";
import { Av, Btn, SBadge } from "./ui";
import { daysUntilDue } from "../utils";

interface AlunosProps {
  t: Theme;
  students: Student[];
  payments: Payment[];
  plans: Plan[];
  onSelectStudent: (id: string) => void;
}

export function Alunos({ t, students, payments, plans, onSelectStudent }: AlunosProps) {
  const _gP = (id: string) => plans.find((p) => p.id === id);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Todos");

  const filtered = students
    .filter(
      (s) =>
        (s.name.toLowerCase().includes(search.toLowerCase()) || s.cpf.includes(search)) &&
        (filter === "Todos" || s.status === filter)
    )
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: t.p[800] }}>
          Alunos
        </h1>
        <Btn t={t} onClick={() => onSelectStudent("novo")} className="shrink-0">
          + Novo Aluno
        </Btn>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="🔍 Buscar..."
        className="w-full border rounded-xl px-4 py-2.5 text-sm"
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

      <div className="space-y-2">
        {filtered.map((s) => {
          const pay = payments.find((p) => p.studentId === s.id);
          const dv = daysUntilDue(s.firstPaymentDate);
          const urgente = dv !== null && dv <= 5 && pay?.status !== "Pago";

          return (
            <button
              key={s.id}
              onClick={() => onSelectStudent(s.id)}
              className="w-full rounded-2xl p-4 border shadow-sm text-left transition-all hover:shadow-md"
              style={{ background: t.card, borderColor: urgente ? "#fbbf24" : t.border }}
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
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{plans.find((p) => p.id === s.planId)?.name}</p>
                </div>
                <span style={{ color: t.p[400] }}>›</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
