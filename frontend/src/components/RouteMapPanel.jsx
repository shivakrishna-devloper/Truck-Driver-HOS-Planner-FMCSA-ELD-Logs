import { useEffect } from "react";
import polyline from "@mapbox/polyline";
import { motion } from "framer-motion";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Fuel, Route as RouteIcon, TimerReset, Truck } from "lucide-react";
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";
import ComplianceBadge from "./ComplianceBadge";
import {
  getComplianceTone,
  getFuelStopEstimate,
  getOverallComplianceScore,
} from "../utils/dashboard";
import { formatHours, formatMiles } from "../utils/formatters";

const markerStyles = {
  current: {
    background: "#0f172a",
    border: "#cbd5e1",
    glow: "0 10px 30px rgba(15, 23, 42, 0.38)",
  },
  pickup: {
    background: "#f59e0b",
    border: "#fef3c7",
    glow: "0 10px 30px rgba(245, 158, 11, 0.42)",
  },
  dropoff: {
    background: "#0ea5e9",
    border: "#bae6fd",
    glow: "0 10px 30px rgba(14, 165, 233, 0.42)",
  },
};

function createMarkerIcon(index, kind) {
  const markerTheme = markerStyles[kind] || markerStyles.current;

  return L.divIcon({
    className: "",
    html: `
      <div style="
        width: 38px;
        height: 38px;
        border-radius: 999px;
        background: ${markerTheme.background};
        border: 3px solid ${markerTheme.border};
        box-shadow: ${markerTheme.glow};
        color: white;
        display: grid;
        place-items: center;
        font-weight: 700;
        font-size: 14px;
      ">
        ${index}
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  });
}

function FitToRoute({ bounds, positions }) {
  const map = useMap();

  useEffect(() => {
    if (bounds?.length === 2) {
      map.fitBounds(bounds, { padding: [40, 40] });
      return;
    }

    if (positions.length > 0) {
      map.fitBounds(positions, { padding: [40, 40] });
    }
  }, [bounds, map, positions]);

  return null;
}

function EmptyState({ loading }) {
  return (
    <div className="flex h-[560px] flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-white/12 bg-slate-900/70 px-6 text-center">
      <div className="inline-flex rounded-2xl bg-white/8 p-4 text-slate-100">
        <RouteIcon className="h-8 w-8" />
      </div>
      <h3 className="mt-6 font-display text-2xl font-semibold text-white">
        {loading ? "Building truck-safe route geometry" : "No route generated yet"}
      </h3>
      <p className="mt-3 max-w-lg text-sm leading-6 text-slate-400">
        {loading
          ? "OpenRouteService truck routing is processing the current, pickup, and dropoff corridor."
          : "Generate a trip to render the multi-stop route map, overlays, and dispatch legs."}
      </p>
    </div>
  );
}

function RouteMapPanel({ route, schedule, loading }) {
  const complianceScore = getOverallComplianceScore(schedule);
  const fuelStops = getFuelStopEstimate(route);

  if (!route?.geometry) {
    return (
      <motion.section
        id="fleet"
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.35 }}
        className="rounded-[2rem] border border-white/8 bg-slate-950 p-5 text-white shadow-[0_32px_90px_-42px_rgba(2,6,23,0.92)]"
      >
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Fleet Corridor
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold">
              Routed operations map
            </h2>
          </div>
          <ComplianceBadge label="Awaiting route" tone="neutral" />
        </div>
        <EmptyState loading={loading} />
      </motion.section>
    );
  }

  const positions = polyline.decode(route.geometry);

  return (
    <motion.section
      id="fleet"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.35 }}
      className="xl:sticky xl:top-24"
    >
      <div className="overflow-hidden rounded-[2rem] border border-white/8 bg-slate-950 p-5 text-white shadow-[0_32px_90px_-42px_rgba(2,6,23,0.92)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Fleet Corridor
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold">
              Premium route operations map
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Live truck route visualization with multi-stop sequencing, compliance overlays,
              and dispatch leg context for operations control.
            </p>
          </div>
          <ComplianceBadge
            label={`${complianceScore}% compliant`}
            tone={getComplianceTone(complianceScore)}
          />
        </div>

        <div className="mt-5 overflow-hidden rounded-[1.75rem] border border-white/8 bg-slate-900">
          <div className="relative">
            <MapContainer
              center={positions[0]}
              zoom={5}
              scrollWheelZoom={false}
              className="h-[460px] w-full lg:h-[560px]"
            >
              <TileLayer
                attribution='&copy; OpenStreetMap contributors &copy; CARTO'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
              <FitToRoute bounds={route.bounds} positions={positions} />

              {route.waypoints?.map((waypoint, index) => (
                <Marker
                  key={`${waypoint.kind}-${waypoint.latitude}-${waypoint.longitude}`}
                  position={[waypoint.latitude, waypoint.longitude]}
                  icon={createMarkerIcon(index + 1, waypoint.kind)}
                />
              ))}

              <Polyline
                positions={positions}
                pathOptions={{
                  color: "#22d3ee",
                  weight: 6,
                  opacity: 0.9,
                }}
              />
            </MapContainer>

            <div className="pointer-events-none absolute inset-x-4 top-4 flex flex-col gap-3 lg:flex-row lg:justify-between">
              <div className="pointer-events-auto max-w-xl rounded-[1.4rem] border border-white/10 bg-slate-950/78 p-4 backdrop-blur">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                      Distance
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {formatMiles(route.distance_miles)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                      ETA
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {formatHours(route.duration_hours)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                      Fuel Stops
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {fuelStops}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                      Status
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">Compliant</p>
                  </div>
                </div>
              </div>

              <div className="pointer-events-auto flex flex-wrap gap-2 lg:max-w-sm lg:justify-end">
                {route.waypoints?.map((waypoint, index) => (
                  <span
                    key={`${waypoint.kind}-${waypoint.query}`}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/78 px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-100 backdrop-blur"
                  >
                    <span className="inline-grid h-6 w-6 place-items-center rounded-full bg-white/10 text-[11px]">
                      {index + 1}
                    </span>
                    {waypoint.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[1.6rem] border border-white/8 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-white">
                Dispatch waypoints
              </h3>
              <span className="rounded-full bg-white/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
                {route.waypoints?.length || 0} stops
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {route.waypoints?.map((waypoint, index) => (
                <div
                  key={`${waypoint.kind}-${waypoint.query}`}
                  className="flex items-start gap-3 rounded-[1.25rem] border border-white/8 bg-slate-900/75 px-4 py-3"
                >
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/8 text-sm font-semibold text-white">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                      {waypoint.label}
                    </p>
                    <p className="mt-1 text-sm font-medium text-white">
                      {waypoint.resolved_name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{waypoint.query}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-white/8 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-white">
                Routed legs
              </h3>
              <span className="rounded-full bg-white/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
                Corridor detail
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {route.legs?.map((leg, index) => (
                <article
                  key={leg.name}
                  className="rounded-[1.25rem] border border-white/8 bg-slate-900/75 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-white">{leg.name}</p>
                      <p className="mt-1 text-sm text-slate-400">
                        {leg.start_label} to {leg.end_label}
                      </p>
                    </div>
                    <span className="rounded-full bg-white/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
                      Leg {index + 1}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-white/5 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                        Mileage
                      </p>
                      <p className="mt-2 text-sm font-medium text-white">
                        {formatMiles(leg.distance_miles)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/5 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                        Duration
                      </p>
                      <p className="mt-2 text-sm font-medium text-white">
                        {formatHours(leg.duration_hours)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <div className="rounded-[1.35rem] border border-white/8 bg-white/5 px-4 py-4">
            <div className="flex items-center gap-3 text-slate-200">
              <RouteIcon className="h-[18px] w-[18px] text-sky-300" />
              <span className="text-sm font-medium">Truck-safe route</span>
            </div>
          </div>
          <div className="rounded-[1.35rem] border border-white/8 bg-white/5 px-4 py-4">
            <div className="flex items-center gap-3 text-slate-200">
              <TimerReset className="h-[18px] w-[18px] text-teal-300" />
              <span className="text-sm font-medium">HOS-aware pacing</span>
            </div>
          </div>
          <div className="rounded-[1.35rem] border border-white/8 bg-white/5 px-4 py-4">
            <div className="flex items-center gap-3 text-slate-200">
              <Fuel className="h-[18px] w-[18px] text-amber-300" />
              <span className="text-sm font-medium">Fuel checkpoints</span>
            </div>
          </div>
          <div className="rounded-[1.35rem] border border-white/8 bg-white/5 px-4 py-4">
            <div className="flex items-center gap-3 text-slate-200">
              <Truck className="h-[18px] w-[18px] text-indigo-300" />
              <span className="text-sm font-medium">Dispatch visibility</span>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

export default RouteMapPanel;
