function decimalPlaces(value) {
  return Number(value) % 1 === 0 ? 0 : 1;
}

export function formatDecimal(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "--";
  }

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimalPlaces(value),
    maximumFractionDigits: 2,
  }).format(Number(value));
}

export function formatMiles(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "--";
  }

  return `${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimalPlaces(value),
    maximumFractionDigits: 1,
  }).format(Number(value))} mi`;
}

export function formatHours(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "--";
  }

  const normalized = Number(value);
  return `${formatDecimal(normalized)} hr${normalized === 1 ? "" : "s"}`;
}

export function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "--";
  }

  return `${Math.round(Number(value))}%`;
}

export function formatTimelineLabel(hour) {
  const normalized = Number(hour) % 24;
  const hour12 = normalized % 12 || 12;
  return `${hour12}${normalized < 12 ? "A" : "P"}`;
}

export function formatTimelineTime(value) {
  const normalized = Number(value);
  let wholeHours = Math.floor(normalized);
  let minutes = Math.round((normalized - wholeHours) * 60);

  if (minutes === 60) {
    wholeHours += 1;
    minutes = 0;
  }

  return `${String(wholeHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function formatTimelineRange(start, end) {
  return `${formatTimelineTime(start)}-${formatTimelineTime(end)}`;
}

export function formatTimelineTimeMeridiem(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "--";
  }

  const normalized = Number(value);
  let wholeHours = Math.floor(normalized);
  let minutes = Math.round((normalized - wholeHours) * 60);

  if (minutes === 60) {
    wholeHours += 1;
    minutes = 0;
  }

  const meridiem = wholeHours >= 12 ? "PM" : "AM";
  const hour12 = wholeHours % 12 || 12;

  return `${String(hour12).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${meridiem}`;
}

export function formatCompactHours(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "--";
  }

  return `${formatDecimal(value)}h`;
}

export function formatCycleWindow(current, limit = 70) {
  if (current === null || current === undefined || Number.isNaN(Number(current))) {
    return "--";
  }

  return `${formatDecimal(current)} / ${limit}h`;
}

export function formatLongDate(value) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
