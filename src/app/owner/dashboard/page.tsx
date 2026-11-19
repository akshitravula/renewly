"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  RefreshCw,
  TrendingUp,
  Users,
  QrCode,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import { formatCurrencyINR } from "@/lib/utils";

export default function OwnerDashboardPage() {
  const [renewalsData, setRenewalsData] = useState<any>(null);
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [renRes, attRes] = await Promise.all([
          fetch("/api/owner/renewals?gymSlug=ironforge-fitness"),
          fetch("/api/owner/attendance?gymSlug=ironforge-fitness"),
        ]);
        const ren = await renRes.json();
        const att = await attRes.json();
        setRenewalsData(ren);
        setAttendanceData(att);
      } catch (err) {
        console.error("Dashboard data load error", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const summary = renewalsData?.summary || {
    totalMoneyAtRisk7Days: 15497,
    totalMoneyAtRisk30Days: 21996,
    recoveredRevenueMonth: 38497,
    countExpiring7Days: 2,
    countExpired: 1,
  };

  const highPriority = [
    ...(renewalsData?.expiring7Days || []),
    ...(renewalsData?.expired || []),
  ].slice(0, 3);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner & Quick Check-in Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            IronForge Studio Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Real-time business health, expiring revenue, and check-in desk
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/owner/attendance"
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-950 hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/10"
          >
            <QrCode className="h-4 w-4" />
            <span>Check-In Terminal</span>
          </Link>
          <Link
            href="/owner/renewals"
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-slate-800 transition"
          >
            <RefreshCw className="h-4 w-4 text-emerald-400" />
            <span>Open Renewals Desk</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Recovered Revenue Card */}
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 via-slate-900 to-slate-900 p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Recovered Revenue
            </span>
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
              This Month
            </span>
          </div>
          <div className="text-3xl font-black text-white">
            {formatCurrencyINR(summary.recoveredRevenueMonth)}
          </div>
          <p className="text-[11px] text-slate-400">
            Attributed to automated WhatsApp & phone retention nudges
          </p>
        </div>

        {/* Expiring in 7 Days */}
        <div className="rounded-2xl border border-rose-500/30 bg-gradient-to-br from-rose-950/20 via-slate-900 to-slate-900 p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
              Expiring in 7 Days
            </span>
            <AlertTriangle className="h-4 w-4 text-rose-400" />
          </div>
          <div className="text-3xl font-black text-white">
            {formatCurrencyINR(summary.totalMoneyAtRisk7Days)}
          </div>
          <p className="text-[11px] text-slate-400">
            {summary.countExpiring7Days} members due this week • Immediate outreach needed
          </p>
        </div>

        {/* Expired / Lapsed */}
        <div className="rounded-2xl border border-amber-500/30 bg-slate-900/60 p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Lapsed Members
            </span>
            <Users className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-white">
            {summary.countExpired} Members
          </div>
          <p className="text-[11px] text-slate-400">
            High churn risk • Comeback offers ready in Renewals Desk
          </p>
        </div>

        {/* Live Active on Floor */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Floor Check-ins
            </span>
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="text-3xl font-black text-white">
            {attendanceData?.activeCurrently || 2} Active
          </div>
          <p className="text-[11px] text-slate-400">
            Checked in within last 90 mins • Studio operating smoothly
          </p>
        </div>
      </div>

      {/* Priority Renewals Section */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              <span>Priority Renewals Requiring Action</span>
            </h2>
            <p className="text-xs text-slate-400">
              Members with critical or high churn risk scores. WhatsApp message drafts prepared.
            </p>
          </div>
          <Link
            href="/owner/renewals"
            className="flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300"
          >
            <span>View All ({summary.countExpiring7Days + summary.countExpired})</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {highPriority.map((item: any, i: number) => {
            const isHighRisk = item.riskScore >= 65;
            return (
              <div
                key={i}
                className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        isHighRisk
                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      Risk Score: {item.riskScore}/100
                    </span>
                    <span className="text-xs font-bold text-white">
                      {formatCurrencyINR(item.planPrice)}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white mt-2">{item.fullName}</h3>
                  <p className="text-xs text-slate-400">{item.phone}</p>
                  <p className="text-xs text-emerald-400 font-medium mt-1">
                    {item.planName} • {item.daysRemaining < 0 ? `Expired ${Math.abs(item.daysRemaining)}d ago` : `Expires in ${item.daysRemaining}d`}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <a
                    href={item.drafts?.hinglish?.whatsappUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 py-2 text-xs font-bold transition"
                  >
                    <span>Send WhatsApp Offer</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Check-ins Feed */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-emerald-400" />
            <span>Today&apos;s Live Check-in Stream</span>
          </h2>
          <span className="text-xs text-slate-400">
            Real-time scanner feed
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-slate-500">
              <tr>
                <th className="pb-2">Member</th>
                <th className="pb-2">Phone</th>
                <th className="pb-2">Time</th>
                <th className="pb-2">Method</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {(attendanceData?.recentCheckIns || []).slice(0, 5).map((log: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-900/40">
                  <td className="py-3 font-semibold text-white">
                    {log.firstName} {log.lastName}
                  </td>
                  <td className="py-3 text-slate-400">{log.phone}</td>
                  <td className="py-3">
                    {new Date(log.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="py-3 text-slate-400">{log.method}</td>
                  <td className="py-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                      Admitted
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
