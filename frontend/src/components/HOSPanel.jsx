import { motion } from "framer-motion";
import { AlertTriangle, Gauge, MoonStar, TimerReset } from "lucide-react";
import ComplianceBadge from "./ComplianceBadge";
import {
  getComplianceScoreForDay,
  getComplianceTone,
  getDutyStatus,
  getFatigueRisk,
} from "../utils/dashboard";
import {
  formatCompactHours,
  formatHours,
  formatPercent,
} from "../utils/formatters";

function ProgressTrack({ value, className }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-white/8">
      <motion.div
        initial={{ scaleX: 0, originX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.45 }}
        className={`h-full rounded-full ${className}`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function HOSPanel({ schedule }) {
  if (!schedule.length) {
    return (
      <section
        id="hos-analytics"
        className="rounded-[2rem] border border-white/8 bg-slate-950 p-5 text-white shadow-[0_28px_80px_-38px_rgba(2,6,23,0.92)]"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
          HOS Operations
        </p>
        <h2 className="mt-2 font-display text-2xl font-semibold">
          Operational compliance intelligence
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Daily HOS insights appear here once a trip is generated, including compliance
          posture, fatigue exposure, break requirements, and remaining cycle capacity.
        </p>
      </section>
    );
  }

  return (
    <section
      id="hos-analytics"
      className="rounded-[2rem] border border-white/8 bg-slate-950 p-5 text-white shadow-[0_28px_80px_-38px_rgba(2,6,23,0.92)]"
    >
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            HOS Operations
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold">
            Compliance and fatigue intelligence
          </h2>
        </div>
        <span className="rounded-full border border-white/8 bg-white/6 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
          70h cycle model
        </span>
      </div>

      <div className="mt-5 space-y-4">
        {schedule.map((day, index) => {
          const complianceScore = getComplianceScoreForDay(day);
          const fatigueRisk = getFatigueRisk(day);
          const dutyStatus = getDutyStatus(day);
          const drivingUsage = Math.min((Number(day.driving_hours || 0) / 11) * 100, 100);
          const cycleUsage = Math.min((Number(day.cycle_hours_used || 0) / 70) * 100, 100);

          return (
            <motion.article
              key={day.day}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.28, delay: index * 0.04 }}
              className="rounded-[1.6rem] border border-white/8 bg-white/5 p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-200">
                      Day {day.day}
                    </span>
                    <ComplianceBadge
                      label={`${complianceScore}% compliant`}
                      tone={getComplianceTone(complianceScore)}
                    />
                    <ComplianceBadge label={dutyStatus.label} tone={dutyStatus.tone} />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    {day.break_required
                      ? "Dispatch break inserted after 8 cumulative driving hours."
                      : "Single drive window scheduled without a mandatory break stop."}
                  </p>
                </div>

                <div className="rounded-[1.2rem] border border-white/8 bg-slate-900/80 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Fatigue Risk
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-300" />
                    <span className="text-sm font-semibold text-white">
                      {fatigueRisk.label}
                    </span>
                    <span className="text-xs text-slate-400">{fatigueRisk.score}/100</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-[1.2rem] bg-slate-900/80 px-4 py-3">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Gauge className="h-4 w-4 text-sky-300" />
                    <span className="text-sm font-medium">Driving hours</span>
                  </div>
                  <p className="mt-3 text-xl font-semibold text-white">
                    {formatHours(day.driving_hours)}
                  </p>
                </div>
                <div className="rounded-[1.2rem] bg-slate-900/80 px-4 py-3">
                  <div className="flex items-center gap-2 text-slate-300">
                    <TimerReset className="h-4 w-4 text-emerald-300" />
                    <span className="text-sm font-medium">Remaining cycle</span>
                  </div>
                  <p className="mt-3 text-xl font-semibold text-white">
                    {formatHours(day.cycle_remaining_hours)}
                  </p>
                </div>
                <div className="rounded-[1.2rem] bg-slate-900/80 px-4 py-3">
                  <div className="flex items-center gap-2 text-slate-300">
                    <MoonStar className="h-4 w-4 text-violet-300" />
                    <span className="text-sm font-medium">Duty status</span>
                  </div>
                  <p className="mt-3 text-xl font-semibold text-white">{dutyStatus.label}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-2">
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                    <span>11-hour driving window</span>
                    <span>{formatCompactHours(day.driving_hours)} / 11h</span>
                  </div>
                  <ProgressTrack value={drivingUsage} className="bg-gradient-to-r from-sky-400 to-blue-500" />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                    <span>Cycle load consumed</span>
                    <span>{formatCompactHours(day.cycle_hours_used)} / 70h</span>
                  </div>
                  <ProgressTrack value={cycleUsage} className="bg-gradient-to-r from-emerald-400 to-teal-500" />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                    <span>Compliance confidence</span>
                    <span>{formatPercent(complianceScore)}</span>
                  </div>
                  <ProgressTrack
                    value={complianceScore}
                    className="bg-gradient-to-r from-indigo-400 to-sky-500"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                    <span>Fatigue pressure</span>
                    <span>{formatPercent(fatigueRisk.score)}</span>
                  </div>
                  <ProgressTrack
                    value={fatigueRisk.score}
                    className={
                      fatigueRisk.tone === "risk"
                        ? "bg-gradient-to-r from-rose-400 to-orange-500"
                        : fatigueRisk.tone === "warning"
                          ? "bg-gradient-to-r from-amber-400 to-orange-400"
                          : "bg-gradient-to-r from-emerald-400 to-lime-400"
                    }
                  />
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}

export default HOSPanel;
