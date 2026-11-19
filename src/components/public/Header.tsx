import Link from "next/link";
import { Dumbbell, MapPin, ShieldCheck, Sparkles, UserCircle } from "lucide-react";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
              <Dumbbell className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-white">
                Rep<span className="text-emerald-400">Sync</span>
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-500">
                Live Verified Fitness
              </span>
            </div>
          </Link>

          <div className="hidden sm:flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-300">
            <MapPin className="h-3.5 w-3.5 text-emerald-400" />
            <span className="font-semibold text-white">Bengaluru</span>
            <span className="text-slate-500">• Launch City</span>
          </div>
        </div>

        <nav className="flex items-center gap-3">
          <Link
            href="/#explore"
            className="text-xs sm:text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Explore Gyms
          </Link>
          <Link
            href="/owner/dashboard"
            className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs sm:text-sm font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-all"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Owner Portal</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
