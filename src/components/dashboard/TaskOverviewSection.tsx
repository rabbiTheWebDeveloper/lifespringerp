"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  ClipboardCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  Flame,
  ArrowRight,
  RefreshCw,
  Search,
  Users,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Layers,
  Calendar,
  X,
  Filter,
  CheckSquare,
  Sparkles,
  UserCheck,
  CircleDot,
} from "lucide-react";

interface ActiveTaskPreview {
  _id: string;
  title: string;
  status: "todo" | "in_progress" | "under_review" | "completed" | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  category?: string;
  dueDate?: string | null;
  createdAt?: string;
}

interface UserTaskStat {
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  department?: string;
  total: number;
  todo: number;
  inProgress: number;
  underReview: number;
  completed: number;
  cancelled: number;
  pending: number;
  overdue: number;
  urgent: number;
  completionRate: number;
  tasks?: ActiveTaskPreview[];
  activeTasks: ActiveTaskPreview[];
}

interface TaskStatsData {
  total: number;
  todo: number;
  inProgress: number;
  underReview: number;
  completed: number;
  cancelled: number;
  overdue: number;
  urgent: number;
  myPending: number;
  completionRate: number;
  isAssigner: boolean;
  userStats: UserTaskStat[];
}

const STATUS_MAP: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  todo: {
    label: "To Do",
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-200 dark:border-slate-700",
  },
  in_progress: {
    label: "In Progress",
    bg: "bg-blue-50 dark:bg-blue-950/50",
    text: "text-blue-700 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800/60",
  },
  under_review: {
    label: "Under Review",
    bg: "bg-amber-50 dark:bg-amber-950/50",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800/60",
  },
  completed: {
    label: "Completed",
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800/60",
  },
  cancelled: {
    label: "Cancelled",
    bg: "bg-rose-50 dark:bg-rose-950/50",
    text: "text-rose-700 dark:text-rose-400",
    border: "border-rose-200 dark:border-rose-800/60",
  },
};

const PRIORITY_MAP: Record<
  string,
  { label: string; badge: string }
> = {
  urgent: {
    label: "Urgent",
    badge: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400 border-red-200 dark:border-red-800/60",
  },
  high: {
    label: "High",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-800/60",
  },
  medium: {
    label: "Medium",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200 dark:border-blue-800/60",
  },
  low: {
    label: "Low",
    badge: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700",
  },
};

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-gray-100 dark:bg-slate-800 rounded-lg ${className}`}
    />
  );
}

export function TaskOverviewSection() {
  const [data, setData] = useState<TaskStatsData | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [scope, setScope] = useState<"all" | "my-tasks">("all");
  const [loading, setLoading] = useState(true);
  const [searchUser, setSearchUser] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "overdue" | "completed">("all");
  const [sortBy, setSortBy] = useState<"total" | "pending" | "completion" | "overdue">("pending");
  const [selectedUserForTasks, setSelectedUserForTasks] = useState<UserTaskStat | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, userRes] = await Promise.all([
        fetch("/api/tasks/stats"),
        fetch("/api/auth/me"),
      ]);
      const [statsJson, userJson] = await Promise.all([
        statsRes.json(),
        userRes.json(),
      ]);
      if (statsJson.success && statsJson.stats) {
        setData(statsJson.stats);
      }
      if (userJson.success && userJson.user) {
        setCurrentUser(userJson.user);
      }
    } catch (err) {
      console.error("[TaskOverviewSection fetch error]", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Filter and sort user stats: ONLY show users who actually have assigned tasks (total > 0)
  const filteredUsers = useMemo(() => {
    if (!data?.userStats) return [];

    let list = data.userStats.filter((u) => u.total > 0);

    // Permission enforcement: regular users can ONLY see their own tasks
    const canSeeAll = data?.isAssigner ?? false;
    if (!canSeeAll && currentUser) {
      const userEmail = (currentUser.email || "").toLowerCase().trim();
      const userId = String(currentUser._id || currentUser.id || "");
      list = list.filter(
        (u) =>
          (u.email && u.email.toLowerCase().trim() === userEmail) ||
          (u.userId && String(u.userId) === userId)
      );
    } else if (scope === "my-tasks" && currentUser) {
      const userEmail = (currentUser.email || "").toLowerCase().trim();
      const userId = String(currentUser._id || currentUser.id || "");
      list = list.filter(
        (u) =>
          (u.email && u.email.toLowerCase().trim() === userEmail) ||
          (u.userId && String(u.userId) === userId)
      );
    }

    // Filter by search query (name, email, department, role)
    if (searchUser.trim()) {
      const q = searchUser.toLowerCase().trim();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.department && u.department.toLowerCase().includes(q)) ||
          (u.role && u.role.toLowerCase().includes(q))
      );
    }

    // Filter by activity status
    if (statusFilter === "active") {
      list = list.filter((u) => u.pending > 0);
    } else if (statusFilter === "overdue") {
      list = list.filter((u) => u.overdue > 0);
    } else if (statusFilter === "completed") {
      list = list.filter((u) => u.total > 0 && u.pending === 0);
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === "pending") return b.pending - a.pending;
      if (sortBy === "total") return b.total - a.total;
      if (sortBy === "completion") return b.completionRate - a.completionRate;
      if (sortBy === "overdue") return b.overdue - a.overdue;
      return 0;
    });

    return list;
  }, [data?.userStats, searchUser, statusFilter, sortBy]);

  const totalTasks = data?.total ?? 0;
  const completedTasks = data?.completed ?? 0;
  const inProgressTasks = data?.inProgress ?? 0;
  const todoTasks = data?.todo ?? 0;
  const underReviewTasks = data?.underReview ?? 0;
  const overdueTasks = data?.overdue ?? 0;
  const urgentTasks = data?.urgent ?? 0;
  const completionRate = data?.completionRate ?? (totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0);

  return (
    <div className="space-y-6">
      {/* ── Main Section Card ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 sm:p-6 transition-all duration-200">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 flex-shrink-0">
              <CheckSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                  Task Management & Workload Overview
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/40">
                  <Sparkles className="w-2.5 h-2.5" /> Real-time
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Academy task pipeline health, operational throughput, and team-wise task delegation.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              onClick={fetchStats}
              disabled={loading}
              title="Refresh Task Overview"
              className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors border border-gray-200/70 dark:border-slate-700/70"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <Link
              href="/tasks"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow transition-all duration-150 active:scale-95"
            >
              <span>Open Task Manager</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* ── KPI Stat Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-5">
          {/* Total Tasks */}
          <div className="p-3.5 rounded-xl bg-gray-50/70 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Total Tasks
              </span>
              <Layers className="w-4 h-4 text-gray-400" />
            </div>
            {loading ? (
              <Skeleton className="h-7 w-16 mt-2" />
            ) : (
              <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                {totalTasks}
              </p>
            )}
            <p className="text-[10px] text-gray-400 mt-0.5">Academy-wide tasks</p>
          </div>

          {/* To Do */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                To Do
              </span>
              <CircleDot className="w-4 h-4 text-slate-500" />
            </div>
            {loading ? (
              <Skeleton className="h-7 w-12 mt-2" />
            ) : (
              <p className="text-2xl font-black text-slate-800 dark:text-slate-200 mt-1">
                {todoTasks}
              </p>
            )}
            <p className="text-[10px] text-slate-400 mt-0.5">Awaiting kickoff</p>
          </div>

          {/* In Progress */}
          <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                In Progress
              </span>
              <Clock className="w-4 h-4 text-blue-500" />
            </div>
            {loading ? (
              <Skeleton className="h-7 w-12 mt-2" />
            ) : (
              <p className="text-2xl font-black text-blue-700 dark:text-blue-400 mt-1">
                {inProgressTasks}
              </p>
            )}
            <p className="text-[10px] text-blue-500/80 mt-0.5">Active execution</p>
          </div>

          {/* Under Review */}
          <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                Review
              </span>
              <AlertCircle className="w-4 h-4 text-amber-500" />
            </div>
            {loading ? (
              <Skeleton className="h-7 w-12 mt-2" />
            ) : (
              <p className="text-2xl font-black text-amber-700 dark:text-amber-400 mt-1">
                {underReviewTasks}
              </p>
            )}
            <p className="text-[10px] text-amber-500/80 mt-0.5">Needs approval</p>
          </div>

          {/* Completed */}
          <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                Completed
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            {loading ? (
              <Skeleton className="h-7 w-12 mt-2" />
            ) : (
              <div className="flex items-baseline gap-1.5 mt-1">
                <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                  {completedTasks}
                </p>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  ({completionRate}%)
                </span>
              </div>
            )}
            <p className="text-[10px] text-emerald-500/80 mt-0.5">Overall rate</p>
          </div>

          {/* Overdue */}
          <div
            className={`p-3.5 rounded-xl border transition-colors ${
              overdueTasks > 0
                ? "bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50"
                : "bg-gray-50/50 dark:bg-slate-800/30 border-gray-100 dark:border-slate-800"
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-[11px] font-bold uppercase tracking-wider ${
                  overdueTasks > 0
                    ? "text-rose-700 dark:text-rose-400"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                Overdue
              </span>
              <AlertTriangle
                className={`w-4 h-4 ${
                  overdueTasks > 0 ? "text-rose-500 animate-pulse" : "text-gray-400"
                }`}
              />
            </div>
            {loading ? (
              <Skeleton className="h-7 w-12 mt-2" />
            ) : (
              <p
                className={`text-2xl font-black mt-1 ${
                  overdueTasks > 0
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-gray-900 dark:text-white"
                }`}
              >
                {overdueTasks}
              </p>
            )}
            <p
              className={`text-[10px] mt-0.5 ${
                overdueTasks > 0
                  ? "text-rose-600/90 dark:text-rose-400/90 font-medium"
                  : "text-gray-400"
              }`}
            >
              {overdueTasks > 0 ? "Past deadline" : "All on schedule"}
            </p>
          </div>
        </div>

        {/* ── Progress Bar ── */}
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
            <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
              <span>Task Pipeline Progress</span>
              {urgentTasks > 0 && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400">
                  <Flame className="w-3 h-3 text-red-500" /> {urgentTasks} Urgent
                </span>
              )}
            </span>
            <span className="font-bold text-gray-900 dark:text-white font-mono">
              {completedTasks} / {totalTasks} Completed ({completionRate}%)
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-gray-100 dark:bg-slate-800 overflow-hidden flex shadow-inner">
            <div
              className="bg-emerald-500 h-full transition-all duration-500"
              style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }}
              title={`Completed: ${completedTasks}`}
            />
            <div
              className="bg-blue-500 h-full transition-all duration-500"
              style={{ width: `${totalTasks > 0 ? (inProgressTasks / totalTasks) * 100 : 0}%` }}
              title={`In Progress: ${inProgressTasks}`}
            />
            <div
              className="bg-amber-400 h-full transition-all duration-500"
              style={{ width: `${totalTasks > 0 ? (underReviewTasks / totalTasks) * 100 : 0}%` }}
              title={`Under Review: ${underReviewTasks}`}
            />
            <div
              className="bg-slate-300 dark:bg-slate-700 h-full transition-all duration-500"
              style={{ width: `${totalTasks > 0 ? (todoTasks / totalTasks) * 100 : 0}%` }}
              title={`To Do: ${todoTasks}`}
            />
          </div>
        </div>

        {/* ── User-Wise Task Breakdown & Inspector (Unified inside Task Management & Workload Overview) ── */}
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-800">
        
        {/* Section Sub-header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-bold text-gray-900 dark:text-white text-base">
                {data?.isAssigner ? "User-Wise Task Distribution & Capacity" : "My Assigned Tasks & Workload"}
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold font-mono border border-indigo-200/50 dark:border-indigo-800/40">
                {filteredUsers.length} {filteredUsers.length === 1 ? "User" : "Users"} With Tasks
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {data?.isAssigner
                ? "Directly inspect assigned tasks per team member. Only users with tasks are shown."
                : "Your personal task queue and active responsibilities."}
            </p>
          </div>

          {/* Search, Scope & Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Scope: Only show switcher if user is an assigner / manager */}
            {data?.isAssigner && (
              <div className="flex items-center bg-gray-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setScope("all")}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    scope === "all"
                      ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm font-bold"
                      : "text-gray-500 hover:text-gray-900 dark:text-gray-400"
                  }`}
                >
                  All Team Tasks
                </button>
                <button
                  onClick={() => setScope("my-tasks")}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    scope === "my-tasks"
                      ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm font-bold"
                      : "text-gray-500 hover:text-gray-900 dark:text-gray-400"
                  }`}
                >
                  My Tasks Only
                </button>
              </div>
            )}
            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search team member..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              {searchUser && (
                <button
                  onClick={() => setSearchUser("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div className="flex items-center bg-gray-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  statusFilter === "all"
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter("active")}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  statusFilter === "active"
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400"
                }`}
              >
                With Active Tasks
              </button>
              <button
                onClick={() => setStatusFilter("overdue")}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  statusFilter === "overdue"
                    ? "bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400"
                }`}
              >
                Has Overdue
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="appearance-none pl-3 pr-7 py-1.5 text-xs font-semibold rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer shadow-sm"
              >
                <option value="pending">Sort: Most Pending</option>
                <option value="total">Sort: Total Tasks</option>
                <option value="completion">Sort: Completion Rate</option>
                <option value="overdue">Sort: Most Overdue</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* ── User Cards Grid ── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="p-4 rounded-xl border border-gray-100 dark:border-slate-800 space-y-3"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                </div>
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12 px-4 border border-dashed border-gray-200 dark:border-slate-800 rounded-xl">
            <UserCheck className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              No team members match this filter
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Try adjusting your search query or reset filter to &quot;All&quot;.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredUsers.map((user) => {
              const initial = (user.name || "?").charAt(0).toUpperCase();
              const isOverdue = user.overdue > 0;
              const userTasks = (user.tasks && user.tasks.length > 0) ? user.tasks : (user.activeTasks || []);

              return (
                <div
                  key={user.email || user.userId || user.name}
                  className={`rounded-2xl border p-4 sm:p-5 transition-all duration-200 flex flex-col justify-between hover:shadow-md ${
                    isOverdue
                      ? "border-rose-200 dark:border-rose-900/60 bg-rose-50/15 dark:bg-rose-950/10"
                      : "border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900/70 hover:border-gray-200 dark:hover:border-slate-700"
                  }`}
                >
                  <div>
                    {/* User Header */}
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-gray-100 dark:border-slate-800">
                      <div className="flex items-center gap-3 min-w-0">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-slate-700 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-blue-500 text-white font-bold text-sm flex items-center justify-center flex-shrink-0 shadow-sm">
                            {initial}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-gray-900 dark:text-white truncate">
                            {user.name}
                          </p>
                          <p className="text-[11px] text-gray-400 truncate">
                            {user.email}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className="text-[10px] font-semibold px-2 py-0.2 rounded-md bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300">
                              {user.role || "Staff"}
                            </span>
                            {user.department && (
                              <span className="text-[10px] text-gray-400">
                                • {user.department}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Task Count Badge */}
                      <div className="flex-shrink-0 text-right">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                          isOverdue
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40"
                            : "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/40"
                        }`}>
                          {user.total} {user.total === 1 ? "Task" : "Tasks"}
                        </span>
                        {isOverdue && (
                          <p className="text-[10px] text-rose-500 font-semibold mt-0.5">
                            {user.overdue} Overdue
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Direct User Tasks List */}
                    <div className="mt-3.5 space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
                        <span className="flex items-center gap-1.5">
                          <ClipboardCheck className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Assigned Tasks ({userTasks.length})</span>
                        </span>
                        <Link
                          href={`/tasks?assignedTo=${encodeURIComponent(user.userId || user.email)}`}
                          className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                        >
                          Manage in Hub <ArrowRight className="w-2.5 h-2.5" />
                        </Link>
                      </div>

                      {userTasks.length > 0 ? (
                        <div className="space-y-2">
                          {userTasks.map((task) => {
                            const statusConf = STATUS_MAP[task.status] || STATUS_MAP.todo;
                            const priorityConf = PRIORITY_MAP[task.priority] || PRIORITY_MAP.medium;
                            const isTaskOverdue =
                              task.dueDate &&
                              new Date(task.dueDate) < new Date() &&
                              task.status !== "completed" &&
                              task.status !== "cancelled";

                            return (
                              <div
                                key={task._id}
                                className="p-3 rounded-xl bg-gray-50/90 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all flex items-start justify-between gap-2.5"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="font-semibold text-xs text-gray-900 dark:text-white line-clamp-1 leading-snug">
                                    {task.title}
                                  </p>
                                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap text-[10px]">
                                    <span className={`px-2 py-0.5 rounded-full font-bold border ${statusConf.bg} ${statusConf.text} ${statusConf.border}`}>
                                      {statusConf.label}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-full font-bold border ${priorityConf.badge}`}>
                                      {priorityConf.label}
                                    </span>
                                    {task.dueDate && (
                                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${isTaskOverdue ? "text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/40" : "text-gray-400 bg-gray-100/60 dark:bg-slate-800"}`}>
                                        <Calendar className="w-3 h-3" />
                                        <span>
                                          {new Date(task.dueDate).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                          })}
                                        </span>
                                        {isTaskOverdue && " (Overdue)"}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <Link
                                  href={`/tasks?search=${encodeURIComponent(task.title)}`}
                                  className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors flex-shrink-0"
                                  title="Open in Task Manager"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </Link>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800/40 text-center text-xs text-gray-400">
                          No tasks recorded for this user.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer: Summary & Link */}
                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
                    <span className="text-gray-400 text-[11px]">
                      {user.completed} completed • {user.pending} active
                    </span>
                    <Link
                      href={`/tasks?assignedTo=${encodeURIComponent(user.userId || user.email)}`}
                      className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 inline-flex items-center gap-1"
                    >
                      <span>Open all in Tasks</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>

      {/* ── Interactive Modal: "See User Tasks" ── */}
      {selectedUserForTasks && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                {selectedUserForTasks.avatar ? (
                  <img
                    src={selectedUserForTasks.avatar}
                    alt={selectedUserForTasks.name}
                    className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-slate-700"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-blue-500 text-white font-bold text-sm flex items-center justify-center">
                    {(selectedUserForTasks.name || "?").charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="font-bold text-base text-gray-900 dark:text-white truncate">
                    {selectedUserForTasks.name} &mdash; Task Overview
                  </h3>
                  <p className="text-xs text-gray-400 truncate">
                    {selectedUserForTasks.email} • {selectedUserForTasks.role || "Staff"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedUserForTasks(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics Bar in Modal */}
            <div className="bg-gray-50/80 dark:bg-slate-800/40 px-4 py-2.5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="text-gray-500 dark:text-gray-400">
                  Total: <b className="text-gray-900 dark:text-white font-mono">{selectedUserForTasks.total}</b>
                </span>
                <span className="text-blue-600 dark:text-blue-400">
                  Active: <b className="font-mono">{selectedUserForTasks.pending}</b>
                </span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  Completed: <b className="font-mono">{selectedUserForTasks.completed}</b>
                </span>
                {selectedUserForTasks.overdue > 0 && (
                  <span className="text-rose-600 dark:text-rose-400 font-bold">
                    Overdue: {selectedUserForTasks.overdue}
                  </span>
                )}
              </div>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold font-mono">
                {selectedUserForTasks.completionRate}% Done
              </span>
            </div>

            {/* Modal Body: Active Tasks List */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-2.5 flex-1">
              <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                Active & Pending Work Items
              </h4>

              {selectedUserForTasks.activeTasks && selectedUserForTasks.activeTasks.length > 0 ? (
                selectedUserForTasks.activeTasks.map((t) => {
                  const statusConf = STATUS_MAP[t.status] || STATUS_MAP.todo;
                  const priorityConf = PRIORITY_MAP[t.priority] || PRIORITY_MAP.medium;
                  const isTaskOverdue =
                    t.dueDate &&
                    new Date(t.dueDate) < new Date() &&
                    t.status !== "completed" &&
                    t.status !== "cancelled";

                  return (
                    <div
                      key={t._id}
                      className="p-3 rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-800/50 hover:border-indigo-200 dark:hover:border-indigo-900/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusConf.bg} ${statusConf.text} ${statusConf.border}`}
                          >
                            {statusConf.label}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priorityConf.badge}`}
                          >
                            {priorityConf.label}
                          </span>
                          {t.category && (
                            <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                              {t.category}
                            </span>
                          )}
                        </div>
                        <p className="font-semibold text-xs text-gray-900 dark:text-white line-clamp-1">
                          {t.title}
                        </p>
                      </div>

                      {/* Due date */}
                      <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
                        {t.dueDate ? (
                          <div
                            className={`text-[11px] font-medium flex items-center gap-1 ${
                              isTaskOverdue
                                ? "text-rose-600 dark:text-rose-400 font-bold"
                                : "text-gray-500 dark:text-gray-400"
                            }`}
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>
                              {new Date(t.dueDate).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                            {isTaskOverdue && (
                              <span className="text-[10px] uppercase font-bold text-rose-500">
                                (Overdue)
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-400">No deadline</span>
                        )}

                        <Link
                          href={`/tasks?search=${encodeURIComponent(t.title)}`}
                          className="p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                          title="Open task in Tasks Manager"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2 opacity-80" />
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    No pending tasks for this user!
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    All assigned tasks are completed or cancelled.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/30 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                Assigned to: <b className="text-gray-700 dark:text-gray-200">{selectedUserForTasks.name}</b>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedUserForTasks(null)}
                  className="px-3.5 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Close
                </button>
                <Link
                  href={`/tasks?assignedTo=${encodeURIComponent(selectedUserForTasks.userId || selectedUserForTasks.email)}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all"
                >
                  <span>Manage in Tasks Hub</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
