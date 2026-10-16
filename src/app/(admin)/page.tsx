"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Users,
  Calendar,
  CalendarDays,
  Clock,
  Search,
  Plus,
  RefreshCw,
  CheckCircle2,
  MapPin,
  ChevronDown,
  ArrowUpRight,
  Stethoscope,
  Star,
  DollarSign,
  MoreVertical,
  CalendarPlus,
  ArrowRight,
  X,
  CreditCard,
  Wallet,
  Smile,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AdminDashboardPage() {
  const [selectedBranch, setSelectedBranch] = useState("fajr");
  const [timeRange, setTimeRange] = useState("today");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New appointment form state
  const [patientName, setPatientName] = useState("");
  const [ageGender, setAgeGender] = useState("");
  const [department, setDepartment] = useState("General Medicine");
  const [doctor, setDoctor] = useState("Dr. Sayyadul Ameen");

  const [appointments, setAppointments] = useState([
    {
      id: "APT-1",
      time: "10:45 AM",
      patient: "Rahim Uddin",
      ageGender: "32 / M",
      department: "General Medicine",
      doctor: "Dr. Sayyadul Ameen",
      status: "Confirmed",
    },
    {
      id: "APT-2",
      time: "11:15 AM",
      patient: "Farhana Akter",
      ageGender: "28 / F",
      department: "Gynecology",
      doctor: "Dr. Nafisa Moni",
      status: "Confirmed",
    },
    {
      id: "APT-3",
      time: "12:00 PM",
      patient: "Md. Rafiq Hasan",
      ageGender: "45 / M",
      department: "Dermatology",
      doctor: "Dr. Hasan Kabir",
      status: "Confirmed",
    },
    {
      id: "APT-4",
      time: "01:30 PM",
      patient: "Ayesha Rahman",
      ageGender: "22 / F",
      department: "Pediatrics",
      doctor: "Dr. Farah Deba",
      status: "Pending",
    },
    {
      id: "APT-5",
      time: "03:00 PM",
      patient: "Tariq Ahmed",
      ageGender: "38 / M",
      department: "General Medicine",
      doctor: "Dr. Sayyadul Ameen",
      status: "Confirmed",
    },
  ]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      triggerToast("Telemetry data synced successfully!");
    }, 600);
  };

  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) return;

    const newAppt = {
      id: `APT-${appointments.length + 1}`,
      time: "04:15 PM",
      patient: patientName,
      ageGender: ageGender || "30 / M",
      department: department,
      doctor: doctor,
      status: "Confirmed",
    };

    setAppointments([newAppt, ...appointments]);
    setPatientName("");
    setAgeGender("");
    setBookingModalOpen(false);
    triggerToast(`Appointment booked for ${patientName}!`);
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      {/* ── Toast Floating Alert ─────────────────────────────────────────── */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 border border-emerald-500/40 text-white shadow-2xl rounded-2xl px-4 py-3 flex items-center gap-3 backdrop-blur-md animate-in slide-in-from-top-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* ── 1. Executive Hospital Command Center Banner ───────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#032d1f] via-[#053d2b] to-[#04281c] text-white p-6 sm:p-7 shadow-lg border border-emerald-600/30">
        <div className="relative z-10 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
          {/* Title & Description */}
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Hospital Operations</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Executive Hospital Command Center
            </h1>

            <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed font-normal">
              Monitor key performance indicators, manage operations, and ensure seamless patient care across all branches of LifeSpring Healthcare.
            </p>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full xl:w-auto">
            {/* Branch Selector: MapPin + Fajr Academy + Chevron */}
            <div className="relative">
              <div className="flex items-center gap-2 bg-[#021f15]/80 border border-emerald-600/40 text-emerald-100 text-xs font-semibold rounded-xl px-3.5 py-2 cursor-pointer shadow-inner">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="bg-transparent appearance-none text-emerald-100 pr-5 focus:outline-none cursor-pointer"
                >
                  <option value="fajr" className="bg-slate-900 text-white">Fajr Academy</option>
                  <option value="panthapath" className="bg-slate-900 text-white">Panthapath Central HQ</option>
                  <option value="dhanmondi" className="bg-slate-900 text-white">Dhanmondi Special Care</option>
                  <option value="banani" className="bg-slate-900 text-white">Banani Wellness Suite</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-emerald-300 absolute right-3 pointer-events-none" />
              </div>
            </div>

            {/* Time Filter Pill */}
            <div className="flex items-center bg-[#021f15]/80 border border-emerald-600/40 p-1 rounded-xl text-xs font-medium">
              {[
                { id: "today", label: "Today" },
                { id: "week", label: "This Week" },
                { id: "month", label: "This Month" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTimeRange(t.id)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    timeRange === t.id
                      ? "bg-[#5eead4] text-slate-950 font-bold shadow-sm"
                      : "text-emerald-200 hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Sync Button */}
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 bg-[#021f15]/80 border border-emerald-600/40 text-emerald-200 hover:bg-emerald-800/40 hover:text-white px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              title="Refresh Telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-emerald-400" : ""}`} />
              <span>Sync</span>
            </button>

            {/* Book Appointment Button */}
            <button
              onClick={() => setBookingModalOpen(true)}
              className="flex items-center gap-2 bg-[#2dd4bf] hover:bg-[#14b8a6] text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <CalendarPlus className="w-4 h-4 stroke-[2.2]" />
              <span>Book Appointment</span>
            </button>
          </div>
        </div>

        {/* Date, Time & Live Status Indicator at Bottom Right */}
        <div className="mt-4 pt-3 border-t border-emerald-500/20 flex justify-end items-center gap-3 text-xs text-emerald-200">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-300" />
            <span>10 Oct 2026  11:42 AM</span>
          </div>
          <div className="flex items-center gap-1.5 font-bold text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Live</span>
          </div>
        </div>
      </div>

      {/* ── 2. Five Executive KPI Cards with Sparklines ───────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Card 1: Total Revenue */}
        <Card className="bg-white dark:bg-[#0c1424] border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold text-sm">
              <DollarSign className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Revenue</span>
          </div>

          <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">৳ 24,85,600</h3>
            <div className="flex items-center gap-1.5 text-xs mt-1">
              <span className="text-emerald-600 font-bold flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" /> +16.4%
              </span>
              <span className="text-slate-400 text-[11px]">vs. last 30 days</span>
            </div>
          </div>

          {/* Sparkline wave: Green */}
          <div className="h-9 w-full">
            <svg viewBox="0 0 120 30" className="w-full h-full overflow-visible" preserveAspectRatio="none">
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path d="M0,22 Q25,25 45,18 T90,14 T120,4 L120,30 L0,30 Z" fill="url(#revGrad)" />
              <path d="M0,22 Q25,25 45,18 T90,14 T120,4" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <Wallet className="w-3 h-3 text-slate-400" /> Today ৳ 3,40,000
            </span>
            <span className="flex items-center gap-1">
              <CreditCard className="w-3 h-3 text-slate-400" /> Last Month ৳ 21,40,000
            </span>
          </div>
        </Card>

        {/* Card 2: Appointments Today */}
        <Card className="bg-white dark:bg-[#0c1424] border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-full bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 flex items-center justify-center">
              <Calendar className="w-4 h-4 stroke-[2.2]" />
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Appointments Today</span>
          </div>

          <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">148 Patients</h3>
            <div className="flex items-center gap-1.5 text-xs mt-1">
              <span className="text-emerald-600 font-bold flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" /> +12.6%
              </span>
              <span className="text-slate-400 text-[11px]">vs. last week</span>
            </div>
          </div>

          {/* Sparkline wave: Blue */}
          <div className="h-9 w-full">
            <svg viewBox="0 0 120 30" className="w-full h-full overflow-visible" preserveAspectRatio="none">
              <defs>
                <linearGradient id="apptGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path d="M0,24 Q30,20 55,22 T95,12 T120,6 L120,30 L0,30 Z" fill="url(#apptGrad)" />
              <path d="M0,24 Q30,20 55,22 T95,12 T120,6" fill="none" stroke="#0ea5e9" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Confirmed 124
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Walk-in 24
            </span>
          </div>
        </Card>

        {/* Card 3: Lead Conversion */}
        <Card className="bg-white dark:bg-[#0c1424] border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4 stroke-[2.2]" />
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Lead Conversion</span>
          </div>

          <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">74.8%</h3>
            <div className="flex items-center gap-1.5 text-xs mt-1">
              <span className="text-emerald-600 font-bold flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" /> +8.2%
              </span>
              <span className="text-slate-400 text-[11px]">vs. last week</span>
            </div>
          </div>

          {/* Sparkline wave: Purple */}
          <div className="h-9 w-full">
            <svg viewBox="0 0 120 30" className="w-full h-full overflow-visible" preserveAspectRatio="none">
              <defs>
                <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path d="M0,26 Q25,24 50,18 T90,16 T120,8 L120,30 L0,30 Z" fill="url(#leadGrad)" />
              <path d="M0,26 Q25,24 50,18 T90,16 T120,8" fill="none" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span>Total Leads 512</span>
            <span>Converted 383</span>
          </div>
        </Card>

        {/* Card 4: Doctors on Duty */}
        <Card className="bg-white dark:bg-[#0c1424] border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4 stroke-[2.2]" />
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Doctors on Duty</span>
          </div>

          <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">38 Active</h3>
            <div className="flex items-center gap-1.5 text-xs mt-1">
              <span className="text-emerald-600 font-bold flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" /> +2.7%
              </span>
              <span className="text-slate-400 text-[11px]">vs. last week</span>
            </div>
          </div>

          {/* Sparkline wave: Teal */}
          <div className="h-9 w-full">
            <svg viewBox="0 0 120 30" className="w-full h-full overflow-visible" preserveAspectRatio="none">
              <defs>
                <linearGradient id="docGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path d="M0,25 Q30,16 60,20 T95,12 T120,6 L120,30 L0,30 Z" fill="url(#docGrad)" />
              <path d="M0,25 Q30,16 60,20 T95,12 T120,6" fill="none" stroke="#14b8a6" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> On Leave 3
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600" /> On Call 2
            </span>
          </div>
        </Card>

        {/* Card 5: Patient Rating */}
        <Card className="bg-white dark:bg-[#0c1424] border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Patient Rating</span>
          </div>

          <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              4.94 <span className="text-base text-slate-400 font-normal">/ 5</span>
            </h3>
            <div className="flex items-center gap-1.5 text-xs mt-1">
              <span className="text-emerald-600 font-bold flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" /> +0.12
              </span>
              <span className="text-slate-400 text-[11px]">vs. last month</span>
            </div>
          </div>

          {/* Sparkline wave: Amber */}
          <div className="h-9 w-full">
            <svg viewBox="0 0 120 30" className="w-full h-full overflow-visible" preserveAspectRatio="none">
              <defs>
                <linearGradient id="rateGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path d="M0,24 Q30,22 55,20 T95,14 T120,8 L120,30 L0,30 Z" fill="url(#rateGrad)" />
              <path d="M0,24 Q30,22 55,20 T95,14 T120,8" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span>Total Reviews 1,260</span>
            <span>Happy Patients 95%</span>
          </div>
        </Card>
      </div>

      {/* ── 3. Middle Section: Revenue Trend (Left) & Specialist Roster (Right) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Revenue & Patient Volume Trend */}
        <Card className="lg:col-span-2 bg-white dark:bg-[#0c1424] border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Revenue & Patient Volume Trend</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Daily revenue and patient volume for the selected period
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-700" />
                <span className="text-slate-600 dark:text-slate-300">Revenue (৳)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-slate-600 dark:text-slate-300">Patient Volume</span>
              </div>
            </div>
          </div>

          {/* Dual Axis Interactive Graph */}
          <div className="h-64 w-full relative flex flex-col justify-between pt-2">
            <svg viewBox="0 0 650 200" className="w-full h-full overflow-visible" preserveAspectRatio="none">
              <defs>
                <linearGradient id="mainAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="60" y1="20" x2="600" y2="20" stroke="currentColor" strokeOpacity="0.06" />
              <line x1="60" y1="60" x2="600" y2="60" stroke="currentColor" strokeOpacity="0.06" />
              <line x1="60" y1="100" x2="600" y2="100" stroke="currentColor" strokeOpacity="0.06" />
              <line x1="60" y1="140" x2="600" y2="140" stroke="currentColor" strokeOpacity="0.06" />
              <line x1="60" y1="180" x2="600" y2="180" stroke="currentColor" strokeOpacity="0.06" />

              {/* Area Under Curve 1 (Revenue) */}
              <path
                d="M80,160 L160,135 L245,140 L325,120 L410,105 L490,80 L570,50 L570,180 L80,180 Z"
                fill="url(#mainAreaGrad)"
              />

              {/* Curve 1: Revenue Line (Dark Emerald) */}
              <path
                d="M80,160 L160,135 L245,140 L325,120 L410,105 L490,80 L570,50"
                fill="none"
                stroke="#047857"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Curve 2: Patient Volume Line (Bright Mint) */}
              <path
                d="M80,175 L160,155 L245,160 L325,145 L410,130 L490,115 L570,95"
                fill="none"
                stroke="#34d399"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Revenue Data Points */}
              {[
                { x: 80, y: 160 },
                { x: 160, y: 135 },
                { x: 245, y: 140 },
                { x: 325, y: 120 },
                { x: 410, y: 105 },
                { x: 490, y: 80 },
                { x: 570, y: 50 },
              ].map((pt, i) => (
                <circle key={`rev-${i}`} cx={pt.x} cy={pt.y} r="4.5" fill="#047857" stroke="#ffffff" strokeWidth="2" />
              ))}

              {/* Patient Volume Data Points */}
              {[
                { x: 80, y: 175 },
                { x: 160, y: 155 },
                { x: 245, y: 160 },
                { x: 325, y: 145 },
                { x: 410, y: 130 },
                { x: 490, y: 115 },
                { x: 570, y: 95 },
              ].map((pt, i) => (
                <circle key={`pt-${i}`} cx={pt.x} cy={pt.y} r="3.5" fill="#34d399" stroke="#ffffff" strokeWidth="1.5" />
              ))}

              {/* Y-Axis Labels Left (Revenue ৳) */}
              <text x="10" y="24" className="text-[10px] fill-slate-400 font-mono">৳ 5,00,000</text>
              <text x="10" y="64" className="text-[10px] fill-slate-400 font-mono">৳ 4,00,000</text>
              <text x="10" y="104" className="text-[10px] fill-slate-400 font-mono">৳ 3,00,000</text>
              <text x="10" y="144" className="text-[10px] fill-slate-400 font-mono">৳ 2,00,000</text>
              <text x="10" y="184" className="text-[10px] fill-slate-400 font-mono">৳ 1,00,000</text>

              {/* Y-Axis Labels Right (Patient Volume) */}
              <text x="615" y="24" className="text-[10px] fill-slate-400 font-mono">200</text>
              <text x="615" y="64" className="text-[10px] fill-slate-400 font-mono">150</text>
              <text x="615" y="104" className="text-[10px] fill-slate-400 font-mono">100</text>
              <text x="615" y="144" className="text-[10px] fill-slate-400 font-mono">50</text>
              <text x="615" y="184" className="text-[10px] fill-slate-400 font-mono">0</text>
            </svg>

            {/* X-Axis Dates */}
            <div className="flex justify-between px-16 text-[11px] text-slate-400 font-medium pt-2">
              <span>Oct 4</span>
              <span>Oct 5</span>
              <span>Oct 6</span>
              <span>Oct 7</span>
              <span>Oct 8</span>
              <span>Oct 9</span>
              <span>Oct 10</span>
            </div>
          </div>
        </Card>

        {/* Right Column (1 Col): Live Specialist Roster */}
        <Card className="bg-white dark:bg-[#0c1424] border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Live Specialist Roster</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Doctors currently on duty at Fajr Academy
              </p>
            </div>
            <Link href="/appointments" className="text-xs font-bold text-emerald-600 hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {/* Doctor 1: Dr. Sayyadul Ameen */}
            <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  SA
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Dr. Sayyadul Ameen</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">General Physician (MBBS)</p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> On Duty
                </span>
                <p className="text-[10px] text-slate-400 mt-1">19 patients</p>
              </div>
            </div>

            {/* Doctor 2: Dr. Farah Deba */}
            <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-sky-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  FD
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Dr. Farah Deba</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Child Specialist (MD)</p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> On Duty
                </span>
                <p className="text-[10px] text-slate-400 mt-1">16 patients</p>
              </div>
            </div>

            {/* Doctor 3: Dr. Hasan Kabir */}
            <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  HK
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Dr. Hasan Kabir</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Dermatologist (MD)</p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> On Call
                </span>
                <p className="text-[10px] text-slate-400 mt-1">8 patients</p>
              </div>
            </div>

            {/* Doctor 4: Dr. Nafisa Moni */}
            <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  NM
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Dr. Nafisa Moni</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Gynecologist (MBBS)</p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> On Duty
                </span>
                <p className="text-[10px] text-slate-400 mt-1">12 patients</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* ── 4. Bottom Section: Upcoming Appointments Table ───────────────── */}
      <Card className="bg-white dark:bg-[#0c1424] border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Upcoming Appointments</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Next 5 appointments across all departments
            </p>
          </div>

          <Link
            href="/appointments"
            className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
          >
            <span>View All Appointments</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Clean Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3">Time</th>
                <th className="py-3 px-3">Patient</th>
                <th className="py-3 px-3">Age / Gender</th>
                <th className="py-3 px-3">Department</th>
                <th className="py-3 px-3">Doctor</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {appointments.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors">
                  <td className="py-3.5 px-3 font-semibold text-slate-800 dark:text-slate-200">{item.time}</td>
                  <td className="py-3.5 px-3 font-bold text-slate-900 dark:text-white">{item.patient}</td>
                  <td className="py-3.5 px-3 text-slate-500 dark:text-slate-400">{item.ageGender}</td>
                  <td className="py-3.5 px-3 text-slate-600 dark:text-slate-300 font-medium">{item.department}</td>
                  <td className="py-3.5 px-3 text-slate-700 dark:text-slate-200 font-medium">{item.doctor}</td>
                  <td className="py-3.5 px-3">
                    {item.status === "Confirmed" ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Confirmed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-3 h-3 text-amber-600" /> Pending
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => triggerToast(`Viewing details for ${item.patient}`)}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
                      >
                        View
                      </button>
                      <button
                        onClick={() => triggerToast(`Options for ${item.id}`)}
                        className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── 5. Book Appointment Modal ─────────────────────────────────────── */}
      {bookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-[#0c1424] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarPlus className="w-4 h-4 text-emerald-600" />
                <span>Book New Appointment</span>
              </h3>
              <button
                onClick={() => setBookingModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Patient Full Name
                </label>
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="e.g. Tanvir Hossain"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Age / Gender
                </label>
                <input
                  type="text"
                  value={ageGender}
                  onChange={(e) => setAgeGender(e.target.value)}
                  placeholder="e.g. 35 / M"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="General Medicine">General Medicine</option>
                  <option value="Gynecology">Gynecology</option>
                  <option value="Dermatology">Dermatology</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="Psychiatry">Psychiatry</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Doctor / Specialist
                </label>
                <select
                  value={doctor}
                  onChange={(e) => setDoctor(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="Dr. Sayyadul Ameen">Dr. Sayyadul Ameen (MBBS)</option>
                  <option value="Dr. Farah Deba">Dr. Farah Deba (MD)</option>
                  <option value="Dr. Hasan Kabir">Dr. Hasan Kabir (MD)</option>
                  <option value="Dr. Nafisa Moni">Dr. Nafisa Moni (MBBS)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBookingModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#00875A] hover:bg-[#00744D] text-white font-bold cursor-pointer"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
