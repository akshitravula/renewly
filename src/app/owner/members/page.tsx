"use client";

import { useEffect, useState } from "react";
import {
  Users,
  UserPlus,
  Upload,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  FileSpreadsheet,
  ArrowRight,
  Filter,
} from "lucide-react";
import { formatCurrencyINR } from "@/lib/utils";

export default function MembersPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // New Member Form State
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newGender, setNewGender] = useState("MALE");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // CSV Import State
  const [csvText, setCsvText] = useState("");
  const [importSummary, setImportSummary] = useState<any>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccessMessage, setImportSuccessMessage] = useState("");

  async function loadData() {
    try {
      const [memRes, planRes] = await Promise.all([
        fetch("/api/owner/members?gymSlug=ironforge-fitness"),
        fetch("/api/owner/plans?gymSlug=ironforge-fitness"),
      ]);
      const memData = await memRes.json();
      const planData = await planRes.json();
      setMembers(memData.members || []);
      setPlans(planData.plans || []);
      if (planData.plans && planData.plans.length > 0) {
        setSelectedPlanId(planData.plans[0].id);
      }
    } catch (err) {
      console.error("Failed to load members", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/owner/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gymSlug: "ironforge-fitness",
          firstName: newFirstName,
          lastName: newLastName,
          phone: newPhone,
          email: newEmail || undefined,
          gender: newGender,
          planId: selectedPlanId,
        }),
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewFirstName("");
        setNewLastName("");
        setNewPhone("");
        setNewEmail("");
        await loadData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to add member");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCsvPreview() {
    if (!csvText.trim()) return;
    setIsImporting(true);
    try {
      const res = await fetch("/api/owner/members/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gymSlug: "ironforge-fitness",
          csvContent: csvText,
          commit: false,
        }),
      });
      const data = await res.json();
      setImportSummary(data.summary);
    } catch (err) {
      console.error(err);
    } finally {
      setIsImporting(false);
    }
  }

  async function handleCsvCommit() {
    setIsImporting(true);
    try {
      const res = await fetch("/api/owner/members/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gymSlug: "ironforge-fitness",
          csvContent: csvText,
          commit: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setImportSuccessMessage(
          `Successfully imported ${data.importedCount} members into your gym database!`
        );
        setImportSummary(null);
        setCsvText("");
        await loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsImporting(false);
    }
  }

  const filteredMembers = members.filter((m) => {
    const fullName = `${m.firstName} ${m.lastName}`.toLowerCase();
    const matchesSearch =
      !search ||
      fullName.includes(search.toLowerCase()) ||
      m.phone.includes(search);

    const matchesStatus =
      statusFilter === "ALL" || m.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Users className="h-6 w-6 text-emerald-400" />
            <span>Members Directory</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Manage gym members, assign plans, pause memberships, and import CSV lists
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-slate-800 transition"
          >
            <Upload className="h-4 w-4 text-emerald-400" />
            <span>Bulk CSV Import</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-950 hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/10"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or 10-digit phone number..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900/60 pl-9 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          {["ALL", "ACTIVE", "EXPIRING_SOON", "EXPIRED"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                statusFilter === status
                  ? "bg-slate-800 text-emerald-400 border border-emerald-500/30"
                  : "bg-slate-900/40 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {status.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Member Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-semibold">
              <tr>
                <th className="py-3 px-4">Member Name</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Active Plan</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Tags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No members found matching your search.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-900/60 transition">
                    <td className="py-3.5 px-4 font-bold text-white">
                      {m.firstName} {m.lastName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono">
                      +91 {m.phone}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-emerald-400">
                      {m.planName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {m.endDate || "N/A"}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          m.status === "ACTIVE"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : m.status === "EXPIRING_SOON"
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {(m.tags || []).map((t: string, i: number) => (
                          <span
                            key={i}
                            className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-emerald-400" />
                <span>Add New Member & Issue Membership</span>
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    placeholder="e.g. Ramesh"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    placeholder="e.g. Kumar"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    Phone (10 digits) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    Gender
                  </label>
                  <select
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Email (Optional for GST invoice delivery)
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="ramesh@gmail.com"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Select Membership Plan *
                </label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.durationMonths}m) - {formatCurrencyINR(p.totalPrice)} (incl. 18% GST)
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-xl bg-slate-950 p-3 text-[11px] text-slate-400 border border-slate-800">
                <p>
                  ✓ Auto-generates sequential GST Tax Invoice with SAC 999723
                </p>
                <p>
                  ✓ Assigns baseline AI churn risk score for renewals tracking
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-emerald-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition"
                >
                  {isSubmitting ? "Adding..." : "Add & Generate Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
                <span>Bulk Import Members from CSV / Excel</span>
              </h2>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportSummary(null);
                  setImportSuccessMessage("");
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {importSuccessMessage ? (
              <div className="rounded-xl border border-emerald-500/50 bg-emerald-950/30 p-6 text-center space-y-3">
                <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Import Complete!</h3>
                <p className="text-xs text-slate-300">{importSuccessMessage}</p>
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportSuccessMessage("");
                  }}
                  className="rounded-xl bg-emerald-500 px-5 py-2 text-xs font-bold text-slate-950"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-400">
                  Paste CSV contents or export from your previous gym software (Fitternity, Okfit, GymPik, Excel).
                  Headers like <strong>Name, Phone/Mobile, Plan, Expiry Date</strong> are auto-detected. Phone duplicates are safely rejected.
                </p>

                <textarea
                  rows={6}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder={`Full Name,Mobile Number,Email,Gender,Package,Expiry Date\nRahul Sharma,9876543210,rahul@gmail.com,Male,Quarterly,2026-12-31\nAnanya Sen,9811223344,ananya@yahoo.com,Female,Monthly,2026-11-20`}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs font-mono text-slate-200 placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
                />

                {/* Import Preview Summary */}
                {importSummary && (
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2 text-xs">
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="p-2 rounded-lg bg-slate-900">
                        <span className="text-[10px] text-slate-500 block">Total Rows</span>
                        <strong className="text-white text-sm">{importSummary.totalRows}</strong>
                      </div>
                      <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30">
                        <span className="text-[10px] text-emerald-400 block">Valid Rows</span>
                        <strong className="text-emerald-400 text-sm">{importSummary.validRows}</strong>
                      </div>
                      <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-500/30">
                        <span className="text-[10px] text-rose-400 block">Invalid</span>
                        <strong className="text-rose-400 text-sm">{importSummary.invalidRows}</strong>
                      </div>
                      <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-500/30">
                        <span className="text-[10px] text-amber-400 block">Duplicates</span>
                        <strong className="text-amber-400 text-sm">{importSummary.duplicatePhonesInFile + (importSummary.existingInDbCount || 0)}</strong>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCsvText(
                        `Full Name,Mobile Number,Email,Gender,Package,Expiry Date\nSunil Hegde,9845099991,sunil@test.com,Male,Annual Champion,2027-10-15\nDeepa Rao,9845099992,deepa@test.com,Female,Monthly Strength,2026-11-20\nSunil Hegde,9845099991,dup@test.com,Male,Monthly,2026-11-20`
                      );
                    }}
                    className="text-xs text-emerald-400 hover:underline"
                  >
                    Insert Sample CSV
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={isImporting || !csvText.trim()}
                      onClick={handleCsvPreview}
                      className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                    >
                      {isImporting ? "Analyzing..." : "1. Preview & Validate"}
                    </button>
                    {importSummary && importSummary.validRows > 0 && (
                      <button
                        type="button"
                        disabled={isImporting}
                        onClick={handleCsvCommit}
                        className="rounded-xl bg-emerald-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition"
                      >
                        {isImporting ? "Importing..." : `2. Import ${importSummary.validRows} Members`}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
