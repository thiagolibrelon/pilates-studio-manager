import { useState } from "react";
import type { Theme, Session, Schedule, Student, PresenceEntry, PresenceStatus } from "../types";
import { Card, Btn, Av, SBadge } from "./ui";
import { fmt } from "../utils";

interface AulaProps {
  t: Theme;
  sessionId: string;
  sessions: Session[];
  schedules: Schedule[];
  students: Student[];
  presence: { studentId: string; day: string; scheduleId: string }[];
  onUpdateSession: (session: Session) => void;
  onUpdateStudent: (student: Student) => void;
  onNavigate: (route: string, id?: string | null) => void;
}

const isFaltaStatus = (s: PresenceStatus): boolean =>
  s === "falta" || s === "falta_justificada" || s === "falta_nao_justificada";

export function Aula({ t, sessionId, sessions, schedules, students, onUpdateSession, onUpdateStudent, onNavigate }: AulaProps) {
  const [showWh, setShowWh] = useState(false);
  const [showRep, setShowRep] = useState(false);

  const ses = sessions.find((s) => s.id === sessionId);
  if (!ses) return <div className="text-center py-12 text-gray-400">Sessão não encontrada.</div>;

  const sc = schedules.find((s) => s.id === ses.scheduleId);
  if (!sc) return <div className="text-center py-12 text-gray-400">Turma não encontrada.</div>;

  const gS = (id: string) => students.find((s) => s.id === id);

  const entries = Object.entries(ses.presences);
  const evolved = ses.evolved || [];
  const total = entries.length;

  const handlePresence = (studentId: string, status: "presente" | "falta_justificada" | "falta_nao_justificada") => {
    const currentStatus = ses.presences[studentId]?.status ?? null;
    if (currentStatus === status) return;

    const student = gS(studentId);
    if (student) {
      const wasFalta = isFaltaStatus(currentStatus);
      const willBeFalta = isFaltaStatus(status);
      if (willBeFalta && !wasFalta) {
        onUpdateStudent({ ...student, repCredits: student.repCredits + 1 });
      } else if (!willBeFalta && wasFalta) {
        onUpdateStudent({ ...student, repCredits: Math.max(0, student.repCredits - 1) });
      }
    }

    const updatedSession = { ...ses, presences: { ...ses.presences } };
    updatedSession.presences[studentId] = { ...ses.presences[studentId], status };

    if (status === "presente") {
      if (!(ses.pendingEvos || []).includes(studentId) && !(ses.evolved || []).includes(studentId)) {
        updatedSession.pendingEvos = [...(updatedSession.pendingEvos || []), studentId];
      }
    } else {
      updatedSession.pendingEvos = (updatedSession.pendingEvos || []).filter((id) => id !== studentId);
    }

    onUpdateSession(updatedSession);
  };

  const removeFromSession = (studentId: string) => {
    const pres = ses.presences[studentId];
    if (pres?.type === "reposicao") {
      const student = gS(studentId);
      if (student) {
        onUpdateStudent({ ...student, repCredits: student.repCredits + 1 });
      }
    }
    const updatedPresences = { ...ses.presences };
    delete updatedPresences[studentId];
    onUpdateSession({
      ...ses,
      presences: updatedPresences,
      pendingEvos: (ses.pendingEvos || []).filter((id) => id !== studentId),
      evolved: (ses.evolved || []).filter((id) => id !== studentId),
    });
  };

  const insertStudent = (studentId: string, type: "wellhub" | "reposicao") => {
    if (type === "reposicao") {
      const student = gS(studentId);
      if (student) {
        onUpdateStudent({ ...student, repCredits: student.repCredits - 1 });
      }
    }
    const updatedSession = {
      ...ses,
      presences: {
        ...ses.presences,
        [studentId]: { status: null, type } as PresenceEntry,
      },
    };
    onUpdateSession(updatedSession);
    if (type === "reposicao") setShowRep(false);
    else setShowWh(false);
  };

  const PRESENCE_BTNS = [
    { status: "presente" as const, label: "✓", title: "Presente", bg: "#22c55e" },
    { status: "falta_justificada" as const, label: "J", title: "Falta Justificada", bg: "#f59e0b" },
    { status: "falta_nao_justificada" as const, label: "✕", title: "Falta Não Justificada", bg: "#ef4444" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => onNavigate("dashboard")} className="text-sm transition-all" style={{ color: t.p[600] }}>
          ← Voltar
        </button>
        <div>
          <h1 className="text-xl font-bold" style={{ color: t.p[800] }}>
            {sc.time} — {sc.type}
          </h1>
          <p className="text-xs text-gray-400">
            {fmt(ses.day)} · {sc.instructor}
          </p>
        </div>
      </div>

      <Card t={t}>
        <div className="flex justify-between text-xs mb-2">
          <span style={{ color: t.p[600] }}>Vagas</span>
          <span className="font-bold" style={{ color: t.p[700] }}>
            {total}/{sc.maxCapacity}
          </span>
        </div>
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${(total / sc.maxCapacity) * 100}%`,
              background: total >= sc.maxCapacity ? t.p[600] : t.p[400],
            }}
          />
        </div>
        <div className="flex gap-2 mt-3">
          <Btn outline t={t} className="flex-1" style={{ fontSize: 12 }} onClick={() => setShowWh(true)}>
            + Wellhub
          </Btn>
          <Btn outline t={t} className="flex-1" style={{ fontSize: 12 }} onClick={() => setShowRep(true)}>
            + Reposição
          </Btn>
        </div>
      </Card>

      <div className="space-y-2">
        {entries.map(([sid, pres]) => {
          const s = gS(sid);
          if (!s) return null;
          const evoOk = evolved.includes(sid);
          const isPending = (ses.pendingEvos || []).includes(sid);
          const isManual = pres.type === "reposicao" || pres.type === "wellhub";

          return (
            <Card key={sid} t={t}>
              <div className="flex items-center gap-3">
                <Av name={s.name} t={t} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm" style={{ color: t.p[800] }}>
                      {s.name}
                    </p>
                    <SBadge s={pres.type} t={t} />
                    {s.hasRestriction && (
                      <span className="text-xs bg-orange-100 text-orange-600 px-1 rounded-full">⚠</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap text-xs">
                    {pres.status === "presente" && <span className="text-emerald-600 font-medium">✅ Presente</span>}
                    {pres.status === "falta_justificada" && <span className="text-amber-600 font-medium">⚠️ Falta Justificada</span>}
                    {(pres.status === "falta_nao_justificada" || pres.status === "falta") && <span className="text-red-400 font-medium">❌ Falta</span>}
                    {!pres.status && <span className="text-gray-400">Aguardando...</span>}
                    {isPending && !evoOk && <span className="text-amber-500">📋 Pendente</span>}
                    {evoOk && <span className="text-emerald-500">📋 OK</span>}
                  </div>
                </div>
                <div className="flex gap-1.5 items-center">
                  {PRESENCE_BTNS.map(({ status, label, title, bg }) => {
                    const isActive =
                      pres.status === status ||
                      (status === "falta_nao_justificada" && pres.status === "falta");
                    return (
                      <button
                        key={status}
                        onClick={() => handlePresence(sid, status)}
                        title={title}
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white shadow transition-all hover:opacity-90 text-sm font-bold"
                        style={{
                          background: bg,
                          opacity: pres.status !== null && !isActive ? 0.3 : 1,
                          outline: isActive ? `2px solid ${bg}` : "none",
                          outlineOffset: "2px",
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                  {isManual && (
                    <button
                      onClick={() => removeFromSession(sid)}
                      title="Remover da aula"
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white shadow transition-all hover:opacity-80 text-xs"
                      style={{ background: "#9ca3af" }}
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
              <button onClick={() => onNavigate("ficha", sid)} className="mt-1 text-xs transition-all" style={{ color: t.p[400] }}>
                Ver ficha →
              </button>
            </Card>
          );
        })}
      </div>

      {/* Wellhub Modal */}
      {showWh && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.3)" }}>
          <div className="bg-white rounded-t-2xl w-full max-w-lg p-5">
            <h3 className="font-bold mb-3" style={{ color: t.p[800] }}>
              Inserir Wellhub
            </h3>
            <div className="space-y-2">
              {students
                .filter((s) => s.status === "Wellhub" && !ses.presences[s.id])
                .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
                .map((s) => (
                  <button
                    key={s.id}
                    onClick={() => insertStudent(s.id, "wellhub")}
                    className="w-full flex items-center justify-between p-3 rounded-xl transition-all hover:opacity-80"
                    style={{ background: t.p[50] }}
                  >
                    <div className="flex items-center gap-3">
                      <Av name={s.name} t={t} />
                      <span className="text-sm font-medium">{s.name}</span>
                    </div>
                  </button>
                ))}
              {students.filter((s) => s.status === "Wellhub" && !ses.presences[s.id]).length === 0 && (
                <p className="text-sm text-gray-400 text-center py-2">Nenhum disponível.</p>
              )}
            </div>
            <Btn outline t={t} className="mt-3 w-full" onClick={() => setShowWh(false)}>
              Fechar
            </Btn>
          </div>
        </div>
      )}

      {/* Reposição Modal */}
      {showRep && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.3)" }}>
          <div className="bg-white rounded-t-2xl w-full max-w-lg p-5">
            <h3 className="font-bold mb-3" style={{ color: t.p[800] }}>
              Inserir Reposição
            </h3>
            <div className="space-y-2">
              {students
                .filter((s) => s.repCredits > 0 && !ses.presences[s.id])
                .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
                .map((s) => (
                  <button
                    key={s.id}
                    onClick={() => insertStudent(s.id, "reposicao")}
                    className="w-full flex items-center justify-between p-3 rounded-xl transition-all hover:opacity-80"
                    style={{ background: t.p[50] }}
                  >
                    <div className="flex items-center gap-3">
                      <Av name={s.name} t={t} />
                      <span className="text-sm font-medium">{s.name}</span>
                    </div>
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                      {s.repCredits} crédito{s.repCredits > 1 ? "s" : ""}
                    </span>
                  </button>
                ))}
              {students.filter((s) => s.repCredits > 0 && !ses.presences[s.id]).length === 0 && (
                <p className="text-sm text-gray-400 text-center py-2">Nenhum disponível.</p>
              )}
            </div>
            <Btn outline t={t} className="mt-3 w-full" onClick={() => setShowRep(false)}>
              Fechar
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}
