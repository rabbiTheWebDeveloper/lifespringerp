import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import JSZip from "jszip";
import { calcTeacherProfileCompletion } from "./teacher-profile-helper";

type RGB = [number, number, number];

const COLORS = {
  navy: [6, 21, 54] as RGB,
  navyLight: [15, 35, 80] as RGB,
  blue: [29, 78, 216] as RGB,
  sky: [2, 132, 199] as RGB,
  emerald: [5, 150, 105] as RGB,
  amber: [217, 119, 6] as RGB,
  dark: [30, 41, 59] as RGB,
  muted: [100, 116, 139] as RGB,
  lightMuted: [148, 163, 184] as RGB,
  cardBg: [248, 250, 252] as RGB,
  cardBorder: [226, 232, 240] as RGB,
  quoteBg: [240, 244, 255] as RGB,
  quoteBorder: [199, 210, 254] as RGB,
  white: [255, 255, 255] as RGB,
};

function fill(doc: jsPDF, c: RGB) {
  doc.setFillColor(c[0], c[1], c[2]);
}

function stroke(doc: jsPDF, c: RGB) {
  doc.setDrawColor(c[0], c[1], c[2]);
}

function text(doc: jsPDF, c: RGB) {
  doc.setTextColor(c[0], c[1], c[2]);
}

async function loadImgData(url: string): Promise<string | null> {
  if (!url || typeof window === "undefined") return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/**
 * Applies uniform institutional footer across all target pages.
 */
export function applyFooters(doc: jsPDF, skipCoverPage: boolean = false) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const totalPages = doc.getNumberOfPages();
  const startP = skipCoverPage ? 2 : 1;

  for (let p = startP; p <= totalPages; p++) {
    doc.setPage(p);

    stroke(doc, COLORS.cardBorder);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 11, pageWidth - margin, pageHeight - 11);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    text(doc, COLORS.muted);
    doc.text(
      "Fajr Academy — Quranic & Islamic Excellence  |  Customer Care: +880 1410-764581  |  hellofajracademy@gmail.com",
      margin,
      pageHeight - 7
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    text(doc, COLORS.navy);
    doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: "right" });
  }
}

/**
 * Renders an official Faculty Portfolio Dossier for a single teacher inside an existing jsPDF doc.
 */
export async function renderTeacherDossier(
  doc: jsPDF,
  teacher: any,
  isFirstPage: boolean = true,
  cachedLogo: string | null = null
): Promise<{ startPage: number; endPage: number }> {
  if (!teacher) return { startPage: 1, endPage: 1 };

  if (!isFirstPage) {
    doc.addPage();
  }

  const startPage = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm
  let currentY = 12;

  const profileComp = calcTeacherProfileCompletion(teacher);

  const drawPageHeaderMini = () => {
    fill(doc, COLORS.navy);
    doc.rect(0, 0, pageWidth, 3, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    text(doc, COLORS.navy);
    doc.text("FAJR ACADEMY — FACULTY PORTFOLIO & CREDENTIALS", margin, 9);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    text(doc, COLORS.muted);
    doc.text(`Faculty ID: ${teacher.teacherId || "—"}`, pageWidth - margin, 9, { align: "right" });

    stroke(doc, COLORS.cardBorder);
    doc.setLineWidth(0.3);
    doc.line(margin, 11, pageWidth - margin, 11);
  };

  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - 20) {
      doc.addPage();
      currentY = 16;
      drawPageHeaderMini();
    }
  };

  // ═════════════════════════════════════════════════════════════
  // 1. TOP BRANDING BAR & ACADEMY HEADER
  // ═════════════════════════════════════════════════════════════
  fill(doc, COLORS.navy);
  doc.rect(0, 0, pageWidth, 5, "F");

  // Emerald & Blue micro accent stripes
  fill(doc, COLORS.emerald);
  doc.rect(0, 5, pageWidth * 0.4, 1.2, "F");
  fill(doc, COLORS.blue);
  doc.rect(pageWidth * 0.4, 5, pageWidth * 0.6, 1.2, "F");

  currentY = 14;

  const logoData =
    cachedLogo !== undefined && cachedLogo !== null
      ? cachedLogo
      : (await loadImgData("/mainlogo.png")) ||
        (await loadImgData("/fajr-logo.png")) ||
        (await loadImgData("/logo.png"));

  if (logoData) {
    try {
      doc.addImage(logoData, "PNG", margin, currentY, 32, 12);
    } catch {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      text(doc, COLORS.navy);
      doc.text("FAJR ACADEMY", margin, currentY + 7);
    }
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    text(doc, COLORS.navy);
    doc.text("FAJR ACADEMY", margin, currentY + 7);
  }

  // Header Titles
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  text(doc, COLORS.navy);
  doc.text("FACULTY PORTFOLIO & CREDENTIALS", pageWidth - margin, currentY + 4, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  text(doc, COLORS.muted);
  doc.text("Official Academic Dossier & Teacher Verification Record", pageWidth - margin, currentY + 8.5, { align: "right" });

  const refNumber = `FA-PORT-${teacher.teacherId || "TCH"}-${new Date().getFullYear()}`;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  text(doc, COLORS.blue);
  doc.text(`REF: ${refNumber} | VERIFIED ERP DOSSIER`, pageWidth - margin, currentY + 12.5, { align: "right" });

  currentY += 16;
  stroke(doc, COLORS.cardBorder);
  doc.setLineWidth(0.4);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 4;

  // ═════════════════════════════════════════════════════════════
  // 2. TEACHER PROFILE & CREDENTIAL OVERVIEW CARD
  // ═════════════════════════════════════════════════════════════
  checkPageBreak(50);

  const profileCardY = currentY;
  const profileCardH = 46;

  fill(doc, COLORS.cardBg);
  doc.roundedRect(margin, profileCardY, contentWidth, profileCardH, 3, 3, "F");
  stroke(doc, COLORS.cardBorder);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, profileCardY, contentWidth, profileCardH, 3, 3, "S");

  // Avatar / Modesty Emblem
  const avatarBoxX = margin + 4;
  const avatarBoxY = profileCardY + 4;
  const avatarSize = 28;

  let avatarRendered = false;
  const isFemale = teacher.gender === "female";

  if (!isFemale && teacher.avatar) {
    const avatarBase64 = await loadImgData(teacher.avatar);
    if (avatarBase64) {
      try {
        doc.addImage(avatarBase64, "JPEG", avatarBoxX, avatarBoxY, avatarSize, avatarSize);
        stroke(doc, COLORS.quoteBorder);
        doc.setLineWidth(0.5);
        doc.rect(avatarBoxX, avatarBoxY, avatarSize, avatarSize, "S");
        avatarRendered = true;
      } catch {
        avatarRendered = false;
      }
    }
  }

  if (!avatarRendered) {
    fill(doc, isFemale ? [238, 242, 255] : [236, 253, 245]);
    doc.roundedRect(avatarBoxX, avatarBoxY, avatarSize, avatarSize, 3, 3, "F");
    stroke(doc, isFemale ? [199, 210, 254] : [167, 243, 208]);
    doc.roundedRect(avatarBoxX, avatarBoxY, avatarSize, avatarSize, 3, 3, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    text(doc, isFemale ? COLORS.blue : COLORS.emerald);
    const initial = (teacher.fullName || "T").charAt(0).toUpperCase();
    doc.text(initial, avatarBoxX + avatarSize / 2, avatarBoxY + 16, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    text(doc, isFemale ? COLORS.blue : COLORS.emerald);
    doc.text(isFemale ? "Purdah Observed" : "Verified Scholar", avatarBoxX + avatarSize / 2, avatarBoxY + 23, {
      align: "center",
    });
  }

  // Profile Info Details (Middle Column)
  const infoLeft = avatarBoxX + avatarSize + 6;
  let infoY = profileCardY + 8;

  // Teacher Full Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  text(doc, COLORS.navy);
  const displayName = isFemale && !teacher.fullName?.toLowerCase().includes("ustadha")
    ? `Ustadha ${teacher.fullName}`
    : teacher.fullName || "Honorable Teacher";
  doc.text(displayName, infoLeft, infoY);

  // Designation & Category
  infoY += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  text(doc, COLORS.blue);
  const designation = teacher.designation || "Islamic Studies & Quran Faculty";
  const categoryName = teacher.category?.name || (typeof teacher.category === "string" ? teacher.category : "Quran & Islamic Department");
  doc.text(`${designation}  •  ${categoryName}`, infoLeft, infoY);

  // Meta pills: Teacher ID, Mediums, Rating
  infoY += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  text(doc, COLORS.muted);
  const mediums = Array.isArray(teacher.version) && teacher.version.length ? teacher.version.join(", ") : "Bangla, English";
  const joinedStr = teacher.joinDate ? new Date(teacher.joinDate).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "Active Faculty";
  doc.text(`ID: ${teacher.teacherId || "—"}  |  Medium: ${mediums}  |  Joined: ${joinedStr}`, infoLeft, infoY);

  // Contact summary (Phone, Email)
  infoY += 4.5;
  const phoneText = teacher.phone ? `Phone: ${teacher.phone}` : "Contact: Via Fajr Academy Desk";
  const emailText = teacher.email ? `Email: ${teacher.email}` : "";
  doc.text(`${phoneText} ${emailText ? ` | ${emailText}` : ""}`, infoLeft, infoY);

  // Modesty or Service status note
  infoY += 4.5;
  if (teacher.currentService) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    text(doc, COLORS.emerald);
    doc.text(`Current Service: ${teacher.currentService}`, infoLeft, infoY);
  }

  // Right Side: Profile Score & Verified Badge
  const scoreBadgeW = 54;
  const scoreBadgeX = pageWidth - margin - scoreBadgeW - 3;
  const scoreBadgeY = profileCardY + 4;

  fill(doc, COLORS.white);
  doc.roundedRect(scoreBadgeX, scoreBadgeY, scoreBadgeW, 38, 2, 2, "F");
  stroke(doc, COLORS.quoteBorder);
  doc.roundedRect(scoreBadgeX, scoreBadgeY, scoreBadgeW, 38, 2, 2, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  text(doc, COLORS.muted);
  doc.text("CREDENTIAL STATUS", scoreBadgeX + scoreBadgeW / 2, scoreBadgeY + 5.5, { align: "center" });

  // Big percentage
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  text(doc, profileComp.pct >= 80 ? COLORS.emerald : COLORS.blue);
  doc.text(`${profileComp.pct}%`, scoreBadgeX + scoreBadgeW / 2, scoreBadgeY + 14, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  text(doc, COLORS.dark);
  doc.text(profileComp.status.label, scoreBadgeX + scoreBadgeW / 2, scoreBadgeY + 18.5, { align: "center" });

  // Mini progress bar in card
  fill(doc, [241, 245, 249]);
  doc.roundedRect(scoreBadgeX + 6, scoreBadgeY + 22, scoreBadgeW - 12, 2.5, 1, 1, "F");
  fill(doc, profileComp.pct >= 80 ? COLORS.emerald : COLORS.blue);
  doc.roundedRect(
    scoreBadgeX + 6,
    scoreBadgeY + 22,
    Math.max(2, ((scoreBadgeW - 12) * profileComp.pct) / 100),
    2.5,
    1,
    1,
    "F"
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  text(doc, COLORS.muted);
  doc.text(`${profileComp.done}/${profileComp.total} Verified Data Points`, scoreBadgeX + scoreBadgeW / 2, scoreBadgeY + 29, {
    align: "center",
  });

  if (teacher.rating > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    text(doc, COLORS.amber);
    doc.text(`Rating: ${teacher.rating.toFixed(1)} / 5.0 (${teacher.totalRatings || 0} reviews)`, scoreBadgeX + scoreBadgeW / 2, scoreBadgeY + 34, {
      align: "center",
    });
  }

  currentY = profileCardY + profileCardH + 5;

  // ═════════════════════════════════════════════════════════════
  // 3. PORTFOLIO HEADLINE & TEACHING PHILOSOPHY
  // ═════════════════════════════════════════════════════════════
  if (teacher.portfolioHeadline || teacher.impact) {
    checkPageBreak(30);

    const headlineBlockY = currentY;

    // Headline Quote
    if (teacher.portfolioHeadline) {
      fill(doc, COLORS.quoteBg);
      stroke(doc, COLORS.quoteBorder);

      const splitHeadline = doc.splitTextToSize(`“${teacher.portfolioHeadline}”`, contentWidth - 14);
      const quoteHeight = splitHeadline.length * 4.2 + 6;

      doc.roundedRect(margin, headlineBlockY, contentWidth, quoteHeight, 2, 2, "F");
      // Blue left border accent
      fill(doc, COLORS.blue);
      doc.rect(margin, headlineBlockY, 2.5, quoteHeight, "F");

      doc.setFont("helvetica", "bolditalic");
      doc.setFontSize(8.5);
      text(doc, COLORS.navy);
      doc.text(splitHeadline, margin + 6, headlineBlockY + 5);

      currentY += quoteHeight + 3;
    }

    // Teaching Philosophy & Impact
    if (teacher.impact) {
      checkPageBreak(25);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      text(doc, COLORS.blue);
      doc.text("TEACHING PHILOSOPHY & EDUCATIONAL IMPACT", margin, currentY);
      currentY += 3.5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      text(doc, COLORS.dark);
      const splitImpact = doc.splitTextToSize(teacher.impact, contentWidth);
      doc.text(splitImpact, margin, currentY);
      currentY += splitImpact.length * 3.8 + 4;
    }
  }

  // ═════════════════════════════════════════════════════════════
  // 4. KEY AREAS OF EXPERTISE & SPECIALTIES
  // ═════════════════════════════════════════════════════════════
  if (Array.isArray(teacher.keyExpertise) && teacher.keyExpertise.length > 0) {
    checkPageBreak(20);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    text(doc, COLORS.navy);
    doc.text("CORE EXPERTISE & SPECIALIZATIONS", margin, currentY);
    currentY += 4;

    // Draw expertise chips
    let chipX = margin;
    let chipY = currentY;
    const chipHeight = 5.2;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);

    teacher.keyExpertise.forEach((skill: string) => {
      const cleanSkill = String(skill).trim();
      const textWidth = doc.getTextWidth(cleanSkill);
      const chipWidth = textWidth + 6;

      if (chipX + chipWidth > margin + contentWidth) {
        chipX = margin;
        chipY += chipHeight + 2;
        checkPageBreak(12);
      }

      fill(doc, [241, 245, 249]);
      doc.roundedRect(chipX, chipY, chipWidth, chipHeight, 1.2, 1.2, "F");
      stroke(doc, [203, 213, 225]);
      doc.roundedRect(chipX, chipY, chipWidth, chipHeight, 1.2, 1.2, "S");

      text(doc, COLORS.navy);
      doc.text(cleanSkill, chipX + 3, chipY + 3.7);

      chipX += chipWidth + 2.5;
    });

    currentY = chipY + chipHeight + 5;
  }

  // ═════════════════════════════════════════════════════════════
  // 5. ACADEMIC QUALIFICATIONS & SANAD (AUTOTABLE)
  // ═════════════════════════════════════════════════════════════
  checkPageBreak(30);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  text(doc, COLORS.navy);
  doc.text("ACADEMIC QUALIFICATIONS & SANADS", margin, currentY);
  currentY += 3;

  const qualCols = [
    { header: "#", dataKey: "index" },
    { header: "Degree / Sanad / Certificate", dataKey: "degree" },
    { header: "Institution / Jamia / Board", dataKey: "institute" },
    { header: "Passing Year", dataKey: "passingYear" },
    { header: "Verification", dataKey: "status" },
  ];

  const qualRows =
    teacher.qualifications && teacher.qualifications.length > 0
      ? teacher.qualifications.map((q: any, idx: number) => ({
          index: String(idx + 1),
          degree: q.degree || "Certificate / Sanad",
          institute: q.institute || "Jamia / Academy",
          passingYear: q.passingYear ? String(q.passingYear) : "—",
          status: "Verified Record",
        }))
      : [
          {
            index: "—",
            degree: "Standard Islamic Academy Induction Criteria Met",
            institute: "Fajr Academy Verified Faculty",
            passingYear: "—",
            status: "Verified",
          },
        ];

  autoTable(doc, {
    columns: qualCols,
    body: qualRows,
    startY: currentY,
    theme: "striped",
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: COLORS.navy,
      textColor: COLORS.white,
      fontStyle: "bold",
      fontSize: 7.5,
      halign: "left",
      cellPadding: 2,
    },
    bodyStyles: {
      textColor: COLORS.dark,
      fontSize: 7.5,
      cellPadding: 2,
    },
    columnStyles: {
      index: { cellWidth: 8, halign: "center" },
      degree: { cellWidth: 62, fontStyle: "bold" },
      institute: { cellWidth: 62 },
      passingYear: { cellWidth: 22, halign: "center" },
      status: { cellWidth: 28, halign: "center", textColor: COLORS.emerald, fontStyle: "bold" },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 5;

  // ═════════════════════════════════════════════════════════════
  // 6. TEACHING EXPERIENCE & POSITIONS (AUTOTABLE)
  // ═════════════════════════════════════════════════════════════
  checkPageBreak(30);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  text(doc, COLORS.navy);
  doc.text("TEACHING EXPERIENCE & CAREER RECORD", margin, currentY);
  currentY += 3;

  const expCols = [
    { header: "#", dataKey: "index" },
    { header: "Position / Designation", dataKey: "position" },
    { header: "Institution / Organization", dataKey: "institute" },
    { header: "Duration", dataKey: "time" },
    { header: "Key Responsibilities & Scope", dataKey: "description" },
  ];

  const expRows =
    teacher.experiences && teacher.experiences.length > 0
      ? teacher.experiences.map((e: any, idx: number) => ({
          index: String(idx + 1),
          position: e.position || "Instructor / Teacher",
          institute: e.institute || "Madrasah / Academy",
          time: e.time || "—",
          description: e.description || "Quran recitation, Tajweed rules coaching, and syllabus evaluation.",
        }))
      : [
          {
            index: "1",
            position: teacher.designation || "Faculty Member",
            institute: "Fajr Academy Online",
            time: "Active Service",
            description: "Online Quranic pedagogy, individualized recitation guidance, and student progress mentorship.",
          },
        ];

  autoTable(doc, {
    columns: expCols,
    body: expRows,
    startY: currentY,
    theme: "striped",
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: COLORS.blue,
      textColor: COLORS.white,
      fontStyle: "bold",
      fontSize: 7.5,
      halign: "left",
      cellPadding: 2,
    },
    bodyStyles: {
      textColor: COLORS.dark,
      fontSize: 7.5,
      cellPadding: 2,
    },
    columnStyles: {
      index: { cellWidth: 8, halign: "center" },
      position: { cellWidth: 42, fontStyle: "bold" },
      institute: { cellWidth: 42 },
      time: { cellWidth: 26, halign: "center" },
      description: { cellWidth: 64 },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 5;

  // ═════════════════════════════════════════════════════════════
  // 7. KEY ACHIEVEMENTS & HONORS (AUTOTABLE)
  // ═════════════════════════════════════════════════════════════
  if (Array.isArray(teacher.achievements) && teacher.achievements.length > 0) {
    checkPageBreak(30);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    text(doc, COLORS.navy);
    doc.text("KEY ACHIEVEMENTS, HONORS & AWARDS", margin, currentY);
    currentY += 3;

    const achCols = [
      { header: "#", dataKey: "index" },
      { header: "Award / Honor / Recognition", dataKey: "title" },
      { header: "Year", dataKey: "year" },
      { header: "Details & Significance", dataKey: "description" },
    ];

    const achRows = teacher.achievements.map((a: any, idx: number) => ({
      index: String(idx + 1),
      title: a.title || "Honor of Excellence",
      year: a.year || "—",
      description: a.description || "Recognized for exemplary dedication and high-quality teaching standards.",
    }));

    autoTable(doc, {
      columns: achCols,
      body: achRows,
      startY: currentY,
      theme: "striped",
      margin: { left: margin, right: margin },
      headStyles: {
        fillColor: COLORS.amber,
        textColor: COLORS.white,
        fontStyle: "bold",
        fontSize: 7.5,
        halign: "left",
        cellPadding: 2,
      },
      bodyStyles: {
        textColor: COLORS.dark,
        fontSize: 7.5,
        cellPadding: 2,
      },
      columnStyles: {
        index: { cellWidth: 8, halign: "center" },
        title: { cellWidth: 60, fontStyle: "bold" },
        year: { cellWidth: 22, halign: "center" },
        description: { cellWidth: 92 },
      },
      alternateRowStyles: {
        fillColor: [255, 251, 235],
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 5;
  }

  // ═════════════════════════════════════════════════════════════
  // 8. EXTERNAL PORTFOLIO & SANAD LINK
  // ═════════════════════════════════════════════════════════════
  if (teacher.portfolioUrl) {
    checkPageBreak(16);

    fill(doc, [239, 246, 255]);
    stroke(doc, [191, 219, 254]);
    doc.roundedRect(margin, currentY, contentWidth, 12, 2, 2, "F");
    doc.roundedRect(margin, currentY, contentWidth, 12, 2, 2, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    text(doc, COLORS.blue);
    doc.text("VERIFIED EXTERNAL PORTFOLIO & SANAD WEB LINK:", margin + 4, currentY + 4.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    text(doc, COLORS.blue);

    const cleanUrl = teacher.portfolioUrl.startsWith("http")
      ? teacher.portfolioUrl
      : `https://${teacher.portfolioUrl}`;

    doc.textWithLink(cleanUrl, margin + 4, currentY + 8.5, { url: cleanUrl });

    currentY += 15;
  }

  // ═════════════════════════════════════════════════════════════
  // 9. OFFICIAL VERIFICATION SEAL & SIGNATURE BOX
  // ═════════════════════════════════════════════════════════════
  checkPageBreak(32);

  const sealBoxY = currentY;
  const sealBoxH = 26;

  fill(doc, COLORS.cardBg);
  stroke(doc, COLORS.cardBorder);
  doc.roundedRect(margin, sealBoxY, contentWidth, sealBoxH, 2, 2, "F");
  doc.roundedRect(margin, sealBoxY, contentWidth, sealBoxH, 2, 2, "S");

  // Left side: Digital verification note
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  text(doc, COLORS.navy);
  doc.text("FAJR ACADEMY VERIFIED FACULTY CREDENTIAL", margin + 4, sealBoxY + 5.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  text(doc, COLORS.muted);
  doc.text(
    "This document is an authentic transcript of teacher portfolio and credential data maintained in the",
    margin + 4,
    sealBoxY + 10
  );
  doc.text(
    "Fajr Academy ERP Enterprise System. Verified for educational, institutional, and student allocation purposes.",
    margin + 4,
    sealBoxY + 14
  );
  doc.text(
    `Official Record Timestamp: ${new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}`,
    margin + 4,
    sealBoxY + 18
  );

  // Right side: Official Seal Stamp box
  const stampX = pageWidth - margin - 46;
  const stampY = sealBoxY + 3;

  stroke(doc, COLORS.emerald);
  doc.setLineWidth(0.6);
  doc.roundedRect(stampX, stampY, 42, 20, 2, 2, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  text(doc, COLORS.emerald);
  doc.text("FAJR ACADEMY", stampX + 21, stampY + 5.5, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("OFFICIALLY VERIFIED", stampX + 21, stampY + 10.5, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  text(doc, COLORS.muted);
  doc.text("ACADEMIC REGISTRAR DESK", stampX + 21, stampY + 15, { align: "center" });
  doc.text(`CODE: FA-REG-${new Date().getFullYear()}`, stampX + 21, stampY + 18, { align: "center" });

  const endPage = doc.getNumberOfPages();
  return { startPage, endPage };
}

/**
 * Generates an official Executive Cover Page for the master booklet.
 */
export function renderExecutiveCoverPage(doc: jsPDF, teachers: any[], logoData: string | null) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Navy Top Header Banner (68mm)
  fill(doc, COLORS.navy);
  doc.rect(0, 0, pageWidth, 68, "F");

  // Emerald & Blue accent bottom lines
  fill(doc, COLORS.emerald);
  doc.rect(0, 68, pageWidth * 0.45, 2, "F");
  fill(doc, COLORS.blue);
  doc.rect(pageWidth * 0.45, 68, pageWidth * 0.55, 2, "F");

  // Logo or Crest
  if (logoData) {
    try {
      doc.addImage(logoData, "PNG", margin, 14, 40, 16);
    } catch {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      text(doc, COLORS.white);
      doc.text("FAJR ACADEMY", margin, 26);
    }
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    text(doc, COLORS.white);
    doc.text("FAJR ACADEMY", margin, 26);
  }

  // Header Sub-text inside dark banner
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  text(doc, [203, 213, 225]);
  doc.text("OFFICIAL INSTITUTIONAL DOSSIER ARCHIVE", pageWidth - margin, 20, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  text(doc, [148, 163, 184]);
  doc.text("Fajr Academy Quranic & Islamic Excellence ERP", pageWidth - margin, 25, { align: "right" });
  doc.text(
    `Official Academic Cycle: ${new Date().getFullYear()} – ${new Date().getFullYear() + 1}`,
    pageWidth - margin,
    30,
    { align: "right" }
  );

  // Main Cover Titles
  let y = 84;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  text(doc, COLORS.blue);
  doc.text("COMPREHENSIVE FACULTY COMPENDIUM", margin, y);

  y += 9;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  text(doc, COLORS.navy);
  doc.text("FACULTY PORTFOLIOS &", margin, y);
  y += 9;
  doc.text("CREDENTIALS DIRECTORY", margin, y);

  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  text(doc, COLORS.muted);
  doc.text("Official transcripts of academic qualifications, sanads, verified teaching backgrounds,", margin, y);
  y += 5;
  doc.text("instructional philosophies, and professional accreditations across all departments.", margin, y);

  // Summary Metrics Grid (4 cards in 2x2)
  y += 12;
  const cardW = (contentWidth - 6) / 2;
  const cardH = 22;

  // Calculate stats
  const totalCount = teachers.length;
  const avgRating =
    totalCount > 0
      ? (teachers.reduce((acc, t) => acc + (t.rating || 0), 0) / totalCount).toFixed(1)
      : "5.0";
  const deptsSet = new Set(teachers.map((t) => t.category?.name || t.category || "Islamic Faculty").filter(Boolean));
  const deptCount = deptsSet.size || 1;
  const verifiedCount = teachers.filter((t) => t.status === "active" || t.status === "approved" || !t.status).length;

  const cards = [
    { label: "TOTAL FACULTY MEMBERS", value: `${totalCount} Registered`, color: COLORS.navy },
    { label: "ACADEMIC DEPARTMENTS", value: `${deptCount} Disciplines`, color: COLORS.blue },
    { label: "VERIFIED FACULTY STATUS", value: `${verifiedCount} / ${totalCount} Active`, color: COLORS.emerald },
    { label: "STUDENT RATING AVERAGE", value: `${avgRating} ★ / 5.0`, color: COLORS.amber },
  ];

  cards.forEach((c, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const cx = margin + col * (cardW + 6);
    const cy = y + row * (cardH + 5);

    fill(doc, COLORS.cardBg);
    stroke(doc, COLORS.cardBorder);
    doc.roundedRect(cx, cy, cardW, cardH, 2.5, 2.5, "F");
    doc.roundedRect(cx, cy, cardW, cardH, 2.5, 2.5, "S");

    fill(doc, c.color);
    doc.rect(cx, cy, 2.5, cardH, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    text(doc, COLORS.muted);
    doc.text(c.label, cx + 6, cy + 7);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    text(doc, c.color);
    doc.text(c.value, cx + 6, cy + 16);
  });

  y += cardH * 2 + 16;

  // Registrar Verification & Security Box
  fill(doc, [240, 249, 255]);
  stroke(doc, [186, 230, 253]);
  doc.roundedRect(margin, y, contentWidth, 38, 3, 3, "F");
  doc.roundedRect(margin, y, contentWidth, 38, 3, 3, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  text(doc, COLORS.navy);
  doc.text("INSTITUTIONAL REGISTRATION & CERTIFICATION AUTHENTICITY", margin + 6, y + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  text(doc, COLORS.dark);
  doc.text(
    "This compendium represents the certified master portfolio directory of Fajr Academy faculty members.",
    margin + 6,
    y + 14
  );
  doc.text(
    "All credentials, academic certificates, and teaching experiences have been submitted and digitally verified",
    margin + 6,
    y + 19
  );
  doc.text(
    "through the academic management registry. Suitable for board presentations, audit, and quality inspections.",
    margin + 6,
    y + 24
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  text(doc, COLORS.emerald);
  doc.text(
    `Official Archive Generated: ${new Date().toLocaleString("en-US", { dateStyle: "full", timeStyle: "medium" })}`,
    margin + 6,
    y + 31
  );

  // Bottom Registrar Stamp
  const stampW = 44;
  const stampX = pageWidth - margin - stampW - 5;
  const stampY = y + 4;
  stroke(doc, COLORS.emerald);
  doc.setLineWidth(0.6);
  doc.roundedRect(stampX, stampY, stampW, 30, 2, 2, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  text(doc, COLORS.emerald);
  doc.text("FAJR ACADEMY", stampX + stampW / 2, stampY + 7, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("MASTER ARCHIVE", stampX + stampW / 2, stampY + 14, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  text(doc, COLORS.muted);
  doc.text("OFFICIAL REGISTRAR DESK", stampX + stampW / 2, stampY + 20, { align: "center" });
  doc.text(`REF: FA-MASTER-${new Date().getFullYear()}`, stampX + stampW / 2, stampY + 24, { align: "center" });
}

/**
 * Renders the Directory & Summary Index autotable on page 2 of the master booklet.
 */
export function renderFacultyDirectoryTable(doc: jsPDF, teachers: any[]) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;

  // Page header
  fill(doc, COLORS.navy);
  doc.rect(0, 0, pageWidth, 5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  text(doc, COLORS.navy);
  doc.text("FACULTY DIRECTORY & SUMMARY INDEX", margin, 15);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  text(doc, COLORS.muted);
  doc.text(
    `Master roster of all ${teachers.length} verified faculty members in this compendium.`,
    margin,
    20
  );

  stroke(doc, COLORS.cardBorder);
  doc.setLineWidth(0.4);
  doc.line(margin, 23, pageWidth - margin, 23);

  const directoryCols = [
    { header: "#", dataKey: "index" },
    { header: "Faculty ID", dataKey: "teacherId" },
    { header: "Faculty Member & Designation", dataKey: "name" },
    { header: "Department", dataKey: "category" },
    { header: "Medium", dataKey: "mediums" },
    { header: "Highest Qualification / Sanad", dataKey: "quals" },
    { header: "Score", dataKey: "completion" },
  ];

  const directoryRows = teachers.map((t, idx) => {
    const isFemale = t.gender === "female";
    const name =
      isFemale && !t.fullName?.toLowerCase().includes("ustadha")
        ? `Ustadha ${t.fullName}`
        : t.fullName || "—";
    const desig = t.designation || "Faculty Member";
    const cat = t.category?.name || (typeof t.category === "string" ? t.category : "Islamic Studies");
    const highestQual =
      Array.isArray(t.qualifications) && t.qualifications[0]?.degree
        ? t.qualifications[0].degree
        : "Sanad Certified";
    const comp = calcTeacherProfileCompletion(t);

    return {
      index: String(idx + 1),
      teacherId: t.teacherId || "—",
      name: `${name}\n${desig}`,
      category: cat,
      mediums: Array.isArray(t.version) && t.version.length ? t.version.join(", ") : "Bangla, English",
      quals: highestQual,
      completion: `${comp.pct}%`,
    };
  });

  autoTable(doc, {
    columns: directoryCols,
    body: directoryRows,
    startY: 26,
    theme: "striped",
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: COLORS.navy,
      textColor: COLORS.white,
      fontStyle: "bold",
      fontSize: 7.5,
      halign: "left",
      cellPadding: 2,
    },
    bodyStyles: {
      textColor: COLORS.dark,
      fontSize: 7,
      cellPadding: 2,
    },
    columnStyles: {
      index: { cellWidth: 8, halign: "center" },
      teacherId: { cellWidth: 20, fontStyle: "bold" },
      name: { cellWidth: 54 },
      category: { cellWidth: 32 },
      mediums: { cellWidth: 26 },
      quals: { cellWidth: 30 },
      completion: { cellWidth: 12, halign: "center", fontStyle: "bold", textColor: COLORS.emerald },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });
}

/**
 * Generates an official, beautifully typeset Faculty Portfolio & Credentials PDF for a single teacher.
 */
export async function generateTeacherPortfolioPDF(
  teacher: any,
  options: { isPrint?: boolean } = {}
): Promise<void> {
  if (!teacher) return;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const logoData =
    (await loadImgData("/mainlogo.png")) ||
    (await loadImgData("/fajr-logo.png")) ||
    (await loadImgData("/logo.png"));

  await renderTeacherDossier(doc, teacher, true, logoData);
  applyFooters(doc, false);

  const cleanName = (teacher.fullName || "Teacher").replace(/[^a-zA-Z0-9_-]/g, "_");
  const fileName = `Teacher-Portfolio-${teacher.teacherId || "TCH"}-${cleanName}.pdf`;

  if (options.isPrint) {
    doc.autoPrint();
    const blob = doc.output("bloburl");
    window.open(blob, "_blank");
  } else {
    doc.save(fileName);
  }
}

/**
 * Generates a consolidated Master Faculty Portfolio Dossier Booklet PDF containing all given teachers.
 */
export async function generateAllTeachersPortfolioBooklet(
  teachers: any[],
  options: {
    isPrint?: boolean;
    includeCover?: boolean;
    title?: string;
  } = {},
  onProgress?: (current: number, total: number, teacherName: string) => void
): Promise<void> {
  if (!Array.isArray(teachers) || teachers.length === 0) return;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const logoData =
    (await loadImgData("/mainlogo.png")) ||
    (await loadImgData("/fajr-logo.png")) ||
    (await loadImgData("/logo.png"));

  const includeCover = options.includeCover !== false;

  if (includeCover) {
    onProgress?.(0, teachers.length, "Generating Executive Cover & Directory Index...");
    renderExecutiveCoverPage(doc, teachers, logoData);

    doc.addPage();
    renderFacultyDirectoryTable(doc, teachers);
  }

  for (let i = 0; i < teachers.length; i++) {
    const teacher = teachers[i];
    const name = teacher.fullName || `Teacher #${i + 1}`;
    onProgress?.(i + 1, teachers.length, `${name} (${teacher.teacherId || `#${i + 1}`})`);

    const isFirstPage = !includeCover && i === 0;
    await renderTeacherDossier(doc, teacher, isFirstPage, logoData);
  }

  applyFooters(doc, includeCover);

  const cleanDate = new Date().toISOString().split("T")[0];
  const fileName = `Fajr-Academy-All-Faculty-Portfolios-Booklet-${cleanDate}.pdf`;

  if (options.isPrint) {
    doc.autoPrint();
    const blob = doc.output("bloburl");
    window.open(blob, "_blank");
  } else {
    doc.save(fileName);
  }
}

/**
 * Generates individual portfolio PDFs for all given teachers and packs them into a single .zip archive.
 */
export async function generateAllTeachersPortfolioZip(
  teachers: any[],
  onProgress?: (current: number, total: number, teacherName: string) => void
): Promise<void> {
  if (!Array.isArray(teachers) || teachers.length === 0) return;

  const zip = new JSZip();
  const logoData =
    (await loadImgData("/mainlogo.png")) ||
    (await loadImgData("/fajr-logo.png")) ||
    (await loadImgData("/logo.png"));

  for (let i = 0; i < teachers.length; i++) {
    const teacher = teachers[i];
    const cleanName = (teacher.fullName || "Teacher").replace(/[^a-zA-Z0-9_-]/g, "_");
    const tid = teacher.teacherId || `TCH${i + 1}`;
    onProgress?.(i + 1, teachers.length, `${teacher.fullName || tid}...`);

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    await renderTeacherDossier(doc, teacher, true, logoData);
    applyFooters(doc, false);

    const pdfBuffer = doc.output("arraybuffer");
    zip.file(`Teacher-Portfolio-${tid}-${cleanName}.pdf`, pdfBuffer);
  }

  onProgress?.(teachers.length, teachers.length, "Packaging ZIP archive...");
  const zipBlob = await zip.generateAsync({ type: "blob" });
  const cleanDate = new Date().toISOString().split("T")[0];
  const zipName = `Fajr-Academy-Teacher-Portfolios-${cleanDate}.zip`;

  const link = document.createElement("a");
  link.href = URL.createObjectURL(zipBlob);
  link.download = zipName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
