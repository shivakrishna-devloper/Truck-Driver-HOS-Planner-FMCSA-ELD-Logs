import {
  CalendarDays,
  Clock3,
  Gauge,
  Route,
  ShieldCheck,
  TimerReset,
} from "lucide-react";
import MetricCard from "./MetricCard";
import { getAnalyticsMetrics } from "../utils/dashboard";

const metricIcons = {
  distance: Route,
  "drive-time": Clock3,
  days: CalendarDays,
  "cycle-used": Gauge,
  "cycle-remaining": TimerReset,
  compliance: ShieldCheck,
};

function AnalyticsCards({ route, schedule, currentCycleUsed }) {
  const metrics = getAnalyticsMetrics({
    route,
    schedule,
    currentCycleUsed,
  });

  return (
    <section id="dashboard" className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
      {metrics.map((metric, index) => (
        <MetricCard
          key={metric.id}
          icon={metricIcons[metric.id]}
          index={index}
          {...metric}
        />
      ))}
    </section>
  );
}

export default AnalyticsCards;
