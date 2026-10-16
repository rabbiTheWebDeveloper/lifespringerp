"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ThemeProvider } from "@/context/ThemeContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { HeartPulse, PhoneCall, ShieldCheck, Lock } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col bg-[#030b05] text-white font-sans relative">

        {/* Floating Transparent Navbar */}
        <header className="fixed top-0 left-0 right-0 z-[60] pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
          <div className="pointer-events-auto mx-3 sm:mx-6 mt-3 sm:mt-4">
            <nav
              className="flex items-center justify-between px-4 sm:px-6 h-12 rounded-2xl"
              style={{
                background: "rgba(3,10,5,0.65)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(16,185,129,0.12)",
                boxShadow: "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
              }}
            >
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2.5 group transition-opacity hover:opacity-80 active:scale-95">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.25) 0%, rgba(20,184,166,0.12) 100%)", border: "1px solid rgba(16,185,129,0.25)" }}>
                  <Image src="/images/lifespring-icon.png" alt="LifeSpring" width={20} height={20} className="object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                </div>
                <div className="flex items-center gap-2">
                  <Image src="/images/lifespring-logo.png" alt="LifeSpring" width={110} height={28} className="object-contain brightness-[1.15] hidden sm:block" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; const fb = e.currentTarget.nextElementSibling as HTMLElement; if (fb) fb.style.display = "flex"; }} />
                  <span style={{ display: "none" }} className="items-center gap-1.5 font-bold text-[15px] text-emerald-300">
                    <HeartPulse className="w-4 h-4" />LifeSpring
                  </span>
                  <span className="sm:hidden font-bold text-[14px] text-white">LifeSpring</span>
                  <span className="text-[9px] font-bold uppercase tracking-[0.15em] px-1.5 py-0.5 rounded-md" style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.2)", color: "rgba(110,231,183,0.9)" }}>ERP</span>
                </div>
              </Link>

              {/* Right actions */}
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)", color: "rgba(110,231,183,0.85)" }}>
                  <PhoneCall className="w-3 h-3" />
                  <span>09638 505 505</span>
                </div>
                <div className="scale-90 origin-right">
                  <ThemeToggle />
                </div>
              </div>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          {children}
        </main>

        {/* Minimal floating footer */}
        <footer className="fixed bottom-0 left-0 right-0 z-[55] pointer-events-none">
          <div className="flex items-center justify-center pb-3 gap-3 text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600/50" />
              &copy; 2026 LifeSpring Limited
            </span>
            <span className="h-3 w-px bg-white/10" />
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-600/50" />
              256-bit SSL Encrypted
            </span>
            <span className="hidden sm:flex items-center gap-1">
              <span className="h-3 w-px bg-white/10 mx-0.5" />
              <a href="https://www.lifespringint.com/privacy-policy" target="_blank" rel="noreferrer" className="hover:text-white/50 transition-colors pointer-events-auto">Privacy</a>
            </span>
            <span className="hidden sm:flex items-center gap-1">
              <span className="h-3 w-px bg-white/10 mx-0.5" />
              <a href="https://www.lifespringint.com/terms" target="_blank" rel="noreferrer" className="hover:text-white/50 transition-colors pointer-events-auto">Terms</a>
            </span>
          </div>
        </footer>
      </div>
    </ThemeProvider>
  );
}