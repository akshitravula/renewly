"use client";

import { useEffect, useState } from "react";
import {
  Receipt,
  QrCode,
  Download,
  CheckCircle2,
  AlertCircle,
  X,
  CreditCard,
  Building,
} from "lucide-react";
import { formatCurrencyINR } from "@/lib/utils";

export default function BillingPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // QR Modal
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [upiUri, setUpiUri] = useState<string>("");
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);

  async function loadBilling() {
    try {
      const res = await fetch("/api/owner/billing?gymSlug=ironforge-fitness");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Error loading billing data", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBilling();
  }, []);

  async function openUpiQrModal(invoice: any) {
    setSelectedInvoice(invoice);
    setIsGeneratingQr(true);
    try {
      const res = await fetch("/api/owner/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payeeVpa: data?.gymVpa || "ironforge@icici",
          payeeName: "IronForge Fitness LLP",
          amount: parseFloat(invoice.grandTotal),
          invoiceNumber: invoice.invoiceNumber,
        }),
      });
      const resJson = await res.json();
      setQrCodeUrl(resJson.qrDataUrl);
      setUpiUri(resJson.upiUri);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingQr(false);
    }
  }

  const summary = data?.summary || {
    totalCollected: 0,
    totalTaxCollected: 0,
    totalDues: 0,
    invoiceCount: 0,
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Receipt className="h-6 w-6 text-emerald-400" />
            <span>GST Invoicing & UPI Collections</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Indian GST Compliant (SAC 999723) • Sequential FY Numbering • Dynamic NPCI UPI QR Codes
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-1.5 text-xs text-slate-300">
          <Building className="h-4 w-4 text-emerald-400" />
          <span>GSTIN: <strong>29AABCU9603R1ZM</strong> (Karnataka)</span>
        </div>
      </div>

      {/* Financial Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/60 p-5 space-y-1">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            Total Collections (Paid)
          </span>
          <div className="text-3xl font-black text-white">
            {formatCurrencyINR(summary.totalCollected)}
          </div>
          <p className="text-[11px] text-slate-400">All memberships reconciled via UPI & Cash</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            GST Collected (18% Output Tax)
          </span>
          <div className="text-3xl font-black text-white">
            {formatCurrencyINR(summary.totalTaxCollected)}
          </div>
          <p className="text-[11px] text-slate-400">CGST (9%) + SGST (9%) on SAC 999723</p>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-slate-900/60 p-5 space-y-1">
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
            Outstanding Dues
          </span>
          <div className="text-3xl font-black text-white">
            {formatCurrencyINR(summary.totalDues)}
          </div>
          <p className="text-[11px] text-slate-400">Zero default risk on prepaid memberships</p>
        </div>
      </div>

      {/* Tax Invoices Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Tax Invoices Directory</h2>
          <span className="text-xs text-slate-400">
            {data?.invoices?.length || 0} Invoices Generated (FY 26-27)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-semibold">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Base Subtotal</th>
                <th className="py-3 px-4">CGST (9%)</th>
                <th className="py-3 px-4">SGST (9%)</th>
                <th className="py-3 px-4">Grand Total</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {(data?.invoices || []).map((inv: any) => (
                <tr key={inv.id} className="hover:bg-slate-900/60 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-white">
                    {inv.invoiceNumber}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-white block">{inv.customerName}</span>
                    <span className="text-[11px] text-slate-400 font-mono">+91 {inv.customerPhone}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono">
                    {formatCurrencyINR(inv.subtotal)}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-400">
                    {formatCurrencyINR(inv.cgstAmount)}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-400">
                    {formatCurrencyINR(inv.sgstAmount)}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                    {formatCurrencyINR(inv.grandTotal)}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        inv.status === "PAID"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => openUpiQrModal(inv)}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition"
                    >
                      <QrCode className="h-3.5 w-3.5" />
                      <span>UPI QR</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dynamic NPCI UPI QR Code Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-5 text-center shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                NPCI Instant UPI Pay
              </span>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">{selectedInvoice.customerName}</h3>
              <p className="text-xs text-slate-400">
                Invoice #{selectedInvoice.invoiceNumber}
              </p>
              <div className="text-2xl font-black text-white pt-1">
                {formatCurrencyINR(selectedInvoice.grandTotal)}
              </div>
            </div>

            {/* QR Image Box */}
            <div className="mx-auto flex h-60 w-60 items-center justify-center rounded-2xl bg-white p-3 shadow-inner">
              {isGeneratingQr ? (
                <div className="text-xs text-slate-600 font-semibold animate-pulse">
                  Generating NPCI QR...
                </div>
              ) : qrCodeUrl ? (
                <img src={qrCodeUrl} alt="UPI QR Code" className="h-full w-full object-contain" />
              ) : null}
            </div>

            <div className="space-y-1 text-xs text-slate-400">
              <p>Scan with any UPI app: Google Pay, PhonePe, Paytm, or BHIM.</p>
              <p className="font-mono text-[11px] text-slate-500">
                Payee: {data?.gymVpa || "ironforge@icici"}
              </p>
            </div>

            <button
              onClick={() => setSelectedInvoice(null)}
              className="w-full rounded-xl bg-slate-800 hover:bg-slate-700 py-2.5 text-xs font-semibold text-white transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
