"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Percent,
  Calendar,
  DollarSign,
  Users,
  UserCheck,
  ArrowUpRight,
  Sparkles,
  Edit3,
  RefreshCw,
  FileSpreadsheet,
  Award,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Target,
  BarChart3,
} from "lucide-react";
import { useSalesTarget } from "@/hooks/useSalesTarget";
import { SalesTargetForm } from "./SalesTargetForm";

// ── Color and Percentage Helpers (as provided in user requirements) ──────────

function calculatePercentage(achievement: number | string, target: number | string): number {
  const achNum = typeof achievement === "string" ? parseFloat(achievement.replace(/,/g, "")) : Number(achievement);
  const tgtNum = typeof target === "string" ? parseFloat(target.replace(/,/g, "")) : Number(target);

  if (isNaN(achNum) || isNaN(tgtNum) || tgtNum <= 0) return 0;
  const pct = (achNum / tgtNum) * 100;
  return Number(pct.toFixed(1));
}

function getColorByPercentage(percentage: number): {
  stroke: string;
  text: string;
  bg: string;
  badge: string;
  gradient: string;
} {
  if (percentage < 30) {
    return {
      stroke: "#ef4444", // red
      text: "text-red-500",
      bg: "bg-red-500",
      badge: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900/50",
      gradient: "from-red-500 to-rose-600",
    };
  }
  if (percentage < 60) {
    return {
      stroke: "#f59e0b", // amber/orange
      text: "text-amber-500",
      bg: "bg-amber-500",
      badge: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/50",
      gradient: "from-amber-500 to-orange-600",
    };
  }
  if (percentage < 80) {
    return {
      stroke: "#10b981", // emerald/green
      text: "text-emerald-500",
      bg: "bg-emerald-500",
      badge: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50",
      gradient: "from-emerald-500 to-teal-600",
    };
  }
  return {
    stroke: "#6366f1", // primary indigo
    text: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-600",
    badge: "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900/50",
    gradient: "from-indigo-600 to-violet-600",
  };
}

function formatBDT(amount?: number): string {
  if (amount === undefined || amount === null || isNaN(amount)) return "0";
  return amount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatDate(dateVal?: any): string {
  if (!dateVal) return "";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return "";
  }
}

// ── Circular Progress Component ──────────────────────────────────────────────

interface CircularProgressRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  strokeColor: string;
}

function CircularProgressRing({
  value,
  size = 124,
  strokeWidth = 10,
  strokeColor,
}: CircularProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedValue = Math.min(Math.max(value, 0), 100);
  const strokeDashoffset = circumference - (clampedValue / 100) * circumference;

  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="rotate-[-90deg] transition-all duration-700 ease-out"
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Background Track Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-slate-100 dark:text-slate-800"
          strokeOpacity={0.6}
        />
        {/* Animated Progress Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          className="transition-all duration-1000 ease-out"
        />
      </svg>

      {/* Centered Value */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
          {Math.round(value)}%
        </span>
        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mt-1">
          {value >= 100 ? "Goal Met" : "Achieved"}
        </span>
      </div>
    </div>
  );
}

// ── Main Section Component ───────────────────────────────────────────────────

export function SalesTargetSection() {
  const {
    salesTarget,
    salesUsers,
    userBreakdown,
    selectedUser,
    setSelectedUser,
    canEdit,
    loading,
    fetchSalesTarget,
  } = useSalesTarget();

  const [formOpen, setFormOpen] = useState(false);

  // Percentages calculated cleanly
  const dailyPct = calculatePercentage(salesTarget.amounts?.daily_total || 0, salesTarget.daily || 1);
  const customPct = calculatePercentage(salesTarget.amounts?.custom_total || 0, salesTarget.custom || 1);
  const monthlyPct = calculatePercentage(salesTarget.amounts?.monthly_total || 0, salesTarget.monthly || 1);

  const dailyTheme = getColorByPercentage(dailyPct);
  const customTheme = getColorByPercentage(customPct);
  const monthlyTheme = getColorByPercentage(monthlyPct);

  const formattedMonthLabel = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, []);

  return (
    <section className="space-y-5 animate-fadeIn">
      {/* ── Section Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/25 flex items-center justify-center shrink-0">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Sales Target &amp; Revenue Quotas
              </h2>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                BDT (৳) Real-Time
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live tracking for Daily, 15-Day / Custom, and Monthly Sales quotas across admissions &amp; student fees.
            </p>
          </div>
        </div>

        {/* Right Action Controls: Filter & Form Modal Trigger */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Sales User Selector */}
          <div className="relative">
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="appearance-none pl-8 pr-8 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer shadow-xs"
            >
              <option value="all">🎯 All New Sales Team (Overall)</option>
              {salesUsers.map((u) => (
                <option key={u._id} value={u._id}>
                  👤 {u.fullName} ({u.designation || "New Sales"})
                </option>
              ))}
            </select>
            <Users className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => fetchSalesTarget()}
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Refresh sales targets"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-500" : ""}`} />
          </button>


          {/* Update Sales Target Button (Superadmin, Admin, Operations Lead, Head of Sales, Software Engineer) */}
          {canEdit && (
            <button
              type="button"
              onClick={() => setFormOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 shadow-sm shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Update Sales Target</span>
            </button>
          )}
        </div>
      </div>

      {/* ── 3 Target Cards Grid (Daily, 15 Days / Custom, Monthly) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* ── CARD 1: TODAY (DAILY TARGET) ── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  Today (Daily)
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">24-hour revenue objective</p>
              </div>
              <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-lg border ${dailyTheme.badge}`}>
                {dailyPct}%
              </span>
            </div>

            {/* Circular Progress Ring */}
            <div className="my-5 flex justify-center items-center">
              <CircularProgressRing
                value={dailyPct}
                strokeColor={dailyTheme.stroke}
                size={126}
                strokeWidth={9}
              />
            </div>
          </div>

          {/* Metrics breakdown */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-md shrink-0"
                  style={{ backgroundColor: dailyTheme.stroke }}
                />
                <span className="font-semibold text-slate-600 dark:text-slate-400">Achievement:</span>
              </div>
              <span className="font-extrabold text-slate-900 dark:text-white font-mono text-sm">
                ৳{formatBDT(salesTarget.amounts?.daily_total)} BDT
              </span>
            </div>

            {/* Admission & Monthly Fee Pills */}
            <div className="grid grid-cols-2 gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px] font-medium">Admission Fee</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  ৳{formatBDT(salesTarget.amounts?.daily_admission)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-medium">Monthly Fee</span>
                <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">
                  ৳{formatBDT(salesTarget.amounts?.daily_monthly)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-md bg-slate-300 dark:bg-slate-700 shrink-0" />
                <span className="font-semibold text-slate-600 dark:text-slate-400">Target Quota:</span>
              </div>
              <span className="font-bold text-slate-500 dark:text-slate-400 font-mono text-xs">
                ৳{formatBDT(salesTarget.daily)} BDT
              </span>
            </div>

            <div className="pt-2 border-t border-dashed border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-medium text-slate-600 dark:text-slate-400">
                👥 {salesTarget.counts?.daily_sales_count || 0} student(s) created today
              </span>
              <span className={dailyPct >= 100 ? "text-emerald-600 font-bold" : "text-amber-500 font-medium"}>
                {dailyPct >= 100
                  ? "✓ Quota Completed"
                  : `৳${formatBDT(Math.max(0, (salesTarget.daily || 0) - (salesTarget.amounts?.daily_total || 0)))} left`}
              </span>
            </div>
          </div>
        </div>

        {/* ── CARD 2: 15 DAYS / CUSTOM DATE RANGE TARGET ── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  15 Days / Custom Range
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {salesTarget.from_date && salesTarget.to_date
                    ? `(${formatDate(salesTarget.from_date)} — ${formatDate(salesTarget.to_date)})`
                    : "Mid-month milestone period"}
                </p>
              </div>
              <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-lg border ${customTheme.badge}`}>
                {customPct}%
              </span>
            </div>

            {/* Circular Progress Ring */}
            <div className="my-5 flex justify-center items-center">
              <CircularProgressRing
                value={customPct}
                strokeColor={customTheme.stroke}
                size={126}
                strokeWidth={9}
              />
            </div>
          </div>

          {/* Metrics breakdown */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-md shrink-0"
                  style={{ backgroundColor: customTheme.stroke }}
                />
                <span className="font-semibold text-slate-600 dark:text-slate-400">Achievement:</span>
              </div>
              <span className="font-extrabold text-slate-900 dark:text-white font-mono text-sm">
                ৳{formatBDT(salesTarget.amounts?.custom_total)} BDT
              </span>
            </div>

            {/* Admission & Monthly Fee Pills */}
            <div className="grid grid-cols-2 gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px] font-medium">Admission Fee</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  ৳{formatBDT(salesTarget.amounts?.custom_admission)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-medium">Monthly Fee</span>
                <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">
                  ৳{formatBDT(salesTarget.amounts?.custom_monthly)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-md bg-slate-300 dark:bg-slate-700 shrink-0" />
                <span className="font-semibold text-slate-600 dark:text-slate-400">Target Quota:</span>
              </div>
              <span className="font-bold text-slate-500 dark:text-slate-400 font-mono text-xs">
                ৳{formatBDT(salesTarget.custom || salesTarget.fifteenDays)} BDT
              </span>
            </div>

            <div className="pt-2 border-t border-dashed border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-medium text-slate-600 dark:text-slate-400">
                👥 {salesTarget.counts?.custom_sales_count || 0} student(s) created in window
              </span>
              <span className={customPct >= 100 ? "text-emerald-600 font-bold" : "text-amber-500 font-medium"}>
                {customPct >= 100
                  ? "✓ Quota Completed"
                  : `৳${formatBDT(Math.max(0, (salesTarget.custom || salesTarget.fifteenDays || 0) - (salesTarget.amounts?.custom_total || 0)))} left`}
              </span>
            </div>
          </div>
        </div>

        {/* ── CARD 3: MONTHLY TARGET ── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-indigo-500" />
                  Monthly Target
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">{formattedMonthLabel}</p>
              </div>
              <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-lg border ${monthlyTheme.badge}`}>
                {monthlyPct}%
              </span>
            </div>

            {/* Circular Progress Ring */}
            <div className="my-5 flex justify-center items-center">
              <CircularProgressRing
                value={monthlyPct}
                strokeColor={monthlyTheme.stroke}
                size={126}
                strokeWidth={9}
              />
            </div>
          </div>

          {/* Metrics breakdown */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-md shrink-0"
                  style={{ backgroundColor: monthlyTheme.stroke }}
                />
                <span className="font-semibold text-slate-600 dark:text-slate-400">Achievement:</span>
              </div>
              <span className="font-extrabold text-slate-900 dark:text-white font-mono text-sm">
                ৳{formatBDT(salesTarget.amounts?.monthly_total)} BDT
              </span>
            </div>

            {/* Admission & Monthly Fee Pills */}
            <div className="grid grid-cols-2 gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px] font-medium">Admission Fee</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  ৳{formatBDT(salesTarget.amounts?.monthly_admission)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-medium">Monthly Fee</span>
                <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">
                  ৳{formatBDT(salesTarget.amounts?.monthly_monthly)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-md bg-slate-300 dark:bg-slate-700 shrink-0" />
                <span className="font-semibold text-slate-600 dark:text-slate-400">Target Quota:</span>
              </div>
              <span className="font-bold text-slate-500 dark:text-slate-400 font-mono text-xs">
                ৳{formatBDT(salesTarget.monthly)} BDT
              </span>
            </div>

            <div className="pt-2 border-t border-dashed border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-medium text-slate-600 dark:text-slate-400">
                👥 {salesTarget.counts?.monthly_sales_count || 0} student(s) created this month
              </span>
              <span className={monthlyPct >= 100 ? "text-emerald-600 font-bold" : "text-amber-500 font-medium"}>
                {monthlyPct >= 100
                  ? "✓ Quota Completed"
                  : `৳${formatBDT(Math.max(0, (salesTarget.monthly || 0) - (salesTarget.amounts?.monthly_total || 0)))} left`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sales Team Performance & Rep Breakdown (shown when overall is selected) ── */}
      {selectedUser === "all" && userBreakdown.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                New Sales Representatives Target &amp; Achievement Breakdown
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              {userBreakdown.length} active sales rep(s)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userBreakdown.map((rep) => {
              const repTheme = getColorByPercentage(rep.percentage);
              return (
                <div
                  key={rep._id}
                  onClick={() => setSelectedUser(rep._id)}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-indigo-300 dark:hover:border-indigo-700 cursor-pointer transition-all hover:-translate-y-0.5 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[150px]">
                        {rep.fullName}
                      </h4>
                      <p className="text-[10px] text-slate-400">{rep.designation || "New Sales"}</p>
                    </div>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${repTheme.badge}`}>
                      {rep.percentage}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(rep.percentage, 100)}%`,
                        backgroundColor: repTheme.stroke,
                      }}
                    />
                  </div>

                  {/* Rep Admission & Monthly Breakdown */}
                  <div className="flex items-center justify-between text-[10px] pt-1 text-slate-500 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-700/60">
                    <span>Adm: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">৳{formatBDT(rep.admissionFee)}</strong></span>
                    <span>Mo: <strong className="text-blue-600 dark:text-blue-400 font-mono">৳{formatBDT(rep.monthlyFee)}</strong></span>
                    <span>👥 {rep.studentCount || 0}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-slate-900 dark:text-white font-extrabold font-mono">
                      ৳{formatBDT(rep.achievement)} BDT
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">
                      Target: ৳{formatBDT(rep.target)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Sales Target Edit Modal ── */}
      <SalesTargetForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        salesTarget={salesTarget}
        salesUsers={salesUsers}
        onTargetUpdated={() => fetchSalesTarget()}
      />
    </section>
  );
}

export default SalesTargetSection;
