"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowLeft,
  Clock,
  Bell,
  CheckCircle2,
  Layers,
  LucideIcon,
  ShieldCheck,
  Activity,
  HeartPulse,
} from "lucide-react";

interface ComingSoonPageProps {
  title: string;
  subtitle: string;
  badge?: string;
  icon?: LucideIcon;
  features?: string[];
  moduleCode?: string;
}

export function ComingSoonPage({
  title,
  subtitle,
  badge = "Under Development",
  icon: Icon = Sparkles,
  features = [
    "Real-time data synchronization with LifeSpring Core ERP",
    "Granular role-based access & clinical data confidentiality",
    "Multi-branch appointment & schedule tracking",
    "Automated SMS & WhatsApp notifications for clients",
  ],
  moduleCode = "ERP-MOD",
}: ComingSoonPageProps) {
  const [subscribed, setSubscribed] = useState(false);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Breadcrumb & Back */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Main Dashboard</span>
        </Link>
        <span className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          Module: {moduleCode}
        </span>
      </div>

      {/* Hero Banner Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900/90 via-[#0B3B24] to-[#072416] text-white p-7 sm:p-10 border border-emerald-700/40 shadow-2xl">
        {/* Glow Effects */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/80 border border-emerald-500/30 text-emerald-200 text-xs font-semibold tracking-wide backdrop-blur-md">
              <Clock className="w-3.5 h-3.5 text-lime-300 animate-spin" />
              <span>{badge}</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0">
                <Icon className="w-6 h-6" />
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                {title}
              </h1>
            </div>

            <p className="text-sm sm:text-base text-emerald-100/80 leading-relaxed">
              {subtitle}
            </p>
          </div>

          <div className="w-full md:w-auto shrink-0 flex flex-col sm:flex-row md:flex-col gap-3">
            <button
              onClick={() => setSubscribed(!subscribed)}
              className="py-2.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              {subscribed ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-900" />
                  <span>Notification Subscribed</span>
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4" />
                  <span>Notify When Live</span>
                </>
              )}
            </button>

            <Link
              href="/"
              className="py-2.5 px-5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 flex items-center justify-center gap-2 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Go to Overview</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Feature Blueprint & Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Upcoming Capabilities */}
        <div className="lg:col-span-7 bg-white dark:bg-[#0c1322] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-sm">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Planned Features &amp; Modules
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                What to expect once this section goes live
              </p>
            </div>
          </div>

          <div className="space-y-3 mt-5">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 text-xs text-slate-700 dark:text-slate-300"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                  {idx + 1}
                </div>
                <span className="leading-relaxed font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Architecture & Security Standard */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-[#0c1322] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>LifeSpring Security Standard</span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Every newly deployed module in the LifeSpring ERP adheres strictly to clinical data encryption, audit trails, and strict role permission gates.
            </p>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Status: In Active Sprint</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                Ready in v2.5
              </span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200/60 dark:border-emerald-800/40 rounded-3xl p-6 space-y-2">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
              <HeartPulse className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Need Immediate Assistance?</span>
            </div>
            <p className="text-xs text-emerald-900/80 dark:text-emerald-200/80 leading-relaxed">
              For manual appointment booking or sales lead support, contact the LifeSpring IT Operations team directly.
            </p>
            <div className="pt-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
              Hotline: 09638 505 505
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
