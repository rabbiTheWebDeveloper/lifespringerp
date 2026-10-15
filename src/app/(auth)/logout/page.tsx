"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { logout } from "@/lib/auth";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    async function performLogout() {
      try {
        // 1. Clear client-side cookie helpers
        logout();

        // 2. Remove all related cookies manually as well
        const cookieKeys = [
          "token",
          "auth_token",
          "user",
          "role",
          "student_token",
          "student_user",
        ];
        cookieKeys.forEach((key) => {
          Cookies.remove(key, { path: "/" });
        });

        // 3. Purge storage caches
        if (typeof window !== "undefined") {
          try {
            sessionStorage.clear();
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            localStorage.removeItem("role");
          } catch {
            // Ignore storage restrictions
          }
        }

        // 4. Invalidate server-side HTTP cookies
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }).catch(() => null);
      } finally {
        // 5. Immediate clean navigation to login
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        } else {
          router.replace("/login");
        }
      }
    }

    performLogout();
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
      <div className="w-10 h-10 border-3 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin mb-4" />
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        Signing out securely...
      </p>
    </div>
  );
}
