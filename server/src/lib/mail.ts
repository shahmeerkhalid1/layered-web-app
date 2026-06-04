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

export async function sendInviteEmail(input: SendInviteEmailInput): Promise<SendInviteEmailResult> {
  const from = process.env.MAIL_FROM?.trim();
  if (!from || !isMailConfigured()) {
    return { ok: false, message: "SMTP is not configured" };
  }

  const roleLabel = formatRoleLabel(input.role);
  const subject = "You're invited to Pilates Platform";
  const text = [
    `You've been invited to join Pilates Platform with the role: ${roleLabel}.`,
    "",
    "Register using this link (valid for 7 days):",
    input.inviteLink,
    "",
    "If you did not expect this email, you can ignore it.",
  ].join("\n");

  const hrefAttr = input.inviteLink.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  const roleHtml = roleLabel.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const html = `
    <p>You've been invited to join <strong>Pilates Platform</strong> with the role: <strong>${roleHtml}</strong>.</p>
    <p><a href="${hrefAttr}">Complete your registration</a></p>
    <p>This link expires in 7 days.</p>
    <p style="color:#666;font-size:12px;">If you did not expect this email, you can ignore it.</p>
  `.trim();

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
    .map((line) => `<p style="margin:0 0 8px;">${line || "&nbsp;"}</p>`)
    .join("");
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
    "— Layered.",
  ].join("\n");

  const instructorHtml = escapeHtml(input.instructorName);
  const titleHtml = escapeHtml(input.classTitle);
  const dateHtml = escapeHtml(input.sessionDate);
  const firstNameHtml = escapeHtml(input.clientFirstName);
  const bodyHtml = contentToHtmlParagraphs(input.content);
  const exercisesHtml =
    input.exercises.length > 0
      ? `<p style="margin:16px 0 8px;font-weight:600;">Exercises covered</p><ul style="margin:0;padding-left:20px;">${input.exercises.map((name) => `<li>${escapeHtml(name)}</li>`).join("")}</ul>`
      : "";

  const html = `
    <p>Hi ${firstNameHtml},</p>
    <p>Here is a summary from your session with <strong>${instructorHtml}</strong> on <strong>${dateHtml}</strong> (${titleHtml}).</p>
    ${bodyHtml}
    ${exercisesHtml}
    <p style="color:#666;font-size:12px;margin-top:24px;">— Layered.</p>
  `.trim();

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
