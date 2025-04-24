import nodemailer from "nodemailer";

const isDev = process.env.NODE_ENV === "development";

export const mailer = nodemailer.createTransport({
  host: isDev ? "localhost" : process.env.SMTP_HOST,
  port: isDev ? 1025 : Number(process.env.SMTP_PORT),
  secure: isDev ? false : true, // false for development
  auth: isDev
    ? undefined // no auth on MailHog
    : { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  tls: { rejectUnauthorized: false },
});
