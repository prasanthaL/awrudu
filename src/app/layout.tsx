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
  title: "අවුරුදු ක්රීඩා - Avrudu Sports Registration",
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
          <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group transition-all">
              <div className="bg-emerald-600 p-2 rounded-xl shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-black text-slate-900 leading-none tracking-tight text-lg">White Villa වසන්ත උත්සවය – 2026</span>
                <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-widest mt-0.5">Festival Manager</span>
              </div>
            </Link>
            <div className="flex items-center gap-2 bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/50">
              <Link
                href="/"
                className="px-5 py-2 text-sm font-bold rounded-xl transition-all hover:text-emerald-600"
              >
                ලියාපදිංචිය
              </Link>
              <Link
                href="/report"
                className="px-5 py-2 text-sm font-bold rounded-xl transition-all hover:text-emerald-600"
              >
                වාර්තා
              </Link>
            </div>
          </div>
        </nav>
        <main className="flex-1">
          {children}
        </main>
        <footer className="border-t border-slate-200 bg-white/50 backdrop-blur-sm py-12 mt-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="bg-slate-200 p-2 rounded-lg">
                  <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <span className="font-bold text-slate-900 tracking-tight">Avrudu Sports System</span>
              </div>
              <p className="text-sm font-medium text-slate-400 font-mono tracking-tighter">© 2026 DESIGNED FOR PRASANTHA</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
