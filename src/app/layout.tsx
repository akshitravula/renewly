import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RepSync | Find, Compare & Join Verified Gyms",
  description:
    "India's first live fitness discovery and renewal platform. Always accurate prices, verified reviews, and real-time studio schedules.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-emerald-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
