import crypto from "crypto";
import { TOT_QUESTIONS, TOT_QUESTION_MAP, TOT_QUIZ_DURATION_MIN, TOT_QUIZ_PARTS, TOT_QUIZ_TITLE } from "./questions";

/** Extra time accepted after expiry to absorb network latency on the auto-submit request */
export const GRACE_MS = 60 * 1000;

/** Show the score to participants after submission (answer key is never shown) */
export const SHOW_SCORE_TO_PARTICIPANT = false;

/** Result announcement schedule */
export const RESULT_PUBLISH_TIME_TEXT = "সন্ধ্যা ৬:০০ টা (6:00 PM)";

export const VIOLATION_TYPES = ["tabSwitch", "copyPaste", "screenshot", "contextMenu", "devtools"];

/* ─────────────────────────── Validation ─────────────────────────── */

export function normalizeName(name) {
  return String(name || "").replace(/\s+/g, " ").trim();
}

export function sameName(a, b) {
  return normalizeName(a).toLowerCase() === normalizeName(b).toLowerCase();
}

/**
 * Normalises a WhatsApp number to digits only.
 * Bangladeshi local format (01XXXXXXXXX) is converted to 8801XXXXXXXXX.
 * Returns "" when invalid.
 */
export function normalizeWhatsapp(raw) {
  // Convert Bangla digits to ASCII first
  const bnDigits = "০১২৩৪৫৬৭৮৯";
  let s = String(raw || "").replace(/[০-৯]/g, (d) => String(bnDigits.indexOf(d)));
  s = s.replace(/[^\d]/g, "");
  if (s.startsWith("00")) s = s.slice(2);
  if (/^01[3-9]\d{8}$/.test(s)) s = `88${s}`;
  if (/^8801[3-9]\d{8}$/.test(s)) return s;
  // Other countries: 10–15 digits incl. country code
  if (/^[1-9]\d{9,14}$/.test(s) && !s.startsWith("880")) return s;
  return "";
}

/* ─────────────────────────── Randomisation ─────────────────────────── */

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function buildRandomisation() {
  const questionOrder = shuffle(TOT_QUESTIONS.map((q) => q.id));
  const optionOrder = {};
  for (const q of TOT_QUESTIONS) {
    optionOrder[String(q.id)] = shuffle(q.options.map((_, i) => i));
  }
  return { questionOrder, optionOrder };
}

export function newToken() {
  return crypto.randomBytes(24).toString("hex");
}

export function tokenMatches(stored, given) {
  if (!stored || !given || typeof given !== "string") return false;
  const a = Buffer.from(stored);
  const b = Buffer.from(given);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/* ─────────────────────────── Grading ─────────────────────────── */

export function isValidChoice(questionId, choice) {
  const q = TOT_QUESTION_MAP.get(Number(questionId));
  return !!q && Number.isInteger(choice) && choice >= 0 && choice < q.options.length;
}

/** Grades the attempt in place and marks it submitted. */
export function gradeAttempt(attempt, reason) {
  let correct = 0;
  let wrong = 0;
  for (const q of TOT_QUESTIONS) {
    const sel = attempt.answers?.get(String(q.id));
    if (sel === undefined || sel === null) continue;
    if (sel === q.answer) correct++;
    else wrong++;
  }
  const total = TOT_QUESTIONS.length;
  const now = new Date();
  const end = now > attempt.expiresAt ? attempt.expiresAt : now;

  attempt.total = total;
  attempt.correct = correct;
  attempt.wrong = wrong;
  attempt.unanswered = total - correct - wrong;
  attempt.percentage = Math.round((correct / total) * 1000) / 10;
  attempt.status = "submitted";
  attempt.submittedAt = now;
  attempt.submitReason = reason;
  attempt.timeTakenSec = Math.max(0, Math.round((end.getTime() - attempt.startedAt.getTime()) / 1000));
  return attempt;
}

/** Grades an abandoned attempt whose time (plus grace) has run out. Returns true if it changed. */
export async function finalizeIfExpired(attempt) {
  if (attempt.status !== "in-progress") return false;
  if (Date.now() <= attempt.expiresAt.getTime() + GRACE_MS) return false;
  gradeAttempt(attempt, "expired");
  await attempt.save();
  return true;
}

/* ─────────────────────────── Serialisation ─────────────────────────── */

export function publicResult(attempt, isPublished = false) {
  const show = isPublished || SHOW_SCORE_TO_PARTICIPANT;
  return {
    total: attempt.total,
    correct: show ? attempt.correct : null,
    wrong: show ? attempt.wrong : null,
    unanswered: show ? attempt.unanswered : null,
    percentage: show ? attempt.percentage : null,
    timeTakenSec: attempt.timeTakenSec,
    submittedAt: attempt.submittedAt,
    submitReason: attempt.submitReason,
    showScore: show,
    isPublished: Boolean(isPublished),
    resultPublishTime: RESULT_PUBLISH_TIME_TEXT,
  };
}

/** Questions in the attempt's shuffled order — WITHOUT the correct answer. */
export function clientQuestions(attempt) {
  return attempt.questionOrder.map((id) => {
    const q = TOT_QUESTION_MAP.get(id);
    const order = attempt.optionOrder?.get(String(id)) ?? q.options.map((_, i) => i);
    return {
      id: q.id,
      part: q.part,
      partTitle: TOT_QUIZ_PARTS[q.part],
      q: q.q,
      options: order.map((key) => ({ key, text: q.options[key] })),
    };
  });
}

export function sessionPayload(attempt, token, isPublished = false) {
  const base = {
    success: true,
    attemptId: attempt._id.toString(),
    name: attempt.name,
    whatsapp: attempt.whatsapp,
    status: attempt.status,
    title: TOT_QUIZ_TITLE,
    durationMin: TOT_QUIZ_DURATION_MIN,
    startedAt: attempt.startedAt,
    expiresAt: attempt.expiresAt,
    serverNow: new Date().toISOString(),
  };
  if (attempt.status === "submitted") {
    return { ...base, result: publicResult(attempt, isPublished) };
  }
  return {
    ...base,
    token,
    questions: clientQuestions(attempt),
    answers: Object.fromEntries(attempt.answers ?? []),
  };
}

export function clientMeta(req) {
  const fwd = req.headers.get("x-forwarded-for") || "";
  return {
    ip: fwd.split(",")[0].trim() || req.headers.get("x-real-ip") || "",
    userAgent: (req.headers.get("user-agent") || "").slice(0, 300),
  };
}

/** Reads JSON from fetch() or navigator.sendBeacon() (text/plain) bodies. */
export async function readBody(req) {
  try {
    const text = await req.text();
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

export async function getQuizResultPublished() {
  try {
    const { TotQuizSettingsModel } = await import("@/model/tot-quiz-settings-model");
    const settings = await TotQuizSettingsModel.findOne({ key: "tot-final-round" }).lean();
    return Boolean(settings?.isResultPublished);
  } catch {
    return false;
  }
}

