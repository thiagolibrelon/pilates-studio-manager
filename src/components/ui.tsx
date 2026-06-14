import { useRef, useState, useEffect } from "react";
import type { Theme, ToastItem } from "../types";

// ── Badge ────────────────────────────────────────────────────────────────────────────────

export function SBadge({ s, t }: { s: string; t: Theme }) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${t.badge[s] || "bg-gray-100 text-gray-500"}`}>
      {s}
    </span>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────────────────

export function Av({ name, size = 9, t }: { name: string; size?: number; t: Theme }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const px = size * 4;
  return (
    <div
      style={{
        background: t.p[200],
        color: t.p[700],
        width: px,
        height: px,
        minWidth: px,
        minHeight: px,
        fontSize: size < 9 ? 12 : 14,
      }}
      className="rounded-full flex items-center justify-center font-semibold shrink-0"
    >
      {initials}
    </div>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────────────────────

export function Inp({ label, required, ...p }: { label?: string; required?: boolean; [key: string]: any }) {
  return (
    <div>
      {label && (
        <label className="text-xs text-gray-500 block mb-1 font-medium">
          {label}
          {required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
      )}
      <input
        {...p}
        className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-offset-1 transition-all"
        style={{ borderColor: "#e5e7eb", ...(p.style || {}) }}
      />
    </div>
  );
}

// ── Date Input (DD/MM/AAAA) ───────────────────────────────────────────────────────────────

const isoToDisplay = (iso: string): string => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return "";
  return `${d}/${m}/${y}`;
};

const displayToISO = (raw: string): string => {
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 8) return "";
  return `${digits.slice(4, 8)}-${digits.slice(2, 4)}-${digits.slice(0, 2)}`;
};

export function DateInp({
  label,
  value,
  onChange,
  required,
}: {
  label?: string;
  value: string;
  onChange: (iso: string) => void;
  required?: boolean;
}) {
  const [display, setDisplay] = useState(() => isoToDisplay(value));

  useEffect(() => {
    setDisplay(isoToDisplay(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 8);
    let formatted = digits;
    if (digits.length > 2) formatted = digits.slice(0, 2) + "/" + digits.slice(2);
    if (digits.length > 4) formatted = digits.slice(0, 2) + "/" + digits.slice(2, 4) + "/" + digits.slice(4);
    setDisplay(formatted);
    if (digits.length === 8) {
      const iso = displayToISO(formatted);
      if (iso) onChange(iso);
    } else if (digits.length === 0) {
      onChange("");
    }
  };

  return (
    <div>
      {label && (
        <label className="text-xs text-gray-500 block mb-1 font-medium">
          {label}
          {required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
      )}
      <input
        type="text"
        inputMode="numeric"
        placeholder="DD/MM/AAAA"
        value={display}
        onChange={handleChange}
        maxLength={10}
        className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-offset-1 transition-all"
        style={{ borderColor: "#e5e7eb" }}
      />
    </div>
  );
}

// ── Textarea ──────────────────────────────────────────────────────────────────────────────

export function TA({ label, rows = 2, ...p }: { label?: string; rows?: number; [key: string]: any }) {
  return (
    <div>
      {label && <label className="text-xs text-gray-500 block mb-1 font-medium">{label}</label>}
      <textarea
        rows={rows}
        {...p}
        className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-offset-1 transition-all"
        style={{ borderColor: "#e5e7eb" }}
      />
    </div>
  );
}

// ── Select ────────────────────────────────────────────────────────────────────────────────

export function Sl({ label, children, ...p }: { label?: string; children: React.ReactNode; [key: string]: any }) {
  return (
    <div>
      {label && <label className="text-xs text-gray-500 block mb-1 font-medium">{label}</label>}
      <select
        {...p}
        className="w-full border rounded-xl px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-offset-1 transition-all"
        style={{ borderColor: "#e5e7eb" }}
      >
        {children}
      </select>
    </div>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────────────────

export function Sec({ title, col, children }: { title: string; col: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: col }}>
        {title}
      </p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────────────────

export function Card({ t, children, className = "" }: { t: Theme; children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl p-4 border shadow-sm ${className}`}
      style={{ background: t.card, borderColor: t.border }}
    >
      {children}
    </div>
  );
}

// ── Button ────────────────────────────────────────────────────────────────────────────────

export function Btn({
  children,
  onClick,
  disabled,
  outline,
  t,
  className = "",
  style = {},
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  outline?: boolean;
  t: Theme;
  className?: string;
  style?: React.CSSProperties;
}) {
  if (outline) {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`rounded-xl border text-sm py-2 px-4 font-medium disabled:opacity-40 transition-all hover:opacity-80 ${className}`}
        style={{ borderColor: t.p[200], color: t.p[600], ...style }}
      >
        {children}
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl text-white font-semibold text-sm py-2.5 px-4 disabled:opacity-40 transition-all hover:opacity-90 ${className}`}
      style={{ background: t.p[500], ...style }}
    >
      {children}
    </button>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────────────────

export function EmptyState({
  icon,
  title,
  description,
  t,
}: {
  icon: string;
  title: string;
  description?: string;
  t: Theme;
}) {
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <span className="text-5xl mb-4 opacity-60">{icon}</span>
      <p className="font-semibold text-sm" style={{ color: t.p[700] }}>
        {title}
      </p>
      {description && (
        <p className="text-xs text-gray-400 mt-1.5 max-w-xs leading-relaxed">{description}</p>
      )}
    </div>
  );
}

// ── Toast Container ───────────────────────────────────────────────────────────────────────

const TOAST_ICONS: Record<ToastItem["type"], string> = {
  success: "✅",
  error: "❌",
  warning: "⚠️",
  info: "ℹ️",
};

const TOAST_COLORS: Record<ToastItem["type"], string> = {
  success: "#16a34a",
  error: "#dc2626",
  warning: "#d97706",
  info: "#2563eb",
};

export function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
}) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed top-4 inset-x-4 z-[200] flex flex-col gap-2 pointer-events-none max-w-sm mx-auto">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl pointer-events-auto animate-pulse-once"
          style={{ background: TOAST_COLORS[toast.type], color: "white" }}
          onClick={() => onRemove(toast.id)}
        >
          <span className="text-base shrink-0">{TOAST_ICONS[toast.type]}</span>
          <p className="text-sm font-medium leading-tight flex-1">{toast.message}</p>
        </div>
      ))}
    </div>
  );
}

// ── Signature Canvas ──────────────────────────────────────────────────────────────────────

export function SigCanvas({ onSave, t }: { onSave: (sig: string) => void; t: Theme }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const dr = useRef(false);

  const gp = (e: React.MouseEvent | React.TouchEvent, c: HTMLCanvasElement) => {
    const r = c.getBoundingClientRect();
    const s = "touches" in e ? e.touches[0] : e;
    return { x: s.clientX - r.left, y: s.clientY - r.top };
  };

  const draw = (e: React.MouseEvent | React.TouchEvent, ctx: CanvasRenderingContext2D, p: { x: number; y: number }) => {
    ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = t.p[700];
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.stroke();
  };

  return (
    <div>
      <p className="text-xs text-gray-500 mb-1 font-medium">Assinatura do instrutor</p>
      <canvas
        ref={ref}
        width={340}
        height={80}
        className="border-2 border-dashed rounded-xl w-full touch-none"
        style={{ borderColor: t.p[300], background: t.p[50] }}
        onMouseDown={(e) => {
          dr.current = true;
          const c = ref.current!;
          const ctx = c.getContext("2d")!;
          const p = gp(e, c);
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          e.preventDefault();
        }}
        onMouseMove={(e) => {
          if (!dr.current) return;
          const c = ref.current!;
          const ctx = c.getContext("2d")!;
          draw(e, ctx, gp(e, c));
          e.preventDefault();
        }}
        onMouseUp={() => { dr.current = false; }}
        onMouseLeave={() => { dr.current = false; }}
        onTouchStart={(e) => {
          dr.current = true;
          const c = ref.current!;
          const ctx = c.getContext("2d")!;
          const p = gp(e, c);
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          e.preventDefault();
        }}
        onTouchMove={(e) => {
          if (!dr.current) return;
          const c = ref.current!;
          const ctx = c.getContext("2d")!;
          draw(e, ctx, gp(e, c));
          e.preventDefault();
        }}
        onTouchEnd={() => { dr.current = false; }}
      />
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => ref.current?.getContext("2d")?.clearRect(0, 0, 340, 80)}
          className="text-xs px-3 py-1 rounded-lg border transition-all hover:opacity-80"
          style={{ borderColor: t.p[200], color: t.p[600] }}
        >
          Limpar
        </button>
        <button
          onClick={() => onSave(ref.current!.toDataURL())}
          className="text-xs px-3 py-1 rounded-lg text-white transition-all hover:opacity-90"
          style={{ background: t.p[500] }}
        >
          Confirmar Assinatura
        </button>
      </div>
    </div>
  );
}

// ── Tab Switcher ──────────────────────────────────────────────────────────────────────────

export function TabSwitcher({
  tabs,
  active,
  onChange,
  t,
}: {
  tabs: [string, string][];
  active: string;
  onChange: (tab: string) => void;
  t: Theme;
}) {
  return (
    <div className="flex rounded-xl p-1 gap-1" style={{ background: "#f3f4f6" }}>
      {tabs.map(([k, l]) => (
        <button
          key={k}
          onClick={() => onChange(k)}
          className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
          style={active === k ? { background: t.p[500], color: "white" } : { color: "#6b7280" }}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
