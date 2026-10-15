"use client";

import React from "react";
import { ComingSoonPage } from "@/components/admin/ComingSoonPage";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <ComingSoonPage
      title="System & ERP Settings"
      subtitle="Configure hospital branches, doctor consultation fees, staff roles, SMS gateway credentials, and audit logs."
      badge="Coming Soon in Q4"
      icon={Settings}
      moduleCode="ERP-SETTINGS"
      features={[
        "Branch management: Banani, Dhanmondi, Chattogram & Virtual Clinics",
        "Role-based permission matrix & granular staff security rules",
        "SMS gateway (Greenweb/Elitbuzz) and payment gateway API configuration",
        "System security logs, active employee sessions & database backup schedules",
      ]}
    />
  );
}
