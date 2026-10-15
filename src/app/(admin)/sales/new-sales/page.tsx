"use client";

import React from "react";
import { ComingSoonPage } from "@/components/admin/ComingSoonPage";
import { PlusCircle } from "lucide-react";

export default function NewSalesPage() {
  return (
    <ComingSoonPage
      title="New Sales Pipeline"
      subtitle="Create corporate client proposals, health packages, diagnostic bookings, and initial consultation billings."
      badge="Coming Soon in Q4"
      icon={PlusCircle}
      moduleCode="SALES-NEW"
      features={[
        "Quick quotation builder for corporate workshops & mental health packages",
        "Instant invoice generator with SSLCommerz payment link dispatch",
        "Multi-tier discount approval workflow for department managers",
        "Direct booking sync into hospital appointment calendars",
      ]}
    />
  );
}
