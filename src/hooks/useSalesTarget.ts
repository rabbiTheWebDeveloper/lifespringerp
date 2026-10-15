"use client";

import { useState, useEffect, useCallback } from "react";

export interface SalesTargetAmounts {
  daily_total: number;
  daily_admission?: number;
  daily_monthly?: number;
  custom_total: number;
  custom_admission?: number;
  custom_monthly?: number;
  monthly_total: number;
  monthly_admission?: number;
  monthly_monthly?: number;
}

export interface SalesTargetCounts {
  daily_sales_count: number;
  custom_sales_count: number;
  monthly_sales_count: number;
}

export interface SalesTargetData {
  _id?: string | null;
  targetType: "organization" | "user";
  userId?: string;
  daily: number;
  fifteenDays: number;
  custom: number;
  from_date: string | Date | null;
  to_date: string | Date | null;
  monthly: number;
  month: string;
  year: number;
  notes?: string;
  daily_completed: number;
  custom_completed: number;
  monthly_completed: number;
  amounts: SalesTargetAmounts;
  counts: SalesTargetCounts;
}

export interface SalesUser {
  _id: string;
  fullName: string;
  email: string;
  role?: string;
  department?: string;
  designation?: string;
  avatar?: string;
}

export interface SalesUserBreakdown extends SalesUser {
  achievement: number;
  admissionFee?: number;
  monthlyFee?: number;
  studentCount?: number;
  target: number;
  percentage: number;
}

export function useSalesTarget(initialUserId: string = "all") {
  const [selectedUser, setSelectedUser] = useState<string>(initialUserId);
  const [salesTarget, setSalesTarget] = useState<SalesTargetData>({
    targetType: "organization",
    userId: "all",
    daily: 5000,
    fifteenDays: 75000,
    custom: 75000,
    from_date: null,
    to_date: null,
    monthly: 150000,
    month: "",
    year: new Date().getFullYear(),
    daily_completed: 0,
    custom_completed: 0,
    monthly_completed: 0,
    amounts: { daily_total: 0, custom_total: 0, monthly_total: 0 },
    counts: { daily_sales_count: 0, custom_sales_count: 0, monthly_sales_count: 0 },
  });
  const [salesUsers, setSalesUsers] = useState<SalesUser[]>([]);
  const [userBreakdown, setUserBreakdown] = useState<SalesUserBreakdown[]>([]);
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSalesTarget = useCallback(async (userIdToFetch?: string) => {
    setLoading(true);
    setError(null);
    try {
      const uId = userIdToFetch !== undefined ? userIdToFetch : selectedUser;
      const res = await fetch(`/api/admin/sales-target?userId=${encodeURIComponent(uId)}`);
      const data = await res.json();
      if (data.success && data.salesTarget) {
        setSalesTarget(data.salesTarget);
        if (Array.isArray(data.salesUsers)) setSalesUsers(data.salesUsers);
        if (Array.isArray(data.userBreakdown)) setUserBreakdown(data.userBreakdown);
        setCanEdit(Boolean(data.canEdit));
      } else {
        setError(data.message || "Failed to load sales targets");
      }
    } catch (err: any) {
      console.error("fetchSalesTarget error:", err);
      setError(err?.message || "Network error loading sales targets");
    } finally {
      setLoading(false);
    }
  }, [selectedUser]);

  const updateSalesTarget = useCallback(async (payload: Partial<SalesTargetData>) => {
    try {
      const res = await fetch("/api/admin/sales-target", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        await fetchSalesTarget();
        return { success: true, message: data.message };
      }
      return { success: false, message: data?.message || (res.status === 403 ? "Forbidden" : "Update failed") };
    } catch (err: any) {
      return { success: false, message: err?.message || "Failed to update target" };
    }
  }, [fetchSalesTarget]);

  useEffect(() => {
    fetchSalesTarget(selectedUser);
  }, [selectedUser, fetchSalesTarget]);

  return {
    salesTarget,
    salesUsers,
    userBreakdown,
    selectedUser,
    setSelectedUser,
    canEdit,
    loading,
    error,
    fetchSalesTarget,
    updateSalesTarget,
  };
}

export default useSalesTarget;
