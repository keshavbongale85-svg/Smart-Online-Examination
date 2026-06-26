// Small shared presentational helpers used across pages.

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, hint, color = "brand" }) {
  const colors = {
    brand: "text-brand-600",
    green: "text-emerald-600",
    red: "text-red-600",
    amber: "text-amber-600",
  };
  return (
    <div className="card">
      <div className="text-sm text-slate-500">{label}</div>
      <div className={`mt-1 text-3xl font-bold ${colors[color]}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-400">{hint}</div>}
    </div>
  );
}

export function EmptyState({ icon = "📭", title, subtitle, action }) {
  return (
    <div className="card flex flex-col items-center gap-2 py-12 text-center">
      <div className="text-4xl">{icon}</div>
      <div className="text-lg font-semibold text-slate-700">{title}</div>
      {subtitle && <div className="text-sm text-slate-500">{subtitle}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function Badge({ children, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-emerald-100 text-emerald-700",
    red: "bg-red-100 text-red-700",
    amber: "bg-amber-100 text-amber-700",
    blue: "bg-brand-100 text-brand-700",
  };
  return <span className={`badge ${tones[tone]}`}>{children}</span>;
}

export function Modal({ open, onClose, title, children, wide = false }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className={`max-h-[90vh] w-full overflow-y-auto rounded-xl bg-white p-6 shadow-xl ${
          wide ? "max-w-2xl" : "max-w-md"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
