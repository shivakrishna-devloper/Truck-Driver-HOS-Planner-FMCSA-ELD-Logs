import { MapPinned, ShieldCheck, Truck } from "lucide-react";

const navItems = [
  { label: "Trip Planner", href: "#trip-planner" },
  { label: "Route Map", href: "#route-map" },
  { label: "HOS Schedule", href: "#hos-schedule" },
  { label: "ELD Logs", href: "#eld-logs" },
];

function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
              
            </p>
            <h1 className="font-display text-xl font-semibold text-slate-900">
              Truck Driver HOS Planner
            </h1>
            <h4>
              FMCSA Hours of Service Route & ELD Planning
            </h4>
          </div>
        </div>

        <nav className="flex flex-wrap gap-2">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex flex-wrap gap-2">
          
          
        </div>
      </div>
    </header>
  );
}

export default Navbar;
