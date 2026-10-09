import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { brl, COMMERCE, FREE_SHIPPING_FROM } from "@/lib/catalog";

/**
 * Política de privacidade e termos de uso.
 * RASCUNHO: escrito a partir do que o código faz de verdade (dados coletados, provedores, cookies).
 * Precisa de revisão jurídica e dos dados da empresa (razão social, CNPJ, endereço, encarregado) antes de vender.
 */
type Doc = "privacy" | "terms";
type Block = { id: string; title: string; body: React.ReactNode };

const UPDATED = "09/10/2026";
const company = BRAND.cnpj ? `${BRAND.name}, CNPJ ${BRAND.cnpj}` : `${BRAND.name} (razão social e CNPJ a definir)`;

const privacy: Block[] = [
  {
    id: "quem",
    title: "Quem cuida dos seus dados",
    body: (
      <p>
        O controlador dos dados é {company}. Para qualquer pedido sobre seus dados, escreva para {BRAND.email}. O encarregado pelo tratamento de dados (LGPD, art. 41) será indicado aqui.
      </p>
    ),
  },
  {
    id: "dados",
    title: "O que coletamos e para quê",
    body: (
      <ul>
        <li>
          <b>Lista de avisos</b>: e-mail, WhatsApp (opcional), de onde você se cadastrou, data e o texto que você aceitou. Para avisar sobre drops. Base: consentimento.
        </li>
        <li>
          <b>Pedidos</b>: nome, e-mail, CPF, telefone, endereço de entrega, itens e valores. Para vender, entregar, emitir nota fiscal e atender trocas. Base: execução de contrato e obrigação legal.
        </li>
        <li>
          <b>Conta</b>: e-mail e uma sessão de login (cookie). Para mostrar seus pedidos. Base: execução de contrato.
        </li>
        <li>
          <b>Segurança</b>: endereço IP de forma resumida (hash), para limitar tentativas abusivas. Base: legítimo interesse.
        </li>
        <li>
          <b>Medição e anúncios</b>, só se você aceitar: páginas vistas e etapas da compra (Google Analytics via Tag Manager) e eventos de campanha (Meta Pixel). Sem nome, e-mail, CPF ou endereço. Base: consentimento.
        </li>
      </ul>
    ),
  },
  {
    id: "cartao",
    title: "Pagamento",
    body: <p>O pagamento é processado pelo Mercado Pago. Os dados do cartão são digitados no ambiente do Mercado Pago e não passam nem ficam guardados nos nossos servidores. Recebemos apenas o status do pagamento e um identificador.</p>,
  },
  {
    id: "compartilhamento",
    title: "Com quem compartilhamos",
    body: (
      <ul>
        <li>Mercado Pago, para processar o pagamento.</li>
        <li>Transportadora ou plataforma de frete, com nome, endereço e telefone, para entregar.</li>
        <li>Parceiro de produção, com os itens do pedido, quando a peça é produzida sob demanda.</li>
        <li>Provedores de hospedagem, banco de dados e envio de e-mail, que operam o site em nosso nome.</li>
        <li>Google e Meta, apenas com o seu consentimento de cookies.</li>
        <li>Autoridades, quando a lei exigir.</li>
      </ul>
    ),
  },
  {
    id: "cookies",
    title: "Cookies e armazenamento no navegador",
    body: (
      <>
        <p>Necessários (sempre ativos): bag, favoritos, tamanhos salvos, dados do checkout em andamento (só nesta aba), sessão de login e escolha de cookies. Ficam no seu navegador e não servem para anúncio.</p>
        <p>Opcionais: Google Tag Manager/Analytics e Meta Pixel. Só carregam depois que você aceita no aviso de cookies, e você pode mudar a escolha em “Preferências de cookies”, no rodapé.</p>
      </>
    ),
  },
  {
    id: "prazo",
    title: "Por quanto tempo guardamos",
    body: <p>Lista de avisos: até você sair (link em todo e-mail). Pedidos e dados fiscais: pelo prazo exigido pela legislação fiscal e de consumo. Sessões de login: até 30 dias. Registros de segurança: poucos dias.</p>,
  },
  {
    id: "direitos",
    title: "Seus direitos",
    body: <p>Você pode pedir confirmação, acesso, correção, anonimização, portabilidade ou exclusão dos seus dados, e revogar consentimentos (LGPD, art. 18), pelo e-mail {BRAND.email}. Alguns dados de pedidos precisam ser mantidos por obrigação legal mesmo depois do pedido de exclusão.</p>,
  },
  {
    id: "seguranca",
    title: "Segurança",
    body: <p>Conexão criptografada (HTTPS), senhas e links de login guardados apenas como hash, acesso administrativo protegido e nenhum dado de cartão armazenado. Nenhum sistema é 100% seguro: se houver incidente que traga risco a você, avisamos e comunicamos a ANPD como a lei manda.</p>,
  },
];

const terms: Block[] = [
  {
    id: "loja",
    title: "A loja",
    body: (
      <p>
        Este site é operado por {company}. Contato: {BRAND.email}. Ao comprar, você concorda com estes termos e com a <Link href="/privacy">política de privacidade</Link>.
      </p>
    ),
  },
  {
    id: "precos",
    title: "Preços e pagamento",
    body: (
      <p>
        Preços em reais, com impostos inclusos. O valor final (itens, cupom, desconto de {Math.round(COMMERCE.pixDiscount * 100)}% no Pix e frete) é calculado pelo servidor e mostrado antes de você pagar. Pagamento por Pix ou cartão de crédito em até {COMMERCE.installments}x{COMMERCE.installmentsInterestFree ? " sem juros" : ""}, pelo Mercado Pago. O pedido só é confirmado quando o Mercado Pago aprova o pagamento.
      </p>
    ),
  },
  {
    id: "reserva",
    title: "Reserva e drops numerados",
    body: (
      <p>
        Peças de drop têm tiragem limitada e numerada, sem reposição. Ao criar o pedido, a peça fica reservada por {COMMERCE.reservationMinutes} minutos à espera do pagamento; depois disso a reserva cai e a peça volta para a vitrine. O número da sua peça é definido na confirmação do pagamento. Limite de {COMMERCE.maxQtyPerLine} unidades por item.
      </p>
    ),
  },
  {
    id: "prevenda",
    title: "Pré-venda",
    body: <p>Na pré-venda você paga na hora e o pedido é enviado a partir da data informada na página do drop. Se desistir antes do envio, o reembolso é integral, pelo mesmo meio de pagamento.</p>,
  },
  {
    id: "entrega",
    title: "Entrega",
    body: (
      <p>
        Postagem em até {COMMERCE.handlingDays} dias úteis depois do pagamento aprovado (ou da data da pré-venda). O prazo da transportadora aparece no checkout. Frete econômico grátis acima de {brl(FREE_SHIPPING_FROM)}.
      </p>
    ),
  },
  {
    id: "trocas",
    title: "Trocas, devoluções e arrependimento",
    body: (
      <p>
        Você tem 7 dias depois de receber para desistir da compra, com reembolso integral (Código de Defesa do Consumidor, art. 49). A primeira troca de tamanho, em até {COMMERCE.exchangeDays} dias, é por nossa conta. Produto com defeito segue o prazo legal de 90 dias. Peça de drop esgotada pode não ter outro tamanho para troca; nesse caso, devolvemos o valor. Detalhes em <Link href="/help#trocas">Ajuda</Link>.
      </p>
    ),
  },
  {
    id: "erros",
    title: "Erros e cancelamentos",
    body: <p>Se um pedido for pago sem estoque disponível (por exemplo, pagamento aprovado depois de a reserva expirar e a peça esgotar), avisamos e devolvemos o valor integral. Pedidos com indício de fraude podem ser cancelados com reembolso.</p>,
  },
  {
    id: "conteudo",
    title: "Marca e conteúdo",
    body: <p>Nome, logo, desenhos e textos da {BRAND.name} são protegidos. Não use sem autorização.</p>,
  },
  {
    id: "foro",
    title: "Lei aplicável",
    body: <p>Valem as leis brasileiras. Eventuais disputas podem ser levadas ao foro do seu domicílio, como garante o Código de Defesa do Consumidor.</p>,
  },
];

const DOCS: Record<Doc, { title: string; intro: string; blocks: Block[] }> = {
  privacy: { title: "Privacidade", intro: "Como a loja trata os seus dados pessoais, em linguagem direta.", blocks: privacy },
  terms: { title: "Termos de uso", intro: "As regras de compra na loja.", blocks: terms },
};

export default function LegalView({ doc }: { doc: Doc }) {
  const d = DOCS[doc];
  return (
    <div className="wrap pt-10 pb-section lg:pt-14">
      <p className="eyebrow text-muted">Atualizado em {UPDATED}</p>
      <h1 className="font-display mt-4 text-d2">{d.title}</h1>
      <p className="mt-6 max-w-[60ch] text-[1.125rem] text-muted">{d.intro}</p>
      <p role="note" className="mt-6 max-w-[60ch] border-l-2 border-accent pl-4 text-small text-muted">
        Versão preliminar, em revisão jurídica. Dados da empresa e condições comerciais ainda serão confirmados.
      </p>
      <div className="mt-12 border-t border-line">
        {d.blocks.map((b) => (
          <section key={b.id} id={b.id} aria-labelledby={`${b.id}-t`} className="grid scroll-mt-[calc(var(--header-h)+1rem)] gap-4 border-b border-line py-10 md:grid-cols-[16rem_1fr]">
            <h2 id={`${b.id}-t`} className="font-display text-[1.5rem] leading-none">
              {b.title}
            </h2>
            <div className="prose-legal max-w-[64ch] text-muted">{b.body}</div>
          </section>
        ))}
      </div>
    </div>
  );
}
