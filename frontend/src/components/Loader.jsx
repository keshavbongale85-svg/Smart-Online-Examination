// Full-screen / inline spinner
export default function Loader({ full = false, label = "Loading…" }) {
  const spinner = (
    <div className="flex flex-col items-center gap-3 text-slate-500">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" />
      <span className="text-sm">{label}</span>
    </div>
  );
  if (full)
    return (
      <div className="flex min-h-screen items-center justify-center">
        {spinner}
      </div>
    );
  return <div className="flex justify-center py-10">{spinner}</div>;
}
