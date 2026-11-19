"use client";

import { useEffect, useState } from "react";
import {
  Tag,
  Plus,
  CheckCircle2,
  Sparkles,
  Info,
  X,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { formatCurrencyINR } from "@/lib/utils";

export default function PlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form
  const [planName, setPlanName] = useState("");
  const [planType, setPlanType] = useState("GYM");
  const [durationMonths, setDurationMonths] = useState(1);
  const [durationDays, setDurationDays] = useState(30);
  const [basePrice, setBasePrice] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadPlans() {
    try {
      const res = await fetch("/api/owner/plans?gymSlug=ironforge-fitness");
      const json = await res.json();
      setPlans(json.plans || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPlans();
  }, []);

  async function handleCreatePlan(e: React.FormEvent) {
    e.preventDefault();
    if (!planName || !basePrice) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/owner/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gymSlug: "ironforge-fitness",
          name: planName,
          planType,
          durationMonths,
          durationDays,
          basePrice,
          isPublic,
        }),
      });
      if (res.ok) {
        setShowCreateModal(false);
        setPlanName("");
        setBasePrice("");
        await loadPlans();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  const baseNum = parseFloat(basePrice) || 0;
  const gstNum = Math.round(baseNum * 0.18 * 100) / 100;
  const grandTotalNum = Math.round((baseNum + gstNum) * 100) / 100;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Tag className="h-6 w-6 text-emerald-400" />
            <span>Membership Plans & Public Sync</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Plans configured here automatically feed the public RepSync listing — zero manual updates required
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-950 hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/10"
        >
          <Plus className="h-4 w-4" />
          <span>Create New Plan</span>
        </button>
      </div>

      {/* Sync Banner */}
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 flex items-center gap-3">
        <Sparkles className="h-5 w-5 text-emerald-400 flex-shrink-0" />
        <div className="text-xs text-slate-300">
          <strong className="text-emerald-300">Single Source of Truth:</strong> Whenever you change a plan duration or price, your public listing on RepSync reflects it in real time. Aggregators go stale; RepSync never does.
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p) => {
          const monthlyEquiv = Math.round(parseFloat(p.totalPrice) / (p.durationMonths || 1));
          return (
            <div
              key={p.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col justify-between space-y-4 hover:border-slate-700 transition"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">
                    {p.durationMonths} Month{p.durationMonths > 1 ? "s" : ""} ({p.durationDays} days)
                  </span>
                  {p.isPublic ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" />
                      Public on Search
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                      Private (In-Studio)
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white">{p.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-black text-white">
                      {formatCurrencyINR(p.totalPrice)}
                    </span>
                    <span className="text-xs text-slate-400">all-inclusive</span>
                  </div>
                  <p className="text-xs text-emerald-400 font-semibold mt-1">
                    Effective {formatCurrencyINR(monthlyEquiv)} / month
                  </p>
                </div>

                <div className="border-t border-slate-800 pt-3 text-xs text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Base Price:</span>
                    <span className="font-mono">{formatCurrencyINR(p.basePrice)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>18% GST (SAC 999723):</span>
                    <span className="font-mono">
                      {formatCurrencyINR(parseFloat(p.totalPrice) - parseFloat(p.basePrice))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Plan Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Tag className="h-5 w-5 text-emerald-400" />
                <span>Create New Membership Plan</span>
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Plan Name *
                </label>
                <input
                  type="text"
                  required
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder="e.g. 6-Month Transformation Pass"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    Duration (Months) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={36}
                    value={durationMonths}
                    onChange={(e) => {
                      const m = parseInt(e.target.value) || 1;
                      setDurationMonths(m);
                      setDurationDays(m * 30);
                    }}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    Total Duration (Days)
                  </label>
                  <input
                    type="number"
                    value={durationDays}
                    onChange={(e) => setDurationDays(parseInt(e.target.value) || 30)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Base Price (Excl. Tax in ₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Automatic GST Math Display */}
              {baseNum > 0 && (
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Base Amount:</span>
                    <span className="font-mono">{formatCurrencyINR(baseNum)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>18% GST (CGST 9% + SGST 9%):</span>
                    <span className="font-mono">{formatCurrencyINR(gstNum)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-white pt-1 border-t border-slate-800">
                    <span className="text-emerald-400">Customer Grand Total:</span>
                    <span className="text-emerald-400 font-mono text-sm">{formatCurrencyINR(grandTotalNum)}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
                />
                <label htmlFor="isPublic" className="text-xs text-slate-300">
                  Publish to RepSync public gym discovery page
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-emerald-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition"
                >
                  {isSubmitting ? "Creating..." : "Save & Sync Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
