import type { Theme, Payment, Student, Plan, Schedule, PendingEvolution } from "../types";
import { Btn, SigCanvas, TA } from "./ui";
import { fmt, fmtM, MONTHS, vencStr } from "../utils";
import { useState } from "react";

// ── Evolution Form Modal ────────────────────────────────────────────────────────────────

interface EvoFormProps {
  pending: PendingEvolution;
  student: Student | undefined;
  schedule: Schedule | undefined;
  classTypes: string[];
  onSave: (data: any) => void;
  onClose: () => void;
  t: Theme;
}

export function EvoForm({ pending, student, schedule, classTypes, onSave, onClose, t }: EvoFormProps) {
  const [exs, setExs] = useState([{ name: "", series: 3, reps: 10, equipment: classTypes[0] || "Reformer" }]);
  const [notes, setNotes] = useState("");
  const [sig, setSig] = useState<string | null>(null);

  const updEx = (i: number, k: string, v: any) => setExs((p) => p.map((e, j) => (j === i ? { ...e, [k]: v } : e)));

  const save = () => {
    if (!sig) {
      alert("Assine antes de salvar.");
      return;
    }
    if (exs.some((e) => !e.name)) {
      alert("Preencha todos os exercícios.");
      return;
    }
    onSave({
      sessionId: pending.sessionId,
      studentId: pending.studentId,
      exercises: exs,
      clinicalNotes: notes,
      signature: sig,
      instructor: "Maria Costa",
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="p-5 border-b" style={{ borderColor: t.p[100] }}>
          <h2 className="font-bold text-lg" style={{ color: t.p[800] }}>
            Registrar Evolução
          </h2>
          <p className="text-sm text-gray-400">
            {student?.name} · {schedule?.time}
          </p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold" style={{ color: t.p[700] }}>
                Exercícios
              </span>
              <button
                onClick={() => setExs((p) => [...p, { name: "", series: 3, reps: 10, equipment: classTypes[0] || "Reformer" }])}
                className="text-xs px-2 py-1 rounded-lg text-white transition-all"
                style={{ background: t.p[500] }}
              >
                + Add
              </button>
            </div>
            {exs.map((ex, i) => (
              <div key={i} className="rounded-xl p-3 mb-2 space-y-2" style={{ background: t.p[50] }}>
                <div className="flex gap-2">
                  <input
                    value={ex.name}
                    onChange={(e) => updEx(i, "name", e.target.value)}
                    placeholder="Nome do exercício"
                    className="flex-1 text-sm border rounded-lg px-2 py-1"
                    style={{ borderColor: t.p[200] }}
                  />
                  {exs.length > 1 && (
                    <button onClick={() => setExs((p) => p.filter((_, j) => j !== i))} className="text-red-400 text-xs">
                      ✕
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  {[["Séries", "series"], ["Reps", "reps"]].map(([l, k]) => (
                    <div key={k} className="flex-1">
                      <label className="text-xs text-gray-400">{l}</label>
                      <input
                        type="number"
                        min={1}
                        value={ex[k as keyof typeof ex]}
                        onChange={(e) => updEx(i, k, +e.target.value)}
                        className="w-full text-sm border rounded-lg px-2 py-1"
                        style={{ borderColor: t.p[200] }}
                      />
                    </div>
                  ))}
                  <div className="flex-1">
                    <label className="text-xs text-gray-400">Equip.</label>
                    <select
                      value={ex.equipment}
                      onChange={(e) => updEx(i, "equipment", e.target.value)}
                      className="w-full text-sm border rounded-lg px-2 py-1 bg-white"
                      style={{ borderColor: t.p[200] }}
                    >
                      {classTypes.map((ct) => (
                        <option key={ct}>{ct}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <TA label="Observações Clínicas" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Evolução, queixas, adaptações..." />
          <SigCanvas
            onSave={(s) => {
              setSig(s);
              alert("Assinatura capturada!");
            }}
            t={t}
          />
          {sig && (
            <p className="text-xs font-medium" style={{ color: t.p[500] }}>
              ✅ Assinatura registrada
            </p>
          )}
        </div>
        <div className="p-5 border-t flex gap-3" style={{ borderColor: t.p[100] }}>
          <Btn outline t={t} className="flex-1" onClick={onClose}>
            Cancelar
          </Btn>
          <Btn t={t} className="flex-1" onClick={save}>
            Salvar Evolução
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ── Recibo Modal ──────────────────────────────────────────────────────────────────────────

interface ReciboModalProps {
  payment: Payment;
  student: Student;
  plan: Plan | undefined;
  t: Theme;
  onClose: () => void;
}

export function ReciboModal({ payment, student, plan, t, onClose }: ReciboModalProps) {
  const month = payment.month ? `${MONTHS[+payment.month.split("-")[1] - 1]}/${payment.month.split("-")[0]}` : "";

  const texto = [
    "✅ *Recibo de Pagamento*",
    "🏋️ Pilates Studio Manager",
    "",
    `👤 Aluno: ${student.name}`,
    `📋 Plano: ${plan?.name || "—"}`,
    `📅 Referência: ${month}`,
    `💰 Valor: ${fmtM(payment.amount)}`,
    `💳 Forma: ${payment.method || "—"}`,
    `📆 Pago em: ${payment.paidAt ? fmt(payment.paidAt) : "—"}`,
    `📌 Vencimento: ${vencStr(student.firstPaymentDate)}`,
    "",
    "Obrigado pela confiança! 🌿",
  ].join("\n");

  const numero = (student.whatsapp || "").replace(/\D/g, "");
  const waLink = `https://wa.me/55${numero}?text=${encodeURIComponent(texto)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="p-5 border-b" style={{ borderColor: t.p[100] }}>
          <h2 className="font-bold text-lg" style={{ color: t.p[800] }}>
            🧾 Recibo
          </h2>
          <p className="text-xs text-gray-400">
            {student.name} · {month}
          </p>
        </div>
        <div className="p-5">
          <pre className="rounded-2xl p-4 text-xs whitespace-pre-wrap leading-relaxed font-sans" style={{ background: "#e9fbe9", color: "#1a1a1a" }}>
            {texto}
          </pre>
        </div>
        <div className="p-5 border-t space-y-2" style={{ borderColor: t.p[100] }}>
          <a
            href={waLink}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-white font-semibold text-sm transition-all"
            style={{ background: "#25D366" }}
          >
            📱 Enviar via WhatsApp
          </a>
          <Btn outline t={t} className="w-full" onClick={onClose}>
            Fechar
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ── Theme Modal ────────────────────────────────────────────────────────────────────────────

interface ThemeModalProps {
  current: string;
  onChange: (key: string) => void;
  onClose: () => void;
  t: Theme;
  themes: Record<string, Theme>;
}

export function ThemeModal({ current, onChange, onClose, t, themes }: ThemeModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="p-5 border-b" style={{ borderColor: t.p[100] }}>
          <h2 className="font-bold text-lg" style={{ color: t.p[800] }}>
            🎨 Tema Visual
          </h2>
        </div>
        <div className="p-5 space-y-3">
          {Object.entries(themes).map(([key, th]) => {
            const active = current === key;
            return (
              <button
                key={key}
                onClick={() => {
                  onChange(key);
                  onClose();
                }}
                className="w-full rounded-2xl p-4 border-2 text-left transition-all hover:shadow-md"
                style={{ borderColor: active ? th.p[500] : th.border, background: active ? th.p[50] : "white" }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    {[th.p[800], th.p[500], th.p[200]].map((c, i) => (
                      <div key={i} className="w-5 h-10 rounded-lg" style={{ background: c }} />
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span>{th.emoji}</span>
                      <span className="font-bold text-sm" style={{ color: th.p[800] }}>
                        {th.name}
                      </span>
                      {active && (
                        <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ background: th.p[500] }}>
                          Ativo
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1.5 mt-2">
                      {[th.bg, th.border, th.p[300], th.p[500], th.p[800]].map((c, i) => (
                        <div key={i} className="w-5 h-5 rounded-full border border-gray-200" style={{ background: c }} />
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <div className="p-5 border-t" style={{ borderColor: t.p[100] }}>
          <Btn outline t={t} className="w-full" onClick={onClose}>
            Fechar
          </Btn>
        </div>
      </div>
    </div>
  );
}
