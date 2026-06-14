import { useState } from "react";
import type { Theme, StudioConfig, ThemeKey } from "../types";
import { THEMES } from "../data";
import { Card, Btn, Inp } from "./ui";

interface ConfiguracoesProps {
  t: Theme;
  themeKey: ThemeKey;
  config: StudioConfig;
  onUpdateConfig: (config: StudioConfig) => void;
  onChangeTheme: (key: ThemeKey) => void;
  onNavigate: (route: string) => void;
  onClearData: () => void;
  onLogout: () => void;
  onToast: (msg: string, type?: "success" | "error" | "warning") => void;
}

export function Configuracoes({
  t,
  themeKey,
  config,
  onUpdateConfig,
  onChangeTheme,
  onNavigate,
  onClearData,
  onLogout,
  onToast,
}: ConfiguracoesProps) {
  const [form, setForm] = useState<StudioConfig>({ ...config });
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showClear, setShowClear] = useState(false);

  const saveStudio = () => {
    if (!form.studioName.trim() || !form.professionalName.trim()) {
      onToast("Nome do estúdio e profissional são obrigatórios.", "warning");
      return;
    }
    onUpdateConfig({ ...form, password: config.password });
    onToast("Configurações salvas com sucesso!");
  };

  const savePassword = () => {
    if (!newPass || newPass.length < 4) {
      onToast("A senha deve ter ao menos 4 caracteres.", "warning");
      return;
    }
    if (newPass !== confirmPass) {
      onToast("As senhas não conferem.", "error");
      return;
    }
    onUpdateConfig({ ...form, password: newPass });
    setNewPass("");
    setConfirmPass("");
    onToast("Senha alterada com sucesso!");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => onNavigate("dashboard")} className="text-sm transition-all" style={{ color: t.p[600] }}>
          ← Voltar
        </button>
        <h1 className="text-xl font-bold" style={{ color: t.p[800] }}>
          Configurações
        </h1>
      </div>

      {/* Dados do Estúdio */}
      <Card t={t}>
        <h2 className="font-semibold text-sm mb-4" style={{ color: t.p[800] }}>
          🏢 Dados do Estúdio
        </h2>
        <div className="space-y-3">
          <Inp
            label="Nome do Estúdio"
            required
            value={form.studioName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, studioName: e.target.value })}
            placeholder="Ex: Studio Pilates Bem Estar"
          />
          <Inp
            label="Nome do Profissional"
            required
            value={form.professionalName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, professionalName: e.target.value })}
            placeholder="Ex: Maria Silva"
          />
          <Inp
            label="CREFITO (opcional)"
            value={form.crefito}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, crefito: e.target.value })}
            placeholder="Ex: 4/123456-F"
          />
          <Inp
            label="Usuário de acesso"
            value={form.username}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, username: e.target.value })}
          />
          <Btn t={t} className="w-full" onClick={saveStudio}>
            Salvar Dados
          </Btn>
        </div>
      </Card>

      {/* Alterar Senha */}
      <Card t={t}>
        <h2 className="font-semibold text-sm mb-4" style={{ color: t.p[800] }}>
          🔒 Alterar Senha
        </h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1 font-medium">Nova Senha</label>
            <input
              type="password"
              className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 transition-all"
              style={{ borderColor: "#e5e7eb" }}
              placeholder="Mínimo 4 caracteres"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1 font-medium">Confirmar Nova Senha</label>
            <input
              type="password"
              className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 transition-all"
              style={{ borderColor: "#e5e7eb" }}
              placeholder="Repita a nova senha"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
            />
          </div>
          <Btn t={t} className="w-full" onClick={savePassword}>
            Alterar Senha
          </Btn>
        </div>
      </Card>

      {/* Tema Visual */}
      <Card t={t}>
        <h2 className="font-semibold text-sm mb-4" style={{ color: t.p[800] }}>
          🎨 Tema Visual
        </h2>
        <div className="space-y-3">
          {(Object.entries(THEMES) as [ThemeKey, typeof THEMES.sage][]).map(([key, th]) => {
            const active = themeKey === key;
            return (
              <button
                key={key}
                onClick={() => onChangeTheme(key)}
                className="w-full rounded-2xl p-4 border-2 text-left transition-all hover:shadow-md"
                style={{ borderColor: active ? th.p[500] : th.border, background: active ? th.p[50] : "white" }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex gap-1 shrink-0">
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
      </Card>

      {/* Sessão */}
      <Card t={t}>
        <h2 className="font-semibold text-sm mb-4" style={{ color: t.p[800] }}>
          👤 Sessão
        </h2>
        <Btn outline t={t} className="w-full" onClick={onLogout}>
          Sair do sistema
        </Btn>
      </Card>

      {/* Zona de Perigo */}
      <div className="rounded-2xl p-4 border-2 border-red-200 bg-red-50">
        <h2 className="font-semibold text-sm text-red-700 mb-1">⚠️ Zona de Perigo</h2>
        <p className="text-xs text-red-500 mb-3">
          Apaga todos os alunos, turmas, pagamentos, evoluções e presenças. As configurações do estúdio são mantidas.
          Esta ação não pode ser desfeita.
        </p>
        {!showClear ? (
          <button
            onClick={() => setShowClear(true)}
            className="w-full rounded-xl border-2 border-red-300 text-red-600 font-medium text-sm py-2.5 transition-all hover:bg-red-100"
          >
            Limpar todos os dados
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-bold text-red-700 text-center">Tem certeza? Esta ação é irreversível.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowClear(false)}
                className="flex-1 rounded-xl border border-gray-300 text-gray-600 font-medium text-sm py-2 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => { onClearData(); setShowClear(false); }}
                className="flex-1 rounded-xl bg-red-600 text-white font-semibold text-sm py-2 transition-all hover:bg-red-700"
              >
                Confirmar exclusão
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
