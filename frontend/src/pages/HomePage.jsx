import { startTransition, useDeferredValue, useState } from "react";
import ELDLogSheet from "../components/ELDLogSheet";
import HOSSchedule from "../components/HOSSchedule";
import RouteMap from "../components/RouteMap";
import SummaryCards from "../components/SummaryCards";
import TripForm from "../components/TripForm";
import DashboardLayout from "../layouts/DashboardLayout";
import { createTripPlan } from "../services/api";
import { formatHours } from "../utils/formatters";

const defaultFormData = {
  current_location: "",
  pickup_location: "",
  dropoff_location: "",
  current_cycle_used: "",
};

function HomePage() {
  const [formData, setFormData] = useState(defaultFormData);
  const [plannerData, setPlannerData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const deferredSchedule = useDeferredValue(plannerData?.hos_schedule || []);
  const currentCycleUsed = Number(formData.current_cycle_used || 0);
  const activeTrip = plannerData?.trip;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        ...formData,
        current_cycle_used: Number(formData.current_cycle_used || 0),
      };
      const { data } = await createTripPlan(payload);

      startTransition(() => {
        setPlannerData(data);
      });
    } catch (requestError) {
      const detail =
        requestError.response?.data?.detail ||
        requestError.response?.data?.message ||
        "The trip planner could not build a route. Check the stops and backend OpenRouteService configuration.";
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
            Trucking HOS & ELD Platform
          </p>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-slate-900">
            Clean trip planning, route visibility, and ELD compliance in one workflow.
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
            Build truck routes with OpenRouteService, calculate multi-day HOS schedules,
            and review FMCSA-style ELD logs in a responsive web application designed for
            dispatch and operations teams.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <div className="rounded-[1.75rem] border border-slate-200 bg-slate-900 p-6 text-white shadow-sm">
            <p className="text-sm font-semibold text-slate-300">Current Trip State</p>
            <p className="mt-3 font-display text-2xl font-semibold">
              {activeTrip
                ? `${activeTrip.pickup_location} to ${activeTrip.dropoff_location}`
                : `${formData.pickup_location} to ${formData.dropoff_location}`}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {plannerData
                ? "Route, HOS schedule, and ELD logs are ready below."
                : "Use the form below to generate a complete trucking trip plan."}
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Current Cycle Used</p>
            <p className="mt-3 font-display text-3xl font-semibold text-slate-900">
              {formatHours(currentCycleUsed)}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              This value is sent directly to the existing backend HOS calculator to track
              remaining cycle hours across multi-day trips.
            </p>
          </div>
        </div>
      </section>

      <TripForm
        formData={formData}
        loading={loading}
        error={error}
        successMessage={plannerData?.message}
        onChange={handleChange}
        onSubmit={handleSubmit}
      />

      {loading && (
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />

          <h2 className="mt-6 text-2xl font-semibold text-slate-900">
            Generating Route & Logs
          </h2>

          <p className="mt-3 text-sm leading-7 text-slate-600">
            Calculating truck route, HOS schedules, and FMCSA ELD logs...
          </p>
        </div>
      )}

      {!loading && !plannerData && (
        <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">
            Generate a Truck Route
          </h2>

          <p className="mt-3 text-sm leading-7 text-slate-600">
            Enter trip locations and cycle usage to generate truck routing,
            HOS schedules, and FMCSA ELD logs.
          </p>
        </div>
      )}

      {plannerData && (
        <>
          <SummaryCards
            route={plannerData?.route}
            schedule={deferredSchedule}
            currentCycleUsed={currentCycleUsed}
          />

          <RouteMap route={plannerData?.route} loading={loading} />

          <HOSSchedule
            schedule={deferredSchedule}
            trip={plannerData?.trip}
          />

          <section id="eld-logs" className="space-y-5">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
                ELD Daily Logs
              </p>

              <h2 className="mt-2 font-display text-3xl font-semibold text-slate-900">
                FMCSA Daily Logs
              </h2>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                Each day renders a 24-hour timeline with off-duty,
                sleeper berth, driving, break, and on-duty segments
                using the generated backend ELD response.
              </p>
            </div>

            {deferredSchedule.map((day) => (
              <ELDLogSheet
                key={day.day}
                day={day}
                trip={plannerData?.trip}
                route={plannerData?.route}
                totalDays={deferredSchedule.length}
              />
            ))}
          </section>
        </>
      )}
    </DashboardLayout>
  );
}

export default HomePage;
