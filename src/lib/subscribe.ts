/**
 * Cadastro na lista do drop.
 *
 * HOJE: só valida e finge sucesso. NENHUM e-mail é salvo.
 * PARA SALVAR DE VERDADE, troque o corpo por uma chamada a uma rota sua:
 *
 *   const res = await fetch("/api/subscribe", {
 *     method: "POST",
 *     headers: { "Content-Type": "application/json" },
 *     body: JSON.stringify({ email, source }),
 *   });
 *   if (!res.ok) throw new Error("Falha ao cadastrar");
 *
 * e crie src/app/api/subscribe/route.ts que repassa o e-mail para o seu
 * serviço de lista (Brevo, Mailchimp, Klaviyo, Resend Audiences...) usando
 * a API key guardada em .env.local (nunca no código do navegador).
 */
export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());

export async function subscribe(email: string, source = "site"): Promise<void> {
  void source; // na versão real, vai junto no fetch para saber de onde veio o cadastro
  if (!isValidEmail(email)) throw new Error("E-mail inválido");
  await new Promise((r) => setTimeout(r, 600)); // simula a ida ao servidor
}
