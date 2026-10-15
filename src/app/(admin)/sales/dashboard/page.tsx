"use client";

import React from "react";
import { ComingSoonPage } from "@/components/admin/ComingSoonPage";
import { BarChart3 } from "lucide-react";

export default function SalesDashboardPage() {
  return (
    <ComingSoonPage
      title="Sales & Revenue Analytics"
      subtitle="Comprehensive revenue breakdowns, consultant fee distribution, monthly target KPIs, and real-time sales performance."
      badge="Coming Soon in Q4"
      icon={BarChart3}
      moduleCode="SALES-DASH"
      features={[
        "Interactive revenue trajectory graphs with monthly comparison",
        "Consultant-wise and department-wise earnings breakdown",
        "Target vs. achievement tracking for healthcare executives",
        "Automated PDF & Excel revenue export for accounts audit",
      ]}
    />
  );
}
