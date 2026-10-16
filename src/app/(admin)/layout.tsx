"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  BarChart3,
  Users2,
  PlusCircle,
  ShoppingBag,
  HeartHandshake,
  CalendarDays,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Bell,
  Search,
  ShieldCheck,
  HeartPulse,
  User,
  Sparkles,
} from "lucide-react";
import { ThemeProvider } from "@/context/ThemeContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { logout } from "@/lib/auth";
import Cookies from "js-cookie";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [salesExpanded, setSalesExpanded] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [user, setUserState] = useState<any>(null);
  const [avatarError, setAvatarError] = useState(false);

  const toggleSidebar = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setMobileOpen((prev) => !prev);
    } else {
      setDesktopSidebarOpen((prev) => !prev);
    }
  };

  // Load user data from cookies / localStorage
  useEffect(() => {
    try {
      let data: any = null;
      const stored = localStorage.getItem("user");
      if (stored) {
        data = JSON.parse(stored);
      } else {
        const cookieVal = Cookies.get("user");
        if (cookieVal) {
          data = JSON.parse(cookieVal);
        }
      }

      if (data) {
        setUserState(data);
      } else {
        // Fallback default admin profile
        setUserState({
          fullName: "Fajr Academy",
          role: "super-admin",
          employeeId: "ADM-0042",
          avatar: "",
        });
      }
    } catch {
      setUserState({
        fullName: "Fajr Academy",
        role: "super-admin",
        employeeId: "ADM-0042",
        avatar: "",
      });
    }
  }, []);

  const displayName = user?.fullName || user?.name || "Fajr Academy";
  const displayRole = user?.role
    ? user.role === "admin"
      ? "Super Admin"
      : user.role.replace(/-/g, " ")
    : "Super Admin";
  const displayId =
    user?.employeeId ||
    user?.id ||
    (user?._id
      ? user._id.length > 8
        ? user._id.slice(-6).toUpperCase()
        : user._id
      : "ADM-0042");

  const getInitials = (name?: string) => {
    if (!name) return "FA";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Auto-expand sales if we are on a sales route
  useEffect(() => {
    if (pathname.startsWith("/sales")) {
      setSalesExpanded(true);
    }
  }, [pathname]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      logout();
      await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    } finally {
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      } else {
        router.push("/login");
      }
    }
  };

  const isExactActive = (href: string) => pathname === href;
  const isParentActive = (prefix: string) => pathname.startsWith(prefix);

  const salesSubItems = [
    { name: "Dashboard", href: "/sales/dashboard", icon: BarChart3 },
    { name: "Lead", href: "/sales/lead", icon: Users2 },
    { name: "New Sales", href: "/sales/new-sales", icon: PlusCircle },
    { name: "Sales", href: "/sales", icon: ShoppingBag },
    { name: "After Sales", href: "/sales/after-sales", icon: HeartHandshake },
  ];

  return (
    <ThemeProvider>
      <div className="min-h-screen flex bg-slate-50 dark:bg-[#070b12] text-slate-900 dark:text-slate-100 font-sans selection:bg-emerald-500/20 selection:text-emerald-700 dark:selection:text-emerald-300">
        {/* ── Mobile Sidebar Backdrop ──────────────────────────────────────── */}
        {mobileOpen && (
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          />
        )}

        {/* ── Sidebar Navigation ───────────────────────────────────────────── */}
        <aside
          className={`fixed lg:sticky top-0 left-0 z-50 h-screen bg-white dark:bg-[#0B111E] border-r border-slate-200/80 dark:border-slate-800 flex flex-col justify-between transition-all duration-300 ease-in-out shrink-0 ${
            mobileOpen ? "translate-x-0 w-72" : "-translate-x-full lg:translate-x-0"
          } ${
            desktopSidebarOpen
              ? "lg:w-72"
              : "lg:w-0 lg:-translate-x-full lg:overflow-hidden lg:border-none"
          }`}
        >
          {/* Top Brand Section & User Profile */}
          <div className="shrink-0">
            <div className="h-16 px-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="relative h-9 w-36 flex items-center">
                  <Image
                    src="/images/lifespring-logo.png"
                    alt="LifeSpring"
                    width={144}
                    height={36}
                    priority
                    className="object-contain dark:brightness-110"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = "none";
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = "flex";
                    }}
                  />
                  <div
                    style={{ display: "none" }}
                    className="items-center gap-2 font-bold text-base text-emerald-700 dark:text-emerald-400"
                  >
                    <HeartPulse className="w-5 h-5 text-emerald-600" />
                    <span>LifeSpring ERP</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Admin
                </span>
              </Link>

              {/* Close / Collapse Button */}
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  setDesktopSidebarOpen(false);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                aria-label="Close Sidebar"
                title="Collapse Sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ── User Card at Sidebar TOP ── */}
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/80 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-amber-50/40 dark:from-[#0c1424] dark:via-[#0c121e] dark:to-amber-950/20">
              <div className="flex items-center gap-3">
                {/* Circular Avatar with Gold Ring & Live Green Dot */}
                <div className="relative shrink-0">
                  {user?.avatar && !avatarError ? (
                    <img
                      src={user.avatar}
                      alt={displayName}
                      onError={() => setAvatarError(true)}
                      className="w-10 h-10 rounded-full object-cover border-2 border-amber-400/90 dark:border-amber-400/80 shadow-md p-[1px] bg-white dark:bg-slate-900"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 text-white flex items-center justify-center text-xs font-black shadow-md border-2 border-amber-400/90 dark:border-amber-400/80">
                      {getInitials(displayName)}
                    </div>
                  )}
                  {/* Live Status Indicator Dot */}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-white dark:border-[#0B111E] rounded-full shadow-sm" />
                </div>

                {/* User Details: Name, Role & ID */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate tracking-tight leading-tight">
                    {displayName}
                  </p>
                  
                  <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold capitalize leading-none">
                      {displayRole}
                    </span>
                    <span className="text-[10px] text-slate-300 dark:text-slate-600 leading-none">•</span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 leading-none">
                      ID: {displayId}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Nav Menu */}
          <div className="px-3.5 py-4 space-y-1.5 overflow-y-auto flex-1">
              {/* Dashboard */}
              <Link
                href="/"
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isExactActive("/")
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                }`}
              >
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                <span>Dashboard</span>
              </Link>

              {/* Sales Collapsible Group */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setSalesExpanded(!salesExpanded)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isParentActive("/sales")
                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>Sales</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                      5
                    </span>
                    {salesExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 transition-transform duration-200" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 transition-transform duration-200" />
                    )}
                  </div>
                </button>

                {/* Sub Items (Lead, After Sales, New Sales, Sales, Dashboard) */}
                {salesExpanded && (
                  <div className="ml-5 pl-3 border-l-2 border-emerald-500/20 dark:border-emerald-500/10 space-y-1 mt-1 animate-in slide-in-from-top-1 duration-200">
                    {salesSubItems.map((item) => {
                      const SubIcon = item.icon;
                      const active = isExactActive(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            active
                              ? "bg-emerald-600 text-white shadow-sm font-semibold"
                              : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/40"
                          }`}
                        >
                          <SubIcon className="w-3.5 h-3.5 shrink-0" />
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Appointment */}
              <Link
                href="/appointments"
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isExactActive("/appointments")
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <CalendarDays className="w-4 h-4 shrink-0" />
                  <span>Appointments</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300">
                  Active
                </span>
              </Link>

              {/* Settings */}
              <Link
                href="/settings"
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isExactActive("/settings")
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                }`}
              >
                <Settings className="w-4 h-4 shrink-0" />
                <span>Settings</span>
              </Link>
            </div>

          {/* Bottom Section: Logout */}
          <div className="p-3.5 border-t border-slate-100 dark:border-slate-800/80 shrink-0">
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 border border-red-200/60 dark:border-red-900/40 transition-all active:scale-[0.98] cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{loggingOut ? "Signing Out..." : "Log Out"}</span>
            </button>
          </div>
        </aside>

        {/* ── Main Layout Body ─────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header */}
          <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-[#070b12]/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Mobile Menu Trigger */}
              {/* Header Menu Trigger (Desktop & Mobile) */}
              <button
                type="button"
                onClick={toggleSidebar}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Toggle Sidebar Navigation"
                title="Toggle Sidebar (Logo & User Details)"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                <span>ERP</span>
                <span>/</span>
                <span className="font-semibold text-slate-900 dark:text-slate-200 capitalize">
                  {pathname === "/" ? "Dashboard" : pathname.replace("/", "").replace(/-/g, " ")}
                </span>
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Quick Search Trigger */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 text-xs text-slate-400">
                <Search className="w-3.5 h-3.5" />
                <span>Search patients, doctors...</span>
                <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 font-bold">
                  ⌘K
                </kbd>
              </div>

              {/* Live Branch Pill */}
              <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/60 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Central HQ</span>
              </div>

              {/* Notification Bell */}
              <div className="relative">
                <button
                  type="button"
                  className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative cursor-pointer"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#070b12]" />
                </button>
              </div>

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* ── Header User Profile Trigger & Dropdown showing Sidebar Logo & Details ── */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-200/60 dark:border-slate-800 cursor-pointer"
                  title="View Sidebar Logo & User Details"
                >
                  {/* Circular Avatar with Gold Ring & Live Green Dot */}
                  <div className="relative shrink-0">
                    {user?.avatar && !avatarError ? (
                      <img
                        src={user.avatar}
                        alt={displayName}
                        onError={() => setAvatarError(true)}
                        className="w-7 h-7 rounded-full object-cover border-2 border-amber-400 dark:border-amber-400/80 shadow-sm p-[1px] bg-white dark:bg-slate-900"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 text-white flex items-center justify-center text-[10px] font-black shadow-sm border-2 border-amber-400 dark:border-amber-400/80">
                        {getInitials(displayName)}
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-400 border-2 border-white dark:border-[#070b12] rounded-full" />
                  </div>

                  {/* Name & Role on sm+ screens */}
                  <div className="hidden sm:block text-left min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate leading-tight">
                      {displayName}
                    </p>
                    <div className="flex items-center gap-1 leading-none mt-0.5">
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold capitalize">
                        {displayRole}
                      </span>
                      <span className="text-[9px] font-mono font-bold text-slate-400 dark:text-slate-500">#{displayId}</span>
                    </div>
                  </div>

                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Dropdown Card Showing Sidebar Logo & Sidebar Details */}
                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-12 mt-2 w-80 z-50 bg-white dark:bg-[#0B111E] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                      {/* 1. Sidebar Brand Logo Section */}
                      <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/60 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="relative h-8 w-32 flex items-center">
                            <Image
                              src="/images/lifespring-logo.png"
                              alt="LifeSpring"
                              width={128}
                              height={32}
                              priority
                              className="object-contain dark:brightness-110"
                              onError={(e) => {
                                const target = e.currentTarget;
                                target.style.display = "none";
                                const fallback = target.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = "flex";
                              }}
                            />
                            <div
                              style={{ display: "none" }}
                              className="items-center gap-2 font-bold text-sm text-emerald-700 dark:text-emerald-400"
                            >
                              <HeartPulse className="w-4 h-4 text-emerald-600" />
                              <span>LifeSpring ERP</span>
                            </div>
                          </div>
                          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            Admin
                          </span>
                        </div>

                        <button
                          onClick={() => setUserMenuOpen(false)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* 2. Sidebar User Details Card */}
                      <div className="p-4 bg-gradient-to-r from-blue-50/60 via-indigo-50/30 to-amber-50/40 dark:from-[#0c1424] dark:via-[#0c121e] dark:to-amber-950/20 border-b border-slate-100 dark:border-slate-800/80">
                        <div className="flex items-center gap-3.5">
                          {/* Circular Avatar with Gold Ring & Live Green Dot */}
                          <div className="relative shrink-0">
                            {user?.avatar && !avatarError ? (
                              <img
                                src={user.avatar}
                                alt={displayName}
                                onError={() => setAvatarError(true)}
                                className="w-12 h-12 rounded-full object-cover border-2 border-amber-400 dark:border-amber-400/80 shadow-md p-[1px] bg-white dark:bg-slate-900"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 text-white flex items-center justify-center text-sm font-black shadow-md border-2 border-amber-400 dark:border-amber-400/80">
                                {getInitials(displayName)}
                              </div>
                            )}
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-white dark:border-[#0B111E] rounded-full shadow-sm" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                              {displayName}
                            </p>
                            <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold capitalize mt-0.5">
                              {displayRole}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                                ID: {displayId}
                              </span>
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" />
                                Verified
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 3. Quick Navigation Links */}
                      <div className="p-2 space-y-1 text-xs">
                        <Link
                          href="/"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span>Dashboard</span>
                        </Link>
                        <Link
                          href="/appointments"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <CalendarDays className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span>Appointments</span>
                        </Link>
                        <Link
                          href="/sales"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <TrendingUp className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                          <span>Sales Pipeline</span>
                        </Link>
                        <Link
                          href="/settings"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Settings className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          <span>Settings</span>
                        </Link>
                      </div>

                      {/* 4. Logout Action */}
                      <div className="p-2 border-t border-slate-100 dark:border-slate-800/80">
                        <button
                          type="button"
                          onClick={handleLogout}
                          disabled={loggingOut}
                          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>{loggingOut ? "Signing Out..." : "Log Out"}</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          {/* Main Content View */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}
