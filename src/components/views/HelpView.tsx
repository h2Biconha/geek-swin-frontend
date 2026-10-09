import { BRAND } from "@/lib/brand";
import { brl, COMMERCE, FREE_SHIPPING_FROM, getDrop, PIX_DISCOUNT, shipsLabel, SITE } from "@/lib/catalog";

const drop = getDrop("001")!;

export default function HelpView() {
  const blocks: [string, string, React.ReactNode][] = [
    ["envio", "Envio e prazos", <>Postagem em até {COMMERCE.handlingDays} dias úteis depois do pagamento aprovado, com código de rastreio por e-mail. Frete grátis na opção econômica acima de {brl(FREE_SHIPPING_FROM)}. O prazo da transportadora aparece no checkout depois do CEP.</>],
    ["pre-venda", "Pré-venda", <>Antes da abertura do drop, a compra é de pré-venda: você paga na hora, garante a peça numerada e o pedido inteiro sai a partir de {drop.shipsFrom ? shipsLabel(drop.shipsFrom) : "data informada na página"}. Desistiu antes do envio? Reembolso integral, pelo mesmo meio de pagamento.</>],
    ["trocas", "Trocas e devoluções", <>A primeira troca de tamanho é por nossa conta, em até {COMMERCE.exchangeDays} dias depois de receber. Você também tem 7 dias para desistir da compra (Código de Defesa do Consumidor), com reembolso integral. Peça de drop esgotada pode não ter outro tamanho para troca: nesse caso, devolvemos o valor.</>],
    ["pagamento", "Pagamento", <>Pix com {Math.round(PIX_DISCOUNT * 100)}% de desconto ou cartão de crédito em até {COMMERCE.installments}x{COMMERCE.installmentsInterestFree ? " sem juros" : ""}. O pagamento acontece no ambiente seguro do processador: a {BRAND.name} não vê nem guarda os dados do seu cartão.</>],
    ["tamanhos", "Tamanhos", <>Cada peça tem a tabela de medidas na própria página (botão “Guia de tamanhos”). A modelagem é larga: entre dois tamanhos, fique com o menor.</>],
    ["contato", "Contato", <>E-mail: {BRAND.email}{BRAND.whatsapp ? ` · WhatsApp: ${BRAND.whatsapp}` : ""}. CNPJ: {BRAND.cnpj ?? "a definir"}.</>],
  ];
  return (
    <div className="wrap pt-10 pb-section lg:pt-14">
      <h1 className="font-display text-d2">Ajuda</h1>
      {SITE.preview && (
        <p role="note" className="mt-6 max-w-[60ch] border-l-2 border-accent pl-4 text-small text-muted">
          Prazos, frete e condições abaixo estão em validação e podem mudar antes da abertura da loja.
        </p>
      )}
      <div className="mt-12 grid gap-12 lg:grid-cols-[14rem_1fr]">
        <nav aria-label="Tópicos" className="lg:sticky lg:top-[calc(var(--header-h)+2rem)] lg:self-start">
          <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
            {blocks.map(([id, t]) => (
              <li key={id}>
                <a href={`#${id}`} className="eyebrow link-u inline-flex min-h-10 items-center">
                  {t}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-line">
          {blocks.map(([id, t, c]) => (
            <section key={id} id={id} aria-labelledby={`${id}-t`} className="grid gap-4 border-b border-line py-10 md:grid-cols-[16rem_1fr]">
              <h2 id={`${id}-t`} className="font-display text-[1.75rem] leading-none">
                {t}
              </h2>
              <p className="max-w-[60ch] text-muted">{c}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
