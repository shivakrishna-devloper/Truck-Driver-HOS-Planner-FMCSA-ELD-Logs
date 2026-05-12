function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function getProjectedCycleRemaining(schedule, currentCycleUsed = 0) {
  if (schedule.length > 0) {
    return Number(schedule.at(-1)?.cycle_remaining_hours || 0);
  }

  return clamp(70 - Number(currentCycleUsed || 0), 0, 70);
}

export function getFuelStopEstimate(route) {
  if (!route?.distance_miles) {
    return 0;
  }

  return Math.max(Math.ceil(Number(route.distance_miles) / 850) - 1, 0);
}

export function getComplianceScoreForDay(day) {
  if (!day) {
    return 0;
  }

  const fatiguePenalty = Math.max(Number(day.driving_hours || 0) - 8, 0) * 3.4;
  const cyclePenalty =
    Number(day.cycle_remaining_hours || 0) < 12
      ? (12 - Number(day.cycle_remaining_hours || 0)) * 1.5
      : 0;
  const breakPenalty =
    day.break_required && Number(day.break_hours || 0) < 0.5 ? 18 : 0;
  const resetPenalty = Number(day.off_duty_hours || 0) < 10 ? 22 : 0;

  return clamp(
    Math.round(100 - fatiguePenalty - cyclePenalty - breakPenalty - resetPenalty),
    72,
    100,
  );
}

export function getOverallComplianceScore(schedule) {
  if (!schedule.length) {
    return 94;
  }

  const aggregate = schedule.reduce(
    (total, day) => total + getComplianceScoreForDay(day),
    0,
  );

  return Math.round(aggregate / schedule.length);
}

export function getComplianceTone(score) {
  if (score >= 92) {
    return "good";
  }

  if (score >= 84) {
    return "warning";
  }

  if (score > 0) {
    return "risk";
  }

  return "neutral";
}

export function getFleetHealth(complianceScore) {
  if (complianceScore >= 94) {
    return {
      label: "Fleet health optimal",
      value: 96,
      tone: "good",
      detail: "Dispatch windows and rest resets are well balanced.",
    };
  }

  if (complianceScore >= 86) {
    return {
      label: "Fleet health stable",
      value: 88,
      tone: "warning",
      detail: "Watch cycle buffers on later driving days.",
    };
  }

  return {
    label: "Fleet health watchlist",
    value: 78,
    tone: "risk",
    detail: "Reduce cycle compression before assigning more miles.",
  };
}

export function getDriverStatus(schedule) {
  if (!schedule.length) {
    return {
      label: "Awaiting dispatch",
      detail: "No active trip generated",
      tone: "neutral",
    };
  }

  const firstDay = schedule[0];

  if (Number(firstDay.off_duty_hours || 0) >= 11) {
    return {
      label: "Sleeper reset protected",
      detail: `${firstDay.off_duty_hours}h off duty planned`,
      tone: "good",
    };
  }

  if (firstDay.break_required) {
    return {
      label: "Break-managed route",
      detail: "30-minute break inserted automatically",
      tone: "warning",
    };
  }

  return {
    label: "Dispatch-ready shift",
    detail: "Standard duty cycle window",
    tone: "good",
  };
}

export function getDutyStatus(day) {
  if (!day) {
    return {
      label: "Awaiting route",
      tone: "neutral",
    };
  }

  if (Number(day.cycle_remaining_hours || 0) < 8) {
    return {
      label: "Cycle-constrained",
      tone: "risk",
    };
  }

  if (day.break_required && Number(day.driving_hours || 0) >= 10) {
    return {
      label: "Tight drive window",
      tone: "warning",
    };
  }

  if (day.break_required) {
    return {
      label: "Break managed",
      tone: "good",
    };
  }

  return {
    label: "Standard duty plan",
    tone: "good",
  };
}

export function getFatigueRisk(day) {
  if (!day) {
    return {
      label: "Low",
      score: 22,
      tone: "good",
    };
  }

  const drivingFactor = Number(day.driving_hours || 0) * 7;
  const cycleFactor =
    Number(day.cycle_remaining_hours || 0) < 14
      ? (14 - Number(day.cycle_remaining_hours || 0)) * 2.2
      : 0;
  const riskScore = clamp(Math.round(drivingFactor + cycleFactor), 20, 95);

  if (riskScore >= 72) {
    return {
      label: "Elevated",
      score: riskScore,
      tone: "risk",
    };
  }

  if (riskScore >= 48) {
    return {
      label: "Moderate",
      score: riskScore,
      tone: "warning",
    };
  }

  return {
    label: "Low",
    score: riskScore,
    tone: "good",
  };
}

export function getAnalyticsMetrics({ route, schedule, currentCycleUsed }) {
  const complianceScore = getOverallComplianceScore(schedule);
  const fuelStops = getFuelStopEstimate(route);
  const projectedRemaining = getProjectedCycleRemaining(schedule, currentCycleUsed);

  return [
    {
      id: "distance",
      label: "Total Distance",
      value: route?.distance_miles,
      valueType: "miles",
      note: route ? `${route.legs?.length || 0} routed dispatch legs` : "Generate a route to populate corridor intelligence",
      delta: fuelStops > 0 ? `${fuelStops} fuel stops forecast` : "Direct linehaul forecast",
      tone: "sky",
    },
    {
      id: "drive-time",
      label: "Estimated Drive Time",
      value: route?.duration_hours,
      valueType: "hours",
      note: "OpenRouteService truck ETA",
      delta: schedule.length ? `${schedule.length} operating day${schedule.length > 1 ? "s" : ""}` : "HOS day count pending",
      tone: "indigo",
    },
    {
      id: "days",
      label: "Driving Days",
      value: schedule.length || null,
      valueType: "number",
      note: schedule.length ? "Multi-day HOS schedule generated" : "Trip days will appear after dispatch planning",
      delta: schedule.length ? `${schedule.filter((day) => day.break_required).length} FMCSA break day${schedule.filter((day) => day.break_required).length !== 1 ? "s" : ""}` : "Break cadence pending",
      tone: "emerald",
    },
    {
      id: "cycle-used",
      label: "Current Cycle Used",
      value: currentCycleUsed,
      valueType: "hours",
      note: "Starting 70-hour cycle load",
      delta: `${clamp(70 - Number(currentCycleUsed || 0), 0, 70)}h currently available`,
      tone: "amber",
    },
    {
      id: "cycle-remaining",
      label: "Remaining Cycle Hours",
      value: projectedRemaining,
      valueType: "hours",
      note: schedule.length ? "Projected remaining hours on arrival" : "Projected post-trip buffer",
      delta: projectedRemaining < 10 ? "Watch late-trip cycle exposure" : "Healthy compliance buffer",
      tone: "violet",
    },
    {
      id: "compliance",
      label: "Compliance Score",
      value: complianceScore,
      valueType: "percent",
      note: "Derived from cycle, break, and reset coverage",
      delta: `${getComplianceTone(complianceScore) === "good" ? "Compliant trip design" : "Needs monitoring"}`,
      tone: "teal",
    },
  ];
}

function getDrivingSegments(day) {
  return day?.eld_log?.segments?.filter((segment) => segment.status === "driving") || [];
}

export function buildOperationsTimeline(schedule, route, trip) {
  return schedule.map((day, index) => {
    const events = [];
    const eldLog = day.eld_log;
    const drivingSegments = getDrivingSegments(day);
    const firstDriving = drivingSegments[0];
    const lastDriving = drivingSegments.at(-1);
    const breakSegment = eldLog?.segments?.find((segment) => segment.status === "break");
    const sleeperSegment = eldLog?.segments?.find(
      (segment) =>
        segment.status === "off_duty" || segment.status === "sleeper_berth",
    );

    events.push({
      id: `dispatch-${day.day}`,
      time: eldLog?.shift?.start ?? 0,
      type: "dispatch",
      title: day.day === 1 ? "Dispatch released" : "Daily duty window opened",
      badge: `Day ${day.day}`,
      description:
        day.day === 1
          ? `Trip staged from ${trip?.current_location || "current location"} with ${day.on_duty_not_driving}h of pre-trip on-duty time.`
          : `Fresh duty cycle opened with ${day.off_duty_hours}h of rest protection.`,
    });

    if (index === 0) {
      events.push({
        id: `pickup-${day.day}`,
        time: (eldLog?.shift?.start ?? 0) + Math.min(Number(day.on_duty_not_driving || 0), 0.5),
        type: "pickup",
        title: "Pickup sequence confirmed",
        badge: route?.waypoints?.[1]?.label || "Pickup",
        description: route?.waypoints?.[1]?.resolved_name || trip?.pickup_location,
      });
    }

    if (firstDriving) {
      events.push({
        id: `drive-start-${day.day}`,
        time: firstDriving.start,
        type: "driving",
        title: "Driving block started",
        badge: `${day.distance} mi`,
        description: `Primary linehaul window runs ${firstDriving.duration}h before the next operational checkpoint.`,
      });
    }

    if (breakSegment) {
      events.push({
        id: `break-${day.day}`,
        time: breakSegment.start,
        type: "break",
        title: "FMCSA 30-minute break",
        badge: "Compliance",
        description:
          "Non-driving stop inserted to protect HOS compliance and create a fueling opportunity.",
      });

      events.push({
        id: `fuel-${day.day}`,
        time: breakSegment.end,
        type: "fuel",
        badge: "Ops",
        title: "Fuel and safety check window",
        description:
          "Recommended dispatch checkpoint for fueling, load check, and route confirmation.",
      });
    }

    if (index === schedule.length - 1 && lastDriving) {
      events.push({
        id: `delivery-${day.day}`,
        time: lastDriving.end,
        type: "delivery",
        badge: "Delivery",
        title: "Delivery window secured",
        description: trip?.dropoff_location || route?.waypoints?.at(-1)?.resolved_name,
      });
    }

    if (sleeperSegment) {
      events.push({
        id: `reset-${day.day}`,
        time: eldLog?.shift?.end ?? sleeperSegment.start,
        type: sleeperSegment.status === "sleeper_berth" ? "sleeper" : "rest",
        badge: `${day.off_duty_hours}h`,
        title:
          sleeperSegment.status === "sleeper_berth"
            ? "Sleeper berth reset begins"
            : "Off-duty reset begins",
        description:
          "Driver transitions into reset time to preserve the next duty cycle window.",
      });
    }

    return {
      day,
      events: events.sort((left, right) => left.time - right.time),
    };
  });
}
