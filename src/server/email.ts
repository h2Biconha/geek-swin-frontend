import "server-only";
import { BRAND } from "@/lib/brand";
import { brl } from "@/lib/catalog";
import { env } from "./env";

/**
 * E-mail transacional. "resend" envia de verdade (RESEND_API_KEY); "console" só registra
 * no log do servidor que um e-mail SERIA enviado, sem o conteúdo pessoal (para testes).
 */
type Mail = { to: string; subject: string; text: string; html: string; tag: string };

/** em modo teste o último link de login fica disponível para os testes automatizados (nunca em produção) */
export const testOutbox: Mail[] = [];

export async function sendMail(m: Mail) {
  if (env.email === "resend" && env.resendKey) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: env.emailFrom, to: [m.to], subject: m.subject, text: m.text, html: m.html, tags: [{ name: "type", value: m.tag }] }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) console.error(`[email] falha ao enviar ${m.tag}: ${res.status}`);
    return res.ok;
  }
  if (env.mode === "test") {
    testOutbox.push(m);
    if (testOutbox.length > 50) testOutbox.shift();
  }
  console.info(`[email:console] ${m.tag} → ${m.to.replace(/^(.).*@/, "$1***@")}`);
  return true;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const layout = (title: string, body: string) =>
  `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#eeece6;font-family:Arial,sans-serif;color:#0b0b0c"><div style="max-width:560px;margin:0 auto;padding:32px 24px"><p style="font:700 18px Arial;letter-spacing:.02em">${esc(BRAND.name)}_</p><h1 style="font:800 26px Arial;margin:24px 0 16px">${esc(title)}</h1>${body}<p style="margin-top:40px;font-size:12px;color:#5e5e64">${esc(BRAND.name)} · ${esc(BRAND.email)}</p></div></body></html>`;
const button = (href: string, label: string) => `<p style="margin:28px 0"><a href="${esc(href)}" style="background:#2e2eff;color:#fff;padding:14px 22px;text-decoration:none;font:700 13px Arial;letter-spacing:.08em;text-transform:uppercase">${esc(label)}</a></p>`;

export function loginMail(to: string, link: string): Mail {
  return {
    to,
    tag: "login",
    subject: `Seu link de acesso · ${BRAND.name}`,
    text: `Use este link para entrar (vale 15 minutos e funciona uma vez):\n${link}\n\nSe não foi você, ignore este e-mail.`,
    html: layout("Seu link de acesso", `<p>Vale 15 minutos e funciona uma vez.</p>${button(link, "Entrar")}<p style="font-size:13px;color:#5e5e64">Se não foi você, ignore este e-mail. Ninguém entra sem o link.</p>`),
  };
}

export function orderPaidMail(o: { to: string; id: string; link: string; totalCents: number; items: { name: string; size: string; qty: number; editionFrom: number | null; editionTo: number | null }[]; presale: boolean; shipsFrom: string | null }): Mail {
  const lines = o.items.map((i) => `${i.qty}× ${i.name} · ${i.size}${i.editionFrom ? ` · peça nº ${i.editionFrom === i.editionTo ? i.editionFrom : `${i.editionFrom} a ${i.editionTo}`}` : ""}`);
  const when = o.presale && o.shipsFrom ? `Pedido de pré-venda: o envio começa a partir de ${o.shipsFrom.split("-").reverse().slice(0, 2).join("/")}.` : "Você recebe o código de rastreio quando o pedido for postado.";
  return {
    to: o.to,
    tag: "order_paid",
    subject: `Pedido ${o.id} confirmado · ${BRAND.name}`,
    text: `Pagamento confirmado.\n\n${lines.join("\n")}\nTotal: ${brl(o.totalCents / 100)}\n\n${when}\n\nAcompanhe: ${o.link}`,
    html: layout(`Pedido ${o.id} confirmado`, `<p>Pagamento confirmado.</p><ul style="padding-left:18px">${lines.map((l) => `<li>${esc(l)}</li>`).join("")}</ul><p><strong>Total: ${brl(o.totalCents / 100)}</strong></p><p>${esc(when)}</p>${button(o.link, "Ver pedido")}`),
  };
}

export function adminAlertMail(subject: string, text: string): Mail | null {
  if (!env.adminEmail) return null;
  return { to: env.adminEmail, tag: "admin", subject: `[${BRAND.name}] ${subject}`, text, html: layout(subject, `<p>${esc(text)}</p>`) };
}
