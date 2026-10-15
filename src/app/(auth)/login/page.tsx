"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Stethoscope,
  HeartHandshake,
  Activity,
  Users,
  Sparkles,
} from "lucide-react";
import { setToken, setUser, setRole } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!identifier.trim()) {
      setError("Please enter your Email, Phone number, or Employee ID.");
      return;
    }

    if (!password) {
      setError("Please enter your account password.");
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

      setSuccess("Authentication successful! Redirecting to your portal...");

      // Update client-side auth helpers
      if (data.token) setToken(data.token);
      if (data.user) setUser(data.user);
      if (data.role) setRole(data.role);

      // Smooth redirection to appropriate dashboard
      setTimeout(() => {
        const dest = data.redirectUrl || "/";
        router.push(dest);
      }, 700);
    } catch (err: any) {
      setError(err.message || "Failed to log in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
      {/* ── Left Column: Brand Showcase (Visible on Large Screens) ──────── */}
      <div className="hidden lg:flex lg:col-span-6 flex-col justify-between p-8 xl:p-10 rounded-3xl bg-gradient-to-br from-emerald-900/90 via-[#0B3B24] to-[#072416] text-white border border-emerald-700/40 shadow-2xl relative overflow-hidden min-h-[620px]">
        {/* Decorative background glow & elements */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-lime-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,#10b981_0%,transparent_60%)] opacity-20 pointer-events-none" />

        {/* Top Tagline */}
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-800/60 border border-emerald-500/30 text-emerald-200 text-xs font-semibold uppercase tracking-wider backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-lime-300" />
            <span>Hospital &amp; Clinic ERP System</span>
          </div>

          <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight leading-tight">
            Redefining Healthcare <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-lime-200">
              Management &amp; Patient Care
            </span>
          </h2>

          <p className="text-emerald-100/80 text-sm leading-relaxed max-w-md pt-1">
            LifeSpring ERP delivers end-to-end clinical workflow automation,
            telepsychiatry, doctor appointment scheduling, and electronic medical records.
          </p>
        </div>

        {/* Value Highlights Cards */}
        <div className="relative z-10 grid grid-cols-2 gap-3.5 my-8">
          <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex flex-col justify-between">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-300 mb-2">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xl font-bold text-white">45+ Specialists</p>
              <p className="text-xs text-emerald-200/70">Top Doctors &amp; Consultants</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex flex-col justify-between">
            <div className="w-8 h-8 rounded-xl bg-lime-500/20 flex items-center justify-center text-lime-300 mb-2">
              <HeartHandshake className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xl font-bold text-white">150k+ Patients</p>
              <p className="text-xs text-emerald-200/70">Empowered &amp; Treated</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex flex-col justify-between">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 flex items-center justify-center text-teal-300 mb-2">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xl font-bold text-white">100% Confidential</p>
              <p className="text-xs text-emerald-200/70">HIPAA &amp; ISO Data Safety</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex flex-col justify-between">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-300 mb-2">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xl font-bold text-white">24/7 Care</p>
              <p className="text-xs text-emerald-200/70">Seamless System Uptime</p>
            </div>
          </div>
        </div>

        {/* Bottom Doctor Testimonial */}
        <div className="relative z-10 p-4 rounded-2xl bg-emerald-950/60 border border-emerald-600/30 backdrop-blur-md flex items-center gap-3.5">
          <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-emerald-400/60 shrink-0 bg-emerald-800 flex items-center justify-center">
            <Image
              src="/images/lifespring-icon.png"
              alt="LifeSpring Mark"
              width={40}
              height={40}
              className="object-contain"
            />
          </div>
          <div>
            <p className="text-xs text-emerald-100 font-medium italic">
              &ldquo;LifeSpring is dedicated to making world-class healthcare accessible and compassionate across Bangladesh.&rdquo;
            </p>
            <p className="text-[11px] text-emerald-300 font-semibold mt-0.5">
              LifeSpring Clinical Leadership Board
            </p>
          </div>
        </div>
      </div>

      {/* ── Right Column: Interactive Login Form ───────────────────────── */}
      <div className="w-full lg:col-span-6 max-w-md mx-auto">
        <div className="bg-white dark:bg-[#0c1322] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-9 shadow-xl shadow-slate-200/50 dark:shadow-black/60 relative backdrop-blur-xl">
          {/* Header */}
          <div className="text-center sm:text-left space-y-2 mb-6">
            <div className="flex items-center justify-center sm:justify-start gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center p-1.5 border border-emerald-500/20">
                <Image
                  src="/images/lifespring-icon.png"
                  alt="LifeSpring Icon"
                  width={24}
                  height={24}
                  className="object-contain"
                />
              </div>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                LifeSpring Portal
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Welcome Back
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Sign in with your Email, Phone Number, or Staff ID to continue.
            </p>
          </div>


          {/* Error Alert */}
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-400 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{error}</div>
            </div>
          )}

          {/* Success Alert */}
          {success && (
            <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              <div className="flex-1 font-medium leading-relaxed">{success}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Identifier input */}
            <div className="space-y-1.5">
              <label
                htmlFor="identifier"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Email, Phone, or Employee ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="identifier"
                  type="text"
                  required
                  autoComplete="username"
                  placeholder="name@lifespringint.com or 01711..."
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            {/* Password input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember me Checkbox */}
            <div className="flex items-center pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/40 dark:border-slate-700 dark:bg-slate-900"
                />
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  Keep me signed in for 7 days
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-semibold text-sm shadow-lg shadow-emerald-700/25 dark:shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In to ERP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Bottom Link to Registration */}
          <div className="mt-7 pt-5 border-t border-slate-200 dark:border-slate-800/80 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Don&apos;t have an ERP account?{" "}
              <Link
                href="/register"
                className="font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
              >
                Register Here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
