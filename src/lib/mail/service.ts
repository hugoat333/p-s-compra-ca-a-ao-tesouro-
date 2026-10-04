/**
 * EmailService: abstração de envio. Implementação SMTP via nodemailer (qualquer provedor:
 * Resend, Brevo, SES, Gmail Workspace, Zoho...). Sem configuração => desativado (nunca simula envio).
 */
import nodemailer from "nodemailer";
import type { EmailConfig } from "../server/config";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface EmailService {
  readonly enabled: boolean;
  send(msg: EmailMessage): Promise<void>;
}

export class DisabledEmailService implements EmailService {
  readonly enabled = false;
  async send(): Promise<void> {
    throw new Error("E-mail não configurado");
  }
}

export class SmtpEmailService implements EmailService {
  readonly enabled = true;
  private transport;
  constructor(private cfg: EmailConfig) {
    this.transport = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: cfg.user ? { user: cfg.user, pass: cfg.password } : undefined,
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 10000,
    });
  }
  async send(msg: EmailMessage): Promise<void> {
    await this.transport.sendMail({ from: this.cfg.from, ...msg });
  }
}

let override: EmailService | undefined;

export function getEmailService(cfg: EmailConfig | undefined): EmailService {
  if (override) return override;
  return cfg ? new SmtpEmailService(cfg) : new DisabledEmailService();
}

export function setEmailServiceForTests(svc: EmailService | undefined) {
  override = svc;
}
