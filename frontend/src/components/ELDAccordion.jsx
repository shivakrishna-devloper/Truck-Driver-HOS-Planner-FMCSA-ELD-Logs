import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Clock3, ShieldCheck } from "lucide-react";
import ComplianceBadge from "./ComplianceBadge";
import ELDLogSheet from "./ELDLogSheet";
import {
  getComplianceScoreForDay,
  getComplianceTone,
} from "../utils/dashboard";
import { formatCompactHours, formatMiles, formatTimelineRange } from "../utils/formatters";

function ELDAccordion({ schedule, trip }) {
  const [expandedDay, setExpandedDay] = useState(schedule[0]?.day ?? null);

  useEffect(() => {
    if (!schedule.length) {
      setExpandedDay(null);
      return;
    }

    setExpandedDay((current) => current ?? schedule[0].day);
  }, [schedule]);

  if (!schedule.length) {
    return (
      <section
        id="eld-logs"
        className="rounded-[2rem] border border-white/8 bg-slate-950 p-5 text-white shadow-[0_30px_80px_-38px_rgba(2,6,23,0.92)]"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
          ELD Logs
        </p>
        <h2 className="mt-2 font-display text-2xl font-semibold">
          Premium FMCSA log sheets
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Generate a trip to expand daily ELD cards with 24-hour timelines, duty
          segments, remarks, and compliance indicators.
        </p>
      </section>
    );
  }

  return (
    <section
      id="eld-logs"
      className="rounded-[2rem] border border-white/8 bg-slate-950 p-5 text-white shadow-[0_30px_80px_-38px_rgba(2,6,23,0.92)]"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            ELD Logs
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold">
            Enterprise FMCSA daily logs
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            Expand each day to inspect a premium 24-hour log sheet with timeline precision,
            duty summaries, remarks, and derived compliance posture.
          </p>
        </div>
        <div className="rounded-full border border-white/8 bg-white/6 px-4 py-2 text-sm font-medium text-slate-200">
          {schedule.length} collapsible daily logs
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {schedule.map((day, index) => {
          const isExpanded = expandedDay === day.day;
          const complianceScore = getComplianceScoreForDay(day);

          return (
            <motion.article
              key={day.day}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.12 }}
              transition={{ duration: 0.28, delay: index * 0.04 }}
              className="overflow-hidden rounded-[1.8rem] border border-white/8 bg-white/5"
            >
              <button
                type="button"
                onClick={() => setExpandedDay((current) => (current === day.day ? null : day.day))}
                className="flex w-full flex-col gap-4 px-5 py-5 text-left lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-100">
                      Day {day.day}
                    </span>
                    <ComplianceBadge
                      label={`${complianceScore}% compliant`}
                      tone={getComplianceTone(complianceScore)}
                    />
                    <ComplianceBadge
                      label={day.break_required ? "Break logged" : "Continuous drive"}
                      tone={day.break_required ? "warning" : "good"}
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-300">
                    <span>{formatMiles(day.distance)}</span>
                    <span>{formatCompactHours(day.driving_hours)} driving</span>
                    <span>{formatCompactHours(day.cycle_hours_used)} cycle used</span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-xs uppercase tracking-[0.2em] text-slate-500">
                    <span className="inline-flex items-center gap-2">
                      <Clock3 className="h-3.5 w-3.5" />
                      {formatTimelineRange(day.eld_log?.shift?.start ?? 0, day.eld_log?.shift?.end ?? 0)}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {trip?.pickup_location} to {trip?.dropoff_location}
                    </span>
                  </div>
                </div>

                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="self-end lg:self-center"
                >
                  <ChevronDown className="h-5 w-5 text-slate-300" />
                </motion.div>
              </button>

              <AnimatePresence initial={false}>
                {isExpanded ? (
                  <motion.div
                    key={`eld-${day.day}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28 }}
                    className="overflow-hidden border-t border-white/8"
                  >
                    <div className="px-5 py-5">
                      <ELDLogSheet day={day} trip={trip} complianceScore={complianceScore} />
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}

export default ELDAccordion;
