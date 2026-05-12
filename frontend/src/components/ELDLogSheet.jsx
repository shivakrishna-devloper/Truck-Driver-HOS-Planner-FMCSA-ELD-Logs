import {
  buildDisplayLog,
  buildDriverMetadata,
  buildEldRemarks,
  getDutyStatusLabel,
} from "../utils/eld";
import {
  formatCycleWindow,
  formatHours,
  formatTimelineLabel,
  formatTimelineRange,
} from "../utils/formatters";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const hourMarkers = Array.from({ length: 24 }, (_, hour) => hour);
const rows = [
  { key: "off_duty", label: "Off Duty" },
  { key: "sleeper_berth", label: "Sleeper Berth" },
  { key: "driving", label: "Driving" },
  { key: "on_duty", label: "On Duty (Not Driving)" },
];

const rowIndexMap = rows.reduce((map, row, index) => {
  map[row.key] = index;
  return map;
}, {});

const segmentStyles = {
  off_duty: {
    bar: "border-green-600/20 bg-green-500 text-white",
    marker: "bg-green-500",
  },
  sleeper_berth: {
    bar: "border-emerald-700/20 bg-emerald-600 text-white",
    marker: "bg-emerald-600",
  },
  break: {
    bar: "border-orange-600/20 bg-orange-400 text-orange-950",
    marker: "bg-orange-400",
  },
  driving: {
    bar: "border-blue-700/20 bg-blue-600 text-white",
    marker: "bg-blue-600",
  },
  on_duty: {
    bar: "border-amber-600/20 bg-amber-300 text-amber-950",
    marker: "bg-amber-300",
  },
};

const legend = [
  { label: "Off Duty", className: "bg-green-500" },
  { label: "Sleeper Berth", className: "bg-emerald-600" },
  { label: "30-Min Break", className: "bg-orange-400" },
  { label: "Driving", className: "bg-blue-600" },
  { label: "On Duty", className: "bg-amber-300" },
];

const rowHeight = 82;
const segmentHeight = 18;

function MetadataField({ label, value }) {
  return (
    <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="text-sm font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function renderSegmentContent(segment) {
  if (segment.duration >= 2) {
    return (
      <div className="flex h-full items-center justify-between gap-2 px-3">
        <span className="truncate text-[10px] font-semibold uppercase tracking-[0.16em]">
          {getDutyStatusLabel(segment.status)}
        </span>
        <span className="shrink-0 text-[10px] font-semibold opacity-90">
          {formatTimelineRange(segment.start, segment.end)}
        </span>
      </div>
    );
  }

  if (segment.duration >= 0.75) {
    return (
      <div className="flex h-full items-center justify-center px-2 text-[10px] font-semibold">
        {formatTimelineRange(segment.start, segment.end)}
      </div>
    );
  }

  return (
    <span className="sr-only">
      {getDutyStatusLabel(segment.status)} {formatTimelineRange(segment.start, segment.end)}
    </span>
  );
}

function DutyStatusChart({ segments, transitions }) {
  const chartHeight = rows.length * rowHeight;

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[860px] overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white">
        <div className="grid grid-cols-[165px_minmax(0,1fr)] sm:grid-cols-[210px_minmax(0,1fr)]">
          <div className="flex h-14 items-center border-b border-r border-slate-200 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Duty Status
          </div>

          <div className="grid h-14 border-b border-slate-200" style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}>
            {hourMarkers.map((hour) => (
              <div
                key={hour}
                className="relative flex items-center justify-center border-r border-slate-200 text-[11px] font-semibold text-slate-500"
              >
                <span className={hour % 4 === 0 ? "text-slate-700" : ""}>
                  {formatTimelineLabel(hour)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-[165px_minmax(0,1fr)] sm:grid-cols-[210px_minmax(0,1fr)]">
          <div className="border-r border-slate-200 bg-slate-50/70">
            {rows.map((row) => (
              <div
                key={row.key}
                className="flex h-[82px] items-center border-b border-slate-200 px-4 last:border-b-0"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{row.label}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {segments
                      .filter((segment) => segment.row === row.key)
                      .map((segment) => getDutyStatusLabel(segment.status))
                      .join(" • ") || "No recorded activity"}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="relative" style={{ height: `${chartHeight}px` }}>
            {Array.from({ length: 25 }, (_, hour) => (
              <div
                key={hour}
                className={`absolute top-0 bottom-0 ${
                  hour === 24 ? "border-r border-slate-200" : "border-r border-dashed border-slate-200"
                }`}
                style={{ left: `${(hour / 24) * 100}%` }}
              />
            ))}

            {rows.map((row, index) => (
              <div
                key={row.key}
                className="absolute left-0 right-0 border-b border-slate-200 last:border-b-0"
                style={{
                  top: `${index * rowHeight}px`,
                  height: `${rowHeight}px`,
                }}
              >
                <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-slate-200" />
              </div>
            ))}

            {transitions.map((transition) => {
              const fromCenter = rowIndexMap[transition.fromRow] * rowHeight + rowHeight / 2;
              const toCenter = rowIndexMap[transition.toRow] * rowHeight + rowHeight / 2;
              const top = Math.min(fromCenter, toCenter);
              const height = Math.abs(toCenter - fromCenter);
              const markerTone = segmentStyles[transition.toStatus]?.marker || "bg-slate-400";

              return (
                <div
                  key={`${transition.time}-${transition.fromRow}-${transition.toRow}`}
                  className="absolute z-10 -translate-x-1/2"
                  style={{
                    left: `${(transition.time / 24) * 100}%`,
                    top: `${top}px`,
                    height: `${height}px`,
                  }}
                >
                  <div className="absolute left-1/2 top-0 h-[6px] w-[6px] -translate-x-1/2 rounded-full bg-slate-700" />
                  <div className="absolute left-1/2 top-1 h-[calc(100%-8px)] w-[2px] -translate-x-1/2 bg-slate-500" />
                  <div
                    className={`absolute bottom-0 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full ring-2 ring-white ${markerTone}`}
                  />
                </div>
              );
            })}

            {segments.map((segment) => {
              const style = segmentStyles[segment.status] || segmentStyles.off_duty;
              const top =
                rowIndexMap[segment.row] * rowHeight + rowHeight / 2 - segmentHeight / 2;

              return (
                <div
                  key={`${segment.row}-${segment.status}-${segment.start}`}
                  title={`${getDutyStatusLabel(segment.status)} ${formatTimelineRange(
                    segment.start,
                    segment.end,
                  )}`}
                  className={`absolute z-20 overflow-hidden rounded-full border shadow-sm ${style.bar}`}
                  style={{
                    top: `${top}px`,
                    left: `${(segment.start / 24) * 100}%`,
                    width: `${(segment.duration / 24) * 100}%`,
                    minWidth: segment.duration < 0.75 ? "14px" : undefined,
                    height: `${segmentHeight}px`,
                  }}
                >
                  {renderSegmentContent(segment)}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function ELDLogSheet({ day, trip, route, totalDays }) {
  const eldLog = day.eld_log;

  if (!eldLog) {
    return null;
  }

  const displayLog = buildDisplayLog(eldLog);
  const metadata = buildDriverMetadata({ trip, route, day, totalDays });
  const remarks = buildEldRemarks({
    day,
    trip,
    route,
    totalDays,
    segments: displayLog.segments,
  });

  const complianceBadges = [
    displayLog.isValid24Hour
      ? "FMCSA Compliant"
      : "Needs Review",
    day.break_required
      ? "30-minute break logged"
      : "No break required",
  ];
  const metrics = [
    { label: "Total Miles Today", value: metadata.totalMilesToday },
    { label: "Driving Time", value: formatHours(day.driving_hours) },
    { label: "Shift Window", value: formatTimelineRange(eldLog.shift.start, eldLog.shift.end) },
    { label: "Cycle Used", value: formatCycleWindow(day.cycle_hours_used) },
  ];

  const exportPDF = () => {
    try {
      const pdf = new jsPDF("p", "mm", "a4");

      let y = 20;

      pdf.setFontSize(18);
      pdf.text(`ELD Daily Log - Day ${day.day}`, 14, y);

      y += 12;

      pdf.setFontSize(11);

      pdf.text(`Date: ${metadata.dateLabel}`, 14, y);
      y += 8;

      pdf.text(`Current Location: ${metadata.startLocation}`, 14, y);
      y += 8;

      pdf.text(`Destination: ${metadata.dropoffLocation}`, 14, y);
      y += 8;

      pdf.text(`Total Miles: ${metadata.totalMilesToday}`, 14, y);
      y += 8;

      pdf.text(`Cycle Used: ${metadata.cycleUsed}`, 14, y);
      y += 14;

      pdf.setFontSize(14);
      pdf.text("Duty Summary", 14, y);

      y += 10;

      pdf.setFontSize(11);

      pdf.text(
        `Off Duty: ${formatHours(displayLog.rowTotals.off_duty)}`,
        14,
        y,
      );
      y += 8;

      pdf.text(
        `Sleeper Berth: ${formatHours(displayLog.rowTotals.sleeper_berth)}`,
        14,
        y,
      );
      y += 8;

      pdf.text(
        `Driving: ${formatHours(displayLog.rowTotals.driving)}`,
        14,
        y,
      );
      y += 8;

      pdf.text(
        `On Duty: ${formatHours(displayLog.rowTotals.on_duty)}`,
        14,
        y,
      );

      y += 14;

      pdf.setFontSize(14);
      pdf.text("Remarks", 14, y);

      y += 10;

      pdf.setFontSize(10);

      remarks.forEach((remark) => {
        const line = `${remark.timeLabel} - ${remark.title} - ${remark.location}`;

        const splitLines = pdf.splitTextToSize(line, 180);

        pdf.text(splitLines, 14, y);

        y += splitLines.length * 6 + 4;

        if (y > 270) {
          pdf.addPage();
          y = 20;
        }
      });

      y += 8;

      pdf.setFontSize(12);

      pdf.text(
        "I certify these records are true and correct.",
        14,
        y,
      );

      y += 10;

      pdf.setFontSize(10);

      pdf.text(
        "Generated electronically by Truck Driver HOS Planner.",
        14,
        y,
      );

      pdf.save(`eld-log-day-${day.day}.pdf`);
    } catch (error) {
      console.error("PDF export failed:", error);
    }
  };

  const metadataFields = [
    { label: "Date", value: metadata.dateLabel },
    { label: "Home Terminal", value: metadata.homeTerminal },
    { label: "Total Miles Today", value: metadata.totalMilesToday },
    { label: "Cycle Used", value: metadata.cycleUsed },
    { label: "Current Location", value: metadata.startLocation },
    { label: "Destination", value: metadata.dropoffLocation },
  ];

  return (
    <article 
    id={`eld-log-${day.day}`}
    className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
            ELD Daily Log
          </p>
          <h3 className="mt-2 font-display text-2xl font-semibold text-slate-900 sm:text-3xl">
            Day {day.day} FMCSA Log
          </h3>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            Clean FMCSA-style log generated from the active route, starting from
            {metadata.startLocation} and dispatching toward {metadata.dropoffLocation}
            with a scheduled shift from{" "}
            {formatTimelineRange(eldLog.shift.start, eldLog.shift.end)}.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {complianceBadges.map((badge) => (
            <span
              key={badge}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700"
            >
              {badge}
            </span>
          ))}
          <button
            onClick={exportPDF}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 transition hover:bg-slate-100"
          >
            Export PDF
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {metadataFields.map((field) => (
          <MetadataField key={field.label} label={field.label} value={field.value} />
        ))}
      </div>

      <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 sm:p-5">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            <span className="rounded-full bg-white px-3 py-2 text-slate-700">
              Shift Window {formatTimelineRange(eldLog.shift.start, eldLog.shift.end)}
            </span>
            <span className="rounded-full bg-white px-3 py-2 text-slate-700">
              {day.break_required
                ? "Break inserted after 8 cumulative driving hours"
                : "Driving block remains below the break trigger"}
            </span>
          </div>
          <p className="text-xs font-medium text-slate-500">
            Total recorded duty time: {displayLog.totalHours.toFixed(2)} hours
          </p>
        </div>
      </div>
        <div className="mt-4">
          <DutyStatusChart
            segments={displayLog.segments}
            transitions={displayLog.transitions}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          {legend.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            >
              <span className={`h-3 w-3 rounded-full ${item.className}`} />
              {item.label}
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-[1.1rem] border border-dashed border-slate-300 bg-white px-4 py-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${
              displayLog.isValid24Hour
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {displayLog.isValid24Hour
              ? "24-Hour Validation Passed"
              : "Timeline Requires Review"}
          </span>

          <p className="text-sm leading-6 text-slate-500">
            Duty status totals:
            <span className="ml-1 font-semibold text-slate-900">
              {displayLog.totalHours.toFixed(2)} hrs
            </span>
          </p>
        </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4"
          >
            <p className="text-sm font-medium text-slate-500">{metric.label}</p>
            <p className="mt-3 text-2xl font-semibold text-slate-900">{metric.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
            Duty Summary
          </p>
          <div className="mt-4 space-y-3">
            <SummaryRow
              label="Off Duty"
              value={formatHours(displayLog.rowTotals.off_duty)}
            />
            <SummaryRow
              label="Sleeper Berth"
              value={formatHours(displayLog.rowTotals.sleeper_berth)}
            />
            <SummaryRow
              label="Driving"
              value={formatHours(displayLog.rowTotals.driving)}
            />
            <SummaryRow
              label="On Duty (Not Driving)"
              value={formatHours(displayLog.rowTotals.on_duty)}
            />
          </div>
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Dispatch Note
            </p>
            <p className="mt-2 text-[15px] leading-7 text-slate-600">
              {day.break_required
                ? "Break placement satisfies the 8-hour cumulative driving requirement before the final driving segment."
                : "The day fits into a single uninterrupted driving block and remains compliant without a break split."}
            </p>
          </div>
        </div>

        <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
              Remarks
            </p>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Realistic trip events
            </span>
          </div>

          <div className="mt-4 space-y-4">
            {remarks.map((remark) => (
              <div key={remark.id} className="flex gap-4 rounded-[1.2rem] bg-white p-4">
                <div className="shrink-0">
                  <div className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white">
                    {remark.timeLabel}
                  </div>
                </div>

                <div className="min-w-0 flex-1 border-l border-slate-200 pl-4">
                  <p className="text-sm font-semibold text-slate-900">{remark.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{remark.location}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{remark.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-[1.35rem] border border-slate-200 bg-slate-50 px-5 py-4">
        <p className="text-sm font-semibold text-slate-900">Driver Certification</p>
        <p className="mt-2 text-sm text-slate-600">
          I certify these records are true and correct.
        </p>
        <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-500">
          Generated electronically by Truck Driver HOS Planner.
        </p>
      </div>
    </article>
  );
}

export default ELDLogSheet;
