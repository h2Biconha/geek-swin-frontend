import type { Metadata } from "next";
import Image from "next/image";
import { BigTitle, Breadcrumb } from "@/components/ui";

export const metadata: Metadata = { title: "Sobre", description: "Sobre a GEEK SWIN, perguntas frequentes e contato." };

const VALUES = [
  ["Autenticidade", "Referências de quem joga de verdade. Nada de estampa genérica de controle."],
  ["Tecido primeiro", "520 g/m² no moletom, 280 g/m² na camiseta. Peça que aguenta a sessão longa e 50 lavagens."],
  ["Drop culture", "Tiragens numeradas e sem reposição. Quando acaba, vira arquivo."],
];
const FAQ = [
  ["Quando meu pedido chega?", "Postamos em até 2 dias úteis. Capitais do Sudeste recebem em 2 a 4 dias úteis; o restante do Brasil, em 4 a 9."],
  ["Como funciona a troca?", "Você tem 30 dias. A primeira troca é por nossa conta, desde que a etiqueta e o lacre de numeração estejam intactos."],
  ["Qual tamanho eu escolho?", "Nossa modelagem é oversized. Se gosta de caimento justo, peça um número abaixo. Cada página de produto tem a tabela com as medidas da peça."],
  ["O que é a numeração da peça?", "Cada peça de drop sai com número (ex.: 037/150) e um QR na etiqueta que confirma a autenticidade."],
  ["Vai ter reposição do Genesis?", "Não. Peças de drop não voltam. A linha permanente, como a GG/WP Core Tee, é reposta sempre."],
];
// Contatos fictícios do protótipo. Troque pelos reais antes de publicar.
const CONTACT = [
  ["WhatsApp", "(11) 90000-0000", "Seg a sex, 9h às 18h"],
  ["E-mail", "contato@geekswin.com.br", "Resposta em até 1 dia útil"],
  ["Instagram e TikTok", "@geekswin", ""],
  ["Discord", "Clube GEEK SWIN", "Acesso para quem já comprou"],
];

export default function SobrePage() {
  return (
    <>
      <section className="px-gutter pb-16 pt-12 md:pt-16">
        <Breadcrumb trail={[["Início", "/"], ["Sobre"]]} />
        <BigTitle lines={["Vestir o", "jogo"]} />
        <div className="mt-12 grid gap-10 md:grid-cols-12">
          <p className="font-display text-[clamp(1.4rem,2.6vw,2.2rem)] font-semibold leading-[1.15] md:col-span-7">
            A GEEK SWIN nasceu de uma pergunta simples: por que a roupa de quem vive games ainda parece fantasia? A gente faz streetwear de corte premium com a língua da comunidade, sem caricatura.
          </p>
          <div className="studio relative aspect-[4/5] overflow-hidden rounded-[28px] md:col-span-4 md:col-start-9">
            <Image src="/products/model-cap.svg" alt="" fill unoptimized className="object-cover" />
          </div>
        </div>
      </section>

      <section className="border-y border-line/15">
        <ul className="grid gap-10 px-gutter py-14 md:grid-cols-3">
          {VALUES.map(([t, d]) => (
            <li key={t}>
              <p className="font-mono text-hud uppercase text-acid-ink">{t}</p>
              <p className="mt-3 text-muted">{d}</p>
            </li>
          ))}
        </ul>
      </section>

      <section id="faq" className="scroll-mt-28 px-gutter py-20 md:py-28">
        <div className="grid gap-10 md:grid-cols-12">
          <h2 className="font-display text-section font-extrabold uppercase md:col-span-4">Perguntas frequentes</h2>
          <div className="md:col-span-7 md:col-start-6">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group border-t border-line/15 last:border-b">
                <summary className="flex cursor-pointer list-none items-center justify-between py-4 font-mono text-label font-bold uppercase tracking-[0.14em] [&::-webkit-details-marker]:hidden">
                  {q}
                  <span aria-hidden className="text-lg transition-transform duration-500 ease-lux group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="pb-5 leading-relaxed text-muted">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section id="contato" className="scroll-mt-28 px-gutter pb-20 md:pb-28">
        <div className="grid gap-8 rounded-[28px] bg-invert p-8 text-on-invert md:grid-cols-3 md:p-14">
          <h2 className="font-display text-[clamp(2rem,4vw,3.4rem)] font-extrabold uppercase leading-[0.92] tracking-[-0.03em]">Fale com a gente</h2>
          <dl className="grid gap-6 sm:grid-cols-2 md:col-span-2">
            {CONTACT.map(([k, v, note]) => (
              <div key={k}>
                <dt className="font-mono text-hud uppercase text-acid">{k}</dt>
                <dd className="mt-2 select-all font-display text-xl font-bold">{v}</dd>
                {note && <dd className="text-sm opacity-70">{note}</dd>}
              </div>
            ))}
          </dl>
        </div>
      </section>
    </>
  );
}
