import { useState } from "react";
import type { Theme, Evolution, PendingEvolution, Student, Schedule } from "../types";
import { Card, Av, TabSwitcher } from "./ui";
import { fmt } from "../utils";

interface EvolucoesProps {
  t: Theme;
  evolutions: Evolution[];
  allPending: PendingEvolution[];
  students: Student[];
  schedules: Schedule[];
  onOpenEvoModal: (pend: PendingEvolution) => void;
  onViewFicha: (studentId: string) => void;
}

export function Evolucoes({ t, evolutions, allPending, students, /*schedules,*/ onOpenEvoModal, onViewFicha }: EvolucoesProps) {
  const [tab, setTab] = useState<"pendentes" | "historico">("pendentes");

  const gS = (id: string) => students.find((s) => s.id === id);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold" style={{ color: t.p[800] }}>
        📋 Evoluções
      </h1>

      <TabSwitcher tabs={[["pendentes", "⏳ Pendentes"], ["historico", "📁 Histórico"]]} active={tab} onChange={(k) => setTab(k as "pendentes" | "historico")} t={t} />

      {tab === "pendentes" && (
        <div className="space-y-3">
          {allPending.length === 0 && (
            <div className="text-center py-10 text-gray-400">
              <p className="text-3xl mb-2">✅</p>
              <p className="text-sm">Nenhuma evolução pendente!</p>
            </div>
          )}
          {allPending.map((pend, i) => {
            const st = gS(pend.studentId);
            if (!st) return null;
            return (
              <Card key={i} t={t}>
                <div className="flex items-center gap-3 mb-3">
                  <Av name={st.name} t={t} />
                  <div className="flex-1">
                    <p className="font-semibold text-sm" style={{ color: t.p[800] }}>
                      {st.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {pend.schedule?.time} · {fmt(pend.day)}
                    </p>
                  </div>
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Pendente</span>
                </div>
                <button
                  onClick={() => onOpenEvoModal(pend)}
                  className="w-full rounded-xl text-white font-semibold text-sm py-2 px-4 transition-all"
                  style={{ background: t.p[500], fontSize: 12, paddingTop: 6, paddingBottom: 6 }}
                >
                  Registrar Evolução
                </button>
              </Card>
            );
          })}
        </div>
      )}

      {tab === "historico" && (
        <div className="space-y-3">
          {evolutions.length === 0 && <p className="text-sm text-gray-400 text-center py-8">Nenhuma evolução.</p>}
          {evolutions.map((ev) => {
            const st = gS(ev.studentId);
            if (!st) return null;
            return (
              <Card key={ev.id} t={t}>
                <div className="flex items-center gap-3 mb-2">
                  <Av name={st.name} t={t} />
                  <div className="flex-1">
                    <p className="font-semibold text-sm" style={{ color: t.p[800] }}>
                      {st.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {fmt(ev.day)} · {ev.instructor}
                    </p>
                  </div>
                  <button onClick={() => onViewFicha(ev.studentId)} className="text-xs transition-all" style={{ color: t.p[500] }}>
                    Ver ficha
                  </button>
                </div>
                {ev.exercises.map((ex, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs p-2 rounded-lg mb-1" style={{ background: t.p[50] }}>
                    <span className="font-medium" style={{ color: t.p[700] }}>
                      {ex.name}
                    </span>
                    {(ex.series || ex.reps || ex.equipment) && (
                      <span className="text-gray-400">
                        {[ex.series && ex.reps ? `${ex.series}x${ex.reps}` : null, ex.equipment].filter(Boolean).join(" - ")}
                      </span>
                    )}
                  </div>
                ))}
                {ev.clinicalNotes && (
                  <p className="text-xs text-gray-500 italic mt-1">"{ev.clinicalNotes}"</p>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
