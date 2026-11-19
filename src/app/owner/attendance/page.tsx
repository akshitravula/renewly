"use client";

import { useEffect, useState } from "react";
import {
  QrCode,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  UserCheck,
  ShieldAlert,
} from "lucide-react";

export default function AttendanceTerminalPage() {
  const [phoneOrId, setPhoneOrId] = useState("");
  const [admissionResult, setAdmissionResult] = useState<any>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  async function loadLogs() {
    try {
      const res = await fetch("/api/owner/attendance?gymSlug=ironforge-fitness");
      const json = await res.json();
      setRecentLogs(json.recentCheckIns || []);
      setActiveCount(json.activeCurrently || 0);
    } catch (err) {
      console.error("Error loading logs", err);
    }
  }

  useEffect(() => {
    loadLogs();
  }, []);

  async function handleCheckIn(e: React.FormEvent) {
    e.preventDefault();
    if (!phoneOrId.trim()) return;
    setIsProcessing(true);
    setAdmissionResult(null);

    try {
      const res = await fetch("/api/owner/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gymSlug: "ironforge-fitness",
          memberPhoneOrId: phoneOrId.trim(),
          method: "MANUAL_STAFF",
        }),
      });
      const data = await res.json();
      setAdmissionResult(data);
      if (data.allowed) {
        setPhoneOrId("");
        await loadLogs();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <QrCode className="h-6 w-6 text-emerald-400" />
            <span>Attendance & Access Terminal</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Front-desk scanner, turnstile admission check, and live member presence
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-2xl bg-slate-900 border border-slate-800 px-4 py-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-white">{activeCount} People Currently in Studio</span>
        </div>
      </div>

      {/* Terminal Scanner Card */}
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6 sm:p-8 space-y-6">
        <div className="max-w-xl space-y-2">
          <h2 className="text-lg font-bold text-white">Quick Check-in Desk</h2>
          <p className="text-xs text-slate-400">
            Enter 10-digit mobile number, scan member QR pass, or enter Member ID.
          </p>

          <form onSubmit={handleCheckIn} className="flex gap-2 pt-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={phoneOrId}
                onChange={(e) => setPhoneOrId(e.target.value)}
                placeholder="Enter member phone number (e.g. 9845011111)..."
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isProcessing}
              className="rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400 transition"
            >
              {isProcessing ? "Checking..." : "Verify & Admit"}
            </button>
          </form>

          {/* Quick Test Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2 text-[11px] text-slate-400">
            <span>Test with:</span>
            <button
              type="button"
              onClick={() => setPhoneOrId("9845011111")}
              className="rounded-lg bg-slate-800 px-2 py-1 text-slate-300 hover:text-white"
            >
              Active: 9845011111 (Aditya)
            </button>
            <button
              type="button"
              onClick={() => setPhoneOrId("9845022222")}
              className="rounded-lg bg-slate-800 px-2 py-1 text-slate-300 hover:text-white"
            >
              Expiring Soon: 9845022222 (Sneha)
            </button>
            <button
              type="button"
              onClick={() => setPhoneOrId("9845044444")}
              className="rounded-lg bg-slate-800 px-2 py-1 text-slate-300 hover:text-white"
            >
              Expired: 9845044444 (Varun)
            </button>
          </div>
        </div>

        {/* Admission Result Card */}
        {admissionResult && (
          <div
            className={`rounded-2xl border p-5 space-y-2 transition-all ${
              admissionResult.allowed && admissionResult.alertType === "EXPIRING_SOON"
                ? "border-amber-500/50 bg-amber-950/30 text-amber-200"
                : admissionResult.allowed
                ? "border-emerald-500/50 bg-emerald-950/30 text-emerald-200"
                : "border-rose-500/50 bg-rose-950/30 text-rose-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {admissionResult.allowed && admissionResult.alertType === "EXPIRING_SOON" ? (
                  <AlertTriangle className="h-6 w-6 text-amber-400" />
                ) : admissionResult.allowed ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                ) : (
                  <XCircle className="h-6 w-6 text-rose-400" />
                )}
                <div>
                  <h3 className="text-base font-bold text-white">
                    {admissionResult.allowed
                      ? "Admission Permitted"
                      : "Admission Denied / Action Needed"}
                  </h3>
                  <p className="text-xs">{admissionResult.message || admissionResult.error}</p>
                </div>
              </div>

              {admissionResult.daysRemaining !== undefined && (
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Days Remaining
                  </span>
                  <span className="text-lg font-black text-white">
                    {admissionResult.daysRemaining} days
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Real-time check-in feed */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Clock className="h-4 w-4 text-emerald-400" />
          <span>Recent Admission Logs</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-semibold">
              <tr>
                <th className="py-2.5 px-4">Member Name</th>
                <th className="py-2.5 px-4">Phone Number</th>
                <th className="py-2.5 px-4">Check-In Time</th>
                <th className="py-2.5 px-4">Method</th>
                <th className="py-2.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {recentLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No check-ins recorded yet today.
                  </td>
                </tr>
              ) : (
                recentLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/60 transition">
                    <td className="py-3 px-4 font-bold text-white">
                      {log.firstName} {log.lastName}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      +91 {log.phone}
                    </td>
                    <td className="py-3 px-4">
                      {new Date(log.checkInTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {log.method}
                    </td>
                    <td className="py-3 px-4">
                      <span className="rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold">
                        Verified Access
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
