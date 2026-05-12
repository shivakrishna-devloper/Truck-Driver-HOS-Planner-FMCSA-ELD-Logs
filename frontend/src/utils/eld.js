import {
  formatDecimal,
  formatHours,
  formatLongDate,
  formatTimelineRange,
  formatTimelineTimeMeridiem,
} from "./formatters";

const DRIVER_FIRST_NAMES = [
  "Avery",
  "Jordan",
  "Logan",
  "Parker",
  "Taylor",
  "Morgan",
  "Riley",
  "Cameron",
];

const DRIVER_LAST_NAMES = [
  "Reed",
  "Bennett",
  "Parker",
  "Hayes",
  "Turner",
  "Brooks",
  "Walker",
  "Collins",
];

const CARRIER_NAMES = [
  "Northline Freight",
  "Blue Mesa Logistics",
  "Prairie Rock Transport",
  "Summit Ridge Carriers",
  "Canyon State Logistics",
  "Iron Mile Transport",
];

const DUTY_ROW_TOTALS = {
  off_duty: 0,
  sleeper_berth: 0,
  driving: 0,
  on_duty: 0,
};

function roundToHundredths(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function hashString(value) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 2147483647;
  }

  return Math.abs(hash);
}

function pickSeeded(list, seed, offset = 0) {
  return list[(seed + offset) % list.length];
}

function normalizeLocation(value, fallback = "--") {
  if (typeof value !== "string") {
    return fallback;
  }

  const cleaned = value.trim();
  return cleaned || fallback;
}

function addDays(baseDate, days) {
  const nextDate = new Date(baseDate);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function createEvent(time, title, location, detail) {
  return {
    id: `${title}-${time}-${location}`,
    time,
    timeLabel: formatTimelineTimeMeridiem(time),
    title,
    location,
    detail,
  };
}

export function getWaypointLabel(route, kind, fallback) {
  const waypoint = route?.waypoints?.find((item) => item.kind === kind);
  return normalizeLocation(waypoint?.resolved_name || waypoint?.query || fallback, fallback);
}

export function getDutyStatusLabel(status) {
  switch (status) {
    case "off_duty":
      return "Off Duty";
    case "sleeper_berth":
      return "Sleeper Berth";
    case "break":
      return "30-Min Break";
    case "driving":
      return "Driving";
    case "on_duty":
      return "On Duty";
    default:
      return "Duty Status";
  }
}

export function buildDayLocations({ trip, route, dayNumber, totalDays }) {
  const currentLocation = getWaypointLabel(route, "current", trip?.current_location);
  const pickupLocation = getWaypointLabel(route, "pickup", trip?.pickup_location);
  const dropoffLocation = getWaypointLabel(route, "dropoff", trip?.dropoff_location);
  const enRouteLocation =
    totalDays > 1 ? `En route to ${dropoffLocation}` : dropoffLocation;

  return {
    currentLocation,
    pickupLocation,
    dropoffLocation,
    homeTerminal: currentLocation,
    startLocation: dayNumber === 1 ? currentLocation : enRouteLocation,
    dispatchLocation: dayNumber === 1 ? pickupLocation : enRouteLocation,
    endLocation: dayNumber === totalDays ? dropoffLocation : enRouteLocation,
    enRouteLocation,
  };
}

export function buildDisplayLog(eldLog) {
  const baseResult = {
    segments: [],
    rowTotals: { ...DUTY_ROW_TOTALS },
    totalHours: 0,
    isValid24Hour: false,
    adjustmentHours: 0,
    transitions: [],
  };

  if (!eldLog?.segments?.length) {
    return baseResult;
  }

  const normalizedSegments = eldLog.segments
    .map((segment) => {
      const start = roundToHundredths(segment.start);
      const end = roundToHundredths(segment.end);
      const duration = roundToHundredths(
        segment.duration ?? Math.max(end - start, 0),
      );

      return {
        ...segment,
        start,
        end,
        duration,
      };
    })
    .sort((left, right) => left.start - right.start);

  const totalBeforeAdjustment = roundToHundredths(
    normalizedSegments.reduce((sum, segment) => sum + segment.duration, 0),
  );
  const adjustmentHours = roundToHundredths(24 - totalBeforeAdjustment);

  if (normalizedSegments.length > 0 && Math.abs(adjustmentHours) >= 0.01) {
    const lastSegment = normalizedSegments[normalizedSegments.length - 1];
    lastSegment.end = roundToHundredths(lastSegment.end + adjustmentHours);
    lastSegment.duration = roundToHundredths(lastSegment.end - lastSegment.start);
  }

  const rowTotals = normalizedSegments.reduce(
    (totals, segment) => {
      if (segment.row in totals) {
        totals[segment.row] = roundToHundredths(totals[segment.row] + segment.duration);
      }

      return totals;
    },
    { ...DUTY_ROW_TOTALS },
  );

  const totalHours = roundToHundredths(
    Object.values(rowTotals).reduce((sum, value) => sum + value, 0),
  );
  const transitions = normalizedSegments
    .slice(1)
    .map((segment, index) => {
      const previousSegment = normalizedSegments[index];

      if (previousSegment.row === segment.row) {
        return null;
      }

      return {
        time: segment.start,
        fromRow: previousSegment.row,
        toRow: segment.row,
        fromStatus: previousSegment.status,
        toStatus: segment.status,
      };
    })
    .filter(Boolean);

  return {
    segments: normalizedSegments,
    rowTotals,
    totalHours,
    isValid24Hour: Math.abs(totalHours - 24) < 0.01,
    adjustmentHours,
    transitions,
  };
}

export function buildDriverMetadata({ trip, route, day, totalDays }) {
  const seed = hashString(
    [
      trip?.id || "trip",
      trip?.current_location || "",
      trip?.pickup_location || "",
      trip?.dropoff_location || "",
    ].join("|"),
  );
  const locations = buildDayLocations({
    trip,
    route,
    dayNumber: day.day,
    totalDays,
  });
  const tripDate = trip?.created_at ? new Date(trip.created_at) : new Date();
  const logDate = Number.isNaN(tripDate.getTime())
    ? new Date()
    : addDays(new Date(tripDate.setHours(0, 0, 0, 0)), Math.max(day.day - 1, 0));

  return {
    ...locations,
    driverName: `${pickSeeded(DRIVER_FIRST_NAMES, seed)} ${pickSeeded(
      DRIVER_LAST_NAMES,
      seed,
      2,
    )}`,
    carrierName: pickSeeded(CARRIER_NAMES, seed, 1),
    truckNumber: `TRK-${100 + (seed % 900)}`,
    trailerNumber: `TRL-${1000 + (seed % 9000)}`,
    shipmentId: `SHP-${String(trip?.id ?? seed % 100000).padStart(5, "0")}-${String(
      day.day,
    ).padStart(2, "0")}`,
    dateLabel: formatLongDate(logDate),
    totalMilesToday: `${formatDecimal(day.distance)} mi`,
    cycleUsed: `${formatDecimal(day.cycle_hours_used)} / 70h`,
  };
}

export function buildDutySummaryText(segments) {
  return segments
    .map((segment) => {
      const label =
        segment.status === "on_duty"
          ? "on duty"
          : segment.status === "sleeper_berth"
            ? "sleeper"
            : segment.status === "break"
              ? "break"
              : segment.status;

      return `${formatTimelineRange(segment.start, segment.end)} ${label}`;
    })
    .join(" • ");
}

export function buildEldRemarks({ day, trip, route, totalDays, segments }) {
  if (!segments.length) {
    return [];
  }

  const locations = buildDayLocations({
    trip,
    route,
    dayNumber: day.day,
    totalDays,
  });

  const routeStops = [
  locations.currentLocation,
  locations.pickupLocation,
  "Fuel stop checkpoint",
  locations.enRouteLocation,
  locations.dropoffLocation,
];

const fuelStopLocation =
  routeStops[Math.min(day.day + 1, routeStops.length - 2)];

const overnightLocation =
  day.day === totalDays
    ? locations.dropoffLocation
    : `Rest area near ${locations.enRouteLocation}`;

  const onDutySegment = segments.find((segment) => segment.row === "on_duty");
  const firstDrivingSegment = segments.find((segment) => segment.status === "driving");
  const breakSegment = segments.find((segment) => segment.status === "break");
  const lastDrivingSegment = [...segments]
    .reverse()
    .find((segment) => segment.status === "driving");
  const offDutySegment = [...segments]
    .reverse()
    .find((segment) => segment.status === "off_duty");

  const events = [];

  if (onDutySegment) {
    events.push(
      createEvent(
        onDutySegment.start,
        "Pre-trip inspection started",
        locations.startLocation,
        "DVIR, dispatch notes, and equipment walkaround opened.",
      ),
    );

    if (day.day === 1) {
      events.push(
        createEvent(
          onDutySegment.end,
          "Pickup completed and bills signed",
          locations.pickupLocation,
          `Load released toward ${locations.dropoffLocation}.`,
        ),
      );
    } else {
      events.push(
        createEvent(
          onDutySegment.end,
          "Post-reset dispatch check completed",
          locations.startLocation,
          `Route released for the next linehaul segment to ${locations.dropoffLocation}.`,
        ),
      );
    }
  }

  if (firstDrivingSegment) {
    events.push(
      createEvent(
        firstDrivingSegment.start,
        "Linehaul driving started",
        locations.dispatchLocation,
        `Truck departed ${locations.dispatchLocation} toward ${locations.dropoffLocation}.`,
      ),
    );
  }

  if (breakSegment) {
    events.push(
      createEvent(
        breakSegment.end,
        "30-minute FMCSA break completed",
        fuelStopLocation,
        `Fuel stop, safety inspection, and required break completed near ${fuelStopLocation}.`,
      ),
    );
  }

  if (lastDrivingSegment) {
    if (day.day === totalDays) {
      events.push(
        createEvent(
          lastDrivingSegment.end,
          "Delivery completed and arrival logged",
          locations.dropoffLocation,
          "Consignee handoff and arrival event recorded in the shipment file.",
        ),
      );
    } else {
      events.push(
        createEvent(
          lastDrivingSegment.end,
          "Daily driving block completed",
          locations.endLocation,
          `Driver parked with ${formatHours(day.cycle_remaining_hours)} remaining on cycle.`,
        ),
      );
    }
  }

  if (offDutySegment) {
    events.push(
      createEvent(
        offDutySegment.start,
        "Off-duty reset started",
        overnightLocation,
        day.day === totalDays
          ? "Vehicle secured after final delivery and driver released from duty."
          : `Driver parked for overnight reset near ${overnightLocation}.`,
      ),
    );
  }

  return events.sort((left, right) => left.time - right.time);
}
