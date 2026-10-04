import type { EmailMessage } from "./service";

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function layout(inner: string, button: { href: string; label: string }, after = ""): string {
  return `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f4efe3;font-family:Arial,Helvetica,sans-serif;color:#1f2a44">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4efe3;padding:24px 12px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;border:1px solid #ead9b5">
<tr><td style="background:#1e3a7a;border-radius:16px 16px 0 0;padding:18px 24px;color:#ffd27a;font-weight:bold;font-size:16px">🗺️ O Tesouro do Dia das Crianças</td></tr>
<tr><td style="padding:28px 24px 8px;font-size:16px;line-height:1.55">${inner}</td></tr>
<tr><td align="center" style="padding:12px 24px 28px">
<a href="${esc(button.href)}" style="display:inline-block;background:#f08c1a;color:#ffffff;text-decoration:none;font-weight:bold;font-size:16px;padding:14px 28px;border-radius:999px">${esc(button.label)}</a>
</td></tr>${after ? `\n<tr><td style="padding:0 24px 20px;font-size:15px;line-height:1.55">${after}</td></tr>` : ""}
<tr><td style="padding:0 24px 24px;font-size:12px;color:#6b7280;line-height:1.5">Se o botão não funcionar, copie e cole este link no navegador:<br><span style="word-break:break-all">${esc(button.href)}</span><br><br>Este link é pessoal. Não compartilhe.</td></tr>
</table></td></tr></table></body></html>`;
}

/** E-mail de entrega (após gerar a aventura). */
export function adventureReadyEmail(p: { to: string; childName: string; themeLabel: string; link: string }): EmailMessage {
  const name = esc(p.childName);
  const html = layout(
    `<p style="margin:0 0 12px">Olá!</p>
<p style="margin:0 0 12px">A aventura de <strong>${name}</strong> já está pronta.</p>
<p style="margin:0 0 12px">Tema escolhido:<br><strong>${esc(p.themeLabel)}</strong></p>
<p style="margin:0 0 12px">Clique abaixo para acessar o arquivo:</p>`,
    { href: p.link, label: "ACESSAR MINHA AVENTURA" },
    "Prepare o presente, imprima as pistas e deixe a aventura começar!",
  );
  const text = `Olá!

A aventura de ${p.childName} já está pronta.

Tema escolhido:
${p.themeLabel}

Clique abaixo para acessar o arquivo:
${p.link}

Prepare o presente, imprima as pistas e deixe a aventura começar!`;
  return { to: p.to, subject: `A aventura de ${p.childName} está pronta! 🎉`, html, text };
}

/** E-mail enviado logo após o pagamento aprovado (rede de segurança caso o cliente feche a aba). */
export function purchaseConfirmedEmail(p: { to: string; link: string }): EmailMessage {
  const html = layout(
    `<p style="margin:0 0 12px">Olá!</p>
<p style="margin:0 0 12px">Sua compra de <strong>O Tesouro do Dia das Crianças</strong> foi confirmada. 🎉</p>
<p style="margin:0 0 12px">Agora falta só um passo: escolher o tema da missão e informar o nome da criança. Nós preparamos o restante.</p>`,
    { href: p.link, label: "PREPARAR MINHA AVENTURA" },
  );
  const text = `Olá!

Sua compra de O Tesouro do Dia das Crianças foi confirmada.

Agora falta só um passo: escolher o tema da missão e informar o nome da criança.
${p.link}`;
  return { to: p.to, subject: "Compra confirmada! Prepare a aventura 🎉", html, text };
}
