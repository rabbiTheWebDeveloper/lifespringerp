"use client";

import React from "react";
import { ComingSoonPage } from "@/components/admin/ComingSoonPage";
import { Users2 } from "lucide-react";

export default function SalesLeadPage() {
  return (
    <ComingSoonPage
      title="Lead Management CRM"
      subtitle="Track prospective patients, corporate health packages, counseling inquiries, and lead qualification stages."
      badge="Coming Soon in Q4"
      icon={Users2}
      moduleCode="SALES-LEAD"
      features={[
        "Automated lead capture from website, social media & hotline calls",
        "Lead scoring and smart assignment to sales counselors",
        "Call logs, follow-up reminders, and WhatsApp chat history integration",
        "Conversion funnel tracking from initial inquiry to paid appointment",
      ]}
    />
  );
}
