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

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [salesExpanded, setSalesExpanded] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [user, setUserState] = useState<any>(null);

  // Load user data from cookies / localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        setUserState(JSON.parse(stored));
      }
    } catch {
      // Fallback
    }
  }, []);

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
          className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-white dark:bg-[#0B111E] border-r border-slate-200/80 dark:border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out shrink-0 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          {/* Top Brand Section */}
          <div>
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

              {/* Close Button on Mobile */}
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Close Sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav Menu */}
            <div className="px-3.5 py-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-170px)]">
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
          </div>

          {/* Bottom Section: Profile & Logout */}
          <div className="p-3.5 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
            {/* User Mini Card */}
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 flex items-center gap-3">
              <div className="relative w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                {user?.fullName ? user.fullName[0].toUpperCase() : "A"}
                <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-400 border-2 border-white dark:border-[#0B111E] rounded-full" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {user?.fullName || "Administrator"}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate capitalize">
                  {user?.role || "Super Admin"}
                </p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 border border-red-200/60 dark:border-red-900/40 transition-all active:scale-[0.98] cursor-pointer"
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
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Open Sidebar"
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
            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Logout Button in Header */}
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
                title="Log Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
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
