"use client";

import React from "react";
import { ComingSoonPage } from "@/components/admin/ComingSoonPage";
import { ShoppingBag } from "lucide-react";

export default function SalesOverviewPage() {
  return (
    <ComingSoonPage
      title="Sales & Invoicing Pipeline"
      subtitle="Centralized management of clinic invoices, fee collections, corporate retainers, and billing reconciliation."
      badge="Coming Soon in Q4"
      icon={ShoppingBag}
      moduleCode="SALES-MAIN"
      features={[
        "Real-time transaction tracking for offline and online clinic checkouts",
        "Due billing alerts and automated patient SMS invoice reminders",
        "Integration with bKash, Nagad, Visa, Mastercard & SSLCommerz gateways",
        "Automated commission calculation for clinical specialists",
      ]}
    />
  );
}
