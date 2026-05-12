import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { formatHours, formatMiles, formatPercent } from "../utils/formatters";

const toneMap = {
  sky: {
    iconSurface: "bg-sky-500/16 text-sky-100 ring-1 ring-sky-400/15",
    accent: "from-sky-500/22 via-sky-500/6 to-transparent",
    border: "border-sky-400/15",
    glow: "shadow-[0_28px_80px_-38px_rgba(56,189,248,0.6)]",
  },
  indigo: {
    iconSurface: "bg-indigo-500/16 text-indigo-100 ring-1 ring-indigo-400/15",
    accent: "from-indigo-500/22 via-indigo-500/6 to-transparent",
    border: "border-indigo-400/15",
    glow: "shadow-[0_28px_80px_-38px_rgba(99,102,241,0.55)]",
  },
  emerald: {
    iconSurface: "bg-emerald-500/16 text-emerald-100 ring-1 ring-emerald-400/15",
    accent: "from-emerald-500/24 via-emerald-500/6 to-transparent",
    border: "border-emerald-400/15",
    glow: "shadow-[0_28px_80px_-38px_rgba(16,185,129,0.55)]",
  },
  amber: {
    iconSurface: "bg-amber-500/16 text-amber-100 ring-1 ring-amber-400/15",
    accent: "from-amber-500/24 via-amber-500/6 to-transparent",
    border: "border-amber-400/15",
    glow: "shadow-[0_28px_80px_-38px_rgba(245,158,11,0.55)]",
  },
  violet: {
    iconSurface: "bg-violet-500/16 text-violet-100 ring-1 ring-violet-400/15",
    accent: "from-violet-500/24 via-violet-500/6 to-transparent",
    border: "border-violet-400/15",
    glow: "shadow-[0_28px_80px_-38px_rgba(139,92,246,0.5)]",
  },
  teal: {
    iconSurface: "bg-teal-500/16 text-teal-100 ring-1 ring-teal-400/15",
    accent: "from-teal-500/24 via-teal-500/6 to-transparent",
    border: "border-teal-400/15",
    glow: "shadow-[0_28px_80px_-38px_rgba(20,184,166,0.55)]",
  },
};

function formatValue(value, valueType) {
  if (valueType === "miles") {
    return formatMiles(value);
  }

  if (valueType === "hours") {
    return formatHours(value);
  }

  if (valueType === "percent") {
    return formatPercent(value);
  }

  if (value === null || value === undefined || value === "") {
    return "--";
  }

  return value;
}

function MetricCard({
  icon: Icon,
  label,
  value,
  valueType,
  note,
  delta,
  tone = "sky",
  index = 0,
}) {
  const variant = toneMap[tone] || toneMap.sky;

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      whileHover={{ y: -4 }}
      className={`group relative overflow-hidden rounded-[1.9rem] border bg-slate-950 px-5 py-5 text-white ${variant.border} ${variant.glow}`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${variant.accent}`} />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className={`inline-flex rounded-2xl p-3 ${variant.iconSurface}`}>
            <Icon className="h-5 w-5" />
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-200">
            Live
            <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </div>

        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
          {label}
        </p>
        <p className="mt-3 font-display text-3xl font-semibold tracking-tight text-white">
          {formatValue(value, valueType)}
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-300">{note}</p>
        <p className="mt-4 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
          {delta}
        </p>
      </div>
    </motion.article>
  );
}

export default MetricCard;
