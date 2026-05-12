import { useEffect } from "react";
import polyline from "@mapbox/polyline";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";
import { formatHours, formatMiles } from "../utils/formatters";

const markerStyles = {
  current: {
    background: "#0f172a",
    border: "#cbd5e1",
  },
  pickup: {
    background: "#f59e0b",
    border: "#fef3c7",
  },
  dropoff: {
    background: "#2563eb",
    border: "#bfdbfe",
  },
};

function createMarkerIcon(index, kind) {
  const markerTheme = markerStyles[kind] || markerStyles.current;

  return L.divIcon({
    className: "",
    html: `
      <div style="
        width: 36px;
        height: 36px;
        border-radius: 999px;
        background: ${markerTheme.background};
        border: 3px solid ${markerTheme.border};
        box-shadow: 0 8px 18px rgba(15, 23, 42, 0.18);
        color: white;
        display: grid;
        place-items: center;
        font-weight: 700;
        font-size: 14px;
      ">
        ${index}
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

function MapViewport({ bounds, positions }) {
  const map = useMap();

  useEffect(() => {
    if (bounds?.length === 2) {
      map.fitBounds(bounds, { padding: [28, 28] });
      return;
    }

    if (positions.length > 0) {
      map.fitBounds(positions, { padding: [28, 28] });
    }
  }, [bounds, map, positions]);

  return null;
}

function EmptyMapState({ loading }) {
  return (
    <section
      id="route-map"
      className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
            Route Visualization
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-slate-900">
            Trip Route Overview
          </h2>
          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
            Powered by OpenRouteService truck routing
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Generate a trip plan to render the OpenRouteService truck geometry,
            multi-stop dispatch legs, and stop markers for the current, pickup,
            and dropoff sequence.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="flex min-h-[360px] items-center justify-center rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-6 text-center text-sm text-slate-500">
            {loading
              ? "Calculating truck route and preparing map layers..."
              : "Generate a trip plan to visualize truck-safe routing, dispatch stops, and FMCSA trip progression."}
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-6 text-slate-700">
            <p className="text-sm font-semibold text-slate-900">What this section shows</p>
            <div className="mt-5 space-y-4 text-sm">
              <div>
                <p className="font-semibold text-slate-900">Truck-safe route path</p>
                <p className="mt-1 text-slate-600">
                  Encoded `driving-hgv` geometry visualized with React Leaflet.
                </p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Dispatch leg summaries</p>
                <p className="mt-1 text-slate-600">
                  Distances and ETAs for each operational handoff.
                </p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Stop sequencing</p>
                <p className="mt-1 text-slate-600">
                  Current location, pickup, and final delivery in order.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function RouteMap({ route, loading }) {
  if (!route?.geometry) {
    return <EmptyMapState loading={loading} />;
  }

  const positions = polyline.decode(route.geometry);

  return (
    <section
      id="route-map"
      className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
            Route Visualization
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-slate-900">
            Trip Route Overview
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Real truck routing from the current location through pickup and dropoff,
            with truck-safe geometry, markers, and stop details.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />  
          {formatMiles(route.distance_miles)} • {formatHours(route.duration_hours)}
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="overflow-hidden rounded-[1.75rem] border border-slate-200">
          <MapContainer
            center={positions[0]}
            zoom={5}
            scrollWheelZoom={true}
            className="h-[360px] md:h-[420px] w-full"
          >
            <TileLayer
              attribution='&copy; OpenStreetMap contributors &copy; CARTO'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
            <MapViewport bounds={route.bounds} positions={positions} />

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
                color: "#0f766e",
                weight: 5,
                opacity: 0.85,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
          </MapContainer>
        </div>

        <div className="space-y-4">
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-900">Route summary</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Total Distance
                </p>
                <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
                  {formatMiles(route.distance_miles)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Routed Duration
                </p>
                <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
                  {formatHours(route.duration_hours)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-slate-900">
                Dispatch legs
              </h3>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                {route.legs?.length || 0} legs
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {route.legs?.map((leg) => (
                <article
                  key={leg.name}
                  className="rounded-[1.25rem] border border-slate-200 bg-white p-4"
                >
                  <p className="text-sm font-semibold text-slate-900">{leg.name}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {leg.start_label} to {leg.end_label}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
                    <span className="rounded-full bg-slate-100 px-3 py-1">
                      {formatMiles(leg.distance_miles)}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1">
                      {formatHours(leg.duration_hours)}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
            <h3 className="font-display text-lg font-semibold text-slate-900">
              Stop order
            </h3>
            <div className="mt-4 space-y-3">
              {route.waypoints?.map((waypoint, index) => (
                <div
                  key={`${waypoint.kind}-${waypoint.query}`}
                  className="flex items-start gap-3 rounded-[1.2rem] border border-slate-200 bg-slate-50 p-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      {waypoint.label}
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {waypoint.resolved_name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{waypoint.query}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default RouteMap;
