"use client";

import { ANALYTICS_CONFIGURED } from "@/lib/consent";
import { consentPanel } from "./Consent";

/** link do rodapé para rever a escolha de cookies (só existe se houver medição configurada) */
export default function ConsentLink() {
  if (!ANALYTICS_CONFIGURED) return null;
  return (
    <button type="button" onClick={() => consentPanel.set(true)} className="link-u text-left">
      Preferências de cookies
    </button>
  );
}
