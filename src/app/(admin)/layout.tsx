"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import {
  Home,
  TrendingUp,
  Users,
  Calendar,
  Stethoscope,
  BarChart3,
  Settings,
  LayoutGrid,
  ChevronRight,
  ChevronDown,
  Search,
  Bell,
  Sun,
  X,
  LogOut,
  User as UserIcon,
  CheckCircle2,
  Building2,
  ShieldCheck,
  HeartPulse,
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
  const [collapsed, setCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [salesExpanded, setSalesExpanded] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [user, setUserState] = useState<any>(null);

  // Restore collapsed preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem("admin_sidebar_collapsed");
      if (saved !== null) {
        setCollapsed(saved === "true");
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleSidebar = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setMobileOpen((prev) => !prev);
    } else {
      setCollapsed((prev) => {
        const next = !prev;
        try {
          localStorage.setItem("admin_sidebar_collapsed", String(next));
        } catch {
          // ignore
        }
        return next;
      });
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
        setUserState({
          fullName: "S M Al Rabbi",
          role: "IT Department",
          employeeId: "IT-902",
        });
      }
    } catch {
      setUserState({
        fullName: "S M Al Rabbi",
        role: "IT Department",
        employeeId: "IT-902",
      });
    }
  }, []);

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

  const navItems = [
    { name: "Dashboard", href: "/", icon: Home, exact: true },
    {
      name: "Sales",
      href: "/sales",
      icon: TrendingUp,
      hasSub: true,
      subItems: [
        { name: "Sales Dashboard", href: "/sales/dashboard" },
        { name: "Leads Funnel", href: "/sales/lead" },
        { name: "New Sales Entry", href: "/sales/new-sales" },
      ],
    },
    { name: "Leads", href: "/sales/lead", icon: Users },
    { name: "Appointments", href: "/appointments", icon: Calendar },
    { name: "Doctors", href: "/doctors", icon: Stethoscope },
    { name: "Reports", href: "/reports", icon: BarChart3 },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <ThemeProvider>
      <div className="min-h-screen flex bg-[#f8fafc] dark:bg-[#070b12] text-slate-900 dark:text-slate-100 font-sans selection:bg-emerald-500/20 selection:text-emerald-700 dark:selection:text-emerald-300">
        {/* ── Mobile Sidebar Backdrop ──────────────────────────────────────── */}
        {mobileOpen && (
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          />
        )}

        {/* ── Sidebar Navigation (Image Reference Exact Match) ──────────────── */}
        <aside
          className={`fixed lg:sticky top-0 left-0 z-50 h-screen bg-white dark:bg-[#0B111E] border-r border-slate-200/80 dark:border-slate-800 flex flex-col justify-between transition-all duration-300 ease-in-out shrink-0 ${
            mobileOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0"
          } ${
            collapsed ? "lg:w-[74px]" : "lg:w-64"
          }`}
        >
          {/* Top Section: Brand Logo & User Profile Card */}
          <div className="shrink-0">
            {/* 1. LifeSpring Logo Header */}
            {!collapsed ? (
              <div className="h-16 px-5 flex items-center justify-between border-b border-transparent">
                <Link href="/" className="flex items-center gap-2.5 min-w-0">
                  <div className="relative h-10 w-44 flex items-center">
                    <Image
                      src="/images/lifespring-logo.png"
                      alt="LifeSpring - Health For a Better Tomorrow"
                      width={160}
                      height={40}
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
                      <span>LifeSpring</span>
                    </div>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  aria-label="Close Sidebar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              /* Collapsed Brand: Compact Icon */
              <div className="h-16 flex items-center justify-center">
                <Link
                  href="/"
                  className="flex items-center justify-center p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="LifeSpring ERP"
                >
                  <Image
                    src="/images/lifespring-icon.png"
                    alt="LifeSpring"
                    width={32}
                    height={32}
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
                    className="w-8 h-8 rounded-xl bg-emerald-600 text-white items-center justify-center font-bold text-xs"
                  >
                    LS
                  </div>
                </Link>
              </div>
            )}

            {/* 2. User Profile Card in Sidebar: Fajr Academy | Super Admin v */}
            {!collapsed ? (
              <div className="px-3.5 mb-2 relative">
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="w-full rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0c1424] p-2.5 flex items-center justify-between text-left hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer shadow-sm"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Amber Circular Avatar with User Silhouette */}
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <UserIcon className="w-5 h-5 stroke-[2.2]" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate leading-tight">
                        Fajr Academy
                      </p>
                      <span className="inline-block mt-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
                        Super Admin
                      </span>
                    </div>
                  </div>

                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                      profileDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Profile Switcher / Quick Dropdown */}
                {profileDropdownOpen && (
                  <div className="absolute left-3.5 right-3.5 top-16 z-50 bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                    <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">Fajr Academy HQ</p>
                      <p className="text-[10px] text-slate-400">Branch Code: #HQ-01</p>
                    </div>
                    <Link
                      href="/settings"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="block px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-lg"
                    >
                      Branch Settings
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg font-medium cursor-pointer"
                    >
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Collapsed Profile: Circular Avatar only */
              <div className="py-2 flex justify-center">
                <button
                  type="button"
                  onClick={() => setCollapsed(false)}
                  className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 text-white flex items-center justify-center shadow-sm cursor-pointer hover:scale-105 transition-transform"
                  title="Fajr Academy • Super Admin"
                >
                  <UserIcon className="w-5 h-5 stroke-[2.2]" />
                </button>
              </div>
            )}
          </div>

          {/* 3. Sidebar Navigation Links */}
          <div className={`py-2 space-y-1 overflow-y-auto flex-1 ${collapsed ? "px-2" : "px-3.5"}`}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.exact ? isExactActive(item.href) : isParentActive(item.href);

              if (item.hasSub) {
                return (
                  <div key={item.name} className="space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (collapsed) {
                          setCollapsed(false);
                          setSalesExpanded(true);
                        } else {
                          setSalesExpanded(!salesExpanded);
                        }
                      }}
                      className={`w-full flex items-center rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        collapsed
                          ? "justify-center w-11 h-11 mx-auto"
                          : "justify-between px-3.5 py-2.5"
                      } ${
                        active
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                          : "text-slate-600 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 shrink-0 text-slate-500" />
                        {!collapsed && <span>{item.name}</span>}
                      </div>
                      {!collapsed && (
                        <ChevronDown
                          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                            salesExpanded ? "rotate-180" : ""
                          }`}
                        />
                      )}
                    </button>

                    {/* Submenu */}
                    {!collapsed && salesExpanded && item.subItems && (
                      <div className="ml-5 pl-3 border-l border-slate-200 dark:border-slate-800 space-y-1 mt-1">
                        {item.subItems.map((sub) => (
                          <Link
                            key={sub.name}
                            href={sub.href}
                            className={`block py-1.5 px-2.5 rounded-lg text-xs font-medium transition-colors ${
                              isExactActive(sub.href)
                                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold"
                                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/60"
                            }`}
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={collapsed ? item.name : undefined}
                  className={`flex items-center rounded-xl text-xs font-semibold transition-all ${
                    collapsed
                      ? "justify-center w-11 h-11 mx-auto"
                      : "gap-3 px-3.5 py-2.5"
                  } ${
                    active
                      ? "bg-[#00875A] text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              );
            })}
          </div>

          {/* 4. Bottom Sidebar Section: System Online Card + Version Info */}
          {!collapsed ? (
            <div className="shrink-0 p-3.5 space-y-3">
              {/* Green System Online Status Card */}
              <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    System Online
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                  All services are running smoothly
                </p>
              </div>

              {/* Version & Copyright */}
              <div className="text-[10px] text-slate-400 dark:text-slate-500 px-1 leading-tight">
                <p>© 2026 LifeSpring</p>
                <p className="mt-0.5 text-slate-400/80">Version 2.4.0</p>
              </div>
            </div>
          ) : (
            /* Collapsed Bottom Indicator */
            <div className="shrink-0 p-2 flex justify-center">
              <span
                className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-900"
                title="System Online: Version 2.4.0"
              />
            </div>
          )}
        </aside>

        {/* ── Main Layout Body ─────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header (Image Reference Exact Match) */}
          <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-[#070b12]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 flex items-center justify-between">
            {/* Left Header: 4-square Grid Toggle & Breadcrumbs (ERP > Dashboard) */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleSidebar}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center"
                aria-label="Toggle Sidebar Navigation"
                title="Toggle Sidebar"
              >
                <LayoutGrid className="w-5 h-5 text-slate-700 dark:text-slate-200" />
              </button>

              <div className="flex items-center gap-2 text-xs font-medium">
                <span className="text-slate-400 dark:text-slate-500">ERP</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 stroke-[2.5]" />
                <span className="font-bold text-slate-900 dark:text-white capitalize">
                  {pathname === "/" ? "Dashboard" : pathname.replace("/", "").replace(/-/g, " ")}
                </span>
              </div>
            </div>

            {/* Right Header Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Search patients, doctors, appointments... ⌘ K */}
              <div className="hidden md:flex items-center relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search patients, doctors, appointments..."
                  className="w-60 lg:w-72 pl-8 pr-12 py-1.5 rounded-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <kbd className="absolute right-2.5 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400">
                  ⌘ K
                </kbd>
              </div>

              {/* Branch Selector Pill: ● Central HQ v */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Central HQ</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>

              {/* Notification Bell with Red Badge "3" */}
              <div className="relative">
                <button
                  type="button"
                  className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative cursor-pointer"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute 0 top-1 right-1 w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
                    3
                  </span>
                </button>
              </div>

              {/* Theme Toggle (Sun icon) */}
              <ThemeToggle />

              {/* User Profile Pill at far right: SR | S M Al Rabbi | IT Department */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2.5 p-1 sm:px-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                  title="User Profile: S M Al Rabbi"
                >
                  {/* Black Circle with White SR */}
                  <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center shadow-sm shrink-0">
                    SR
                  </div>

                  {/* Name & Role on sm+ screens */}
                  <div className="hidden sm:block text-left min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate leading-tight">
                      S M Al Rabbi
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                      IT Department
                    </p>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-12 mt-2 w-64 z-50 bg-white dark:bg-[#0B111E] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-150">
                      <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                            SR
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">S M Al Rabbi</p>
                            <p className="text-[10px] text-slate-400">IT Department • Super Admin</p>
                          </div>
                        </div>
                      </div>

                      <div className="py-1 text-xs">
                        <Link
                          href="/settings"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Settings className="w-4 h-4 text-slate-400" />
                          <span>System Preferences</span>
                        </Link>
                      </div>

                      <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={handleLogout}
                          disabled={loggingOut}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
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
          <main className="flex-1 p-4 sm:p-6 lg:p-7 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}
