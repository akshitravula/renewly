"use client";

import { useEffect, useState } from "react";
import {
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Phone,
  MessageCircle,
  ExternalLink,
  ChevronDown,
  Info,
  Clock,
  Sparkles,
} from "lucide-react";
import { formatCurrencyINR } from "@/lib/utils";

export default function RenewalsDeskPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"7days" | "30days" | "expired">("7days");
  const [selectedLanguage, setSelectedLanguage] = useState<Record<string, "en" | "hinglish" | "hi">>({});

  useEffect(() => {
    async function loadRenewals() {
      try {
        const res = await fetch("/api/owner/renewals?gymSlug=ironforge-fitness");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Error loading renewals", err);
      } finally {
        setLoading(false);
      }
    }
    loadRenewals();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 max-w-7xl mx-auto animate-pulse">
        <div className="h-10 w-1/4 bg-slate-900 rounded-xl" />
        <div className="h-64 bg-slate-900 rounded-2xl" />
      </div>
    );
  }

  const summary = data?.summary || {
    totalMoneyAtRisk7Days: 0,
    totalMoneyAtRisk30Days: 0,
    totalMoneyExpired: 0,
    recoveredRevenueMonth: 38497,
  };

  const currentList =
    activeTab === "7days"
      ? data?.expiring7Days || []
      : activeTab === "30days"
      ? data?.expiring30Days || []
      : data?.expired || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header & Recovery Counter */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <RefreshCw className="h-6 w-6 text-emerald-400" />
            <span>Renewals & Retention Desk</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            AI & rules-based churn risk evaluation • Contextual offers • WhatsApp message automation
          </p>
        </div>

        <div className="flex items-center gap-3 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-3">
          <Sparkles className="h-5 w-5 text-emerald-400" />
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-400 block">
              Recovered Revenue (Holdout Tested)
            </span>
            <span className="text-lg font-black text-white">
              {formatCurrencyINR(summary.recoveredRevenueMonth)}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("7days")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
            activeTab === "7days"
              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          <span>Expiring in 7 Days ({data?.expiring7Days?.length || 0})</span>
          <span className="text-xs text-rose-300 font-normal">
            • {formatCurrencyINR(summary.totalMoneyAtRisk7Days)}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("30days")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
            activeTab === "30days"
              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Expiring in 30 Days ({data?.expiring30Days?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab("expired")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
            activeTab === "expired"
              ? "bg-slate-800 text-white border border-slate-700"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <span>Lapsed / Expired ({data?.expired?.length || 0})</span>
          <span className="text-xs text-slate-400 font-normal">
            • {formatCurrencyINR(summary.totalMoneyExpired)}
          </span>
        </button>
      </div>

      {/* Member Cards List */}
      <div className="space-y-4">
        {currentList.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center text-slate-400">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400 mb-2" />
            <h3 className="text-base font-bold text-white">No members in this renewal bucket</h3>
            <p className="text-xs mt-1">All members are either active or updated.</p>
          </div>
        ) : (
          currentList.map((item: any) => {
            const lang = selectedLanguage[item.memberId] || "hinglish";
            const currentDraft =
              lang === "en"
                ? item.drafts?.en
                : item.drafts?.hinglish;

            const isCriticalRisk = item.riskScore >= 75;
            const isHighRisk = item.riskScore >= 55 && item.riskScore < 75;

            return (
              <div
                key={item.memberId}
                className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 sm:p-6 space-y-4 hover:border-slate-700 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-base sm:text-lg font-bold text-white">
                        {item.fullName}
                      </h3>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          isCriticalRisk
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            : isHighRisk
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        }`}
                      >
                        Risk Score: {item.riskScore}/100
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span>Phone: +91 {item.phone}</span>
                      <span>•</span>
                      <span>Plan: <strong className="text-white">{item.planName}</strong></span>
                      <span>•</span>
                      <span>Expiry: <strong className="text-rose-400">{item.endDate}</strong></span>
                      <span>•</span>
                      <span>Renewal Value: <strong className="text-emerald-400">{formatCurrencyINR(item.planPrice)}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Action:
                    </span>
                    <span className="rounded-lg bg-slate-800 px-3 py-1 text-xs font-semibold text-emerald-400 border border-slate-700">
                      {item.recommendedAction.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>

                {/* Risk Explanation */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                  <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-1">
                    <Info className="h-3.5 w-3.5" />
                    <span>Behavioral Risk Factors:</span>
                  </div>
                  {item.explanation}
                </div>

                {/* Message Draft Box */}
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-300">
                      Pre-Drafted Retention Message:
                    </span>

                    {/* Language Switcher */}
                    <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                      <button
                        onClick={() =>
                          setSelectedLanguage({ ...selectedLanguage, [item.memberId]: "hinglish" })
                        }
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                          lang === "hinglish"
                            ? "bg-emerald-500 text-slate-950"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        Hinglish
                      </button>
                      <button
                        onClick={() =>
                          setSelectedLanguage({ ...selectedLanguage, [item.memberId]: "en" })
                        }
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                          lang === "en"
                            ? "bg-emerald-500 text-slate-950"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        English
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-sans bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                    {currentDraft?.body || "Drafting message..."}
                  </p>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <span className="text-[11px] text-slate-500">
                      Offer: <strong className="text-slate-400">{currentDraft?.offerType || "STANDARD"}</strong>
                    </span>

                    <a
                      href={currentDraft?.whatsappUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-2.5 text-xs font-bold text-slate-950 transition shadow-md shadow-emerald-500/20"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>Review & Send WhatsApp Message</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
