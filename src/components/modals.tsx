import type { Theme, Payment, Student, Plan, Schedule, PendingEvolution, Evolution } from "../types";
import { Btn, SigCanvas, TA, Inp, DateInp } from "./ui";
import { fmt, fmtM, MONTHS, vencStr, TODAY } from "../utils";
import { useState } from "react";

// ── Evolution Form Modal ────────────────────────────────────────────────────────────────

interface EvoFormProps {
  pending: PendingEvolution;
  existingEvo?: Evolution;
  student: Student | undefined;
  schedule: Schedule | undefined;
  classTypes: string[];
  instructorName: string;
  onSave: (data: any) => void;
  onClose: () => void;
  onToast: (msg: string, type?: "success" | "error" | "warning") => void;
  t: Theme;
}

export function EvoForm({ pending, existingEvo, student, schedule, classTypes, instructorName, onSave, onClose, onToast, t }: EvoFormProps) {
  const [selectedExercises, setSelectedExercises] = useState<string[]>(
    existingEvo?.exercises.map((e) => e.name) || []
  );
  const [notes, setNotes] = useState(existingEvo?.clinicalNotes || "");
  const [sig, setSig] = useState<string | null>(null);
  const [evoDate, setEvoDate] = useState(existingEvo?.day || pending.day || TODAY);

  const isEditing = !!existingEvo;

  const toggleExercise = (name: string) => {
    setSelectedExercises((prev) => (prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]));
  };

  const save = () => {
    const finalSig = sig || existingEvo?.signature || null;
    if (!finalSig) {
      onToast("Assine antes de salvar.", "warning");
      return;
    }
    if (selectedExercises.length === 0) {
      onToast("Marque ao menos um exercício.", "warning");
      return;
    }
    onSave({
      sessionId: isEditing ? "" : pending.sessionId,
      studentId: pending.studentId,
      existingEvoId: existingEvo?.id || null,
      exercises: selectedExercises.map((name) => ({ name })),
      clinicalNotes: notes,
      signature: finalSig,
      instructor: instructorName,
      createdAt: existingEvo?.createdAt || new Date().toISOString(),
      day: evoDate,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="p-5 border-b" style={{ borderColor: t.p[100] }}>
          <h2 className="font-bold text-lg" style={{ color: t.p[800] }}>
            {isEditing ? "Editar Evolução" : "Registrar Evolução"}
          </h2>
          <p className="text-sm text-gray-400">
            {student?.name} · {schedule?.time || "—"}
          </p>
        </div>
        <div className="p-5 space-y-4">
          <DateInp
            label="Data da aula"
            value={evoDate}
            onChange={(v) => setEvoDate(v)}
          />
          <div>
            <div className="mb-2">
              <span className="text-sm font-semibold" style={{ color: t.p[700] }}>
                Exercicios
              </span>
              <p className="text-xs text-gray-400 mt-0.5">Marque os tipos trabalhados nesta aula.</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {classTypes.map((type) => {
                const checked = selectedExercises.includes(type);
                return (
                  <label
                    key={type}
                    className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm cursor-pointer transition-all"
                    style={{
                      borderColor: checked ? t.p[400] : t.p[100],
                      background: checked ? t.p[50] : "white",
                      color: checked ? t.p[700] : "#4b5563",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleExercise(type)}
                      className="w-4 h-4"
                      style={{ accentColor: t.p[500] }}
                    />
                    <span className="font-medium">{type}</span>
                  </label>
                );
              })}
            </div>
          </div>
          <TA label="Observações Clínicas" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Evolução, queixas, adaptações..." />
          <SigCanvas
            onSave={(s) => {
              setSig(s);
              onToast("Assinatura capturada!");
            }}
            t={t}
          />
          {sig && (
            <p className="text-xs font-medium" style={{ color: t.p[500] }}>
              ✅ Assinatura registrada
            </p>
          )}
          {!sig && isEditing && existingEvo?.signature && (
            <p className="text-xs text-gray-400">
              Assinatura original mantida. Assine novamente para substituir.
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
  studioName: string;
  t: Theme;
  onClose: () => void;
}

export function ReciboModal({ payment, student, plan, studioName, t, onClose }: ReciboModalProps) {
  const month = payment.month ? `${MONTHS[+payment.month.split("-")[1] - 1]}/${payment.month.split("-")[0]}` : "";

  const texto = [
    "✅ *Recibo de Pagamento*",
    studioName,
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

