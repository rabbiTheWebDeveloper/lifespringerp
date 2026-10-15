"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Percent,
  Calendar,
  DollarSign,
  TrendingUp,
  UserCheck,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Calculator,
} from "lucide-react";
import { SalesTargetData, SalesUser } from "@/hooks/useSalesTarget";

interface SalesTargetFormProps {
  isOpen: boolean;
  onClose: () => void;
  salesTarget: SalesTargetData;
  salesUsers: SalesUser[];
  onTargetUpdated: () => void;
}

function formatDateForInput(dateVal: any): string {
  if (!dateVal) return "";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  } catch {
    return "";
  }
}

export function SalesTargetForm({
  isOpen,
  onClose,
  salesTarget,
  salesUsers,
  onTargetUpdated,
}: SalesTargetFormProps) {
  const [targetType, setTargetType] = useState<"organization" | "user">("organization");
  const [selectedUserId, setSelectedUserId] = useState<string>("all");
  const [daily, setDaily] = useState<string>("");
  const [custom, setCustom] = useState<string>("");
  const [monthly, setMonthly] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Sync state when modal opens or target changes
  useEffect(() => {
    if (isOpen) {
      setFeedback(null);
      const isUserScope = salesTarget.targetType === "user" && salesTarget.userId && salesTarget.userId !== "all";
      setTargetType(isUserScope ? "user" : "organization");
      setSelectedUserId(salesTarget.userId || "all");
      setDaily(salesTarget.daily ? String(salesTarget.daily) : "5000");
      setCustom(salesTarget.custom || salesTarget.fifteenDays ? String(salesTarget.custom || salesTarget.fifteenDays) : "75000");
      setMonthly(salesTarget.monthly ? String(salesTarget.monthly) : "150000");
      setNotes(salesTarget.notes || "");

      // Date range
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const day15 = new Date(now.getFullYear(), now.getMonth(), 15);

      setFromDate(formatDateForInput(salesTarget.from_date) || formatDateForInput(firstDay));
      setToDate(formatDateForInput(salesTarget.to_date) || formatDateForInput(day15));
    }
  }, [isOpen, salesTarget]);

  // Quick 1-click calculator helpers
  const handleAutoCalcFromDaily = () => {
    const dVal = parseInt(daily, 10);
    if (!isNaN(dVal) && dVal > 0) {
      setCustom(String(dVal * 15));
      setMonthly(String(dVal * 30));
    }
  };

  const setRangePreset = (preset: "first15" | "second15" | "fullMonth") => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();

    if (preset === "first15") {
      setFromDate(formatDateForInput(new Date(y, m, 1)));
      setToDate(formatDateForInput(new Date(y, m, 15)));
    } else if (preset === "second15") {
      setFromDate(formatDateForInput(new Date(y, m, 16)));
      setToDate(formatDateForInput(new Date(y, m + 1, 0)));
    } else if (preset === "fullMonth") {
      setFromDate(formatDateForInput(new Date(y, m, 1)));
      setToDate(formatDateForInput(new Date(y, m + 1, 0)));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const parseSafeISO = (val: string) => {
        if (!val) return null;
        const d = new Date(val);
        return isNaN(d.getTime()) ? null : d.toISOString();
      };

      const payload = {
        targetType,
        userId: targetType === "user" ? selectedUserId : null,
        daily: parseInt(daily, 10) || 0,
        custom: parseInt(custom, 10) || 0,
        fifteenDays: parseInt(custom, 10) || 0,
        monthly: parseInt(monthly, 10) || 0,
        from_date: parseSafeISO(fromDate),
        to_date: parseSafeISO(toDate),
        notes,
      };

      const res = await fetch("/api/admin/sales-target", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        setFeedback({ type: "success", text: "Sales target updated successfully in BDT!" });
        onTargetUpdated();
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        const errorMsg = data?.message || (res.status === 403 ? "Forbidden: You do not have permission to edit sales targets." : `Failed to update target (${res.status} ${res.statusText || ""})`);
        setFeedback({ type: "error", text: errorMsg });
      }
    } catch (err: any) {
      const isFetchErr = err?.name === "TypeError" || err?.message?.toLowerCase().includes("fetch");
      setFeedback({
        type: "error",
        text: isFetchErr
          ? "Network connection error: Failed to reach the server. Please check your internet connection or verify the server is running."
          : (err?.message || "An unexpected error occurred."),
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Set Sales Target in BDT (৳)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Daily, 15-Day / Custom, and Monthly Revenue Goals
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mx-6 mt-4 p-3.5 rounded-2xl flex items-center gap-2.5 text-xs font-semibold ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                : "bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Target Assignment Scope */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Target Assignment Scope
            </label>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <button
                type="button"
                onClick={() => {
                  setTargetType("organization");
                  setSelectedUserId("all");
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl text-xs font-bold border transition-all ${
                  targetType === "organization"
                    ? "bg-indigo-50 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 shadow-xs"
                    : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <Users className="w-4 h-4" />
                <span>All New Sales Team (Overall)</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetType("user")}
                className={`flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl text-xs font-bold border transition-all ${
                  targetType === "user"
                    ? "bg-indigo-50 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 shadow-xs"
                    : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>Individual New Sales Rep</span>
              </button>
            </div>

            {targetType === "user" && (
              <div className="mt-2.5">
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer"
                >
                  <option value="all">-- Select New Sales Executive --</option>
                  {salesUsers.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.fullName} ({u.designation || "New Sales"})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Target Amount Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Daily Target */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Daily Sales Target <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleAutoCalcFromDaily}
                  className="inline-flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                  title="Auto calculate 15-day and monthly from daily"
                >
                  <Calculator className="w-3 h-3" />
                  Auto Multiply
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-extrabold text-slate-400">
                  ৳
                </span>
                <input
                  type="number"
                  required
                  min="0"
                  step="500"
                  value={daily}
                  onChange={(e) => setDaily(e.target.value)}
                  placeholder="5000"
                  className="w-full pl-8 pr-4 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold text-slate-900 dark:text-white outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Expected daily revenue target</p>
            </div>

            {/* 15 Days / Custom Target */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                15 Days / Custom Target <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-extrabold text-slate-400">
                  ৳
                </span>
                <input
                  type="number"
                  required
                  min="0"
                  step="1000"
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                  placeholder="75000"
                  className="w-full pl-8 pr-4 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold text-slate-900 dark:text-white outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Mid-month / 15-day milestone</p>
            </div>
          </div>

          {/* Monthly Target */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Monthly Sales Target <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-extrabold text-slate-400">
                ৳
              </span>
              <input
                type="number"
                required
                min="0"
                step="5000"
                value={monthly}
                onChange={(e) => setMonthly(e.target.value)}
                placeholder="150000"
                className="w-full pl-8 pr-4 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold text-slate-900 dark:text-white outline-none"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Full monthly quota for BDT collection</p>
          </div>

          {/* 15 Days / Custom Targeting Date Range */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                Custom Targeting Date Range (15 Days / Custom)
              </label>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setRangePreset("first15")}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:text-indigo-600"
                >
                  Day 1-15
                </button>
                <button
                  type="button"
                  onClick={() => setRangePreset("second15")}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:text-indigo-600"
                >
                  Day 16-End
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  required
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none font-medium focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  required
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none font-medium focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Strategic Notes &amp; Campaign Name (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Q4 Admission Campaign, Hifz Batch Sales Sprint"
              className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/25 active:scale-98 disabled:opacity-60 cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>{saving ? "Saving Changes..." : "Save Sales Target"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SalesTargetForm;
