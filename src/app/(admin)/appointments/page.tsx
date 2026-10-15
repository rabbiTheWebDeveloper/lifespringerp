"use client";

import React from "react";
import { ComingSoonPage } from "@/components/admin/ComingSoonPage";
import { CalendarDays } from "lucide-react";

export default function AppointmentsPage() {
  return (
    <ComingSoonPage
      title="Clinical Appointment Scheduling"
      subtitle="Doctor schedules, multi-branch consultation booking, telemedicine sessions, and automated patient queue management."
      badge="Coming Soon in Q4"
      icon={CalendarDays}
      moduleCode="APPT-SCHEDULER"
      features={[
        "Interactive weekly & monthly calendar grid with doctor shift allocation",
        "Dual offline in-clinic and Google Meet telemedicine video appointment booking",
        "SMS/Email automatic booking confirmation with digital appointment pass",
        "Live queue display board integration for branch reception TVs",
      ]}
    />
  );
}
