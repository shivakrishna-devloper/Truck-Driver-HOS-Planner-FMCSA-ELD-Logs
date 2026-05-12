import { motion } from "framer-motion";
import { ArrowRight, Flag, Gauge, MapPinned, Warehouse } from "lucide-react";

const fieldMeta = {
  current_location: {
    label: "Current Location",
    placeholder: "Chicago, IL",
    helper: "Driver's live starting point",
    icon: MapPinned,
  },
  pickup_location: {
    label: "Pickup Location",
    placeholder: "Dallas, TX",
    helper: "Freight handoff origin",
    icon: Warehouse,
  },
  dropoff_location: {
    label: "Dropoff Location",
    placeholder: "Los Angeles, CA",
    helper: "Final delivery destination",
    icon: Flag,
  },
  current_cycle_used: {
    label: "Current Cycle Used",
    placeholder: "32",
    helper: "Existing 70-hour cycle load",
    icon: Gauge,
    type: "number",
  },
};

function Field({ name, value, onChange }) {
  const meta = fieldMeta[name];
  const Icon = meta.icon;

  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-200">
        <span className="inline-flex rounded-xl bg-white/8 p-2 text-slate-100">
          <Icon className="h-4 w-4" />
        </span>
        {meta.label}
      </span>
      <input
        type={meta.type || "text"}
        name={name}
        value={value}
        onChange={onChange}
        required
        min={meta.type === "number" ? 0 : undefined}
        max={meta.type === "number" ? 70 : undefined}
        step={meta.type === "number" ? "0.5" : undefined}
        placeholder={meta.placeholder}
        className="h-12 w-full rounded-[1.15rem] border border-white/10 bg-slate-900/85 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-400/40 focus:bg-slate-900"
      />
      <span className="mt-2 block text-xs text-slate-400">{meta.helper}</span>
    </label>
  );
}

function TripPlannerPanel({
  formData,
  onChange,
  onSubmit,
  loading,
  error,
  successMessage,
  route,
}) {
  return (
    <motion.section
      id="trip-planner"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.35 }}
      className="overflow-hidden rounded-[2rem] border border-white/8 bg-slate-950 text-white shadow-[0_30px_80px_-38px_rgba(2,6,23,0.9)]"
    >
      <div className="border-b border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.22),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.18),transparent_30%)] px-5 py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Trip Planner
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold">
              Dispatch a new control-center run
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Use the existing backend planner to generate the truck route, multi-day HOS
              schedule, and ELD-ready logs without changing the API contract.
            </p>
          </div>
          <div className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm font-medium text-slate-200">
            Current → Pickup → Dropoff
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-5 px-5 py-5">
        <div className="grid gap-5 xl:grid-cols-2">
          <Field
            name="current_location"
            value={formData.current_location}
            onChange={onChange}
          />
          <Field
            name="pickup_location"
            value={formData.pickup_location}
            onChange={onChange}
          />
          <Field
            name="dropoff_location"
            value={formData.dropoff_location}
            onChange={onChange}
          />
          <Field
            name="current_cycle_used"
            value={formData.current_cycle_used}
            onChange={onChange}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <motion.button
            type="submit"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            className="inline-flex h-[52px] items-center justify-center gap-2 rounded-[1.2rem] bg-gradient-to-r from-sky-500 via-sky-400 to-teal-400 px-5 text-sm font-semibold text-slate-950 transition disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Generating fleet intelligence..." : "Generate Route & Logs"}
            <ArrowRight className="h-4 w-4" />
          </motion.button>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.2rem] border border-white/10 bg-white/6 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                Routing mode
              </p>
              <p className="mt-2 text-sm font-medium text-white">driving-hgv</p>
            </div>
            <div className="rounded-[1.2rem] border border-white/10 bg-white/6 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                Cycle model
              </p>
              <p className="mt-2 text-sm font-medium text-white">70-hour rolling</p>
            </div>
            <div className="rounded-[1.2rem] border border-white/10 bg-white/6 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                Avg speed
              </p>
              <p className="mt-2 text-sm font-medium text-white">60 mph planning</p>
            </div>
          </div>
        </div>

        {error ? (
          <div className="rounded-[1.25rem] border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        {successMessage ? (
          <div className="rounded-[1.25rem] border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            {successMessage}
          </div>
        ) : null}

        <div className="rounded-[1.5rem] border border-white/8 bg-white/4 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Current operational route string
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-200">
                <span className="rounded-full bg-white/8 px-3 py-1.5">
                  {formData.current_location}
                </span>
                <ArrowRight className="h-4 w-4 text-slate-500" />
                <span className="rounded-full bg-white/8 px-3 py-1.5">
                  {formData.pickup_location}
                </span>
                <ArrowRight className="h-4 w-4 text-slate-500" />
                <span className="rounded-full bg-white/8 px-3 py-1.5">
                  {formData.dropoff_location}
                </span>
              </div>
            </div>

            <div className="rounded-[1.1rem] border border-white/8 bg-slate-900/85 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                Legs surfaced
              </p>
              <p className="mt-2 text-sm font-medium text-white">
                {route?.legs?.length || 0} route segments
              </p>
            </div>
          </div>
        </div>
      </form>
    </motion.section>
  );
}

export default TripPlannerPanel;
