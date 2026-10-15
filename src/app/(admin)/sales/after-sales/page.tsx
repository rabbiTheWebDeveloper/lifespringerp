"use client";

import React from "react";
import { ComingSoonPage } from "@/components/admin/ComingSoonPage";
import { HeartHandshake } from "lucide-react";

export default function AfterSalesPage() {
  return (
    <ComingSoonPage
      title="After-Sales & Retention"
      subtitle="Follow-up consultation tracking, therapy progress checks, patient satisfaction feedback, and subscription renewals."
      badge="Coming Soon in Q4"
      icon={HeartHandshake}
      moduleCode="SALES-RETENTION"
      features={[
        "Automated therapy follow-up prompts after completion of sessions",
        "Patient NPS and doctor rating feedback surveys",
        "Churn prediction and retention discount campaigns for chronic care patients",
        "Dedicated escalation desk for client billing and scheduling queries",
      ]}
    />
  );
}
