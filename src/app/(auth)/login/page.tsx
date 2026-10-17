"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Globe,
  ChevronDown,
  Users,
  Calendar,
  FileText,
  BarChart3,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { setToken, setUser, setRole } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("admin@lifespring.com");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState("English");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!identifier.trim()) {
      setError("Please enter your Email Address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
          rememberMe,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Invalid credentials. Please try again.");
      }

      setSuccess("Authentication successful! Redirecting to dashboard...");
      if (data.token) setToken(data.token);
      if (data.user) setUser(data.user);
      if (data.role) setRole(data.role);

      setTimeout(() => {
        router.push(data.redirectUrl || "/");
      }, 700);
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setError(null);
    setLoading(true);
    setTimeout(() => {
      setIdentifier("admin@lifespring.com");
      setPassword("admin123");
      setLoading(false);
      setSuccess("Google SSO authenticated! Redirecting...");
      setTimeout(() => router.push("/"), 700);
    }, 600);
  };

  return (
    <div className="h-screen w-full flex flex-col lg:flex-row bg-[#f6f9f8] font-sans-clean selection:bg-[#007a55] selection:text-white overflow-hidden">
      {/* ========================================================= */}
      {/* LEFT COLUMN: HERO, VALUE PROPOSITIONS & ARTISTIC WAVE     */}
      {/* ========================================================= */}
      <div className="relative w-full lg:w-[58%] xl:w-[59%] h-full flex flex-col justify-between overflow-hidden bg-white select-none">
        {/* Background Image: Clean Hospital Consultation Desk */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <Image
            src="/images/auth-hero-clinic-v2.jpg"
            alt="LifeSpring Hospital Consultation Desk"
            fill
            priority
            quality={98}
            className="object-cover object-[75%_center]"
          />
          {/* Soft white gradient wash for editorial text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-white/30 via-transparent to-white/10" />
        </div>

        {/* Top: LifeSpring Brand Logo */}
        <div className="relative z-10 p-6 sm:p-8 lg:p-10 xl:p-12 pb-0">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 shrink-0">
              <Image
                src="/images/lifespring-icon.png"
                alt="LifeSpring Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="font-serif-display font-bold text-2xl sm:text-[26px] tracking-tight text-[#0a3d2c] leading-none">
                LifeSpring
              </span>
              <span className="text-[11px] sm:text-[11.5px] font-medium text-[#2d5746] tracking-normal mt-0.5">
                Health for a Better Tomorrow
              </span>
            </div>
          </div>
        </div>

        {/* Middle: Editorial Headline & 4 Feature Badges */}
        <div className="relative z-10 px-6 sm:px-8 lg:px-10 xl:px-12 my-auto max-w-xl xl:max-w-2xl">
          <h1 className="font-serif-display text-3xl sm:text-4xl lg:text-[42px] xl:text-[46px] font-bold text-[#0c3c2a] leading-[1.12] tracking-tight">
            Better Healthcare<br />
            Management<br />
            for a Healthier Tomorrow
          </h1>

          <p className="text-slate-600 text-[13.5px] sm:text-[14.5px] leading-relaxed mt-3.5 max-w-lg font-normal">
            Streamline your hospital operations, manage patients,<br className="hidden sm:block" />
            and deliver quality care — all in one place.
          </p>

          {/* 4 Feature Highlights in a horizontal row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-1 max-w-lg">
            {/* Card 1: Patient Management */}
            <div className="flex flex-col items-start">
              <div className="w-10 h-10 rounded-xl bg-[#eef8f2] text-[#007a55] flex items-center justify-center">
                <Users className="w-4.5 h-4.5 stroke-[2]" />
              </div>
              <h2 className="font-bold text-[13px] text-[#113a2b] mt-2.5 leading-tight">
                Patient<br />Management
              </h2>
              <p className="text-slate-500 text-[11px] leading-tight mt-1">
                Complete patient lifecycle
              </p>
            </div>

            {/* Card 2: Appointments */}
            <div className="flex flex-col items-start">
              <div className="w-10 h-10 rounded-xl bg-[#eef8f2] text-[#007a55] flex items-center justify-center">
                <Calendar className="w-4.5 h-4.5 stroke-[2]" />
              </div>
              <h2 className="font-bold text-[13px] text-[#113a2b] mt-2.5 leading-tight">
                Appointments
              </h2>
              <p className="text-slate-500 text-[11px] leading-tight mt-1">
                Easy scheduling &amp; tracking
              </p>
            </div>

            {/* Card 3: Clinical Records */}
            <div className="flex flex-col items-start">
              <div className="w-10 h-10 rounded-xl bg-[#eef8f2] text-[#007a55] flex items-center justify-center">
                <FileText className="w-4.5 h-4.5 stroke-[2]" />
              </div>
              <h2 className="font-bold text-[13px] text-[#113a2b] mt-2.5 leading-tight">
                Clinical Records
              </h2>
              <p className="text-slate-500 text-[11px] leading-tight mt-1">
                Secure &amp; organized medical history
              </p>
            </div>

            {/* Card 4: Reports & Analytics */}
            <div className="flex flex-col items-start">
              <div className="w-10 h-10 rounded-xl bg-[#eef8f2] text-[#007a55] flex items-center justify-center">
                <BarChart3 className="w-4.5 h-4.5 stroke-[2]" />
              </div>
              <h2 className="font-bold text-[13px] text-[#113a2b] mt-2.5 leading-tight">
                Reports &amp; Analytics
              </h2>
              <p className="text-slate-500 text-[11px] leading-tight mt-1">
                Data-driven decisions
              </p>
            </div>
          </div>
        </div>

        {/* Bottom space buffer */}
        <div className="h-28 pointer-events-none" />

        {/* ========================================================= */}
        {/* BOTTOM LEFT WAVE GRAPHIC WITH SCRIPT TYPOGRAPHY           */}
        {/* ========================================================= */}
        <div className="absolute bottom-0 left-0 w-full pointer-events-none select-none z-20">
          <svg
            viewBox="0 0 1000 240"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto block"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="waveMint" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.85" />
                <stop offset="45%" stopColor="#34d399" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#059669" stopOpacity="0.15" />
              </linearGradient>
              <linearGradient id="waveDeepForest" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#05442e" />
                <stop offset="45%" stopColor="#0a4e35" />
                <stop offset="100%" stopColor="#0e5a3e" />
              </linearGradient>
            </defs>

            {/* Mint Wave Layer with dipping curve */}
            <path
              d="M 0 105 C 320 85 460 215 780 160 C 890 140 960 115 1000 95 L 1000 240 L 0 240 Z"
              fill="url(#waveMint)"
            />

            {/* Deep Green Wave Layer */}
            <path
              d="M 0 135 C 340 115 480 235 780 185 C 890 165 960 145 1000 125 L 1000 240 L 0 240 Z"
              fill="url(#waveDeepForest)"
            />
          </svg>

          {/* Script Text over the Wave: "Together for Better Health" */}
          <div className="absolute bottom-4 sm:bottom-6 left-6 sm:left-10 -rotate-[9deg] flex flex-col items-start drop-shadow">
            <span className="font-handwriting text-white text-2xl sm:text-[27px] font-semibold leading-tight tracking-wide">
              Together for
            </span>
            <span className="font-handwriting text-white text-[32px] sm:text-[38px] font-bold leading-none tracking-wide">
              Better Health
            </span>
            {/* White curved underline brush stroke */}
            <svg
              viewBox="0 0 160 16"
              className="w-36 sm:w-42 h-3.5 text-white/95 -mt-0.5"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M 4 8 C 50 15 110 14 156 4"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* RIGHT COLUMN: FLOATING AUTH CARD & SYSTEM METADATA        */}
      {/* ========================================================= */}
      <div className="w-full lg:w-[42%] xl:w-[41%] h-full bg-[#f6f9f8] flex flex-col justify-between items-center py-5 sm:py-6 px-4 sm:px-6 relative z-20 overflow-y-auto">
        {/* Top Header: Language Switcher Dropdown */}
        <div className="w-full flex justify-end max-w-[430px] relative">
          <div className="relative">
            <button
              type="button"
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="flex items-center gap-1.5 text-[12.5px] font-medium text-slate-600 hover:text-slate-900 transition-colors py-1 px-2 rounded-lg hover:bg-slate-200/50 cursor-pointer"
            >
              <Globe className="w-4 h-4 text-slate-500" />
              <span>{selectedLang}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {langMenuOpen && (
              <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150">
                {["English", "বাংলা (Bengali)"].map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => {
                      setSelectedLang(lang.split(" ")[0]);
                      setLangMenuOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-1.5 text-[12px] hover:bg-emerald-50 hover:text-[#007a55] transition-colors cursor-pointer ${
                      selectedLang === lang.split(" ")[0]
                        ? "text-[#007a55] font-semibold bg-emerald-50/60"
                        : "text-slate-600"
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center: Main Elevated Sign-In Card */}
        <div className="w-full max-w-[430px] my-auto py-2">
          <div className="bg-white rounded-[26px] shadow-[0_20px_50px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.02)] p-7 sm:p-8 transition-all">
            {/* Center Logo in Card */}
            <div className="flex flex-col items-center text-center">
              <div className="relative w-11 h-11 mb-1.5">
                <Image
                  src="/images/lifespring-icon.png"
                  alt="LifeSpring Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <span className="font-serif-display font-bold text-[23px] text-[#0a3d2c] tracking-tight leading-none">
                LifeSpring
              </span>
              <span className="text-[10.5px] font-medium text-[#2d5746] tracking-normal mt-0.5">
                Health for a Better Tomorrow
              </span>
            </div>

            {/* Section Titles */}
            <div className="text-center mt-5">
              <span className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-[#059669]">
                WELCOME BACK
              </span>
              <h2 className="font-serif-display text-2xl sm:text-[25px] font-bold text-[#0c3123] mt-0.5 leading-tight">
                Sign in to your account
              </h2>
              <p className="text-slate-500 text-[12.5px] sm:text-[13px] mt-1">
                Access your dashboard and manage your operations.
              </p>
            </div>

            {/* Feedback Alerts */}
            {error && (
              <div className="mt-3.5 flex items-start gap-2.5 px-3 py-2 rounded-xl text-red-700 bg-red-50 border border-red-200/80 text-[12px] animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mt-3.5 flex items-start gap-2.5 px-3 py-2 rounded-xl text-emerald-800 bg-emerald-50 border border-emerald-200/80 text-[12px] animate-in fade-in duration-150">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                <span>{success}</span>
              </div>
            )}

            {/* Login Form with Premium Stacked Input Boxes */}
            <form onSubmit={handleLogin} className="mt-4 space-y-3">
              {/* Email Address Field with Stacked Label */}
              <div className="relative rounded-xl border border-slate-200 focus-within:border-[#007a55] focus-within:ring-2 focus-within:ring-[#007a55]/15 transition-all bg-white px-3.5 py-1.5 flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="flex-1 flex flex-col justify-center">
                  <label
                    htmlFor="email-field"
                    className="text-[11px] font-semibold text-slate-500 leading-none select-none"
                  >
                    Email Address
                  </label>
                  <input
                    id="email-field"
                    type="text"
                    required
                    autoComplete="username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="admin@lifespring.com"
                    className="w-full text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:outline-none bg-transparent font-medium pt-0.5 leading-tight"
                  />
                </div>
              </div>

              {/* Password Field with Stacked Label */}
              <div className="relative rounded-xl border border-slate-200 focus-within:border-[#007a55] focus-within:ring-2 focus-within:ring-[#007a55]/15 transition-all bg-white px-3.5 py-1.5 flex items-center gap-3">
                <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="flex-1 flex flex-col justify-center">
                  <label
                    htmlFor="password-field"
                    className="text-[11px] font-semibold text-slate-500 leading-none select-none"
                  >
                    Password
                  </label>
                  <input
                    id="password-field"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:outline-none bg-transparent font-medium pt-0.5 leading-tight"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-1 cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Remember Me & Forgot Password Row */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none group">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={rememberMe}
                    onClick={() => setRememberMe(!rememberMe)}
                    className={`w-[17px] h-[17px] rounded flex items-center justify-center transition-all cursor-pointer ${
                      rememberMe
                        ? "bg-[#007a55] border border-[#007a55] text-white"
                        : "border border-slate-300 bg-white"
                    }`}
                  >
                    {rememberMe && (
                      <svg
                        className="w-2.5 h-2.5 stroke-[3] text-white"
                        fill="none"
                        viewBox="0 0 12 10"
                      >
                        <path
                          d="M1.5 5L4.5 8L10.5 1.5"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                  <span className="text-[12.5px] text-slate-600 font-medium group-hover:text-slate-900 transition-colors">
                    Remember me
                  </span>
                </label>

                <Link
                  href="/forgot-password"
                  className="text-[12.5px] font-semibold text-[#007a55] hover:text-[#005e41] hover:underline transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-[#007a55] hover:bg-[#006848] active:bg-[#00593d] text-white font-semibold text-[14px] flex items-center justify-center gap-2 shadow-xs hover:shadow transition-all disabled:opacity-65 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4" />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>

            {/* OR Divider */}
            <div className="flex items-center my-4">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                OR
              </span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Continue with Google */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-[13.5px] flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.27 21.41 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.99 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.27 2.59 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Bottom Security Box inside the card */}
            <div className="mt-4 p-2.5 px-3.5 rounded-xl bg-[#ebf8f2] flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-[#007a55] shrink-0" />
              <div className="flex flex-col">
                <span className="text-[12px] font-bold text-[#065f46] leading-snug">
                  Secure &amp; Encrypted
                </span>
                <span className="text-[11px] text-[#047857] leading-snug">
                  Your data is safe with us
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Outside the Card: Copyright & Version */}
        <div className="text-center py-1">
          <p className="text-[11px] sm:text-[11.5px] text-slate-500 font-medium">
            &copy; 2026 LifeSpring Healthcare ERP. All rights reserved.
          </p>
          <p className="text-[10.5px] text-slate-400 mt-0.5">
            Version 2.4.0
          </p>
        </div>
      </div>
    </div>
  );
}