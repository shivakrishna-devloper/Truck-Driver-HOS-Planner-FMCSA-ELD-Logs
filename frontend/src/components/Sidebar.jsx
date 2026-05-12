import { motion } from "framer-motion";
import { ChevronRight, Sparkles } from "lucide-react";
import ComplianceBadge from "./ComplianceBadge";
import { formatPercent } from "../utils/formatters";

function Sidebar({
  items,
  activeItem,
  onNavigate,
  onClose,
  complianceScore,
  fleetHealth,
}) {
  return (
    <aside className="flex h-full w-[18.5rem] flex-col rounded-r-[2rem] border-r border-white/6 bg-slate-950/96 px-4 py-5 text-white shadow-[18px_0_60px_-34px_rgba(2,6,23,0.88)] backdrop-blur">
      <div className="flex items-center gap-3 px-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-teal-400 via-sky-500 to-indigo-500 text-sm font-bold text-white shadow-[0_16px_40px_-20px_rgba(14,165,233,0.85)]">
          NB
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-slate-300">
            Northbound
          </p>
          <p className="mt-1 font-display text-lg font-semibold text-white">
            Fleet Control
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-[1.75rem] border border-white/8 bg-white/5 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
          Control Room
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-200">
          Command your routed trip, monitor compliance pressure, and audit daily ELD
          activity from a single operational workspace.
        </p>
      </div>

      <nav className="mt-6 flex-1 space-y-1.5">
        {items.map((item, index) => {
          const Icon = item.icon;
          const active = activeItem === item.id;

          return (
            <motion.button
              key={item.id}
              type="button"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.24, delay: index * 0.04 }}
              whileHover={{ x: 3 }}
              onClick={() => {
                onNavigate(item.target);
                onClose?.();
              }}
              className={`group flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left transition ${
                active
                  ? "bg-white/10 text-white shadow-[0_18px_45px_-35px_rgba(148,163,184,0.65)]"
                  : "text-slate-300 hover:bg-white/7 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex rounded-2xl p-2.5 ${
                    active
                      ? "bg-gradient-to-br from-teal-400/30 to-sky-500/20 text-white"
                      : "bg-white/6 text-slate-300"
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className="text-xs text-slate-400">{item.description}</p>
                </div>
              </div>
              <ChevronRight
                className={`h-4 w-4 transition ${
                  active ? "text-slate-100" : "text-slate-500 group-hover:text-slate-300"
                }`}
              />
            </motion.button>
          );
        })}
      </nav>

      <div className="mt-6 rounded-[1.8rem] border border-white/8 bg-gradient-to-br from-white/7 to-white/[0.03] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
              Fleet Health
            </p>
            <p className="mt-2 text-sm font-semibold text-white">{fleetHealth.label}</p>
          </div>
          <ComplianceBadge label={formatPercent(complianceScore)} tone={fleetHealth.tone} />
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-300">{fleetHealth.detail}</p>
        <div className="mt-5 flex items-center gap-2 rounded-2xl bg-slate-900/70 px-3 py-3 text-sm text-slate-200">
          <Sparkles className="h-4 w-4 text-teal-300" />
          Routed trip intelligence is aligned with the current HOS constraints.
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
