"use client";

import React from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  TrendingUp,
  CalendarDays,
  Users2,
  Stethoscope,
  HeartPulse,
  Activity,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  DollarSign,
  Clock,
} from "lucide-react";

export default function AdminDashboardPage() {
  const stats = [
    {
      title: "Total Appointments",
      value: "1,248",
      change: "+12.4%",
      period: "this month",
      icon: CalendarDays,
      color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40",
    },
    {
      title: "Sales Pipeline",
      value: "৳ 8,45,200",
      change: "+18.2%",
      period: "vs last month",
      icon: TrendingUp,
      color: "text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40",
    },
    {
      title: "Active Leads",
      value: "384",
      change: "+5.1%",
      period: "qualified leads",
      icon: Users2,
      color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40",
    },
    {
      title: "Specialists On Duty",
      value: "38",
      change: "Active Now",
      period: "across branches",
      icon: Stethoscope,
      color: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40",
    },
  ];

  const quickNav = [
    {
      title: "Sales Lead Pipeline",
      desc: "Manage customer inquiries, consultations & lead scoring.",
      href: "/sales/lead",
      icon: Users2,
      color: "hover:border-emerald-500",
    },
    {
      title: "Appointment Schedules",
      desc: "Live doctor schedules, room allocations & patient check-ins.",
      href: "/appointments",
      icon: CalendarDays,
      color: "hover:border-blue-500",
    },
    {
      title: "Sales Analytics",
      desc: "Monthly revenue reports, conversion rates & targets.",
      href: "/sales/dashboard",
      icon: TrendingUp,
      color: "hover:border-teal-500",
    },
    {
      title: "System Settings",
      desc: "Configure clinic branches, roles, permissions & ERP preferences.",
      href: "/settings",
      icon: LayoutDashboard,
      color: "hover:border-purple-500",
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-7 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900/90 via-[#0B3B24] to-[#072416] text-white p-6 sm:p-8 border border-emerald-700/40 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/80 border border-emerald-500/30 text-emerald-200 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-lime-300" />
              <span>LifeSpring Healthcare ERP v2.4</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hospital Executive Overview
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/80 max-w-xl">
              Welcome back. Real-time operations, clinical appointments, and sales pipeline metrics.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/appointments"
              className="py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all active:scale-95"
            >
              <CalendarDays className="w-4 h-4" />
              <span>View Appointments</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {item.title}
                </span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${item.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900 dark:text-white">
                  {item.value}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {item.change}
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    {item.period}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Navigation Cards */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          Quick Access Modules
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickNav.map((card, idx) => {
            const Icon = card.icon;
            return (
              <Link
                key={idx}
                href={card.href}
                className={`p-5 rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all hover:shadow-md group ${card.color}`}
              >
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 mb-3 group-hover:scale-110 transition-transform">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors flex items-center justify-between">
                  <span>{card.title}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {card.desc}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
