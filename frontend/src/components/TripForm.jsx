import { Gauge, MapPin, Package, Route } from "lucide-react";

const fields = [
  {
    name: "current_location",
    label: "Current Location",
    placeholder: "Chicago, IL",
    icon: MapPin,
    helper: "Driver start point for the trip.",
    type: "text",
  },
  {
    name: "pickup_location",
    label: "Pickup Location",
    placeholder: "Dallas, TX",
    icon: Package,
    helper: "Freight pickup destination.",
    type: "text",
  },
  {
    name: "dropoff_location",
    label: "Dropoff Location",
    placeholder: "Los Angeles, CA",
    icon: Route,
    helper: "Final delivery location.",
    type: "text",
  },
  {
    name: "current_cycle_used",
    label: "Current Cycle Used",
    placeholder: "32",
    icon: Gauge,
    helper: "Current 70-hour cycle usage.",
    type: "number",
  },
];

function TripForm({
  formData,
  loading,
  error,
  successMessage,
  onChange,
  onSubmit,
}) {
  return (
    <section
      id="trip-planner"
      className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
              Trip Planner
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-slate-900">
              Generate Route & Logs
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Enter the current location, pickup, delivery, and cycle usage to build a
              truck-safe route, multi-day HOS schedule, and FMCSA-style ELD logs.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              {fields.map((field) => {
                const Icon = field.icon;

                return (
                  <label key={field.name} className="block">
                    <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
                      <span className="inline-flex rounded-xl bg-slate-100 p-2 text-slate-600">
                        <Icon className="h-4 w-4" />
                      </span>
                      {field.label}
                    </span>
                    <input
                      type={field.type}
                      name={field.name}
                      value={formData[field.name]}
                      onChange={onChange}
                      required
                      min={field.type === "number" ? 0 : undefined}
                      max={field.type === "number" ? 70 : undefined}
                      step={field.type === "number" ? "0.5" : undefined}
                      placeholder={field.placeholder}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                    />
                    <span className="mt-2 block text-xs text-slate-500">{field.helper}</span>
                  </label>
                );
              })}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-900 px-6 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Generating Route & Logs..." : "Generate Route & Logs"}
            </button>

            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            {successMessage ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {successMessage}
              </div>
            ) : null}
          </form>
        </div>

        <div className="space-y-4">
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-900">Planner Assumptions</p>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="rounded-2xl bg-white px-4 py-3">
                11-hour driving limit per day
              </div>
              <div className="rounded-2xl bg-white px-4 py-3">
                30-minute break after 8 driving hours
              </div>
              <div className="rounded-2xl bg-white px-4 py-3">
                10-hour off-duty reset window
              </div>
              <div className="rounded-2xl bg-white px-4 py-3">
                70-hour cycle tracking with 60 mph planning speed
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-900 p-5 text-white">
            <p className="text-sm font-semibold text-slate-200">Sample Flow</p>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <div className="rounded-2xl bg-white/10 px-4 py-3">
                1. Route the truck from the current location
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-3">
                2. Continue through pickup to final dropoff
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-3">
                3. Generate multi-day HOS and ELD outputs
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default TripForm;
