"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ThemeProvider } from "@/context/ThemeContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ShieldCheck, PhoneCall, HeartPulse, Sparkles, Building2, Lock } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070b12] text-slate-900 dark:text-slate-100 selection:bg-emerald-500/20 selection:text-emerald-700 dark:selection:text-emerald-300 font-sans transition-colors duration-300 relative">

        {/* Subtle Ambient Background Gradients */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-600/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/3 -right-40 w-[30rem] h-[30rem] bg-teal-500/10 dark:bg-teal-500/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-lime-500/10 dark:bg-emerald-950/20 rounded-full blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(#059669_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03] dark:opacity-[0.05]" />
        </div>

        {/* Top Header */}
        <header className="relative z-20 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-[#090e17]/70 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-3 group transition-transform active:scale-95"
            >
              <div className="relative h-9 w-36 sm:h-10 sm:w-44 flex items-center">
                <Image
                  src="/images/lifespring-logo.png"
                  alt="LifeSpring - Redefining Healthcare"
                  width={176}
                  height={44}
                  priority
                  className="object-contain dark:brightness-110 drop-shadow-sm"
                  onError={(e) => {
                    // Fallback to text + icon if image fails to render
                    const target = e.currentTarget;
                    target.style.display = "none";
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = "flex";
                  }}
                />
                <div
                  style={{ display: "none" }}
                  className="items-center gap-2 font-bold text-lg text-emerald-700 dark:text-emerald-400"
                >
                  <HeartPulse className="w-6 h-6 text-emerald-600 animate-pulse" />
                  <span>LifeSpring</span>
                </div>
              </div>
              <span className="hidden sm:inline-flex items-center text-[11px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                ERP Portal
              </span>
            </Link>

            {/* Right Header Actions */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Emergency Hotline Hotline Badge */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-xs font-medium">
                <PhoneCall className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-bounce" />
                <span>Support: 09638 505 505</span>
              </div>

              {/* Theme Toggle */}
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="relative z-10 flex-1 flex flex-col justify-center items-center py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-6xl mx-auto flex items-center justify-center">
            {children}
          </div>
        </main>

        {/* Modern Footer */}
        <footer className="relative z-10 w-full border-t border-slate-200/80 dark:border-slate-800/80 bg-white/40 dark:bg-[#070b12]/40 backdrop-blur-sm py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>
                &copy; 2026 LifeSpring Limited. All rights reserved.
              </span>
            </div>

            <div className="flex items-center gap-4 sm:gap-6">
              <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                256-bit SSL Encrypted
              </span>
              <a
                href="https://www.lifespringint.com/privacy-policy"
                target="_blank"
                rel="noreferrer"
                className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                Privacy
              </a>
              <a
                href="https://www.lifespringint.com/terms"
                target="_blank"
                rel="noreferrer"
                className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                Terms
              </a>
              <span className="hidden md:inline-flex text-emerald-600/80 dark:text-emerald-400/80">
                Healthcare ERP v2.4
              </span>
            </div>
          </div>
        </footer>
      </div>
    </ThemeProvider>
  );
}
