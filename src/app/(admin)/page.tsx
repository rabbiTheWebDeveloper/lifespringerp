"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  CalendarDays,
  TrendingUp,
  Users2,
  Stethoscope,
  HeartPulse,
  Activity,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  DollarSign,
  Clock,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  AlertCircle,
  Video,
  Building2,
  MapPin,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  FileSpreadsheet,
  Download,
  Phone,
  Mail,
  UserCheck,
  SlidersHorizontal,
  Flame,
  Award,
  Calendar,
  X,
  Eye,
  Check,
  Brain,
  Smile,
  BadgeAlert,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

// ── Mock Branches ─────────────────────────────────────────────────────────────
const BRANCHES = [
  { id: "all", name: "All Branches", city: "National Network" },
  { id: "panthapath", name: "Panthapath Central HQ", city: "Dhaka" },
  { id: "dhanmondi", name: "Dhanmondi Special Care", city: "Dhaka" },
  { id: "banani", name: "Banani Wellness Suite", city: "Dhaka" },
  { id: "chittagong", name: "Chittagong Regional Hub", city: "Chattogram" },
  { id: "sylhet", name: "Sylhet Consultation Clinic", city: "Sylhet" },
];

// ── Mock Specialists on Duty ──────────────────────────────────────────────────
const SPECIALISTS_ON_DUTY = [
  {
    id: "doc-1",
    name: "Dr. Sayedul Ashraf",
    title: "Lead Psychiatrist & Founder",
    department: "Psychiatry",
    branch: "Panthapath Central HQ",
    room: "Room 402",
    avatar: "SA",
    status: "In Session",
    patientsToday: 18,
    rating: 4.98,
    telehealth: true,
  },
  {
    id: "doc-2",
    name: "Dr. Farah Deeba",
    title: "Senior Clinical Psychologist",
    department: "Clinical Psychology",
    branch: "Dhanmondi Special Care",
    room: "Room 205",
    avatar: "FD",
    status: "Available",
    patientsToday: 14,
    rating: 4.95,
    telehealth: true,
  },
  {
    id: "doc-3",
    name: "Dr. Tanvir Ahmed",
    title: "Neuropsychiatrist & Sleep Specialist",
    department: "Neuropsychiatry",
    branch: "Banani Wellness Suite",
    room: "Suite 108",
    avatar: "TA",
    status: "In Session",
    patientsToday: 12,
    rating: 4.92,
    telehealth: false,
  },
  {
    id: "doc-4",
    name: "Farzana Sultana",
    title: "Child & Adolescent Therapist",
    department: "Child Development",
    branch: "Panthapath Central HQ",
    room: "Child Wing 3",
    avatar: "FS",
    status: "Waiting",
    patientsToday: 16,
    rating: 4.96,
    telehealth: true,
  },
  {
    id: "doc-5",
    name: "Dr. Mahbubur Rahman",
    title: "Consultant Psychiatrist",
    department: "Psychiatry",
    branch: "Chittagong Regional Hub",
    room: "Room 101",
    avatar: "MR",
    status: "In Session",
    patientsToday: 15,
    rating: 4.89,
    telehealth: true,
  },
];

// ── Initial Mock Appointments Queue ───────────────────────────────────────────
const INITIAL_APPOINTMENTS = [
  {
    id: "LS-9201",
    patientName: "Tasnim Rahman",
    age: 29,
    gender: "Female",
    phone: "+880 1712-894520",
    specialist: "Dr. Sayedul Ashraf",
    department: "Psychiatry",
    branch: "Panthapath Central HQ",
    room: "Room 402",
    time: "11:15 AM",
    type: "In-Clinic",
    status: "In Session",
    paymentStatus: "Paid",
    amount: "৳ 2,500",
  },
  {
    id: "LS-9202",
    patientName: "Kazi Ashikur Islam",
    age: 34,
    gender: "Male",
    phone: "+880 1823-456789",
    specialist: "Dr. Farah Deeba",
    department: "Clinical Psychology",
    branch: "Dhanmondi Special Care",
    room: "Room 205",
    time: "11:30 AM",
    type: "Telemedicine",
    status: "Waiting in Lobby",
    paymentStatus: "Paid",
    amount: "৳ 2,000",
  },
  {
    id: "LS-9203",
    patientName: "Nusrat Jahan Chowdhury",
    age: 26,
    gender: "Female",
    phone: "+880 1911-348921",
    specialist: "Farzana Sultana",
    department: "Child Development",
    branch: "Panthapath Central HQ",
    room: "Child Wing 3",
    time: "11:45 AM",
    type: "In-Clinic",
    status: "Confirmed",
    paymentStatus: "Due at Counter",
    amount: "৳ 2,200",
  },
  {
    id: "LS-9204",
    patientName: "Rezaul Karim",
    age: 48,
    gender: "Male",
    phone: "+880 1715-992233",
    specialist: "Dr. Tanvir Ahmed",
    department: "Neuropsychiatry",
    branch: "Banani Wellness Suite",
    room: "Suite 108",
    time: "12:00 PM",
    type: "In-Clinic",
    status: "Confirmed",
    paymentStatus: "Paid",
    amount: "৳ 3,000",
  },
  {
    id: "LS-9205",
    patientName: "Sabrina Momotaz",
    age: 31,
    gender: "Female",
    phone: "+880 1689-112233",
    specialist: "Dr. Mahbubur Rahman",
    department: "Psychiatry",
    branch: "Chittagong Regional Hub",
    room: "Room 101",
    time: "12:15 PM",
    type: "Telemedicine",
    status: "In Session",
    paymentStatus: "Paid",
    amount: "৳ 2,500",
  },
  {
    id: "LS-9206",
    patientName: "Mahmud Hasan",
    age: 42,
    gender: "Male",
    phone: "+880 1734-556677",
    specialist: "Dr. Farah Deeba",
    department: "Clinical Psychology",
    branch: "Dhanmondi Special Care",
    room: "Room 205",
    time: "10:30 AM",
    type: "In-Clinic",
    status: "Completed",
    paymentStatus: "Paid",
    amount: "৳ 2,000",
  },
];

// ── Mock Pipeline Leads ───────────────────────────────────────────────────────
const RECENT_LEADS = [
  {
    id: "LD-881",
    name: "Sabbir Hossain",
    phone: "+880 1718-445566",
    interest: "Adult ADHD & Focus Evaluation",
    budget: "৳ 5,000 - 8,000",
    score: 96,
    stage: "Consultation Booked",
    assignedTo: "Sadia A.",
    date: "10 mins ago",
  },
  {
    id: "LD-882",
    name: "Mehnaz Parveen",
    phone: "+880 1912-778899",
    interest: "Couple Therapy & Relationship Counseling",
    budget: "৳ 12,000 Package",
    score: 91,
    stage: "Needs Assessment",
    assignedTo: "Tanvir R.",
    date: "24 mins ago",
  },
  {
    id: "LD-883",
    name: "Kamrul Ahsan",
    phone: "+880 1822-334455",
    interest: "Child Speech & Autism Screening",
    budget: "৳ 15,000 Package",
    score: 87,
    stage: "New Inquiry",
    assignedTo: "Rakibul H.",
    date: "45 mins ago",
  },
  {
    id: "LD-884",
    name: "Farhana Yasmin",
    phone: "+880 1678-990011",
    interest: "Post-Partum Depression Support",
    budget: "৳ 6,500",
    score: 94,
    stage: "Needs Assessment",
    assignedTo: "Sadia A.",
    date: "1 hour ago",
  },
];

// ── Mock Activity Feed ────────────────────────────────────────────────────────
const LIVE_ACTIVITIES = [
  {
    id: 1,
    time: "2 mins ago",
    type: "payment",
    text: "Payment of ৳ 2,500 received via bKash for Patient Tasnim Rahman (LS-9201).",
    badge: "bKash Paid",
    badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  {
    id: 2,
    time: "8 mins ago",
    type: "appointment",
    text: "Dr. Sayedul Ashraf commenced consultation in Room 402 (Panthapath HQ).",
    badge: "Consultation Started",
    badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  {
    id: 3,
    time: "14 mins ago",
    type: "lead",
    text: "High-intent lead #LD-881 scored 96/100 and converted to scheduled appointment.",
    badge: "Lead Converted",
    badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  },
  {
    id: 4,
    time: "25 mins ago",
    type: "telehealth",
    text: "Telemedicine Google Meet link generated and dispatched to Kazi Ashikur Islam.",
    badge: "Telehealth Sync",
    badgeColor: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
  },
];

export default function AdminDashboardPage() {
  // ── States ──────────────────────────────────────────────────────────────────
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [timeRange, setTimeRange] = useState("today");
  const [activeTab, setActiveTab] = useState<"overview" | "appointments" | "leads" | "specialists">("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [appointments, setAppointments] = useState(INITIAL_APPOINTMENTS);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals state
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [newPatientName, setNewPatientName] = useState("");
  const [newPatientPhone, setNewPatientPhone] = useState("");
  const [newDepartment, setNewDepartment] = useState("Psychiatry");
  const [newSpecialist, setNewSpecialist] = useState("Dr. Sayedul Ashraf");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Show temporary toast
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      triggerToast("Real-time ERP telemetry synced successfully!");
    }, 600);
  };

  // Add Appointment handler
  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName.trim()) return;

    const newAppt = {
      id: `LS-${Math.floor(9207 + Math.random() * 500)}`,
      patientName: newPatientName,
      age: 30,
      gender: "Not specified",
      phone: newPatientPhone || "+880 1700-000000",
      specialist: newSpecialist,
      department: newDepartment,
      branch: selectedBranch === "all" ? "Panthapath Central HQ" : BRANCHES.find((b) => b.id === selectedBranch)?.name || "Central HQ",
      room: "Room 301",
      time: "02:30 PM",
      type: "In-Clinic",
      status: "Confirmed",
      paymentStatus: "Paid",
      amount: "৳ 2,500",
    };

    setAppointments([newAppt, ...appointments]);
    setNewPatientName("");
    setNewPatientPhone("");
    setAppointmentModalOpen(false);
    triggerToast(`Appointment #${newAppt.id} successfully booked!`);
  };

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((item) => {
      const matchBranch =
        selectedBranch === "all"
          ? true
          : item.branch.toLowerCase().includes(selectedBranch.toLowerCase());
      const matchStatus =
        statusFilter === "all"
          ? true
          : item.status.toLowerCase().includes(statusFilter.toLowerCase());
      const matchSearch =
        item.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.specialist.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.phone.includes(searchQuery);

      return matchBranch && matchStatus && matchSearch;
    });
  }, [appointments, selectedBranch, statusFilter, searchQuery]);

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      {/* ── Toast Notification Floating Pill ──────────────────────────────── */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-950/95 border border-emerald-500/40 text-emerald-100 shadow-2xl rounded-2xl px-4 py-3 flex items-center gap-3 backdrop-blur-md animate-in slide-in-from-top-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* ── Top Executive Command Banner ──────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#06331e] via-[#09472b] to-[#041c11] text-white p-6 sm:p-8 border border-emerald-500/30 shadow-2xl">
        {/* Subtle decorative background mesh */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
          {/* Welcome Info */}
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-semibold backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>LifeSpring Clinical ERP • Live Telemetry</span>
              <span className="text-emerald-400/60">•</span>
              <span className="text-emerald-300/90 font-mono">v3.2 Enterprise</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold tracking-tight text-white flex items-center gap-3">
              <span>Executive Hospital Command Center</span>
            </h1>

            <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
              Monitoring psychiatric consultations, outpatient queues, revenue streams, and nationwide lead conversions across all LifeSpring branches in real-time.
            </p>
          </div>

          {/* Quick Controls & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full xl:w-auto">
            {/* Branch Selector Dropdown Pill */}
            <div className="relative">
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="appearance-none bg-emerald-950/70 border border-emerald-600/40 text-emerald-100 text-xs font-semibold rounded-xl px-3.5 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 cursor-pointer shadow-inner"
              >
                {BRANCHES.map((b) => (
                  <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                    {b.name}
                  </option>
                ))}
              </select>
              <Building2 className="w-3.5 h-3.5 text-emerald-300 absolute right-3 top-3.5 pointer-events-none" />
            </div>

            {/* Time Filter Pill */}
            <div className="flex items-center bg-emerald-950/70 border border-emerald-600/40 p-1 rounded-xl text-xs font-medium">
              {[
                { id: "today", label: "Today" },
                { id: "week", label: "This Week" },
                { id: "month", label: "This Month" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTimeRange(t.id)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    timeRange === t.id
                      ? "bg-emerald-500 text-emerald-950 font-bold shadow-sm"
                      : "text-emerald-200 hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Sync Refresh Button */}
            <Button
              variant="outline"
              size="default"
              onClick={handleRefresh}
              className="bg-emerald-950/60 border-emerald-600/40 text-emerald-200 hover:bg-emerald-800/50 hover:text-white h-10 px-3 rounded-xl gap-2 cursor-pointer"
              title="Refresh Live Telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-emerald-400" : ""}`} />
              <span className="hidden sm:inline">Sync</span>
            </Button>

            {/* + New Appointment Button */}
            <Button
              onClick={() => setAppointmentModalOpen(true)}
              className="bg-gradient-to-r from-emerald-400 to-teal-400 text-emerald-950 font-bold text-xs h-10 px-4 rounded-xl shadow-lg shadow-emerald-500/20 hover:from-emerald-300 hover:to-teal-300 transition-all active:scale-95 gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Book Appointment</span>
            </Button>
          </div>
        </div>

        {/* Live Status Ticker Banner */}
        <div className="mt-6 pt-4 border-t border-emerald-500/20 flex flex-wrap items-center justify-between gap-4 text-xs text-emerald-200/90">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-medium">Telemedicine Server:</span>
              <span className="font-bold text-emerald-300">Active (0% Packet Loss)</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-medium">Avg Clinic Wait Time:</span>
              <span className="font-bold text-white">12 Minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <Users2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-medium">Outpatient Load:</span>
              <span className="font-bold text-white">Moderate (78% capacity)</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-emerald-300/80">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>ISO 27001 Clinical HIPAA Compliance Active</span>
          </div>
        </div>
      </div>

      {/* ── 5 Key Executive KPI Cards (Shadcn Cards) ───────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Card 1: Total Revenue */}
        <Card className="relative overflow-hidden bg-white dark:bg-[#0c1322] border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all group">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Revenue
              </CardDescription>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                ৳
              </div>
            </div>
            <CardTitle className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              ৳ 24,85,600
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            <div className="flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                <ArrowUpRight className="w-3.5 h-3.5" />
                +16.4%
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">vs target</span>
            </div>
            {/* Custom mini progress bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: "82.8%" }} />
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 flex justify-between">
              <span>Goal: ৳ 30,00,000</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">82.8% achieved</span>
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Today's Appointments */}
        <Card className="relative overflow-hidden bg-white dark:bg-[#0c1322] border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all group">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Appointments Today
              </CardDescription>
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <CalendarDays className="w-4 h-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              148 Patients
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            <div className="flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400">
                <ArrowUpRight className="w-3.5 h-3.5" />
                +12% Today
              </span>
              <Badge variant="outline" className="text-[10px] bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/60">
                87% Slot Filled
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-1 pt-1 text-center">
              <div className="bg-slate-50 dark:bg-slate-900/60 p-1 rounded-lg">
                <span className="block text-xs font-bold text-emerald-600 dark:text-emerald-400">96</span>
                <span className="text-[9px] text-slate-400">Done</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/60 p-1 rounded-lg">
                <span className="block text-xs font-bold text-amber-500">32</span>
                <span className="text-[9px] text-slate-400">In-Clinic</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/60 p-1 rounded-lg">
                <span className="block text-xs font-bold text-purple-500">20</span>
                <span className="text-[9px] text-slate-400">Video</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Lead Pipeline Conversion */}
        <Card className="relative overflow-hidden bg-white dark:bg-[#0c1322] border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all group">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Lead Conversion
              </CardDescription>
              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Users2 className="w-4 h-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              74.8%
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            <div className="flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1 font-bold text-purple-600 dark:text-purple-400">
                <ArrowUpRight className="w-3.5 h-3.5" />
                312 of 418
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">converted</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div className="bg-purple-500 h-full rounded-full" style={{ width: "74.8%" }} />
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 flex justify-between">
              <span>Avg close time: 4.2 hrs</span>
              <span className="font-semibold text-purple-600 dark:text-purple-400">High intent</span>
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Specialists on Duty */}
        <Card className="relative overflow-hidden bg-white dark:bg-[#0c1322] border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all group">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Doctors on Duty
              </CardDescription>
              <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <Stethoscope className="w-4 h-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              38 Active
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            <div className="flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1 font-bold text-teal-600 dark:text-teal-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Across 5 Branches
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">4 on-call</span>
            </div>
            <div className="flex items-center gap-1 pt-1">
              <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                14 Psych
              </Badge>
              <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                18 Psychol
              </Badge>
              <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                6 Therapy
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Card 5: Patient Care NPS */}
        <Card className="relative overflow-hidden bg-white dark:bg-[#0c1322] border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all group">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Patient Rating
              </CardDescription>
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-black text-slate-900 dark:text-white mt-1 flex items-baseline gap-1">
              <span>4.94</span>
              <span className="text-xs text-slate-400 font-normal">/ 5.0</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            <div className="flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                ★★★★★
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">1,420 ratings</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full" style={{ width: "98.8%" }} />
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 flex justify-between">
              <span>98.8% positive</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Exemplary Care</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Main Workspace Tabs ───────────────────────────────────────────── */}
      <div className="space-y-4">
        {/* Navigation Tab Bar */}
        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-3 flex-wrap gap-3">
          <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-900/80 rounded-2xl border border-slate-200/60 dark:border-slate-800">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "overview"
                  ? "bg-white dark:bg-[#0c1322] text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Executive Overview</span>
            </button>

            <button
              onClick={() => setActiveTab("appointments")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "appointments"
                  ? "bg-white dark:bg-[#0c1322] text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Live Queue & Schedule</span>
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                {filteredAppointments.length}
              </Badge>
            </button>

            <button
              onClick={() => setActiveTab("leads")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "leads"
                  ? "bg-white dark:bg-[#0c1322] text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Users2 className="w-3.5 h-3.5" />
              <span>Sales & Lead Funnel</span>
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px] bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                {RECENT_LEADS.length}
              </Badge>
            </button>

            <button
              onClick={() => setActiveTab("specialists")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "specialists"
                  ? "bg-white dark:bg-[#0c1322] text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Doctor Roster</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => triggerToast("Generating full clinic analytics PDF...")}
              className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-semibold gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export Summary</span>
            </Button>
          </div>
        </div>

        {/* ── TAB 1: EXECUTIVE OVERVIEW ────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-in fade-in duration-200">
            {/* Left 2 Cols: Revenue & Consultation Analytics + Departments */}
            <div className="xl:col-span-2 space-y-6">
              {/* Interactive Area Chart Box */}
              <Card className="bg-white dark:bg-[#0c1322] border-slate-200/80 dark:border-slate-800/80 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Clinical Revenue & Patient Volume Trajectory</span>
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        In-person hospital visits vs digital telemedicine revenue breakdown
                      </CardDescription>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-semibold">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span className="text-slate-600 dark:text-slate-300">In-Clinic Consultations</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-teal-400" />
                        <span className="text-slate-600 dark:text-slate-300">Telemedicine</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Clean SVG interactive chart */}
                  <div className="h-64 w-full relative flex flex-col justify-end">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 700 220" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="tealGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Grid Lines */}
                      <line x1="0" y1="40" x2="700" y2="40" stroke="currentColor" strokeOpacity="0.07" strokeDasharray="3 3" />
                      <line x1="0" y1="90" x2="700" y2="90" stroke="currentColor" strokeOpacity="0.07" strokeDasharray="3 3" />
                      <line x1="0" y1="140" x2="700" y2="140" stroke="currentColor" strokeOpacity="0.07" strokeDasharray="3 3" />
                      <line x1="0" y1="190" x2="700" y2="190" stroke="currentColor" strokeOpacity="0.07" />

                      {/* Area 1: In-Clinic Consultations */}
                      <path
                        d="M0,170 C100,150 150,110 230,120 C310,130 380,80 460,70 C540,60 620,40 700,30 L700,200 L0,200 Z"
                        fill="url(#emeraldGradient)"
                      />
                      <path
                        d="M0,170 C100,150 150,110 230,120 C310,130 380,80 460,70 C540,60 620,40 700,30"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />

                      {/* Area 2: Telemedicine Consultations */}
                      <path
                        d="M0,190 C100,180 150,150 230,160 C310,170 380,130 460,120 C540,115 620,95 700,80 L700,200 L0,200 Z"
                        fill="url(#tealGradient)"
                      />
                      <path
                        d="M0,190 C100,180 150,150 230,160 C310,170 380,130 460,120 C540,115 620,95 700,80"
                        fill="none"
                        stroke="#2dd4bf"
                        strokeWidth="2.5"
                        strokeDasharray="4 4"
                        strokeLinecap="round"
                      />

                      {/* Interactive Data Nodes */}
                      {[
                        { x: 0, y: 170, label: "Mon" },
                        { x: 140, y: 115, label: "Tue" },
                        { x: 280, y: 125, label: "Wed" },
                        { x: 420, y: 75, label: "Thu" },
                        { x: 560, y: 55, label: "Fri" },
                        { x: 700, y: 30, label: "Sat" },
                      ].map((pt, i) => (
                        <g key={i}>
                          <circle cx={pt.x} cy={pt.y} r="5" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
                        </g>
                      ))}
                    </svg>

                    {/* X-axis labels */}
                    <div className="flex justify-between text-[11px] text-slate-400 dark:text-slate-500 pt-2 font-medium">
                      <span>Monday</span>
                      <span>Tuesday</span>
                      <span>Wednesday</span>
                      <span>Thursday</span>
                      <span>Friday (Peak)</span>
                      <span>Saturday</span>
                      <span>Sunday</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Department Performance Matrix */}
              <Card className="bg-white dark:bg-[#0c1322] border-slate-200/80 dark:border-slate-800/80 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span>Clinical Department Breakdown</span>
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                        Patient volume and revenue contribution by medical specialty
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      5 Active Wings
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    {
                      dept: "Adult Psychiatry & Psychopharmacology",
                      revenue: "৳ 10,85,000",
                      patients: "410 Patients",
                      achieved: 92,
                      color: "bg-emerald-500",
                      badge: "Primary Wing",
                    },
                    {
                      dept: "Clinical Psychology & CBT Counseling",
                      revenue: "৳ 7,45,000",
                      patients: "390 Patients",
                      achieved: 88,
                      color: "bg-teal-500",
                      badge: "High Growth",
                    },
                    {
                      dept: "Child Development & Autism Therapy",
                      revenue: "৳ 4,15,600",
                      patients: "185 Patients",
                      achieved: 81,
                      color: "bg-purple-500",
                      badge: "Full Slot",
                    },
                    {
                      dept: "Marital & Relationship Psychotherapy",
                      revenue: "৳ 2,40,000",
                      patients: "98 Couples",
                      achieved: 76,
                      color: "bg-blue-500",
                      badge: "Trending",
                    },
                  ].map((item, idx) => (
                    <div key={idx} className="space-y-1.5 p-3 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{item.dept}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                            {item.badge}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500 dark:text-slate-400">{item.patients}</span>
                          <span className="font-extrabold text-slate-900 dark:text-white">{item.revenue}</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-200/80 dark:bg-slate-800 rounded-full h-2 overflow-hidden flex">
                        <div className={`${item.color} h-full rounded-full transition-all`} style={{ width: `${item.achieved}%` }} />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Target progress: {item.achieved}%</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">On Track</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Nationwide Branch Occupancy */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Nationwide Clinic Network Status</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    {
                      name: "Panthapath Central HQ",
                      city: "Dhaka",
                      rooms: "12 / 14 In Use",
                      doctors: "16 Doctors",
                      queue: "28 In Queue",
                      status: "High Load",
                      statusColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
                    },
                    {
                      name: "Dhanmondi Care",
                      city: "Dhaka",
                      rooms: "8 / 10 In Use",
                      doctors: "9 Doctors",
                      queue: "14 In Queue",
                      status: "Optimal",
                      statusColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
                    },
                    {
                      name: "Banani Wellness Suite",
                      city: "Dhaka",
                      rooms: "6 / 6 Full",
                      doctors: "6 Doctors",
                      queue: "9 In Queue",
                      status: "At Capacity",
                      statusColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
                    },
                    {
                      name: "Chittagong Regional Hub",
                      city: "Chattogram",
                      rooms: "5 / 8 In Use",
                      doctors: "5 Doctors",
                      queue: "11 In Queue",
                      status: "Active",
                      statusColor: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
                    },
                    {
                      name: "Sylhet Consultation Clinic",
                      city: "Sylhet",
                      rooms: "3 / 6 In Use",
                      doctors: "3 Doctors",
                      queue: "6 In Queue",
                      status: "Normal",
                      statusColor: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
                    },
                  ].map((branch, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-emerald-500/40 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">{branch.name}</h4>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {branch.city}
                          </span>
                        </div>
                        <Badge variant="outline" className={`text-[9px] ${branch.statusColor}`}>
                          {branch.status}
                        </Badge>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Consultation Rooms</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">{branch.rooms}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Patient Queue</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">{branch.queue}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right 1 Col: Live Activity Feed + On-Duty Specialists Spotlight */}
            <div className="space-y-6">
              {/* Doctors Active On-Duty Widget */}
              <Card className="bg-white dark:bg-[#0c1322] border-slate-200/80 dark:border-slate-800/80 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Specialists In Consultation</span>
                    </CardTitle>
                    <Link
                      href="/appointments"
                      className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
                    >
                      <span>Roster</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                  <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                    Doctors currently taking patient sessions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {SPECIALISTS_ON_DUTY.slice(0, 4).map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="w-9 h-9 border border-emerald-500/20">
                          <AvatarFallback className="bg-emerald-600 text-white font-bold text-xs">
                            {doc.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {doc.name}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {doc.department} • {doc.room}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <Badge
                          variant="outline"
                          className={`text-[9px] ${
                            doc.status === "In Session"
                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                              : "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800"
                          }`}
                        >
                          {doc.status}
                        </Badge>
                        <span className="block text-[10px] text-slate-400 mt-1">
                          {doc.patientsToday} patients
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Real-time Reception Feed */}
              <Card className="bg-white dark:bg-[#0c1322] border-slate-200/80 dark:border-slate-800/80 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Live Clinical Feed</span>
                    </CardTitle>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                  </div>
                  <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                    Real-time admissions, billing & sessions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3.5">
                  {LIVE_ACTIVITIES.map((act) => (
                    <div key={act.id} className="flex items-start gap-3 text-xs">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <div className="space-y-1 flex-1">
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">
                          {act.text}
                        </p>
                        <div className="flex items-center justify-between text-[10px]">
                          <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${act.badgeColor}`}>
                            {act.badge}
                          </Badge>
                          <span className="text-slate-400">{act.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Quick Action Shortcuts */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-900/30 via-slate-900/60 to-slate-950 border border-emerald-500/20 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <Sparkles className="w-4 h-4 text-lime-300" />
                  <span>Clinical Quick Shortcuts</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Link
                    href="/appointments"
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-slate-200 font-semibold flex items-center gap-2 transition-colors"
                  >
                    <CalendarDays className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-[11px]">New Booking</span>
                  </Link>

                  <Link
                    href="/sales/lead"
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-slate-200 font-semibold flex items-center gap-2 transition-colors"
                  >
                    <Users2 className="w-4 h-4 text-purple-400 shrink-0" />
                    <span className="text-[11px]">Add Lead</span>
                  </Link>

                  <Link
                    href="/sales/dashboard"
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-slate-200 font-semibold flex items-center gap-2 transition-colors"
                  >
                    <TrendingUp className="w-4 h-4 text-teal-400 shrink-0" />
                    <span className="text-[11px]">Sales Target</span>
                  </Link>

                  <Link
                    href="/settings"
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-slate-200 font-semibold flex items-center gap-2 transition-colors"
                  >
                    <Building2 className="w-4 h-4 text-blue-400 shrink-0" />
                    <span className="text-[11px]">Branch Settings</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: LIVE QUEUE & APPOINTMENTS TABLE ──────────────────────── */}
        {activeTab === "appointments" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Search and Filters Strip */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search patient name, phone, doctor or ID..."
                  className="pl-9 h-10 rounded-xl bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-xs"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                {["all", "In Session", "Waiting in Lobby", "Confirmed", "Completed"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      statusFilter === status
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                    }`}
                  >
                    {status === "all" ? "All Queue" : status}
                  </button>
                ))}
              </div>
            </div>

            {/* Table Card */}
            <Card className="bg-white dark:bg-[#0c1322] border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Patient Info</th>
                      <th className="py-3 px-4">Assigned Specialist</th>
                      <th className="py-3 px-4">Branch & Room</th>
                      <th className="py-3 px-4">Slot Time</th>
                      <th className="py-3 px-4">Session Type</th>
                      <th className="py-3 px-4">Queue Status</th>
                      <th className="py-3 px-4">Billing</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    {filteredAppointments.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          <Users2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                          <p className="text-sm font-semibold">No appointments found</p>
                          <p className="text-xs text-slate-500">Try adjusting your search query or filter tags.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredAppointments.map((appt) => (
                        <tr key={appt.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors">
                          {/* Patient */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <Avatar className="w-8 h-8 border border-slate-200 dark:border-slate-700">
                                <AvatarFallback className="bg-slate-200 dark:bg-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300">
                                  {appt.patientName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-bold text-slate-900 dark:text-white">{appt.patientName}</p>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {appt.id} • {appt.age}y, {appt.gender}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Doctor */}
                          <td className="py-3.5 px-4">
                            <p className="font-semibold text-slate-800 dark:text-slate-200">{appt.specialist}</p>
                            <span className="text-[10px] text-slate-400">{appt.department}</span>
                          </td>

                          {/* Branch & Room */}
                          <td className="py-3.5 px-4">
                            <p className="font-medium text-slate-700 dark:text-slate-300">{appt.branch}</p>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">{appt.room}</span>
                          </td>

                          {/* Time */}
                          <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                            {appt.time}
                          </td>

                          {/* Session Type */}
                          <td className="py-3.5 px-4">
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-semibold gap-1 ${
                                appt.type === "Telemedicine"
                                  ? "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-800"
                                  : "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800"
                              }`}
                            >
                              {appt.type === "Telemedicine" ? <Video className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                              <span>{appt.type}</span>
                            </Badge>
                          </td>

                          {/* Queue Status */}
                          <td className="py-3.5 px-4">
                            <Badge
                              className={`text-[10px] font-bold ${
                                appt.status === "In Session"
                                  ? "bg-emerald-500 text-white animate-pulse"
                                  : appt.status === "Waiting in Lobby"
                                  ? "bg-amber-500 text-white"
                                  : appt.status === "Completed"
                                  ? "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                                  : "bg-blue-600 text-white"
                              }`}
                            >
                              {appt.status}
                            </Badge>
                          </td>

                          {/* Billing */}
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-900 dark:text-white block">{appt.amount}</span>
                            <span className={`text-[10px] ${appt.paymentStatus === "Paid" ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-amber-500 font-medium"}`}>
                              {appt.paymentStatus}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {appt.type === "Telemedicine" && (
                                <button
                                  onClick={() => triggerToast(`Launching Telemedicine Google Meet for ${appt.patientName}...`)}
                                  className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-300 hover:bg-teal-100 transition-colors"
                                  title="Join Telehealth"
                                >
                                  <Video className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => triggerToast(`Patient Check-in recorded for ${appt.patientName}`)}
                                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                                title="Patient Check-In"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ── TAB 3: SALES & LEAD FUNNEL ─────────────────────────────────── */}
        {activeTab === "leads" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Pipeline Stage Visualizer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {[
                { stage: "New Inquiries", count: 84, value: "৳ 4,20,000", color: "border-blue-500/40 bg-blue-50/30 dark:bg-blue-950/20" },
                { stage: "Needs Assessment", count: 62, value: "৳ 3,85,000", color: "border-purple-500/40 bg-purple-50/30 dark:bg-purple-950/20" },
                { stage: "Doctor Matched", count: 48, value: "৳ 2,90,000", color: "border-teal-500/40 bg-teal-50/30 dark:bg-teal-950/20" },
                { stage: "Consultation Booked", count: 96, value: "৳ 8,45,000", color: "border-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-950/20" },
                { stage: "Enrolled in Therapy", count: 128, value: "৳ 14,50,000", color: "border-amber-500/40 bg-amber-50/30 dark:bg-amber-950/20" },
              ].map((pipe, idx) => (
                <div key={idx} className={`p-4 rounded-2xl border ${pipe.color} shadow-sm space-y-2`}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300">{pipe.stage}</span>
                    <Badge variant="secondary" className="font-mono text-xs">{pipe.count}</Badge>
                  </div>
                  <p className="text-lg font-black text-slate-900 dark:text-white">{pipe.value}</p>
                  <p className="text-[10px] text-slate-400">Projected billing value</p>
                </div>
              ))}
            </div>

            {/* Recent Leads Table */}
            <Card className="bg-white dark:bg-[#0c1322] border-slate-200/80 dark:border-slate-800/80 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Flame className="w-4 h-4 text-amber-500" />
                      <span>High-Priority Healthcare Leads</span>
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                      Top lead score patients seeking immediate therapy & psychiatry consultations
                    </CardDescription>
                  </div>
                  <Link
                    href="/sales/lead"
                    className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <span>Open Lead CRM</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                      <tr>
                        <th className="py-2.5 px-3">Lead Name</th>
                        <th className="py-2.5 px-3">Interest & Clinical Requirement</th>
                        <th className="py-2.5 px-3">Lead Score</th>
                        <th className="py-2.5 px-3">Stage</th>
                        <th className="py-2.5 px-3">Budget</th>
                        <th className="py-2.5 px-3">Assigned Executive</th>
                        <th className="py-2.5 px-3 text-right">Quick Contact</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                      {RECENT_LEADS.map((lead) => (
                        <tr key={lead.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40">
                          <td className="py-3 px-3">
                            <p className="font-bold text-slate-900 dark:text-white">{lead.name}</p>
                            <span className="text-[10px] text-slate-400 font-mono">{lead.phone}</span>
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">
                            {lead.interest}
                          </td>
                          <td className="py-3 px-3">
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-bold text-[10px]">
                              <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                              <span>{lead.score}/100</span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <Badge variant="outline" className="text-[10px] bg-slate-100 dark:bg-slate-800 font-medium">
                              {lead.stage}
                            </Badge>
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                            {lead.budget}
                          </td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                            {lead.assignedTo}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => triggerToast(`Calling ${lead.name} (${lead.phone})...`)}
                              className="gap-1 rounded-lg text-emerald-600 border-emerald-300 dark:border-emerald-800 cursor-pointer"
                            >
                              <Phone className="w-3 h-3" />
                              <span>Call</span>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── TAB 4: DOCTOR ROSTER ────────────────────────────────────────── */}
        {activeTab === "specialists" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in duration-200">
            {SPECIALISTS_ON_DUTY.map((doc) => (
              <Card key={doc.id} className="bg-white dark:bg-[#0c1322] border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12 border-2 border-emerald-500/30">
                        <AvatarFallback className="bg-emerald-600 text-white font-extrabold text-sm">
                          {doc.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">{doc.name}</CardTitle>
                        <CardDescription className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{doc.title}</CardDescription>
                      </div>
                    </div>
                    <Badge
                      className={`text-[10px] ${
                        doc.status === "In Session" ? "bg-emerald-500 text-white" : "bg-blue-600 text-white"
                      }`}
                    >
                      {doc.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60 space-y-1">
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>Primary Clinic:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{doc.branch}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>Room Assigned:</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">{doc.room}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>Sessions Today:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{doc.patientsToday} patients</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="font-bold text-amber-500 flex items-center gap-1">
                      ★ {doc.rating} Rating
                    </span>
                    {doc.telehealth && (
                      <Badge variant="outline" className="text-[10px] text-teal-600 border-teal-300 dark:border-teal-800 gap-1">
                        <Video className="w-3 h-3" />
                        Telehealth Ready
                      </Badge>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setNewSpecialist(doc.name);
                      setNewDepartment(doc.department);
                      setAppointmentModalOpen(true);
                    }}
                    className="w-full text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 rounded-xl cursor-pointer"
                  >
                    Assign Patient to {doc.name.split(" ")[1] || "Doctor"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ── Interactive Modal: Book New Appointment ────────────────────────── */}
      {appointmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Book Clinical Appointment
                  </h3>
                  <p className="text-xs text-slate-500">Add outpatient or telemedicine session</p>
                </div>
              </div>
              <button
                onClick={() => setAppointmentModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Patient Full Name *
                </label>
                <Input
                  required
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                  placeholder="e.g. Mahfuzur Rahman"
                  className="rounded-xl h-10 bg-slate-50 dark:bg-slate-900/60"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <Input
                    value={newPatientPhone}
                    onChange={(e) => setNewPatientPhone(e.target.value)}
                    placeholder="+880 1700-000000"
                    className="rounded-xl h-10 bg-slate-50 dark:bg-slate-900/60"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Clinical Wing
                  </label>
                  <select
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:outline-none"
                  >
                    <option value="Psychiatry">Psychiatry</option>
                    <option value="Clinical Psychology">Clinical Psychology</option>
                    <option value="Child Development">Child Development</option>
                    <option value="Neuropsychiatry">Neuropsychiatry</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Assigned Consultant / Specialist
                </label>
                <select
                  value={newSpecialist}
                  onChange={(e) => setNewSpecialist(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:outline-none"
                >
                  {SPECIALISTS_ON_DUTY.map((doc) => (
                    <option key={doc.id} value={doc.name}>
                      {doc.name} ({doc.department} - {doc.room})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[11px] leading-relaxed">
                Consultation fee: <strong>৳ 2,500</strong>. Automated SMS booking pass and calendar invitation will be dispatched upon confirmation.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAppointmentModalOpen(false)}
                  className="rounded-xl cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  Confirm & Schedule
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
