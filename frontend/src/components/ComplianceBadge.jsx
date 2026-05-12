import { AlertTriangle, ShieldAlert, ShieldCheck, Sparkles } from "lucide-react";

const toneMap = {
  good: {
    icon: ShieldCheck,
    className:
      "border-emerald-500/20 bg-emerald-500/12 text-emerald-200 ring-1 ring-emerald-500/10",
  },
  warning: {
    icon: AlertTriangle,
    className:
      "border-amber-500/20 bg-amber-500/12 text-amber-100 ring-1 ring-amber-500/10",
  },
  risk: {
    icon: ShieldAlert,
    className:
      "border-rose-500/20 bg-rose-500/12 text-rose-100 ring-1 ring-rose-500/10",
  },
  info: {
    icon: Sparkles,
    className:
      "border-sky-500/20 bg-sky-500/12 text-sky-100 ring-1 ring-sky-500/10",
  },
  neutral: {
    icon: Sparkles,
    className:
      "border-slate-500/20 bg-slate-500/12 text-slate-100 ring-1 ring-slate-500/10",
  },
};

function ComplianceBadge({ label, tone = "neutral", className = "" }) {
  const variant = toneMap[tone] || toneMap.neutral;
  const Icon = variant.icon;

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] ${variant.className} ${className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

export default ComplianceBadge;
