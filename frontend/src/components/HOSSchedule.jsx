import { buildDisplayLog, buildDutySummaryText } from "../utils/eld";
import {
  formatDecimal,
  formatHours,
  formatMiles,
  formatTimelineRange,
} from "../utils/formatters";

function ProgressBar({ value, className }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
      <div className={`h-full rounded-full ${className}`} style={{ width: `${value}%` }} />
    </div>
  );
}

function StatusBadge({ className, children }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${className}`}
    >
      {children}
    </span>
  );
}

function buildDayNarrative(day, trip, totalDays) {
  if (!trip) {
    return day.break_required
      ? "30-minute break is inserted after 8 cumulative driving hours for compliance."
      : "Driving block remains below the break trigger and runs as a single linehaul segment.";
  }

  if (day.day === 1) {
    return `Depart ${trip.current_location}, complete pickup at ${trip.pickup_location}, and release the load toward ${trip.dropoff_location}.`;
  }

  if (day.day === totalDays) {
    return `Run the final linehaul segment into ${trip.dropoff_location} and close the trip with the scheduled off-duty reset.`;
  }

  return `Continue the loaded linehaul toward ${trip.dropoff_location} with the planned break and reset windows preserved.`;
}

function HOSSchedule({ schedule, trip }) {
  if (!schedule.length) {
    return (
      <section
        id="hos-schedule"
        className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
          HOS Schedule
        </p>
        <h2 className="mt-2 font-display text-2xl font-semibold text-slate-900">
          Multi-day HOS schedule
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Daily HOS cards appear here after the route is calculated. Each card summarizes
          the planned driving window, break logic, reset time, and cumulative cycle usage.
        </p>
      </section>
    );
  }

  return (
    <section
      id="hos-schedule"
      className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
            HOS Schedule
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-slate-900">
            Hours of Service Schedule
          </h2>
        </div>

        <div className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
          {schedule.length} day itinerary
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {schedule.map((day) => {
          const validation = day.hos_validation;
          const displayLog = buildDisplayLog(day.eld_log);
          const shiftWindow = day.eld_log?.shift
            ? formatTimelineRange(day.eld_log.shift.start, day.eld_log.shift.end)
            : "--";
          const drivingUsage = Math.min((day.driving_hours / 11) * 100, 100);
          const cycleUsage = Math.min((day.cycle_hours_used / 70) * 100, 100);
          const rawCycleRemaining = Number(day.cycle_remaining_hours || 0);
          const cycleRemaining = Math.max(rawCycleRemaining, 0);
          const complianceState =
            day.driving_hours > 11 || rawCycleRemaining < 0
              ? {
                  label: "Needs review",
                  className: "bg-red-100 text-red-700",
                }
              : cycleRemaining <= 8
                ? {
                    label: "Watch cycle",
                    className: "bg-amber-100 text-amber-700",
                  }
                : {
                    label: "Compliant",
                    className: "bg-emerald-100 text-emerald-700",
                  };

          return (
            <article
              key={day.day}
              className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5"
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white">
                      Day {day.day}
                    </span>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500">
                      {formatMiles(day.distance)}
                    </span>
                    <StatusBadge className={complianceState.className}>
                      {complianceState.label}
                    </StatusBadge>
                  </div>
                  <div className="mt-3">
                    {validation?.compliant ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                        FMCSA Compliant ✓
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                        Violation Detected
                      </span>
                    )}
                  </div>

                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {buildDayNarrative(day, trip, schedule.length)}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:w-[360px]">
                  <div className="rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                      Shift Window
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">
                      {shiftWindow}
                    </p>
                  </div>
                  <div className="rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                      Cycle Used
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">
                      {formatDecimal(day.cycle_hours_used)} hrs
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-[1.2rem] bg-white p-4">
                  <p className="text-sm text-slate-500">Driving</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">
                    {formatHours(day.driving_hours)}
                  </p>
                </div>
                <div className="rounded-[1.2rem] bg-white p-4">
                  <p className="text-sm text-slate-500">Break + On Duty</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">
                    {formatDecimal(day.break_hours + day.on_duty_not_driving)} hrs
                  </p>
                </div>
                <div className="rounded-[1.2rem] bg-white p-4">
                  <p className="text-sm text-slate-500">Off Duty Reset</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">
                    {formatHours(day.off_duty_hours)}
                  </p>
                </div>
                <div className="rounded-[1.2rem] bg-white p-4">
                  <p className="text-sm text-slate-500">Cycle Remaining</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">
                    {formatHours(day.cycle_remaining_hours)}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
                <div className="rounded-[1.2rem] border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Duty Sequence
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {buildDutySummaryText(displayLog.segments)}
                  </p>
                </div>

                <div className="rounded-[1.2rem] border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Dispatch Notes
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      Break status:{" "}
                      <span className="font-semibold text-slate-900">
                        {day.break_required ? "Required and scheduled" : "Not triggered"}
                      </span>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      Duty total:{" "}
                      <span className="font-semibold text-slate-900">
                        {displayLog.totalHours.toFixed(2)} hrs logged
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
                    <span>Driving hours used</span>
                    <span>{formatDecimal(day.driving_hours)} / 11 hrs</span>
                  </div>
                  <ProgressBar value={drivingUsage} className="bg-blue-500" />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
                    <span>Cycle hours consumed</span>
                    <span>{formatDecimal(day.cycle_hours_used)} / 70 hrs</span>
                  </div>
                  <ProgressBar
                    value={cycleUsage}
                    className={cycleRemaining <= 8 ? "bg-amber-500" : "bg-teal-500"}
                  />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default HOSSchedule;
