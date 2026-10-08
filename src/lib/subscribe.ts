import { track } from "./analytics";

/**
 * Cadastro na lista (lobby, aviso de drop, "avisar-me", members).
 *
 * HOJE: NÃO ESTÁ CONECTADO. A função valida e responde "not_connected" depois de um instante,
 * e a interface mostra isso com honestidade. Nenhum e-mail ou WhatsApp é salvo.
 *
 * PARA LIGAR: defina NEXT_PUBLIC_SUBSCRIBE_URL (ex.: /api/subscribe) e implemente a rota
 * conforme o contrato em BACKEND.md > Lista de e-mails.
 */
export type SubscribeInput = { email: string; whatsapp?: string; consent: boolean; source: string; product?: string; size?: string };
export type SubscribeResult = { ok: true } | { ok: false; reason: "invalid_email" | "invalid_whatsapp" | "no_consent" | "not_connected" | "error" };

export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
export const onlyDigits = (v: string) => v.replace(/\D/g, "");
export const isValidWhatsapp = (v: string) => !v || /^(55)?\d{10,11}$/.test(onlyDigits(v));
export const maskPhone = (v: string) => {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
};

const ENDPOINT = process.env.NEXT_PUBLIC_SUBSCRIBE_URL;
export const SUBSCRIBE_CONNECTED = Boolean(ENDPOINT);

export async function subscribe(input: SubscribeInput): Promise<SubscribeResult> {
  if (!isValidEmail(input.email)) return { ok: false, reason: "invalid_email" };
  if (input.whatsapp && !isValidWhatsapp(input.whatsapp)) return { ok: false, reason: "invalid_whatsapp" };
  if (!input.consent) return { ok: false, reason: "no_consent" };
  if (!ENDPOINT) {
    await new Promise((r) => setTimeout(r, 500));
    return { ok: false, reason: "not_connected" };
  }
  try {
    const res = await fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...input, whatsapp: input.whatsapp ? onlyDigits(input.whatsapp) : undefined }) });
    if (!res.ok && res.status !== 200) return { ok: false, reason: "error" };
    track("sign_up", { source: input.source });
    return { ok: true };
  } catch {
    return { ok: false, reason: "error" };
  }
}

export const SUBSCRIBE_MESSAGES: Record<Exclude<SubscribeResult, { ok: true }>["reason"], string> = {
  invalid_email: "Confere o e-mail. Algo como nome@gmail.com.",
  invalid_whatsapp: "WhatsApp com DDD, só números. Ou deixe em branco.",
  no_consent: "Marque a autorização para a gente poder te avisar.",
  not_connected: "Prévia: a lista ainda não está conectada, então nada foi salvo. Isso liga junto com o back-end.",
  error: "Não deu certo agora. Tenta de novo em instantes.",
};
