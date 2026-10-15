import nodemailer from "nodemailer";

const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.NEXT_PUBLIC_VERCEL_URL) return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  return "http://localhost:3000";
};

// ── Shared transporter ─────────────────────────────────────────────────────────
const getTransporter = () =>
  nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER || "rabbi.fajracademy@gmail.com",
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

// ── Shared branded HTML email wrapper ──────────────────────────────────────────────────
function getEmailWrapper(contentHtml) {
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>Fajr Academy</title>
</head>
<body style="margin:0;padding:0;background:#f0f2f8;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f0f2f8;padding:36px 0;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
               style="max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;
                      box-shadow:0 6px 30px rgba(10,25,49,0.10);border:1px solid #dde2ec;">

          <!-- ── Header / Logo ──────────────────────────────────── -->
          <tr>
            <td style="background:linear-gradient(135deg,#0A1931 0%,#1c3f70 100%);
                        padding:30px 40px 24px;text-align:center;">
              <p style="color:#ffffff;font-size:28px;font-weight:800;margin:0;
                         letter-spacing:1px;font-family:Georgia,serif;">Fajr Academy</p>
              <p style="color:#a8bcd4;font-size:11px;margin:10px 0 0;
                         text-transform:uppercase;letter-spacing:2.5px;font-weight:600;">
                Official Communication
              </p>
            </td>
          </tr>

          <!-- ── Body content ───────────────────────────────────── -->
          <tr>
            <td style="padding:38px 44px 30px;color:#1a1a2e;font-size:15px;line-height:1.75;">
              ${contentHtml}
            </td>
          </tr>

          <!-- ── Divider ────────────────────────────────────────── -->
          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none;border-top:1px solid #e8ecf3;margin:0;" />
            </td>
          </tr>

          <!-- ── Footer ─────────────────────────────────────────── -->
          <tr>
            <td style="background:#f8f9fd;padding:22px 40px 28px;text-align:center;">
              <p style="margin:0 0 8px;">
                <a href="https://www.fajracademy.io/"
                   style="color:#0A1931;font-weight:700;font-size:13px;text-decoration:none;">
                  www.fajracademy.io
                </a>
              </p>
              <p style="margin:0 0 10px;font-size:12px;color:#6b7a99;">
                &#128222;&nbsp;
                <a href="tel:+8801857381244"
                   style="color:#6b7a99;text-decoration:none;">01857-381244</a>
              </p>
              <p style="margin:0;font-size:11px;color:#aab4c8;line-height:1.7;">
                This is an automated email from Fajr Academy ERP.<br />
                Please do not reply directly to this message.<br />
                &copy; ${year} Fajr Academy. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── sendWelcomeEmail ───────────────────────────────────────────────────────────
async function sendWelcomeEmail({ toEmail, fullName }) {
  const transporter = getTransporter();
  const fromEmail = process.env.GMAIL_USER || "rabbi.fajracademy@gmail.com";

  await transporter.sendMail({
    from: `"Fajr Academy" <${fromEmail}>`,
    to: toEmail,
    subject: "Welcome to Fajr Academy ERP — Account Activated",
    html: getEmailWrapper(`
      <h3 style="color:#0A1931;font-size:20px;margin:0 0 16px;">Welcome, ${fullName}! &#127881;</h3>
      <p style="margin:0 0 12px;">Your Fajr Academy ERP account has been successfully created and activated.</p>
      <p style="margin:0 0 20px;"><strong>Registered Email:</strong> ${toEmail}</p>
      <div style="text-align:center;margin:28px 0;">
        <a href="${getBaseUrl()}/login"
           style="background:#0A1931;color:#fff;padding:14px 36px;text-decoration:none;
                  border-radius:7px;font-weight:700;font-size:14px;display:inline-block;">
          Log in to Your Dashboard
        </a>
      </div>
      <p style="margin:0 0 8px;color:#555;">You can now access the ERP portal using your email and password.</p>
      <p style="margin:0;color:#555;">If you need any assistance, please contact the administration team.</p>
    `),
  });
}

// ── sendVerifyEmail ────────────────────────────────────────────────────────────
async function sendVerifyEmail({ toEmail, fullName, code }) {
  const transporter = getTransporter();
  const fromEmail = process.env.GMAIL_USER || "rabbi.fajracademy@gmail.com";

  await transporter.sendMail({
    from: `"Fajr Academy" <${fromEmail}>`,
    to: toEmail,
    subject: "Fajr Academy ERP — Email Verification Code",
    html: getEmailWrapper(`
      <h3 style="color:#0A1931;font-size:20px;margin:0 0 16px;">Dear ${fullName},</h3>
      <p style="margin:0 0 12px;">
        Please use the following <strong>4-digit OTP code</strong> to verify your Fajr Academy ERP account:
      </p>
      <div style="text-align:center;margin:28px 0;">
        <div style="font-size:40px;font-weight:700;color:#3b4fcf;background:#eef0fc;
                    padding:20px 44px;display:inline-block;border-radius:12px;
                    letter-spacing:12px;border:2px solid #d0d5f5;">
          ${code}
        </div>
      </div>
      <p style="margin:0 0 12px;color:#555;">
        This code is valid for <strong>15 minutes</strong>. Do not share it with anyone.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${getBaseUrl()}/verify?email=${encodeURIComponent(toEmail)}"
           style="background:#0A1931;color:#fff;padding:14px 36px;text-decoration:none;
                  border-radius:7px;font-weight:700;font-size:14px;display:inline-block;">
          Verify Email Address
        </a>
      </div>
      <p style="font-size:13px;color:#999;margin:0;">
        If you did not request this, you can safely ignore this email.
      </p>
    `),
  });
}

// ── sendCustomEmail ────────────────────────────────────────────────────────────
async function sendCustomEmail({ toEmail, subject, htmlBody }) {
  const transporter = getTransporter();
  const fromEmail = process.env.GMAIL_USER || "rabbi.fajracademy@gmail.com";

  await transporter.sendMail({
    from: `"Fajr Academy" <${fromEmail}>`,
    to: toEmail,
    subject: subject,
    html: getEmailWrapper(htmlBody),
  });
}

// ── sendTaskAssignmentEmail ───────────────────────────────────────────────────
async function sendTaskAssignmentEmail({
  toEmail,
  assigneeName,
  task,
  assignedByName = "Administration",
  assignedByRole = "Management",
}) {
  const transporter = getTransporter();
  const fromEmail = process.env.GMAIL_USER || "rabbi.fajracademy@gmail.com";

  const priorityColors = {
    urgent: { bg: "#ffe4e6", text: "#e11d48", border: "#fecdd3" },
    high: { bg: "#ffedd5", text: "#c2410c", border: "#fed7aa" },
    medium: { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
    low: { bg: "#f1f5f9", text: "#475569", border: "#cbd5e1" },
  };

  const priorityBadge = priorityColors[task.priority] || priorityColors.medium;
  const formattedDueDate = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "No deadline specified";

  const subtasksHtml =
    task.subtasks && task.subtasks.length > 0
      ? `
      <div style="margin: 20px 0 10px; padding: 14px 18px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
        <p style="margin: 0 0 10px; font-weight: 700; color: #1e293b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">
          Checklist Items (${task.subtasks.length}):
        </p>
        <ul style="margin: 0; padding-left: 20px; color: #334155; font-size: 14px; line-height: 1.6;">
          ${task.subtasks
            .slice(0, 5)
            .map(
              (st) =>
                `<li style="margin-bottom: 4px;">${st.title}</li>`
            )
            .join("")}
          ${task.subtasks.length > 5 ? `<li style="color: #64748b; font-style: italic;">+ ${task.subtasks.length - 5} more items</li>` : ""}
        </ul>
      </div>
    `
      : "";

  const htmlBody = `
    <h3 style="color:#0A1931;font-size:22px;margin:0 0 12px;font-weight:800;">
      New Task Assigned to You &#128203;
    </h3>
    <p style="margin:0 0 18px;color:#475569;font-size:15px;">
      Dear <strong>${assigneeName}</strong>, a new task has been delegated to you on Fajr Academy ERP.
    </p>

    <!-- Task Overview Card -->
    <div style="background:#ffffff;border:1px solid #e2e8f0;border-left:5px solid #0A1931;border-radius:10px;padding:22px 24px;margin-bottom:22px;box-shadow:0 3px 12px rgba(10,25,49,0.04);">
      <div style="display:flex;align-items:center;margin-bottom:12px;">
        <span style="display:inline-block;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:700;text-transform:uppercase;background:${priorityBadge.bg};color:${priorityBadge.text};border:1px solid ${priorityBadge.border};letter-spacing:0.5px;">
          ${task.priority.toUpperCase()} PRIORITY
        </span>
        <span style="margin-left:10px;font-size:12px;color:#64748b;text-transform:uppercase;font-weight:600;">
          • ${task.category || "General"}
        </span>
      </div>

      <h2 style="font-size:18px;color:#0f172a;margin:0 0 12px;font-weight:700;line-height:1.4;">
        ${task.title}
      </h2>

      ${
        task.description
          ? `<div style="background:#f8fafc;padding:12px 16px;border-radius:8px;color:#334155;font-size:14px;line-height:1.6;margin-bottom:16px;border:1px solid #e2e8f0;">
              ${task.description.replace(/\n/g, "<br />")}
            </div>`
          : ""
      }

      <table width="100%" cellpadding="6" cellspacing="0" style="font-size:13px;color:#334155;border-collapse:collapse;">
        <tr>
          <td style="color:#64748b;width:35%;font-weight:600;padding:6px 0;">Assigned By:</td>
          <td style="font-weight:700;color:#0f172a;padding:6px 0;">${assignedByName} <span style="font-size:11px;color:#64748b;font-weight:normal;">(${assignedByRole})</span></td>
        </tr>
        <tr>
          <td style="color:#64748b;width:35%;font-weight:600;padding:6px 0;">Due Date:</td>
          <td style="font-weight:700;color:#e11d48;padding:6px 0;">&#128197; ${formattedDueDate}</td>
        </tr>
        <tr>
          <td style="color:#64748b;width:35%;font-weight:600;padding:6px 0;">Current Status:</td>
          <td style="font-weight:700;color:#2563eb;padding:6px 0;text-transform:capitalize;">${task.status.replace("_", " ")}</td>
        </tr>
      </table>

      ${subtasksHtml}
    </div>

    <!-- Call to action button -->
    <div style="text-align:center;margin:28px 0 20px;">
      <a href="${getBaseUrl()}/tasks"
         style="background:linear-gradient(135deg,#0A1931 0%,#1c3f70 100%);color:#ffffff;padding:14px 38px;text-decoration:none;
                border-radius:8px;font-weight:700;font-size:14px;display:inline-block;box-shadow:0 4px 14px rgba(10,25,49,0.25);">
        View Task on Dashboard &rarr;
      </a>
    </div>

    <p style="font-size:13px;color:#64748b;text-align:center;margin:0;">
      Please update your task progress, checklist, and comments directly in the portal.
    </p>
  `;

  await transporter.sendMail({
    from: `"Fajr Academy Tasks" <${fromEmail}>`,
    to: toEmail,
    subject: `[Task Assigned] ${task.title} (${task.priority.toUpperCase()})`,
    html: getEmailWrapper(htmlBody),
  });
}

// ── sendTaskStatusUpdateEmail ─────────────────────────────────────────────────
async function sendTaskStatusUpdateEmail({
  toEmail,
  recipientName,
  task,
  updatedByName,
  newStatus,
  note = "",
}) {
  const transporter = getTransporter();
  const fromEmail = process.env.GMAIL_USER || "rabbi.fajracademy@gmail.com";

  const htmlBody = `
    <h3 style="color:#0A1931;font-size:20px;margin:0 0 12px;font-weight:800;">
      Task Status Updated &#9881;
    </h3>
    <p style="margin:0 0 16px;color:#475569;font-size:14px;">
      Hello <strong>${recipientName}</strong>, the status of the following task has been updated by <strong>${updatedByName}</strong>:
    </p>

    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:18px;margin-bottom:20px;">
      <p style="margin:0 0 8px;font-weight:700;color:#0f172a;font-size:16px;">
        ${task.title}
      </p>
      <p style="margin:0 0 12px;font-size:14px;color:#334155;">
        <strong>New Status:</strong> <span style="display:inline-block;padding:2px 10px;border-radius:6px;background:#e0f2fe;color:#0369a1;font-weight:700;text-transform:capitalize;">${newStatus.replace("_", " ")}</span>
      </p>
      ${note ? `<p style="margin:0;font-size:13px;color:#64748b;font-style:italic;">"${note}"</p>` : ""}
    </div>

    <div style="text-align:center;margin:24px 0 16px;">
      <a href="${getBaseUrl()}/tasks"
         style="background:#0A1931;color:#ffffff;padding:12px 30px;text-decoration:none;
                border-radius:6px;font-weight:700;font-size:13px;display:inline-block;">
        View Task Details
      </a>
    </div>
  `;

  await transporter.sendMail({
    from: `"Fajr Academy Tasks" <${fromEmail}>`,
    to: toEmail,
    subject: `[Task Update] "${task.title}" is now ${newStatus.replace("_", " ")}`,
    html: getEmailWrapper(htmlBody),
  });
}

export {
  sendWelcomeEmail,
  sendVerifyEmail,
  sendCustomEmail,
  sendTaskAssignmentEmail,
  sendTaskStatusUpdateEmail,
};

