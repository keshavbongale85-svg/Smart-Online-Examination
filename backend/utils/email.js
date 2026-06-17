import nodemailer from "nodemailer";

// Lazily create a transporter from SMTP env vars.
const createTransport = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

// Send an email. Throws on failure so callers can decide how to handle it.
export const sendEmail = async ({ to, subject, html, text }) => {
  if (!process.env.SMTP_USER) {
    console.warn("⚠️  SMTP not configured — skipping email to", to);
    return { skipped: true };
  }
  const transporter = createTransport();
  const info = await transporter.sendMail({
    from: process.env.FROM_EMAIL || process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
  });
  return info;
};
