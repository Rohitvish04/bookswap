import nodemailer from 'nodemailer';

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (!process.env.SMTP_HOST) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
    });
  }
  return transporter;
}

/** Sends via SMTP when configured; otherwise logs to the server console so dev/testing never blocks on email. */
export async function sendEmail(to: string, subject: string, html: string) {
  const t = getTransporter();
  const from = process.env.EMAIL_FROM || 'BookSwap <no-reply@bookswap.local>';

  if (!t) {
    console.log(`\n--- EMAIL (dev mode, no SMTP configured) ---\nTo: ${to}\nSubject: ${subject}\n${html}\n---\n`);
    return;
  }

  await t.sendMail({ from, to, subject, html });
}

export function verificationEmailHtml(link: string) {
  return `<p>Welcome to BookSwap! Please verify your email address:</p><p><a href="${link}">${link}</a></p><p>This link expires in 24 hours.</p>`;
}

export function resetEmailHtml(link: string) {
  return `<p>Reset your BookSwap password using the link below:</p><p><a href="${link}">${link}</a></p><p>This link expires in 1 hour. If you did not request this, you can ignore this email.</p>`;
}
