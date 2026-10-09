"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ANALYTICS_CONFIGURED, consentStore, saveConsent } from "@/lib/consent";
import { createMemoryStore, useHydrated } from "@/lib/store";

const GTM = process.env.NEXT_PUBLIC_GTM_ID;
const PIXEL = process.env.NEXT_PUBLIC_META_PIXEL_ID;

/** abre o painel de preferências (link "Cookies" no rodapé) */
export const consentPanel = createMemoryStore(false);

function loadScript(id: string, src: string) {
  if (document.getElementById(id)) return;
  const s = document.createElement("script");
  s.id = id;
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
}

/** GTM e Pixel são injetados SÓ depois do aceite da categoria correspondente. */
function useThirdParty() {
  const c = consentStore.use();
  useEffect(() => {
    if (!c) return;
    type W = { dataLayer?: unknown[]; fbq?: ((...a: unknown[]) => void) & { queue?: unknown[]; callMethod?: (...a: unknown[]) => void; loaded?: boolean; version?: string; push?: unknown }; _fbq?: unknown };
    const w = window as unknown as W;
    if (c.analytics && GTM) {
      w.dataLayer = w.dataLayer || [];
      if (!document.getElementById("gtm")) w.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
      loadScript("gtm", `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(GTM)}`);
    }
    if (c.marketing && PIXEL && !w.fbq) {
      const q: unknown[] = [];
      const fbq = Object.assign((...a: unknown[]) => (fbq.callMethod ? fbq.callMethod(...a) : q.push(a)), { queue: q, loaded: true, version: "2.0", callMethod: undefined as undefined | ((...a: unknown[]) => void) });
      w.fbq = fbq;
      w._fbq = fbq;
      fbq("init", PIXEL);
      fbq("track", "PageView");
      loadScript("meta-pixel", "https://connect.facebook.net/en_US/fbevents.js");
    }
  }, [c]);
}

/**
 * Aviso de cookies. Só existe quando há ferramenta de medição configurada (GTM ou Pixel):
 * sem elas o site usa apenas armazenamento necessário e não há o que consentir.
 * Não bloqueia a navegação; recusar é tão fácil quanto aceitar.
 */
export default function Consent() {
  const hydrated = useHydrated();
  const choice = consentStore.use();
  const open = consentPanel.use();
  useThirdParty();
  if (!ANALYTICS_CONFIGURED || !hydrated) return null;
  if (choice && !open) return null;
  return <Panel initial={choice} expanded={open} />;
}

function Panel({ initial, expanded }: { initial: ReturnType<typeof consentStore.read>; expanded: boolean }) {
  const [details, setDetails] = useState(expanded);
  const [analytics, setAnalytics] = useState(initial?.analytics ?? false);
  const [marketing, setMarketing] = useState(initial?.marketing ?? false);
  const done = (a: boolean, m: boolean) => {
    saveConsent(a, m);
    consentPanel.set(false);
    // revogar não descarrega script já carregado: recarrega a página para garantir
    if (initial && ((initial.analytics && !a) || (initial.marketing && !m))) location.reload();
  };
  return (
    <section role="region" aria-labelledby="consent-t" className="fixed inset-x-0 bottom-0 z-[70] border-t border-line-strong bg-bg text-fg shadow-[0_-8px_24px_rgb(0_0_0/0.12)] sm:inset-x-auto sm:right-4 sm:bottom-4 sm:max-w-[26rem] sm:border">
      <div className="p-5">
        <h2 id="consent-t" className="eyebrow">
          Cookies
        </h2>
        <p className="mt-3 text-small text-muted">
          Usamos o necessário para a bag e o checkout funcionarem. Com a sua permissão, também medimos visitas e anúncios para melhorar a loja.{" "}
          <Link href="/privacy#cookies" className="link-u text-fg">
            Política de privacidade
          </Link>
          .
        </p>
        {details && (
          <fieldset className="mt-4 grid gap-3 border-t border-line pt-4">
            <legend className="sr-only">Preferências de cookies</legend>
            <label className="flex items-start gap-3 text-small">
              <input type="checkbox" checked disabled className="mt-1 size-4" />
              <span>
                <b className="font-semibold">Necessários</b>
                <span className="block text-muted">Bag, favoritos, login e segurança. Sempre ativos.</span>
              </span>
            </label>
            <label className="flex items-start gap-3 text-small">
              <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} className="mt-1 size-4 accent-[var(--color-accent)]" />
              <span>
                <b className="font-semibold">Medição</b>
                <span className="block text-muted">Google Analytics via Tag Manager: páginas vistas e etapas da compra, sem nome, e-mail ou CPF.</span>
              </span>
            </label>
            <label className="flex items-start gap-3 text-small">
              <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="mt-1 size-4 accent-[var(--color-accent)]" />
              <span>
                <b className="font-semibold">Anúncios</b>
                <span className="block text-muted">Meta Pixel: mede campanhas no Instagram e Facebook.</span>
              </span>
            </label>
          </fieldset>
        )}
        <div className="mt-5 flex flex-wrap gap-2">
          {details ? (
            <button type="button" className="btn btn-primary" onClick={() => done(analytics, marketing)}>
              Salvar escolhas
            </button>
          ) : (
            <>
              <button type="button" className="btn btn-primary" onClick={() => done(true, true)}>
                Aceitar
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => done(false, false)}>
                Só necessários
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setDetails(true)}>
                Escolher
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
