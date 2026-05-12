import {
  CalendarDays,
  Clock3,
  Gauge,
  Route as RouteIcon,
  TimerReset,
  Zap,
} from "lucide-react";
import { formatHours, formatMiles } from "../utils/formatters";

const cardIcons = [
  RouteIcon,
  Clock3,
  CalendarDays,
  Gauge,
  TimerReset,
  Zap,
];

function SummaryCards({ route, schedule, currentCycleUsed }) {
  const finalDay = schedule.at(-1);
  const totalOnDuty = schedule.reduce(
    (total, day) => total + (day.total_on_duty_hours || 0),
    0,
  );
  const remainingCycle = finalDay
    ? finalDay.cycle_remaining_hours
    : Math.max(70 - Number(currentCycleUsed || 0), 0);

  const cards = [
    {
      label: "Total Distance",
      value: route ? formatMiles(route.distance_miles) : "--",
      note: route ? `${route.legs?.length || 0} route legs` : "Waiting for route generation",
    },
    {
      label: "Estimated Drive Time",
      value: route ? formatHours(route.duration_hours) : "--",
      note: "OpenRouteService ETA",
    },
    {
      label: "Driving Days",
      value: schedule.length ? `${schedule.length}` : "--",
      note: schedule.length ? "Multi-day schedule generated" : "No schedule yet",
    },
    {
      label: "Current Cycle Used",
      value: formatHours(currentCycleUsed || 0),
      note: "Starting cycle usage",
    },
    {
      label: "Remaining Cycle Hours",
      value: formatHours(remainingCycle),
      note: "Projected after this trip",
    },
    {
      label: "Total On Duty",
      value: schedule.length ? formatHours(totalOnDuty) : "--",
      note: schedule.some((day) => day.break_required)
        ? "Includes required FMCSA break time"
        : "Break not required on current plan",
    },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card, index) => {
        const Icon = cardIcons[index];

        return (
        <article
          key={card.label}
          className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="inline-flex rounded-2xl bg-slate-100 p-3 text-slate-600">
              <Icon className="h-5 w-5" />
            </div>
            <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
              Live
            </span>
          </div>
          <p className="mt-5 text-sm font-medium text-slate-500">{card.label}</p>
          <p className="mt-3 font-display text-3xl font-semibold text-slate-900">
            {card.value}
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-600">{card.note}</p>
        </article>
        );
      })}
    </section>
  );
}

export default SummaryCards;
