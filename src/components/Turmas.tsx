import { useState } from "react";
import type { Theme, Schedule, Enrollment } from "../types";
import { Card, Btn, Inp, Sl, EmptyState } from "./ui";
import { WD, uid } from "../utils";

interface TurmasProps {
  t: Theme;
  schedules: Schedule[];
  enrollments: Enrollment[];
  classTypes: string[];
  onUpdateSchedules: (schedules: Schedule[]) => void;
  onUpdateEnrollments: (enrollments: Enrollment[]) => void;
  onUpdateClassTypes: (types: string[]) => void;
  onToast: (msg: string, type?: "success" | "error" | "warning") => void;
}

export function Turmas({
  t, schedules, enrollments, classTypes,
  onUpdateSchedules, onUpdateEnrollments, onUpdateClassTypes, onToast,
}: TurmasProps) {
  const [turmaForm, setTurmaForm] = useState<{
    editing: string | null;
    form: { time: string; days: string[]; instructor: string; type: string; maxCapacity: number };
  } | null>(null);

  const [showTypes, setShowTypes] = useState(false);
  const [newType, setNewType] = useState("");

  const saveTurma = () => {
    if (!turmaForm) return;
    const f = turmaForm.form;
    if (!f.time || f.days.length === 0 || !f.instructor) {
      onToast("Preencha horário, dias e instrutor.", "warning");
      return;
    }
    if (turmaForm.editing) {
      onUpdateSchedules(schedules.map((sc) => (sc.id === turmaForm.editing ? { ...sc, ...f } : sc)));
      onToast("Turma atualizada com sucesso!");
    } else {
      onUpdateSchedules([...schedules, { id: "sc" + uid(), ...f }]);
      onToast("Nova turma cadastrada!");
    }
    setTurmaForm(null);
  };

  const removeSchedule = (id: string) => {
    const enrolled = enrollments.filter((e) => e.scheduleId === id).length;
    if (enrolled > 0) {
      onToast(`Esta turma tem ${enrolled} aluno(s) vinculado(s). Desvincule-os antes de remover.`, "warning");
      return;
    }
    onUpdateSchedules(schedules.filter((s) => s.id !== id));
    onUpdateEnrollments(enrollments.filter((e) => e.scheduleId !== id));
    onToast("Turma removida.", "warning");
  };

  const addClassType = () => {
    if (newType.trim() && !classTypes.includes(newType.trim())) {
      onUpdateClassTypes([...classTypes, newType.trim()]);
      setNewType("");
      onToast("Tipo de aula adicionado!");
    }
  };

  const removeClassType = (ct: string) => {
    onUpdateClassTypes(classTypes.filter((x) => x !== ct));
  };

  const getEnrolledCount = (scId: string) =>
    [...new Set(enrollments.filter((e) => e.scheduleId === scId).map((e) => e.studentId))].length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: t.p[800] }}>Turmas</h1>
        <div className="flex gap-2">
          <Btn outline t={t} onClick={() => setShowTypes(true)}>Tipos</Btn>
          <Btn
            t={t}
            onClick={() =>
              setTurmaForm({
                editing: null,
                form: { time: "07:00", days: [], instructor: "", type: classTypes[0] || "Reformer", maxCapacity: 4 },
              })
            }
          >
            + Nova
          </Btn>
        </div>
      </div>

      {schedules.length === 0 ? (
        <EmptyState
          icon="🗓"
          title="Nenhuma turma cadastrada"
          description="Cadastre horários, instrutor e tipo de aparelho para começar a organizar sua agenda."
          t={t}
        />
      ) : (
        schedules
          .sort((a, b) => a.time.localeCompare(b.time))
          .map((sc) => {
            const enrolledCount = getEnrolledCount(sc.id);
            const pct = Math.min((enrolledCount / sc.maxCapacity) * 100, 100);
            const barColor = pct >= 100 ? t.occ.fullT : pct >= 60 ? t.occ.halfT : t.p[500];

            return (
              <Card key={sc.id} t={t}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-lg font-bold" style={{ color: t.p[700] }}>{sc.time}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: t.p[100], color: t.p[600] }}>
                        {sc.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-0.5">👤 {sc.instructor}</p>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {WD.map((d) => (
                        <span
                          key={d}
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={
                            sc.days.includes(d)
                              ? { background: t.p[400], color: "white" }
                              : { background: "#f1f5f9", color: "#cbd5e1" }
                          }
                        >
                          {d}
                        </span>
                      ))}
                    </div>

                    {/* Ocupação */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">
                          {enrolledCount} aluno{enrolledCount !== 1 ? "s" : ""} matriculado{enrolledCount !== 1 ? "s" : ""}
                        </span>
                        <span className="font-medium" style={{ color: barColor }}>
                          {enrolledCount}/{sc.maxCapacity} vagas
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: barColor }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 shrink-0">
                    <Btn
                      outline
                      t={t}
                      onClick={() =>
                        setTurmaForm({
                          editing: sc.id,
                          form: { time: sc.time, days: [...sc.days], instructor: sc.instructor, type: sc.type, maxCapacity: sc.maxCapacity },
                        })
                      }
                    >
                      Editar
                    </Btn>
                    <button
                      onClick={() => removeSchedule(sc.id)}
                      className="text-xs px-3 py-1.5 rounded-xl border border-red-200 text-red-400 transition-all hover:bg-red-50"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              </Card>
            );
          })
      )}

      {/* Turma Form Modal */}
      {turmaForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b" style={{ borderColor: t.p[100] }}>
              <h2 className="font-bold text-lg" style={{ color: t.p[800] }}>
                {turmaForm.editing ? "Editar Turma" : "Nova Turma"}
              </h2>
            </div>
            <div className="p-5 space-y-4">
              <Inp
                label="Horário"
                value={turmaForm.form.time}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setTurmaForm((f) => f && { ...f, form: { ...f.form, time: e.target.value } })
                }
                placeholder="07:00"
              />
              <div>
                <label className="text-xs text-gray-500 block mb-2 font-medium">Dias da semana</label>
                <div className="flex gap-2 flex-wrap">
                  {WD.map((d) => {
                    const sel = turmaForm.form.days.includes(d);
                    return (
                      <button
                        key={d}
                        onClick={() =>
                          setTurmaForm((f) =>
                            f && {
                              ...f,
                              form: {
                                ...f.form,
                                days: sel ? f.form.days.filter((x) => x !== d) : [...f.form.days, d],
                              },
                            }
                          )
                        }
                        className="px-3 py-1.5 rounded-xl text-sm font-medium transition-all"
                        style={sel ? { background: t.p[500], color: "white" } : { background: t.p[50], color: t.p[600] }}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>
              <Inp
                label="Instrutor"
                required
                value={turmaForm.form.instructor}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setTurmaForm((f) => f && { ...f, form: { ...f.form, instructor: e.target.value } })
                }
                placeholder="Nome do instrutor"
              />
              <Sl
                label="Tipo de Aula"
                value={turmaForm.form.type}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setTurmaForm((f) => f && { ...f, form: { ...f.form, type: e.target.value } })
                }
              >
                {classTypes.map((ct) => (
                  <option key={ct}>{ct}</option>
                ))}
              </Sl>
              <Inp
                label="Capacidade máxima"
                type="number"
                min={1}
                max={20}
                value={turmaForm.form.maxCapacity}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setTurmaForm((f) => f && { ...f, form: { ...f.form, maxCapacity: +e.target.value } })
                }
              />
            </div>
            <div className="p-5 border-t flex gap-3" style={{ borderColor: t.p[100] }}>
              <Btn outline t={t} className="flex-1" onClick={() => setTurmaForm(null)}>Cancelar</Btn>
              <Btn t={t} className="flex-1" onClick={saveTurma}>Salvar</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Class Types Modal */}
      {showTypes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="p-5 border-b" style={{ borderColor: t.p[100] }}>
              <h2 className="font-bold text-lg" style={{ color: t.p[800] }}>Tipos de Aula</h2>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex gap-2">
                <input
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addClassType()}
                  placeholder="Novo tipo..."
                  className="flex-1 border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 transition-all"
                  style={{ borderColor: "#e5e7eb" }}
                />
                <Btn t={t} onClick={addClassType}>Adicionar</Btn>
              </div>
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {classTypes.map((ct) => (
                  <div key={ct} className="flex items-center justify-between p-3 rounded-xl" style={{ background: t.p[50] }}>
                    <span className="text-sm font-medium" style={{ color: t.p[700] }}>{ct}</span>
                    <button
                      onClick={() => removeClassType(ct)}
                      className="text-red-400 text-xs px-2 py-0.5 border border-red-200 rounded-lg transition-all hover:bg-red-50"
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-5 border-t" style={{ borderColor: t.p[100] }}>
              <Btn outline t={t} className="w-full" onClick={() => setShowTypes(false)}>Fechar</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
