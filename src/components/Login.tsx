import { useState } from "react";
import type { StudioConfig, Theme } from "../types";
import { THEMES } from "../data";

interface LoginProps {
  config: StudioConfig | null;
  onLogin: (username: string, password: string) => boolean;
  onSetup: (config: StudioConfig) => void;
}

export function Login({ config, onLogin, onSetup }: LoginProps) {
  const t = THEMES.sage;
  if (!config || !config.password) return <SetupScreen onSetup={onSetup} t={t} />;
  return <LoginScreen config={config} onLogin={onLogin} t={t} />;
}

// ── Setup (primeiro acesso) ───────────────────────────────────────────────────────────────

function SetupScreen({ onSetup, t }: { onSetup: (c: StudioConfig) => void; t: Theme }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<StudioConfig>({
    studioName: "",
    professionalName: "",
    crefito: "",
    username: "admin",
    password: "",
  });
  const [confirmPass, setConfirmPass] = useState("");
  const [error, setError] = useState("");

  const nextStep = () => {
    if (!form.studioName.trim() || !form.professionalName.trim()) {
      setError("Nome do estúdio e nome do profissional são obrigatórios.");
      return;
    }
    setError("");
    setStep(2);
  };

  const submit = () => {
    if (!form.password || form.password.length < 4) {
      setError("A senha deve ter ao menos 4 caracteres.");
      return;
    }
    if (form.password !== confirmPass) {
      setError("As senhas não conferem.");
      return;
    }
    setError("");
    onSetup(form);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12" style={{ background: t.bg }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg mb-4"
            style={{ background: t.p[500] }}
          >
            P
          </div>
          <h1 className="text-2xl font-bold" style={{ color: t.p[800] }}>
            Pilates Studio
          </h1>
          <p className="text-sm text-gray-400 mt-1">Configuração inicial do sistema</p>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{
                  background: step >= s ? t.p[500] : "#e5e7eb",
                  color: step >= s ? "white" : "#9ca3af",
                }}
              >
                {s}
              </div>
              <span className="text-xs font-medium" style={{ color: step >= s ? t.p[600] : "#9ca3af" }}>
                {s === 1 ? "Dados do estúdio" : "Acesso"}
              </span>
              {s < 2 && <div className="flex-1 h-0.5 rounded" style={{ background: step > s ? t.p[300] : "#e5e7eb" }} />}
            </div>
          ))}
        </div>

        <div
          className="rounded-2xl p-6 border shadow-sm space-y-4"
          style={{ background: t.card, borderColor: t.border }}
        >
          {step === 1 && (
            <>
              <div>
                <label className="text-xs text-gray-500 block mb-1 font-medium">
                  Nome do Estúdio <span className="text-red-400">*</span>
                </label>
                <input
                  className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 transition-all"
                  style={{ borderColor: "#e5e7eb" }}
                  placeholder="Ex: Studio Pilates Bem Estar"
                  value={form.studioName}
                  onChange={(e) => setForm({ ...form, studioName: e.target.value })}
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1 font-medium">
                  Nome do Profissional <span className="text-red-400">*</span>
                </label>
                <input
                  className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 transition-all"
                  style={{ borderColor: "#e5e7eb" }}
                  placeholder="Ex: Maria Silva"
                  value={form.professionalName}
                  onChange={(e) => setForm({ ...form, professionalName: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1 font-medium">CREFITO (opcional)</label>
                <input
                  className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 transition-all"
                  style={{ borderColor: "#e5e7eb" }}
                  placeholder="Ex: 4/123456-F"
                  value={form.crefito}
                  onChange={(e) => setForm({ ...form, crefito: e.target.value })}
                />
              </div>
              {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
              <button
                onClick={nextStep}
                className="w-full rounded-xl text-white font-semibold text-sm py-3 transition-all hover:opacity-90"
                style={{ background: t.p[500] }}
              >
                Próximo →
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="text-xs text-gray-500 block mb-1 font-medium">Usuário de acesso</label>
                <input
                  className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 transition-all"
                  style={{ borderColor: "#e5e7eb" }}
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1 font-medium">
                  Senha <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 transition-all"
                  style={{ borderColor: "#e5e7eb" }}
                  placeholder="Mínimo 4 caracteres"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1 font-medium">
                  Confirmar senha <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 transition-all"
                  style={{ borderColor: "#e5e7eb" }}
                  placeholder="Repita a senha"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                />
              </div>
              {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
              <div className="flex gap-3">
                <button
                  onClick={() => { setStep(1); setError(""); }}
                  className="flex-1 rounded-xl border text-sm py-3 font-medium transition-all hover:opacity-80"
                  style={{ borderColor: t.p[200], color: t.p[600] }}
                >
                  ← Voltar
                </button>
                <button
                  onClick={submit}
                  className="flex-1 rounded-xl text-white font-semibold text-sm py-3 transition-all hover:opacity-90"
                  style={{ background: t.p[500] }}
                >
                  Concluir
                </button>
              </div>
            </>
          )}
        </div>

        <p className="text-xs text-center text-gray-400 mt-6">
          Estas informações poderão ser alteradas nas configurações
        </p>
      </div>
    </div>
  );
}

// ── Login (acessos seguintes) ─────────────────────────────────────────────────────────────

function LoginScreen({
  config,
  onLogin,
  t,
}: {
  config: StudioConfig;
  onLogin: (u: string, p: string) => boolean;
  t: Theme;
}) {
  const [username, setUsername] = useState(config.username);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = () => {
    if (!password) { setError("Informe a senha."); return; }
    setLoading(true);
    setTimeout(() => {
      const ok = onLogin(username, password);
      if (!ok) {
        setError("Usuário ou senha incorretos.");
        setPassword("");
      }
      setLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12" style={{ background: t.bg }}>
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg mb-4"
            style={{ background: t.p[500] }}
          >
            P
          </div>
          <h1 className="text-xl font-bold text-center" style={{ color: t.p[800] }}>
            {config.studioName || "Pilates Studio"}
          </h1>
          {config.professionalName && (
            <p className="text-sm text-gray-400 mt-0.5">{config.professionalName}</p>
          )}
        </div>

        <div
          className="rounded-2xl p-6 border shadow-sm space-y-4"
          style={{ background: t.card, borderColor: t.border }}
        >
          <div>
            <label className="text-xs text-gray-500 block mb-1 font-medium">Usuário</label>
            <input
              className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 transition-all"
              style={{ borderColor: "#e5e7eb" }}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1 font-medium">Senha</label>
            <input
              type="password"
              className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 transition-all"
              style={{ borderColor: error ? "#fca5a5" : "#e5e7eb" }}
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              autoFocus
            />
            {error && <p className="text-xs text-red-500 mt-1 font-medium">{error}</p>}
          </div>
          <button
            onClick={submit}
            disabled={loading}
            className="w-full rounded-xl text-white font-semibold text-sm py-3 disabled:opacity-60 transition-all hover:opacity-90"
            style={{ background: t.p[500] }}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </div>

        <p className="text-xs text-center text-gray-400 mt-6">
          Sistema de Gestão — Pilates Studio Manager
        </p>
      </div>
    </div>
  );
}
