import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Coffee,
  Flag,
  Fuel,
  MoonStar,
  PackageCheck,
  Radio,
  Truck,
} from "lucide-react";
import ComplianceBadge from "./ComplianceBadge";
import {
  buildOperationsTimeline,
  getComplianceScoreForDay,
  getComplianceTone,
} from "../utils/dashboard";
import { formatCompactHours, formatMiles, formatTimelineTime } from "../utils/formatters";

const eventMeta = {
  dispatch: {
    icon: Radio,
    className: "bg-sky-500/12 text-sky-200 ring-sky-400/12",
  },
  pickup: {
    icon: PackageCheck,
    className: "bg-amber-500/12 text-amber-100 ring-amber-400/12",
  },
  driving: {
    icon: Truck,
    className: "bg-indigo-500/12 text-indigo-100 ring-indigo-400/12",
  },
  break: {
    icon: Coffee,
    className: "bg-orange-500/12 text-orange-100 ring-orange-400/12",
  },
  fuel: {
    icon: Fuel,
    className: "bg-teal-500/12 text-teal-100 ring-teal-400/12",
  },
  delivery: {
    icon: Flag,
    className: "bg-emerald-500/12 text-emerald-100 ring-emerald-400/12",
  },
  sleeper: {
    icon: MoonStar,
    className: "bg-violet-500/12 text-violet-100 ring-violet-400/12",
  },
  rest: {
    icon: MoonStar,
    className: "bg-slate-500/12 text-slate-100 ring-slate-400/12",
  },
};

function OperationsTimeline({ schedule, route, trip }) {
  const [expandedDay, setExpandedDay] = useState(schedule[0]?.day ?? null);
  const timelineDays = buildOperationsTimeline(schedule, route, trip);

  useEffect(() => {
    if (!schedule.length) {
      setExpandedDay(null);
      return;
    }

    setExpandedDay((current) => current ?? schedule[0].day);
  }, [schedule]);

  if (!schedule.length) {
    return (
      <section className="rounded-[2rem] border border-white/8 bg-slate-950 p-5 text-white shadow-[0_28px_80px_-38px_rgba(2,6,23,0.92)]">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
          Operations Timeline
        </p>
        <h2 className="mt-2 font-display text-2xl font-semibold">
          Dispatch events and checkpoints
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Generate a trip to populate day-by-day dispatch events, compliance checkpoints,
          breaks, and reset transitions.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-[2rem] border border-white/8 bg-slate-950 p-5 text-white shadow-[0_28px_80px_-38px_rgba(2,6,23,0.92)]">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Operations Timeline
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold">
            Dispatch events and checkpoints
          </h2>
        </div>
        <span className="rounded-full border border-white/8 bg-white/6 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
          {schedule.length} day run
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {timelineDays.map(({ day, events }, index) => {
          const isOpen = expandedDay === day.day;
          const complianceScore = getComplianceScoreForDay(day);

          return (
            <motion.article
              key={day.day}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.28, delay: index * 0.05 }}
              className="overflow-hidden rounded-[1.55rem] border border-white/8 bg-white/5"
            >
              <button
                type="button"
                onClick={() => setExpandedDay((current) => (current === day.day ? null : day.day))}
                className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-200">
                      Day {day.day}
                    </span>
                    <ComplianceBadge
                      label={`${complianceScore}%`}
                      tone={getComplianceTone(complianceScore)}
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-300">
                    <span>{formatMiles(day.distance)}</span>
                    <span>{formatCompactHours(day.driving_hours)} driving</span>
                    <span>{events.length} timeline events</span>
                  </div>
                </div>

                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="h-5 w-5 text-slate-300" />
                </motion.div>
              </button>

              <AnimatePresence initial={false}>
                {isOpen ? (
                  <motion.div
                    key={`timeline-${day.day}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden border-t border-white/8"
                  >
                    <div className="space-y-4 px-4 py-4">
                      {events.map((event, eventIndex) => {
                        const meta = eventMeta[event.type] || eventMeta.dispatch;
                        const Icon = meta.icon;

                        return (
                          <div key={event.id} className="grid grid-cols-[auto_1fr] gap-3">
                            <div className="flex flex-col items-center">
                              <div
                                className={`inline-flex rounded-2xl p-2.5 ring-1 ${meta.className}`}
                              >
                                <Icon className="h-4 w-4" />
                              </div>
                              {eventIndex < events.length - 1 ? (
                                <div className="mt-2 h-full w-px bg-gradient-to-b from-white/20 to-transparent" />
                              ) : null}
                            </div>

                            <div className="rounded-[1.2rem] border border-white/8 bg-slate-900/80 px-4 py-3">
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                                    {formatTimelineTime(event.time)}
                                  </p>
                                  <p className="mt-2 text-sm font-semibold text-white">
                                    {event.title}
                                  </p>
                                </div>
                                {event.badge ? (
                                  <span className="rounded-full bg-white/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                                    {event.badge}
                                  </span>
                                ) : null}
                              </div>
                              <p className="mt-3 text-sm leading-6 text-slate-400">
                                {event.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
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

export default OperationsTimeline;
