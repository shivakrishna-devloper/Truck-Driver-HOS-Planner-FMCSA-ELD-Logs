import { Bell, Menu, Search, ShieldCheck, UserCircle2 } from "lucide-react";
import ComplianceBadge from "./ComplianceBadge";

function Topbar({ onOpenSidebar, driverStatus, fleetHealth, complianceScore }) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/8 bg-slate-950/75 backdrop-blur-xl">
      <div className="px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenSidebar}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="relative min-w-0 flex-1 xl:w-[28rem]">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Search route, stop, driver, load, or compliance event"
                className="h-12 w-full rounded-[1.15rem] border border-white/10 bg-white/6 pl-11 pr-4 text-sm text-white outline-none ring-0 placeholder:text-slate-400 focus:border-sky-400/40 focus:bg-white/8"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <div className="hidden rounded-[1.15rem] border border-white/10 bg-white/6 px-4 py-3 xl:block">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                Driver Status
              </p>
              <div className="mt-2 flex items-center gap-3">
                <ComplianceBadge label={driverStatus.label} tone={driverStatus.tone} />
                <span className="text-sm text-slate-300">{driverStatus.detail}</span>
              </div>
            </div>

            <div className="hidden rounded-[1.15rem] border border-white/10 bg-white/6 px-4 py-3 sm:block">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                Fleet Health
              </p>
              <div className="mt-2 flex items-center gap-2 text-sm text-white">
                <ShieldCheck className="h-[18px] w-[18px] text-emerald-300" />
                <span>{fleetHealth.value}% stable</span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-300">{complianceScore}% compliance</span>
              </div>
            </div>

            <button
              type="button"
              className="relative inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-white transition hover:bg-white/10"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(16,185,129,0.15)]" />
            </button>

            <div className="flex items-center gap-3 rounded-[1.15rem] border border-white/10 bg-white/6 px-3 py-2 text-white">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold">Jordan Miles</p>
                <p className="text-xs text-slate-400">Fleet Operations Lead</p>
              </div>
              <UserCircle2 className="h-9 w-9 text-slate-200" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Topbar;
