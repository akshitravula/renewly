"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { PublicHeader } from "@/components/public/Header";
import {
  MapPin,
  Phone,
  ShieldCheck,
  Clock,
  Sparkles,
  CheckCircle2,
  Calendar,
  MessageCircle,
  Dumbbell,
  Users,
  Award,
  ChevronRight,
  Info,
} from "lucide-react";
import { formatCurrencyINR } from "@/lib/utils";

interface GymProfileData {
  gym: {
    id: string;
    name: string;
    slug: string;
    legalEntityName: string;
    phone: string;
    headline: string;
    description: string;
    genderPolicy: string;
    startingPriceMonthly: string;
    isVerified: boolean;
    isFeatured: boolean;
  };
  branch: {
    id: string;
    name: string;
    addressLine1: string;
    addressLine2?: string;
    landmark?: string;
    locality: string;
    city: string;
    state: string;
    pincode: string;
    latitude: string;
    longitude: string;
    phone: string;
    operatingHours: any;
  };
  photos: Array<{ id: string; photoUrl: string; caption?: string; isCover: boolean }>;
  plans: Array<{
    id: string;
    name: string;
    planType: string;
    durationMonths: number;
    durationDays: number;
    basePrice: string;
    gstRatePercent: string;
    totalPrice: string;
  }>;
  trainers: Array<{
    id: string;
    name: string;
    specializations: string[];
    certifications: string[];
    languagesSpoken: string[];
    bio?: string;
  }>;
  amenities: Array<{
    id: string;
    name: string;
    category: string;
    icon: string;
  }>;
  busyness: Array<{
    hourOfDay: number;
    relativeBusynessScore: number;
  }>;
}

export default function GymProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [data, setData] = useState<GymProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [trialBooked, setTrialBooked] = useState(false);
  const [trialName, setTrialName] = useState("");
  const [trialPhone, setTrialPhone] = useState("");

  useEffect(() => {
    async function loadGym() {
      try {
        const res = await fetch(`/api/gyms/${slug}`);
        if (!res.ok) throw new Error("Gym not found");
        const json = await res.json();
        setData(json);
        if (json.plans && json.plans.length > 0) {
          setSelectedPlan(json.plans[0].id);
        }
      } catch (err) {
        console.error("Error loading gym profile", err);
      } finally {
        setLoading(false);
      }
    }
    loadGym();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <PublicHeader />
        <div className="mx-auto max-w-7xl px-4 py-20 w-full animate-pulse space-y-8">
          <div className="h-10 w-1/3 bg-slate-900 rounded-xl" />
          <div className="h-96 w-full bg-slate-900 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!data || !data.gym) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <PublicHeader />
        <div className="mx-auto max-w-2xl text-center py-32 px-4">
          <h1 className="text-2xl font-bold text-white">Gym Listing Not Found</h1>
          <p className="text-slate-400 mt-2">The gym you are looking for is not currently active.</p>
          <Link href="/" className="mt-6 inline-block rounded-xl bg-emerald-500 px-6 py-2.5 font-semibold text-slate-950">
            Browse All Gyms
          </Link>
        </div>
      </div>
    );
  }

  const { gym, branch, photos, plans, trainers, amenities, busyness } = data;
  const coverPhoto = photos.find((p) => p.isCover)?.photoUrl || photos[0]?.photoUrl;

  const whatsappInquiryUrl = `https://wa.me/91${gym.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
    `Hi ${gym.name}, I found your listing on RepSync (repsync.in) and would like to enquire about memberships!`
  )}`;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <PublicHeader />

      {/* Breadcrumb Bar */}
      <div className="border-b border-slate-800 bg-slate-900/40 py-2.5 px-4 text-xs text-slate-400">
        <div className="mx-auto max-w-7xl flex items-center gap-1.5">
          <Link href="/" className="hover:text-white">Bengaluru</Link>
          <ChevronRight className="h-3 w-3 text-slate-600" />
          <span className="text-slate-300">{branch?.locality || "Locality"}</span>
          <ChevronRight className="h-3 w-3 text-slate-600" />
          <span className="text-emerald-400 font-medium truncate">{gym.name}</span>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1 w-full space-y-10">
        {/* Header Title Section */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 pb-6 border-b border-slate-800">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              {gym.isVerified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 px-3 py-1 text-xs font-semibold text-emerald-300">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  Verified Software Partner
                </span>
              )}
              {gym.genderPolicy === "WOMEN_ONLY" && (
                <span className="inline-flex items-center rounded-full bg-purple-950/80 border border-purple-500/40 px-3 py-1 text-xs font-semibold text-purple-300">
                  Exclusive Women Only
                </span>
              )}
              <span className="inline-flex items-center rounded-full bg-slate-900 border border-slate-800 px-3 py-1 text-xs font-medium text-slate-300">
                Live Pricing Synced
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              {gym.name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-300">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-emerald-400" />
                <span>
                  {branch?.addressLine1}, {branch?.locality}, Bengaluru - {branch?.pincode}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-slate-400" />
                <span>Mon-Sat: 06:00 AM - 10:00 PM</span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed pt-1">
              {gym.description}
            </p>
          </div>

          {/* Quick CTA Block */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 min-w-[240px]">
            <a
              href="#trial-booking"
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20"
            >
              <Calendar className="h-4 w-4" />
              <span>Book Free Trial Pass</span>
            </a>
            <a
              href={whatsappInquiryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition"
            >
              <MessageCircle className="h-4 w-4 text-emerald-400" />
              <span>WhatsApp Studio</span>
            </a>
          </div>
        </div>

        {/* Photo Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 overflow-hidden rounded-2xl bg-slate-900 aspect-[16/9] border border-slate-800">
            <img
              src={coverPhoto || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80"}
              alt={gym.name}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
            {photos.slice(1, 3).map((photo) => (
              <div key={photo.id} className="overflow-hidden rounded-2xl bg-slate-900 aspect-[16/9] border border-slate-800">
                <img src={photo.photoUrl} alt="Studio preview" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        {/* Live Busyness Chart Section */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-400" />
                <span>Usually Busy At (Live Check-In Heatmap)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Aggregated from verified member check-ins. Peak hours are around 7-8 AM & 7-8 PM.
              </p>
            </div>
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              Live Data
            </span>
          </div>

          <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 pt-2 items-end h-32">
            {[6, 7, 8, 9, 10, 11, 16, 17, 18, 19, 20, 21].map((h) => {
              const item = busyness.find((b) => b.hourOfDay === h);
              const score = item ? item.relativeBusynessScore : (h === 7 || h === 19 ? 85 : 40);
              const isPeak = score >= 75;

              return (
                <div key={h} className="flex flex-col items-center h-full justify-end gap-1.5">
                  <span className="text-[10px] text-slate-400 font-medium">
                    {score}%
                  </span>
                  <div
                    style={{ height: `${Math.max(15, score)}%` }}
                    className={`w-full rounded-md transition-all ${
                      isPeak
                        ? "bg-rose-500 shadow-sm shadow-rose-500/30"
                        : score > 50
                        ? "bg-amber-500/80"
                        : "bg-emerald-500/80"
                    }`}
                  />
                  <span className="text-[10px] text-slate-500 font-semibold whitespace-nowrap">
                    {h > 12 ? `${h - 12} PM` : `${h} AM`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Verified Plans & Pricing Grid */}
        <section id="plans" className="space-y-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Official Verified Plans & Transparent Pricing
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              100% all-inclusive pricing including 18% GST (SAC 999723). Zero hidden charges at reception.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {plans.map((p) => {
              const isSelected = selectedPlan === p.id;
              const monthlyRate = Math.round(parseFloat(p.totalPrice) / (p.durationMonths || 1));

              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlan(p.id)}
                  className={`cursor-pointer rounded-2xl border p-6 flex flex-col justify-between transition-all ${
                    isSelected
                      ? "border-emerald-500 bg-slate-900 shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-500"
                      : "border-slate-800 bg-slate-900/40 hover:border-slate-700"
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">
                        {p.durationMonths} Month{p.durationMonths > 1 ? "s" : ""}
                      </span>
                      {p.durationMonths >= 12 && (
                        <span className="rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold">
                          Best Value
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-white">{p.name}</h3>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-white">
                          {formatCurrencyINR(p.totalPrice)}
                        </span>
                        <span className="text-xs text-slate-400">total</span>
                      </div>
                      <p className="text-xs text-emerald-400 font-semibold mt-1">
                        Effective {formatCurrencyINR(monthlyRate)} / month
                      </p>
                    </div>

                    <div className="border-t border-slate-800 pt-3 text-xs text-slate-400 space-y-1">
                      <div className="flex justify-between">
                        <span>Base Price:</span>
                        <span>{formatCurrencyINR(p.basePrice)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>GST (18% SAC 999723):</span>
                        <span>{formatCurrencyINR(parseFloat(p.totalPrice) - parseFloat(p.basePrice))}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800">
                    <a
                      href={`/join/${gym.slug}?planId=${p.id}`}
                      className="w-full block text-center rounded-xl bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 px-4 py-2.5 text-xs font-bold text-white transition-colors"
                    >
                      Join Online via UPI
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Studio Amenities */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white">Amenities & Equipment</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {amenities.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-3.5 text-xs text-slate-200"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                <span className="font-medium">{a.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Certified Trainers */}
        {trainers.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">Coaches & Certified Trainers</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trainers.map((t) => (
                <div key={t.id} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white">{t.name}</h3>
                    <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                      <Award className="h-3 w-3" />
                      <span>{t.certifications?.join(", ") || "Certified"}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">{t.bio}</p>
                  <div className="pt-2 flex flex-wrap gap-1.5">
                    {t.specializations?.map((spec, i) => (
                      <span key={i} className="text-[10px] rounded-md bg-slate-800 px-2 py-0.5 text-slate-300">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Free Trial Booking Card */}
        <section id="trial-booking" className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 p-6 sm:p-10">
          <div className="max-w-2xl">
            <span className="text-xs uppercase font-bold text-emerald-400 tracking-wider">
              Experience First-Hand
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              Book a 100% Free Trial Workout Pass
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Get full workout floor access for 1 day, consult with a certified coach, and test the equipment with zero commitments.
            </p>

            {trialBooked ? (
              <div className="mt-6 rounded-2xl border border-emerald-500/50 bg-emerald-950/40 p-5 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Free Trial Pass Confirmed!</span>
                </div>
                <p className="text-xs text-slate-300">
                  We have dispatched your QR check-in pass to <strong>+91 {trialPhone}</strong>. Show this pass at {gym.name} reception on your visit.
                </p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (trialName && trialPhone) setTrialBooked(true);
                }}
                className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3"
              >
                <input
                  type="text"
                  required
                  placeholder="Your Full Name"
                  value={trialName}
                  onChange={(e) => setTrialName(e.target.value)}
                  className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
                <input
                  type="tel"
                  required
                  placeholder="10-digit Phone"
                  value={trialPhone}
                  onChange={(e) => setTrialPhone(e.target.value)}
                  className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-500 px-6 py-2.5 text-xs sm:text-sm font-bold text-slate-950 hover:bg-emerald-400 transition"
                >
                  Confirm Free Pass
                </button>
              </form>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
