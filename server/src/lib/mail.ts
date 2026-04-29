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
