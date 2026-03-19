import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "අවුරුදු ක්‍රීඩා - Avrudu Sports Registration",
  description: "Avrudu sports registration and participant reporting system.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col selection:bg-emerald-100 selection:text-emerald-900`}
      >
        <nav className="sticky top-0 z-50 border-b border-slate-200/50 bg-white/70 backdrop-blur-xl">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3 group transition-all">
              <div className="w-12 h-12 sm:w-16 sm:h-16 relative flex items-center justify-center group-hover:scale-110 transition-transform">
                <img
                  src="/logo.png"
                  alt="White Villa Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] sm:text-[12px] uppercase font-black text-emerald-600 tracking-[0.2em] leading-none">වසන්ත උදානය – 2026</span>
              </div>
            </Link>
            <div className="flex items-center gap-1 sm:gap-2 bg-slate-100/50 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border border-slate-200/50">
              <Link
                href="/"
                className="px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl transition-all hover:text-emerald-600"
              >
                ලියාපදිංචිය
              </Link>
              <Link
                href="/report"
                className="px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl transition-all hover:text-emerald-600"
              >
                වාර්තා
              </Link>
            </div>
          </div>
        </nav>
        <main className="flex-1">
          {children}
        </main>
        <footer className="border-t border-slate-200 bg-white/50 backdrop-blur-sm py-8 sm:py-12 mt-12 sm:mt-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 relative grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                  <img
                    src="/logo.png"
                    alt="White Villa Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="font-bold text-slate-900 tracking-tight">Avrudu Sports System</span>
              </div>
              <p className="text-[10px] sm:text-sm font-medium text-slate-400 font-mono tracking-tighter text-center">© 2026 DESIGNED FOR PRASANTHA</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
