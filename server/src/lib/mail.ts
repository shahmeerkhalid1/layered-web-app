/**
 * SMTP (env-driven). For local dev e.g. Mailtrap:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE (optional), MAIL_FROM
 */
import nodemailer from "nodemailer";

export function isMailConfigured(): boolean {
  const host = process.env.SMTP_HOST?.trim();
  const portRaw = process.env.SMTP_PORT?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const from = process.env.MAIL_FROM?.trim();
  const port = portRaw ? Number.parseInt(portRaw, 10) : NaN;
  return Boolean(host && user && pass && from && Number.isFinite(port) && port > 0);
}

function getSmtpSecure(): boolean {
  return process.env.SMTP_SECURE?.toLowerCase() === "true";
}

function createTransport() {
  const host = process.env.SMTP_HOST!.trim();
  const port = Number.parseInt(process.env.SMTP_PORT!.trim(), 10);
  const user = process.env.SMTP_USER!.trim();
  const pass = process.env.SMTP_PASS!.trim();
  return nodemailer.createTransport({
    host,
    port,
    secure: getSmtpSecure(),
    auth: { user, pass },
  });
}

function formatRoleLabel(role: string): string {
  if (role === "ADMIN") return "Administrator";
  if (role === "INSTRUCTOR") return "Instructor";
  return role;
}

export type SendInviteEmailInput = {
  to: string;
  inviteLink: string;
  role: string;
};

export type SendInviteEmailResult =
  | { ok: true }
  | { ok: false; message: string };

export type SendPasswordResetEmailInput = {
  to: string;
  resetLink: string;
};

export type SendPasswordResetEmailResult =
  | { ok: true }
  | { ok: false; message: string };

export type SendEmailVerificationInput = {
  to: string;
  verifyLink: string;
};

export type SendEmailVerificationResult =
  | { ok: true }
  | { ok: false; message: string };

export async function sendInviteEmail(input: SendInviteEmailInput): Promise<SendInviteEmailResult> {
  const from = process.env.MAIL_FROM?.trim();
  if (!from || !isMailConfigured()) {
    return { ok: false, message: "SMTP is not configured" };
  }

  const roleLabel = formatRoleLabel(input.role);
  const subject = "You're invited to join Layered Planning";
  const text = [
    `You've been invited to join Layered Planning with the role: ${roleLabel}.`,
    "",
    "Register using this link (valid for 7 days):",
    input.inviteLink,
    "",
    "If you did not expect this email, you can ignore it.",
  ].join("\n");

  const hrefAttr = input.inviteLink.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  const roleHtml = escapeHtml(roleLabel);
  const body = `
    <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;">You're invited!</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;">Join Layered Planning as an ${roleHtml}</p>
    <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">You've been invited to join <strong>Layered Planning</strong> — the platform for managing your Pilates practice, classes, and clients.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td style="background-color:#1b3c9b;border-radius:9999px;padding:14px 32px;">
          <a href="${hrefAttr}" style="color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;display:inline-block;">Complete Registration</a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 4px;font-size:13px;color:#9ca3af;">This invitation expires in 7 days.</p>
    <p style="margin:0;font-size:13px;color:#9ca3af;">If you did not expect this email, you can safely ignore it.</p>
  `;
  const html = emailLayout(body);

  try {
    const transport = createTransport();
    await transport.sendMail({
      from,
      to: input.to,
      subject,
      text,
      html,
    });
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to send email";
    return { ok: false, message };
  }
}

export async function sendEmailVerificationEmail(
  input: SendEmailVerificationInput
): Promise<SendEmailVerificationResult> {
  const from = process.env.MAIL_FROM?.trim();
  if (!from || !isMailConfigured()) {
    return { ok: false, message: "SMTP is not configured" };
  }

  const subject = "Verify your email for Layered Planning";
  const text = [
    "Welcome to Layered Planning.",
    "",
    "Confirm your email address by opening this link:",
    input.verifyLink,
    "",
    "If you did not create an account, you can ignore this email.",
  ].join("\n");

  const hrefAttr = input.verifyLink.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  const body = `
    <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;">Verify your email</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;">One quick step before you can access your workspace</p>
    <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">Thanks for signing up for <strong>Layered Planning</strong>. Click the button below to confirm this email address belongs to you.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td style="background-color:#1b3c9b;border-radius:9999px;padding:14px 32px;">
          <a href="${hrefAttr}" style="color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;display:inline-block;">Verify email</a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 4px;font-size:13px;color:#9ca3af;">This link expires in 1 hour.</p>
    <p style="margin:0;font-size:13px;color:#9ca3af;">If you did not create an account, you can safely ignore this email.</p>
  `;
  const html = emailLayout(body);

  try {
    const transport = createTransport();
    await transport.sendMail({
      from,
      to: input.to,
      subject,
      text,
      html,
    });
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to send email";
    return { ok: false, message };
  }
}

export async function sendPasswordResetEmail(
  input: SendPasswordResetEmailInput
): Promise<SendPasswordResetEmailResult> {
  const from = process.env.MAIL_FROM?.trim();
  if (!from || !isMailConfigured()) {
    return { ok: false, message: "SMTP is not configured" };
  }

  const subject = "Password Reset Request";
  const text = [
    "We received a request to reset your password.",
    "",
    "Use this link to choose a new password (valid for 1 hour):",
    input.resetLink,
    "",
    "If you did not request this, you can ignore this email.",
  ].join("\n");

  const hrefAttr = input.resetLink.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  const body = `
    <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;">Reset your password</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;">We received a request to reset your password</p>
    <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">Click the button below to choose a new password for your Layered Planning account. If you didn't request this, you can safely ignore this email.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td style="background-color:#1b3c9b;border-radius:9999px;padding:14px 32px;">
          <a href="${hrefAttr}" style="color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;display:inline-block;">Choose New Password</a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 4px;font-size:13px;color:#9ca3af;">This link expires in 1 hour.</p>
    <p style="margin:0;font-size:13px;color:#9ca3af;">If you did not request a password reset, no action is needed.</p>
  `;
  const html = emailLayout(body);

  try {
    const transport = createTransport();
    await transport.sendMail({
      from,
      to: input.to,
      subject,
      text,
      html,
    });
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to send email";
    return { ok: false, message };
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function contentToHtmlParagraphs(content: string): string {
  const escaped = escapeHtml(content.trim());
  if (!escaped) return "";
  return escaped
    .split(/\n/)
    .map((line) => `<p style="margin:0 0 8px;color:#374151;line-height:1.6;">${line || "&nbsp;"}</p>`)
    .join("");
}

function emailLayout(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Layered Planning</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid #f0f0f0;">
              <p style="margin:0;font-size:22px;font-weight:700;letter-spacing:-0.02em;color:#111827;">Layered Planning</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 40px 40px;">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;background-color:#f9fafb;border-top:1px solid #f0f0f0;">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5;">This email was sent by Layered Planning. If you have questions, reply to this email or contact your instructor.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export type SendSessionNoteEmailInput = {
  to: string;
  clientFirstName: string;
  instructorName: string;
  classTitle: string;
  sessionDate: string;
  content: string;
  exercises: string[];
};

export type SendSessionNoteEmailResult =
  | { ok: true }
  | { ok: false; message: string };

export async function sendSessionNoteEmail(
  input: SendSessionNoteEmailInput
): Promise<SendSessionNoteEmailResult> {
  const from = process.env.MAIL_FROM?.trim();
  if (!from || !isMailConfigured()) {
    return { ok: false, message: "SMTP is not configured" };
  }

  const subject = `Your session summary — ${input.classTitle} (${input.sessionDate})`;
  const exerciseLines =
    input.exercises.length > 0
      ? ["", "Exercises covered:", ...input.exercises.map((name) => `• ${name}`)]
      : [];

  const text = [
    `Hi ${input.clientFirstName},`,
    "",
    `Here is a summary from your session with ${input.instructorName} on ${input.sessionDate}.`,
    "",
    input.content.trim(),
    ...exerciseLines,
    "",
    "— Layered Planning",
  ].join("\n");

  const instructorHtml = escapeHtml(input.instructorName);
  const titleHtml = escapeHtml(input.classTitle);
  const dateHtml = escapeHtml(input.sessionDate);
  const firstNameHtml = escapeHtml(input.clientFirstName);
  const bodyHtml = contentToHtmlParagraphs(input.content);
  const exercisesHtml =
    input.exercises.length > 0
      ? `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 0;background-color:#f9fafb;border-radius:12px;padding:20px 24px;">
          <tr>
            <td>
              <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#374151;">Exercises covered</p>
              <table role="presentation" cellpadding="0" cellspacing="0">
                ${input.exercises.map((name) => `<tr><td style="padding:4px 0;font-size:14px;color:#4b5563;"><span style="color:#1b3c9b;margin-right:8px;font-size:16px;font-weight:600;">&#8226;</span>${escapeHtml(name)}</td></tr>`).join("")}
              </table>
            </td>
          </tr>
        </table>`
      : "";

  const body = `
    <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;">Session Summary</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;">${titleHtml} &middot; ${dateHtml}</p>
    <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">Hi ${firstNameHtml}, here's a summary from your session with <strong>${instructorHtml}</strong>.</p>
    <div style="border-left:3px solid #1b3c9b;padding-left:16px;margin:0 0 4px;">
      ${bodyHtml}
    </div>
    ${exercisesHtml}
  `;
  const html = emailLayout(body);

  try {
    const transport = createTransport();
    await transport.sendMail({
      from,
      to: input.to,
      subject,
      text,
      html,
    });
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to send email";
    return { ok: false, message };
  }
}
