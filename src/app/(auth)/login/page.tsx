"use client";

import React, { useState, useEffect, useRef } from "react";
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
  CheckCircle2,
  Users,
  Sparkles,
  ShieldCheck,
  HeartPulse,
} from "lucide-react";
import { setToken, setUser, setRole } from "@/lib/auth";

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animFrame: number;
    const particles: { x: number; y: number; r: number; vx: number; vy: number; alpha: number }[] = [];
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener("resize", resize);
    for (let i = 0; i < 60; i++) {
      particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, r: Math.random() * 1.8 + 0.4, vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28, alpha: Math.random() * 0.45 + 0.08 });
    }
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(52,211,153,${p.alpha})`; ctx.fill();
      });
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x; const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) { ctx.beginPath(); ctx.strokeStyle = `rgba(52,211,153,${0.07 * (1 - dist / 120)})`; ctx.lineWidth = 0.4; ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y); ctx.stroke(); }
        }
      }
      animFrame = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animFrame); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [identifierFocused, setIdentifierFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (loading) {
      setProgress(0);
      const t = setInterval(() => setProgress((p) => Math.min(p + Math.random() * 16, 88)), 180);
      return () => clearInterval(t);
    } else {
      setProgress(success ? 100 : 0);
    }
  }, [loading, success]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setSuccess(null);
    if (!identifier.trim()) { setError("Please enter your Email, Phone number, or Employee ID."); return; }
    if (!password) { setError("Please enter your account password."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ identifier: identifier.trim(), password, rememberMe }) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Invalid credentials. Please try again.");
      setSuccess("Authentication successful! Redirecting...");
      if (data.token) setToken(data.token);
      if (data.user) setUser(data.user);
      if (data.role) setRole(data.role);
      setTimeout(() => router.push(data.redirectUrl || "/"), 900);
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image src="/images/login-bg.jpg" alt="LifeSpring Healthcare Background" fill priority quality={95} className="object-cover object-center scale-105" />
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-[#021008]/70 to-emerald-950/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/25 via-transparent to-black/25" />
      </div>

      {/* Particle overlay */}
      <div className="absolute inset-0 z-[1] pointer-events-none">
        <ParticleCanvas />
      </div>

      {/* Centered Card */}
      <div className="relative z-10 w-full max-w-[430px] mx-4 sm:mx-auto">
        <div className="absolute -inset-16 bg-emerald-500/8 rounded-[60px] blur-3xl pointer-events-none animate-pulse" />

        {/* Gradient border */}
        <div className="relative rounded-[28px] shadow-[0_32px_80px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.06)]" style={{ background: "linear-gradient(145deg, rgba(52,211,153,0.2) 0%, rgba(20,184,166,0.07) 40%, rgba(255,255,255,0.04) 100%)", padding: "1px" }}>
          <div className="bg-[rgba(3,8,14,0.85)] backdrop-blur-[44px] rounded-[27px] overflow-hidden">

            {/* Progress bar */}
            <div className="absolute top-0 left-0 h-[2.5px] bg-gradient-to-r from-emerald-400 via-teal-300 to-lime-400 transition-all duration-500 ease-out z-20" style={{ width: `${progress}%`, opacity: progress > 0 ? 1 : 0, boxShadow: progress > 0 ? "0 0 16px rgba(52,211,153,0.9)" : "none" }} />

            <div className="px-7 pt-9 pb-8 sm:px-10 sm:pt-11 sm:pb-9">

              {/* Header */}
              <div className="flex flex-col items-center text-center mb-8 gap-4">
                <div className="relative">
                  <div className="w-[68px] h-[68px] rounded-[20px] flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.22) 0%, rgba(20,184,166,0.1) 100%)", border: "1px solid rgba(16,185,129,0.28)", boxShadow: "0 8px 32px rgba(16,185,129,0.18), inset 0 1px 0 rgba(255,255,255,0.06)" }}>
                    <Image src="/images/lifespring-icon.png" alt="LifeSpring" width={38} height={38} className="object-contain drop-shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
                  </div>
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70" />
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-[#03080e]" />
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300" style={{ background: "rgba(16,185,129,0.09)", border: "1px solid rgba(16,185,129,0.2)" }}>
                    <Sparkles className="w-2.5 h-2.5 text-lime-300 animate-pulse" />
                    LifeSpring ERP Portal
                  </div>
                  <h1 className="text-[1.8rem] sm:text-[2.1rem] font-black text-white tracking-tight leading-none">Welcome Back</h1>
                  <p className="text-[12px] text-slate-400/80 leading-relaxed">Sign in to access your healthcare management portal</p>
                </div>
              </div>

              {/* Alerts */}
              {error && (
                <div className="mb-5 flex items-start gap-2.5 px-4 py-3.5 rounded-2xl text-red-300 text-[12px] font-medium animate-in fade-in slide-in-from-top-2 duration-200" style={{ background: "rgba(127,29,29,0.35)", border: "1px solid rgba(239,68,68,0.22)" }}>
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}
              {success && (
                <div className="mb-5 flex items-start gap-2.5 px-4 py-3.5 rounded-2xl text-emerald-300 text-[12px] font-medium animate-in fade-in slide-in-from-top-2 duration-200" style={{ background: "rgba(6,78,59,0.35)", border: "1px solid rgba(16,185,129,0.28)" }}>
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                  <span className="leading-relaxed">{success}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Identifier */}
                <div className="space-y-1.5">
                  <label htmlFor="identifier" className={`block text-[11px] font-bold uppercase tracking-widest transition-colors duration-150 ${identifierFocused ? "text-emerald-400" : "text-slate-500"}`}>Email / Phone / Staff ID</label>
                  <div className={`relative flex items-center rounded-2xl transition-all duration-200 ${identifierFocused ? "shadow-[0_0_0_3px_rgba(16,185,129,0.13)]" : ""}`} style={{ background: identifierFocused ? "rgba(16,185,129,0.05)" : "rgba(255,255,255,0.04)", border: identifierFocused ? "1px solid rgba(16,185,129,0.5)" : "1px solid rgba(255,255,255,0.1)" }}>
                    <div className={`absolute left-4 pointer-events-none transition-colors duration-150 ${identifierFocused ? "text-emerald-400" : "text-slate-600"}`}><Mail className="w-4 h-4" /></div>
                    <input id="identifier" type="text" required autoComplete="username" placeholder="name@lifespringint.com" value={identifier} onFocus={() => setIdentifierFocused(true)} onBlur={() => setIdentifierFocused(false)} onChange={(e) => setIdentifier(e.target.value)} className="w-full pl-11 pr-4 py-3.5 bg-transparent text-[13px] text-white placeholder:text-slate-700 focus:outline-none font-medium" />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className={`text-[11px] font-bold uppercase tracking-widest transition-colors duration-150 ${passwordFocused ? "text-emerald-400" : "text-slate-500"}`}>Password</label>
                    <Link href="/forgot-password" className="text-[11px] font-semibold text-emerald-500/70 hover:text-emerald-300 transition-colors">Forgot password?</Link>
                  </div>
                  <div className={`relative flex items-center rounded-2xl transition-all duration-200 ${passwordFocused ? "shadow-[0_0_0_3px_rgba(16,185,129,0.13)]" : ""}`} style={{ background: passwordFocused ? "rgba(16,185,129,0.05)" : "rgba(255,255,255,0.04)", border: passwordFocused ? "1px solid rgba(16,185,129,0.5)" : "1px solid rgba(255,255,255,0.1)" }}>
                    <div className={`absolute left-4 pointer-events-none transition-colors duration-150 ${passwordFocused ? "text-emerald-400" : "text-slate-600"}`}><Lock className="w-4 h-4" /></div>
                    <input id="password" type={showPassword ? "text" : "password"} required autoComplete="current-password" placeholder="Enter your password" value={password} onFocus={() => setPasswordFocused(true)} onBlur={() => setPasswordFocused(false)} onChange={(e) => setPassword(e.target.value)} className="w-full pl-11 pr-12 py-3.5 bg-transparent text-[13px] text-white placeholder:text-slate-700 focus:outline-none font-medium" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 p-1 text-slate-600 hover:text-emerald-400 transition-colors" aria-label={showPassword ? "Hide password" : "Show password"}>
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center pt-1">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                    <button type="button" role="checkbox" aria-checked={rememberMe} onClick={() => setRememberMe(!rememberMe)} className="flex items-center justify-center rounded-md transition-all duration-150 shrink-0" style={{ width: "17px", height: "17px", background: rememberMe ? "linear-gradient(135deg,#059669,#0d9488)" : "rgba(255,255,255,0.05)", border: rememberMe ? "1px solid #059669" : "1px solid rgba(255,255,255,0.15)", boxShadow: rememberMe ? "0 0 10px rgba(16,185,129,0.4)" : "none" }}>
                      {rememberMe && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8"><path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </button>
                    <span className="text-[12px] text-slate-500 font-medium group-hover:text-slate-300 transition-colors">Keep me signed in for 7 days</span>
                  </label>
                </div>

                {/* Submit */}
                <button type="submit" disabled={loading} className="w-full relative overflow-hidden mt-2.5 py-3.5 px-5 rounded-2xl text-[13px] font-bold text-white flex items-center justify-center gap-2.5 cursor-pointer group transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed" style={{ background: "linear-gradient(135deg, #059669 0%, #0f766e 55%, #064e3b 100%)", boxShadow: "0 8px 32px rgba(5,150,105,0.45), 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)" }}>
                  <span className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                    <span className="absolute -left-full top-0 h-full w-3/4 bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-12 group-hover:left-full transition-all duration-700 ease-in-out" />
                  </span>
                  {loading ? (
                    <><div className="w-4 h-4 border-[2px] border-white/30 border-t-white rounded-full animate-spin" /><span>Signing In...</span></>
                  ) : (
                    <><span>Sign In to Portal</span><ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-150" /></>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
                <span className="text-[10px] text-slate-700 font-bold uppercase tracking-[0.15em]">Protected</span>
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: ShieldCheck, label: "256-bit SSL", sub: "Encrypted" },
                  { icon: HeartPulse, label: "HIPAA", sub: "Compliant" },
                  { icon: Users, label: "Role-Based", sub: "Access Control" },
                ].map(({ icon: Icon, label, sub }) => (
                  <div key={label} className="flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl hover:bg-white/5 transition-all duration-200" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <Icon className="w-3.5 h-3.5 text-emerald-600/80" />
                    <span className="text-[10px] font-bold text-slate-400 leading-none">{label}</span>
                    <span className="text-[9px] text-slate-700 leading-none text-center">{sub}</span>
                  </div>
                ))}
              </div>

              {/* Register link */}
              <p className="text-center text-[12px] text-slate-700 mt-6">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="font-bold text-emerald-500 hover:text-emerald-300 transition-colors">Request Access</Link>
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-[10px] mt-5 font-medium tracking-wider" style={{ color: "rgba(255,255,255,0.15)" }}>
          &copy; 2026 LifeSpring Limited &middot; Healthcare ERP v2.4
        </p>
      </div>
    </div>
  );
}