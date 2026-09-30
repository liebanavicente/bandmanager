import nodemailer, { type Transporter } from "nodemailer";

type Mail = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
};

let transporter: Transporter | null = null;

/** SMTP configurado (p. ej. Gmail con contraseña de aplicación). */
export function isMailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransporter(): Transporter {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT ?? 465);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

/**
 * Envía un email. Sin SMTP configurado no falla: lo escribe en el log para
 * poder probar el flujo en local.
 */
export async function sendMail(mail: Mail): Promise<void> {
  if (!isMailConfigured()) {
    console.info(`[EMAIL SIN SMTP] Para: ${mail.to} · ${mail.subject}\n${mail.text}`);
    return;
  }
  const from = process.env.MAIL_FROM ?? `BandManager <${process.env.SMTP_USER}>`;
  await getTransporter().sendMail({ from, ...mail });
}

/** URL pública de la app, para los enlaces de los emails. */
export function appUrl(path: string): string {
  const base = (process.env.AUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${base}${path}`;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
