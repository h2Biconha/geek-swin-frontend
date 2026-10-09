"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { STORE_CONNECTED } from "@/lib/mode";

/**
 * Descadastro em um clique a partir do link dos e-mails (?e=email&t=token assinado).
 * Pede um clique de confirmação: antivírus de e-mail abrem links sozinhos e não podem tirar ninguém da lista.
 */
export default function UnsubscribeView() {
  const q = useSearchParams();
  const email = q.get("e") ?? "";
  const token = q.get("t") ?? "";
  const [state, setState] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [msg, setMsg] = useState("");
  const valid = email && token;

  const go = async () => {
    setState("sending");
    try {
      const r = await fetch("/api/unsubscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, token }) });
      if (r.ok) return setState("ok");
      setMsg(r.status === 400 ? "Link inválido ou incompleto. Use o link do e-mail mais recente ou escreva para a gente." : "Não deu certo agora. Tente de novo em instantes.");
    } catch {
      setMsg("Sem conexão. Tente de novo.");
    }
    setState("error");
  };

  return (
    <div className="wrap max-w-[40rem] pt-16 pb-section">
      <h1 className="font-display text-d2">Sair da lista</h1>
      {state === "ok" ? (
        <div role="status" className="mt-8">
          <p className="text-[1.125rem]">Pronto. {email} não recebe mais avisos de drops.</p>
          <p className="mt-3 text-muted">Pedidos em andamento continuam recebendo e-mails sobre pagamento e envio.</p>
          <Link href="/" className="btn btn-secondary mt-8">
            Voltar ao início
          </Link>
        </div>
      ) : !valid || !STORE_CONNECTED ? (
        <p className="mt-8 text-muted">{STORE_CONNECTED ? "Este link está incompleto. Use o link “sair da lista” do e-mail que você recebeu." : "Na prévia não há lista ligada, então não há nada para descadastrar."}</p>
      ) : (
        <div className="mt-8">
          <p className="text-[1.125rem]">
            Confirma que <b className="font-semibold">{email}</b> deve sair de todas as listas de aviso?
          </p>
          <button type="button" className="btn btn-primary btn-lg mt-8" onClick={go} disabled={state === "sending"}>
            {state === "sending" ? "Saindo…" : "Sim, sair da lista"}
          </button>
          {state === "error" && (
            <p role="alert" className="mt-4 text-small text-danger">
              {msg}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
