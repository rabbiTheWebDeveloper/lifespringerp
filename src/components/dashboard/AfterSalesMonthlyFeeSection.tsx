"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  CalendarDays,
  Info,
  Wallet,
  Sparkles,
  Receipt,
  UserX,
  Users,
} from "lucide-react";

interface TrendMonth {
  monthKey: string;
  monthName: string;
  fullMonthName: string;
  month: number;
  year: number;
  expected: number;
  paid: number;
  unpaid: number;
  eligibleCount: number;
  collectionRate: number;
  isCurrent: boolean;
}

interface FeeStatsData {
  month: number;
  year: number;
  monthName: string;
  formattedPeriod: string;
  isCurrentMonth: boolean;
  totals: {
    totalExpectedFee: number;
    totalPaidAmount: number;
    totalUnpaidAmount: number;
    totalEligibleStudents: number;
    totalCandidateStudents: number;
    paidStudentsCount: number;
    partialStudentsCount: number;
    unpaidStudentsCount: number;
    excludedNewStudentsCount: number;
    collectionRate: number;
    studentPaidRate: number;
  };
  trendMonths: TrendMonth[];
}

export function AfterSalesMonthlyFeeSection() {
  const now = useMemo(() => new Date(), []);

  // Filter options for the last 3 months + current month
  const monthOptions = useMemo(() => {
    const options: { label: string; shortLabel: string; value: string; month: number; year: number; isCurrent: boolean }[] = [];
    const currentM = now.getMonth() + 1;
    const currentY = now.getFullYear();

    // 0: Current Month (Default)
    const currentD = new Date(currentY, currentM - 1, 1);
    const currentLabel = `${currentD.toLocaleDateString("en-US", { month: "long", year: "numeric" })} (Current)`;
    const currentShort = currentD.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    options.push({
      label: currentLabel,
      shortLabel: `${currentShort} (Current)`,
      value: `${currentY}-${currentM}`,
      month: currentM,
      year: currentY,
      isCurrent: true,
    });

    // 1 to 2: Past 2 months (giving 3 months total including current)
    for (let i = 1; i <= 2; i++) {
      const d = new Date(currentY, currentM - 1 - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const label = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      const short = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      options.push({
        label,
        shortLabel: short,
        value: `${y}-${m}`,
        month: m,
        year: y,
        isCurrent: false,
      });
    }

    return options;
  }, [now]);

  // Selected period state (default to current month)
  const [selectedPeriod, setSelectedPeriod] = useState<string>(
    () => `${now.getFullYear()}-${now.getMonth() + 1}`
  );

  const [data, setData] = useState<FeeStatsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch Monthly Fee Stats from API
  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const currentOpt = monthOptions.find((o) => o.value === selectedPeriod) || monthOptions[0];
      const params = new URLSearchParams({
        month: String(currentOpt.month),
        year: String(currentOpt.year),
      });

      const res = await fetch(`/api/dashboard/monthly-fee-stats?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error("Error fetching monthly fee stats:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod, monthOptions]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const totals = data?.totals || {
    totalExpectedFee: 0,
    totalPaidAmount: 0,
    totalUnpaidAmount: 0,
    totalEligibleStudents: 0,
    totalCandidateStudents: 0,
    paidStudentsCount: 0,
    partialStudentsCount: 0,
    unpaidStudentsCount: 0,
    excludedNewStudentsCount: 0,
    collectionRate: 0,
    studentPaidRate: 0,
  };

  const trendMonths = data?.trendMonths || [];
  const currentOption = monthOptions.find((o) => o.value === selectedPeriod) || monthOptions[0];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-black/20 p-5 sm:p-7 space-y-6 transition-all">

      {/* ── Top Header Toolbar ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-100 dark:border-slate-800/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">
                  After Sales: Monthly Fee Collection
                </h3>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/50">
                  {currentOption.isCurrent ? "Current Month" : currentOption.shortLabel}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span>
                  Showing <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{totals.totalEligibleStudents} After Sales Students</strong>
                  {totals.totalCandidateStudents > 0 ? ` (of ${totals.totalCandidateStudents} total)` : ""}.
                </span>
                {totals.excludedNewStudentsCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200/50 dark:border-amber-800/40">
                    <UserX className="w-3 h-3" />
                    {totals.excludedNewStudentsCount} newly joined this month excluded
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Controls: Quick Pills for Last 3 Months & Refresh */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-gray-100/80 dark:bg-slate-800/80 p-1 rounded-2xl text-xs font-semibold border border-gray-200/50 dark:border-slate-700/50">
            {monthOptions.map((opt) => {
              const active = selectedPeriod === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setSelectedPeriod(opt.value)}
                  className={`px-3 py-1.5 rounded-xl transition-all duration-200 flex items-center gap-1.5 text-xs ${
                    active
                      ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm font-bold scale-[1.02]"
                      : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50"
                  }`}
                >
                  <CalendarDays className="w-3.5 h-3.5 opacity-70" />
                  <span>{opt.shortLabel}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => fetchStats()}
            disabled={loading}
            className="p-2 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 transition-all border border-gray-200/50 dark:border-slate-700/50"
            title="Refresh statistics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* ── KPI Summary Cards Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">

        {/* Card 1: Target Monthly Fee */}
        <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white shadow-lg shadow-indigo-950/20 border border-indigo-900/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-indigo-400" />
              Target Monthly Fee
            </span>
            <div className="group relative inline-flex items-center">
              <Info className="w-3.5 h-3.5 text-indigo-400/80 hover:text-indigo-200 cursor-help transition-colors" />
              <div className="opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 absolute right-0 top-full mt-2 w-64 p-3 bg-slate-900 text-white rounded-xl shadow-2xl text-[11px] leading-relaxed z-50 border border-slate-700">
                <p className="font-bold text-indigo-300 mb-1">After Sales Calculation</p>
                <p className="text-gray-300">
                  Target expected fee from all <strong>{totals.totalEligibleStudents} recurring students</strong> created prior to {data?.monthName || "this month"}.
                </p>
                {totals.excludedNewStudentsCount > 0 && (
                  <p className="text-amber-300 mt-1.5 font-medium">
                    ⚡ {totals.excludedNewStudentsCount} students created in {data?.monthName} are excluded.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-3">
            {loading ? (
              <div className="h-8 w-32 bg-white/20 animate-pulse rounded-lg" />
            ) : (
              <p className="text-2xl sm:text-3xl font-black tracking-tight text-white font-mono">
                ৳{totals.totalExpectedFee.toLocaleString()} <span className="text-xs font-normal text-indigo-300">BDT</span>
              </p>
            )}
            <div className="mt-2.5 flex items-center justify-between text-xs text-indigo-200/90 pt-2 border-t border-indigo-800/60">
              <span className="font-semibold flex items-center gap-1">
                <Users className="w-3 h-3 text-indigo-400" />
                {totals.totalEligibleStudents} After Sales Students
              </span>
              {totals.excludedNewStudentsCount > 0 && (
                <span className="text-[10px] text-amber-300 bg-amber-950/60 border border-amber-800/40 px-2 py-0.5 rounded-full">
                  +{totals.excludedNewStudentsCount} new excluded
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Monthly Fee Paid (Amount + Count) */}
        <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white shadow-lg shadow-emerald-950/20 border border-emerald-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
              Monthly Fee Paid
            </span>
            <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-sm">
              {totals.collectionRate}% Realized
            </span>
          </div>

          <div className="mt-3">
            {loading ? (
              <div className="h-8 w-32 bg-white/20 animate-pulse rounded-lg" />
            ) : (
              <p className="text-2xl sm:text-3xl font-black tracking-tight text-white font-mono">
                ৳{totals.totalPaidAmount.toLocaleString()} <span className="text-xs font-normal text-emerald-200">BDT</span>
              </p>
            )}
            <div className="mt-2.5 flex items-center justify-between text-xs text-emerald-100/90 pt-2 border-t border-emerald-500/40">
              <span className="font-bold text-white flex items-center gap-1">
                <Users className="w-3 h-3 text-emerald-200" />
                {totals.paidStudentsCount} Students Paid
              </span>
              <span className="text-[10px] text-emerald-200 font-medium">
                {totals.totalEligibleStudents > 0
                  ? `${((totals.paidStudentsCount / totals.totalEligibleStudents) * 100).toFixed(1)}% count`
                  : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Monthly Fee Unpaid (Amount + Count) */}
        <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-rose-600 via-rose-700 to-red-800 text-white shadow-lg shadow-rose-950/20 border border-rose-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-200 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-200" />
              Monthly Fee Unpaid
            </span>
            <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-sm">
              {(100 - Number(totals.collectionRate)).toFixed(1)}% Due
            </span>
          </div>

          <div className="mt-3">
            {loading ? (
              <div className="h-8 w-32 bg-white/20 animate-pulse rounded-lg" />
            ) : (
              <p className="text-2xl sm:text-3xl font-black tracking-tight text-white font-mono">
                ৳{totals.totalUnpaidAmount.toLocaleString()} <span className="text-xs font-normal text-rose-200">BDT</span>
              </p>
            )}
            <div className="mt-2.5 flex items-center justify-between text-xs text-rose-100/90 pt-2 border-t border-rose-500/40">
              <span className="font-bold text-white flex items-center gap-1">
                <Users className="w-3 h-3 text-rose-200" />
                {totals.unpaidStudentsCount} Students Unpaid
                {totals.partialStudentsCount > 0 ? ` (${totals.partialStudentsCount} partial)` : ""}
              </span>
              <span className="text-[10px] text-rose-200 font-medium">
                {totals.totalEligibleStudents > 0
                  ? `${((totals.unpaidStudentsCount / totals.totalEligibleStudents) * 100).toFixed(1)}% count`
                  : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Collection Performance & Summary */}
        <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-purple-700 via-purple-800 to-indigo-900 text-white shadow-lg shadow-purple-950/20 border border-purple-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-200 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-purple-200" />
              Performance Rate
            </span>
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>

          <div className="mt-3">
            {loading ? (
              <div className="h-8 w-24 bg-white/20 animate-pulse rounded-lg" />
            ) : (
              <div className="flex items-baseline gap-2">
                <p className="text-2xl sm:text-3xl font-black tracking-tight text-white font-mono">
                  {totals.collectionRate}%
                </p>
                <span className="text-xs text-purple-200">collected</span>
              </div>
            )}

            {/* Visual Progress Bar */}
            <div className="mt-2.5 h-2 w-full bg-black/30 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-emerald-400 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, totals.collectionRate))}%` }}
                title={`Paid: ${totals.collectionRate}%`}
              />
              <div
                className="h-full bg-rose-400/80 transition-all duration-500"
                style={{ width: `${Math.max(0, 100 - totals.collectionRate)}%` }}
                title={`Unpaid: ${(100 - totals.collectionRate).toFixed(1)}%`}
              />
            </div>

            <div className="mt-2 flex items-center justify-between text-[11px] text-purple-200 pt-1">
              <span>{totals.studentPaidRate}% Student Coverage</span>
              <span>
                {totals.paidStudentsCount}/{totals.totalEligibleStudents} Cleared
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* ── Last 3 Months Trend Cards ── */}
      {trendMonths.length > 0 && (
        <div className="bg-gray-50/80 dark:bg-slate-800/50 rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <span className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-indigo-500" />
              Last 3 Months Comparison Trend
            </span>
            <span className="text-[11px] text-gray-400">Click any card to switch month view</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {trendMonths.map((m) => {
              const isSelected = selectedPeriod === m.monthKey;
              return (
                <button
                  key={m.monthKey}
                  onClick={() => setSelectedPeriod(m.monthKey)}
                  className={`p-3.5 rounded-xl text-left transition-all duration-200 border relative ${
                    isSelected
                      ? "bg-white dark:bg-slate-800 border-indigo-500 shadow-md ring-2 ring-indigo-500/20"
                      : "bg-white/60 dark:bg-slate-800/60 border-gray-200/60 dark:border-slate-700/60 hover:bg-white dark:hover:bg-slate-800 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-gray-900 dark:text-white">
                      {m.monthName}
                    </span>
                    {m.isCurrent ? (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                        Current
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-gray-400 font-mono">
                        {m.collectionRate}%
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between items-center text-gray-600 dark:text-gray-300">
                      <span className="text-[10px] text-gray-400">Paid:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        ৳{m.paid.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-gray-600 dark:text-gray-300">
                      <span className="text-[10px] text-gray-400">Unpaid:</span>
                      <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">
                        ৳{m.unpaid.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Tiny Progress Bar */}
                  <div className="mt-2.5 h-1.5 w-full bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${Math.min(100, Math.max(0, m.collectionRate))}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
