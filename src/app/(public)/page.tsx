"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PublicHeader } from "@/components/public/Header";
import {
  Search,
  MapPin,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Flame,
  CheckCircle2,
  Users,
  Clock,
  Dumbbell,
  Tag,
} from "lucide-react";
import { formatCurrencyINR } from "@/lib/utils";

interface GymListing {
  id: string;
  name: string;
  slug: string;
  phone: string;
  headline: string;
  description: string;
  genderPolicy: string;
  startingPriceMonthly: string;
  isVerified: boolean;
  isFeatured: boolean;
  listingQualityScore: number;
  locality: string;
  city: string;
  coverPhoto: string;
}

export default function HomePage() {
  const [gyms, setGyms] = useState<GymListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocality, setSelectedLocality] = useState<string>("All");
  const [selectedGender, setSelectedGender] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    async function loadGyms() {
      try {
        const res = await fetch("/api/gyms?city=Bengaluru");
        const data = await res.json();
        setGyms(data.gyms || []);
      } catch (err) {
        console.error("Failed to load gyms", err);
      } finally {
        setLoading(false);
      }
    }
    loadGyms();
  }, []);

  const localities = ["All", "Koramangala", "Indiranagar", "HSR Layout"];

  const filteredGyms = gyms.filter((gym) => {
    const matchesLocality =
      selectedLocality === "All" ||
      gym.locality.toLowerCase().includes(selectedLocality.toLowerCase());

    const matchesGender =
      selectedGender === "ALL" ||
      (selectedGender === "WOMEN_ONLY" && gym.genderPolicy === "WOMEN_ONLY") ||
      (selectedGender === "UNISEX" && gym.genderPolicy === "UNISEX");

    const matchesSearch =
      !searchQuery.trim() ||
      gym.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gym.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gym.locality.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesLocality && matchesGender && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <PublicHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-b from-slate-900/50 via-slate-950 to-slate-950 px-4 py-16 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent pointer-events-none" />

        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-400 mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Direct Software Sync • No Stale Aggregator Data</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Find, compare & join <br />
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              verified gyms in Bengaluru
            </span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">
            Every price, schedule, and amenity is verified directly from the gym’s live management system.
            No fake discounts. No expired offers.
          </p>

          {/* Search Bar */}
          <div className="mt-8 max-w-2xl mx-auto">
            <div className="relative flex items-center rounded-2xl border border-slate-700 bg-slate-900/90 p-2 shadow-2xl backdrop-blur focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20">
              <Search className="ml-3 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by gym name, locality, or 'women-only Indiranagar'..."
                className="w-full bg-transparent px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none"
              />
              <button
                onClick={() => {}}
                className="rounded-xl bg-emerald-500 px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition-colors"
              >
                Search
              </button>
            </div>

            {/* Quick Natural Language Queries */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
              <span className="text-slate-500">Try asking:</span>
              <button
                onClick={() => {
                  setSearchQuery("Women-only Indiranagar");
                  setSelectedGender("WOMEN_ONLY");
                  setSelectedLocality("Indiranagar");
                }}
                className="rounded-full bg-slate-800/80 px-2.5 py-1 text-slate-300 hover:text-emerald-400 hover:bg-slate-800 border border-slate-700 transition"
              >
                &ldquo;Women-only gym in Indiranagar&rdquo;
              </button>
              <button
                onClick={() => {
                  setSearchQuery("Strength Koramangala");
                  setSelectedGender("UNISEX");
                  setSelectedLocality("Koramangala");
                }}
                className="rounded-full bg-slate-800/80 px-2.5 py-1 text-slate-300 hover:text-emerald-400 hover:bg-slate-800 border border-slate-700 transition"
              >
                &ldquo;Strength training Koramangala&rdquo;
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Tabs & Content Section */}
      <section id="explore" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 flex-1">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-8 border-b border-slate-800">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Featured Fitness Studios & Gyms
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              {filteredGyms.length} verified listings available in Bengaluru
            </p>
          </div>

          {/* Gender Filter Buttons */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setSelectedGender("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedGender === "ALL"
                  ? "bg-emerald-500 text-slate-950"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setSelectedGender("UNISEX")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedGender === "UNISEX"
                  ? "bg-emerald-500 text-slate-950"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Unisex
            </button>
            <button
              onClick={() => setSelectedGender("WOMEN_ONLY")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedGender === "WOMEN_ONLY"
                  ? "bg-emerald-500 text-slate-950"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Women Only
            </button>
          </div>
        </div>

        {/* Locality Pills */}
        <div className="flex items-center gap-2 overflow-x-auto py-4 scrollbar-none">
          <span className="text-xs font-medium text-slate-500 whitespace-nowrap">Localities:</span>
          {localities.map((loc) => (
            <button
              key={loc}
              onClick={() => setSelectedLocality(loc)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium whitespace-nowrap transition ${
                selectedLocality === loc
                  ? "bg-slate-800 text-emerald-400 border border-emerald-500/40"
                  : "bg-slate-900/60 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              {loc}
            </button>
          ))}
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-96 rounded-2xl bg-slate-900/40 border border-slate-800 animate-pulse" />
            ))}
          </div>
        ) : filteredGyms.length === 0 ? (
          <div className="text-center py-20">
            <Dumbbell className="mx-auto h-12 w-12 text-slate-600 mb-3" />
            <h3 className="text-lg font-semibold text-white">No gyms found matching your filters</h3>
            <p className="text-sm text-slate-400 mt-1">Try resetting the locality or search keywords.</p>
            <button
              onClick={() => {
                setSelectedLocality("All");
                setSelectedGender("ALL");
                setSearchQuery("");
              }}
              className="mt-4 rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
            {filteredGyms.map((gym) => (
              <Link
                key={gym.id}
                href={`/gym/${gym.slug}`}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 hover:border-emerald-500/40 hover:bg-slate-900/70 transition-all duration-300"
              >
                {/* Image Cover */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-800">
                  <img
                    src={gym.coverPhoto}
                    alt={gym.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                  {/* Badges on Image */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    {gym.isVerified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/90 border border-emerald-500/40 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300 backdrop-blur">
                        <ShieldCheck className="h-3 w-3 text-emerald-400" />
                        Verified Partner
                      </span>
                    )}
                    {gym.genderPolicy === "WOMEN_ONLY" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-purple-950/90 border border-purple-500/40 px-2.5 py-0.5 text-[11px] font-semibold text-purple-300 backdrop-blur">
                        Women Only
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-3 left-3 flex items-center gap-1 text-xs text-slate-300">
                    <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{gym.locality}, Bengaluru</span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                      {gym.name}
                    </h3>
                  </div>

                  <p className="mt-2 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {gym.headline}
                  </p>

                  <div className="mt-auto pt-5 border-t border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                        Verified Price
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-extrabold text-white">
                          {formatCurrencyINR(gym.startingPriceMonthly)}
                        </span>
                        <span className="text-xs text-slate-400">/mo</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-semibold text-emerald-400 group-hover:translate-x-0.5 transition-transform">
                      <span>View Plans</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-10 px-4 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 RepSync Platform (repsync.in). All rights reserved. Launching in Bengaluru.</p>
          <div className="flex items-center gap-6">
            <Link href="/claim/ironforge-fitness" className="hover:text-slate-300">
              Claim a Gym Listing
            </Link>
            <Link href="/owner/dashboard" className="text-emerald-400 hover:text-emerald-300">
              Gym Owner Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
