"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  RefreshCw,
  Users,
  QrCode,
  Receipt,
  Tag,
  ExternalLink,
  ChevronDown,
  Dumbbell,
  Menu,
  X,
  Bell,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentGym, setCurrentGym] = useState({
    name: "IronForge Fitness & Performance",
    slug: "ironforge-fitness",
    locality: "Koramangala 5th Block",
  });

  const navigation = [
    { name: "Dashboard", href: "/owner/dashboard", icon: LayoutDashboard },
    { name: "Renewals Desk", href: "/owner/renewals", icon: RefreshCw, badge: "3 Due" },
    { name: "Members & Import", href: "/owner/members", icon: Users },
    { name: "Attendance Scanner", href: "/owner/attendance", icon: QrCode },
    { name: "Billing & GST", href: "/owner/billing", icon: Receipt },
    { name: "Membership Plans", href: "/owner/plans", icon: Tag },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex w-64 flex-col border-r border-slate-800 bg-slate-950 p-4">
        {/* Logo & Platform Name */}
        <div className="flex items-center gap-2.5 px-2 py-3 border-b border-slate-800 pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/20">
            <Dumbbell className="h-4 w-4 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white">
              Rep<span className="text-emerald-400">Sync</span>
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block">
              Studio OS
            </span>
          </div>
        </div>

        {/* Studio Switcher */}
        <div className="mt-4 px-2">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-2.5">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Current Studio</span>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-xs font-bold text-white truncate max-w-[170px]">
                {currentGym.name}
              </span>
            </div>
            <span className="text-[11px] text-emerald-400 font-medium block">
              {currentGym.locality}
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="mt-6 flex-1 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "text-slate-400 hover:bg-slate-900 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`h-4 w-4 ${isActive ? "text-emerald-400" : "text-slate-500"}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Public Listing Quick Link */}
        <div className="mt-auto pt-4 border-t border-slate-800 space-y-2">
          <Link
            href={`/gym/${currentGym.slug}`}
            target="_blank"
            className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-900 hover:text-white transition"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              <span>Public Listing</span>
            </div>
            <ExternalLink className="h-3 w-3 text-slate-500" />
          </Link>
          <div className="flex items-center justify-between px-2 text-[11px] text-slate-500">
            <span>GSTIN: 29AABCU9603R1ZM</span>
            <span className="text-emerald-500 font-semibold">Active</span>
          </div>
        </div>
      </aside>

      {/* Mobile Top Navigation */}
      <div className="md:hidden flex h-14 items-center justify-between border-b border-slate-800 bg-slate-950 px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500">
            <Dumbbell className="h-3.5 w-3.5 text-slate-950" />
          </div>
          <span className="font-bold text-white text-sm">
            Rep<span className="text-emerald-400">Sync</span> Studio
          </span>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-white"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-950 p-4 space-y-2">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-900"
            >
              <div className="flex items-center gap-2.5">
                <item.icon className="h-4 w-4 text-emerald-400" />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="rounded-full bg-rose-500/20 text-rose-400 px-2 py-0.5 text-[10px] font-bold">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
          <Link
            href={`/gym/${currentGym.slug}`}
            target="_blank"
            className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-xs font-medium text-slate-200"
          >
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <span>View Live Public Listing</span>
          </Link>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
