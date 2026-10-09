import { track } from "./analytics";
import { STORE_CONNECTED } from "./mode";
import { isValidEmail, isValidWhatsapp, onlyDigits } from "./validate";

/**
 * Cadastro na lista (lista do drop, "avise-me" de tamanho esgotado).
 * Com a loja conectada (STORE_MODE test/live) grava em POST /api/subscribe.
 * Na prévia responde "not_connected" e a interface diz que nada foi salvo.
 */
export type SubscribeInput = { email: string; whatsapp?: string; consent: boolean; source: string; product?: string; size?: string; website?: string };
export type SubscribeResult = { ok: true; isNew: boolean } | { ok: false; reason: "invalid_email" | "invalid_whatsapp" | "no_consent" | "not_connected" | "rate_limited" | "error" };

export { CONSENT_TEXT } from "./consentText";

export const SUBSCRIBE_CONNECTED = STORE_CONNECTED;

export async function subscribe(input: SubscribeInput): Promise<SubscribeResult> {
  if (!isValidEmail(input.email)) return { ok: false, reason: "invalid_email" };
  if (input.whatsapp && !isValidWhatsapp(input.whatsapp)) return { ok: false, reason: "invalid_whatsapp" };
  if (!input.consent) return { ok: false, reason: "no_consent" };
  if (!STORE_CONNECTED) {
    await new Promise((r) => setTimeout(r, 400));
    return { ok: false, reason: "not_connected" };
  }
  try {
    const res = await fetch("/api/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...input, email: input.email.trim(), whatsapp: input.whatsapp ? onlyDigits(input.whatsapp) : undefined }) });
    if (res.status === 429) return { ok: false, reason: "rate_limited" };
    if (res.status === 400) {
      const e = ((await res.json().catch(() => ({}))) as { error?: string }).error;
      return { ok: false, reason: e === "whatsapp_invalido" ? "invalid_whatsapp" : e === "sem_consentimento" ? "no_consent" : "invalid_email" };
    }
    if (!res.ok) return { ok: false, reason: "error" };
    track("sign_up", { method: input.source });
    return { ok: true, isNew: res.status === 201 };
  } catch {
    return { ok: false, reason: "error" };
  }
}

export const SUBSCRIBE_MESSAGES: Record<Exclude<SubscribeResult, { ok: true }>["reason"], string> = {
  invalid_email: "Confira o e-mail. Algo como nome@gmail.com.",
  invalid_whatsapp: "WhatsApp com DDD, só números. Ou deixe em branco.",
  no_consent: "Marque a autorização para a gente poder te avisar.",
  not_connected: "Esta é uma prévia: a lista ainda não está ligada, então nada foi salvo.",
  rate_limited: "Muitas tentativas seguidas. Tente de novo mais tarde.",
  error: "Não deu certo agora. Tente de novo em instantes.",
};
