export interface ProfileFieldItem {
  key: string;
  label: string;
  category: "personal" | "professional" | "portfolio" | "verification";
  check?: (data: any) => boolean;
}

export const SUGGESTED_EXPERTISE = [
  "Tajweed Rules",
  "Noorani Qaida",
  "Quran Hifz",
  "Makharij & Pronunciation",
  "Tafseer Ul Quran",
  "Hadith Studies",
  "Arabic Grammar (Nahw & Sarf)",
  "Islamic Studies & Fiqh",
  "Qira'ah (Hafs / Warsh)",
  "Kids Quran Specialist",
  "Adult Recitation Coaching",
  "Urdu & Arabic Spoken",
];

export const PROFILE_COMPLETION_FIELDS: ProfileFieldItem[] = [
  // 1. Personal & Contact (9 items)
  { key: "avatar", label: "Profile photo", category: "personal" },
  { key: "fullName", label: "Full name", category: "personal" },
  { key: "phone", label: "Contact number", category: "personal" },
  { key: "emergencyContactNumber", label: "Emergency contact", category: "personal" },
  { key: "gender", label: "Gender", category: "personal" },
  { key: "bloodGroup", label: "Blood group", category: "personal" },
  { key: "presentAddress", label: "Present address", category: "personal" },
  { key: "permanentAddress", label: "Permanent address", category: "personal" },
  { key: "bio", label: "Biography / Summary", category: "personal" },

  // 2. Professional & Academy (4 items)
  {
    key: "category",
    label: "Teacher category / designation",
    category: "professional",
    check: (t) => {
      if (!t) return false;
      if (typeof t.category === "object" && t.category !== null) {
        return Boolean(t.category._id || t.category.name);
      }
      return Boolean(t.category && String(t.category).trim() !== "");
    },
  },
  { key: "joinDate", label: "Joining date", category: "professional" },
  {
    key: "version",
    label: "Medium / Versions (Bangla/English/Arabic)",
    category: "professional",
    check: (t) => Array.isArray(t?.version) && t.version.length > 0,
  },
  {
    key: "salary",
    label: "Salary / Revenue share percentage",
    category: "professional",
    check: (t) => {
      if (!t) return false;
      return (Number(t.salary) > 0) || (Boolean(t.salaryType) && t.salaryType !== "monthly");
    },
  },

  // 3. Public Portfolio & Credentials (7 items)
  { key: "portfolioHeadline", label: "Portfolio headline / tagline", category: "portfolio" },
  {
    key: "keyExpertise",
    label: "Key areas of expertise",
    category: "portfolio",
    check: (t) => Array.isArray(t?.keyExpertise) && t.keyExpertise.length > 0,
  },
  { key: "portfolioUrl", label: "External portfolio / Sanad URL", category: "portfolio" },
  { key: "impact", label: "Teaching philosophy & impact", category: "portfolio" },
  {
    key: "qualifications",
    label: "Academic qualifications & Sanad",
    category: "portfolio",
    check: (t) => Array.isArray(t?.qualifications) && t.qualifications.some((q: any) => q && (q.degree?.trim() || q.institute?.trim())),
  },
  {
    key: "experiences",
    label: "Teaching experience",
    category: "portfolio",
    check: (t) => Array.isArray(t?.experiences) && t.experiences.some((e: any) => e && (e.institute?.trim() || e.position?.trim())),
  },
  {
    key: "achievements",
    label: "Achievements & honors",
    category: "portfolio",
    check: (t) => Array.isArray(t?.achievements) && t.achievements.some((a: any) => a && a.title?.trim()),
  },

  // 4. Verification & Accounts (2 items)
  { key: "nidOrBirthCertificatePicture", label: "NID / Birth certificate picture", category: "verification" },
  {
    key: "paymentInfo",
    label: "Payment account details",
    category: "verification",
    check: (t) => {
      if (!t) return false;
      return Boolean(t.paymentInfo?.accountNumber || t.paymentInfo?.accountName || t.salary > 0);
    },
  },
];

export interface CategoryProgress {
  label: string;
  category: "personal" | "professional" | "portfolio" | "verification";
  done: number;
  total: number;
  pct: number;
}

export interface ProfileCompletionResult {
  pct: number;
  done: number;
  total: number;
  missing: string[];
  completed: string[];
  checks: Array<{
    key: string;
    label: string;
    category: "personal" | "professional" | "portfolio" | "verification";
    done: boolean;
  }>;
  byCategory: {
    personal: CategoryProgress;
    professional: CategoryProgress;
    portfolio: CategoryProgress;
    verification: CategoryProgress;
  };
  status: {
    label: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    barColor: string;
  };
}

export function calcTeacherProfileCompletion(teacher: any): ProfileCompletionResult {
  const categoryLabels: Record<string, string> = {
    personal: "Personal & Contact",
    professional: "Professional Details",
    portfolio: "Portfolio & Credentials",
    verification: "Verification & Accounts",
  };

  if (!teacher) {
    const checks = PROFILE_COMPLETION_FIELDS.map((f) => ({
      key: f.key,
      label: f.label,
      category: f.category,
      done: false,
    }));
    return {
      pct: 0,
      done: 0,
      total: PROFILE_COMPLETION_FIELDS.length,
      missing: PROFILE_COMPLETION_FIELDS.map((f) => f.label),
      completed: [],
      checks,
      byCategory: {
        personal: { label: categoryLabels.personal, category: "personal", done: 0, total: 9, pct: 0 },
        professional: { label: categoryLabels.professional, category: "professional", done: 0, total: 4, pct: 0 },
        portfolio: { label: categoryLabels.portfolio, category: "portfolio", done: 0, total: 7, pct: 0 },
        verification: { label: categoryLabels.verification, category: "verification", done: 0, total: 2, pct: 0 },
      },
      status: {
        label: "Empty Profile",
        badgeBg: "bg-rose-50",
        badgeText: "text-rose-700",
        badgeBorder: "border-rose-200",
        barColor: "bg-rose-500",
      },
    };
  }

  const checks = PROFILE_COMPLETION_FIELDS.map((f) => {
    let done = false;
    if (f.check) {
      done = Boolean(f.check(teacher));
    } else {
      const val = teacher[f.key];
      if (typeof val === "string") {
        done = val.trim().length > 0;
      } else if (Array.isArray(val)) {
        done = val.length > 0;
      } else if (typeof val === "number") {
        done = !isNaN(val) && val > 0;
      } else if (val !== null && val !== undefined) {
        done = true;
      }
    }
    return {
      key: f.key,
      label: f.label,
      category: f.category,
      done,
    };
  });

  const done = checks.filter((c) => c.done).length;
  const total = checks.length;
  const pct = Math.round((done / total) * 100);
  const missing = checks.filter((c) => !c.done).map((c) => c.label);
  const completed = checks.filter((c) => c.done).map((c) => c.label);

  const categories = ["personal", "professional", "portfolio", "verification"] as const;
  const byCategory = {} as Record<string, CategoryProgress>;

  for (const cat of categories) {
    const catChecks = checks.filter((c) => c.category === cat);
    const catDone = catChecks.filter((c) => c.done).length;
    const catTotal = catChecks.length;
    byCategory[cat] = {
      label: categoryLabels[cat],
      category: cat,
      done: catDone,
      total: catTotal,
      pct: catTotal > 0 ? Math.round((catDone / catTotal) * 100) : 100,
    };
  }

  let status = {
    label: "Needs Info",
    badgeBg: "bg-rose-50",
    badgeText: "text-rose-700",
    badgeBorder: "border-rose-200",
    barColor: "bg-rose-500",
  };

  if (pct >= 85) {
    status = {
      label: pct === 100 ? "100% Fully Verified" : "Nearly Complete",
      badgeBg: "bg-emerald-50",
      badgeText: "text-emerald-700",
      badgeBorder: "border-emerald-200",
      barColor: "bg-emerald-500",
    };
  } else if (pct >= 50) {
    status = {
      label: "Good Progress",
      badgeBg: "bg-amber-50",
      badgeText: "text-amber-700",
      badgeBorder: "border-amber-200",
      barColor: "bg-amber-500",
    };
  }

  return {
    pct,
    done,
    total,
    missing,
    completed,
    checks,
    byCategory: byCategory as ProfileCompletionResult["byCategory"],
    status,
  };
}
