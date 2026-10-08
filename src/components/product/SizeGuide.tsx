"use client";

import { SIZE_TABLES } from "@/lib/catalog";
import Modal from "../ui/Modal";

export default function SizeGuide({ table, open, onClose, productName }: { table: string; open: boolean; onClose: () => void; productName: string }) {
  const t = SIZE_TABLES[table];
  return (
    <Modal open={open} onClose={onClose} title="Guia de tamanhos" variant="sheet">
      <p className="font-display text-d4">{productName}</p>
      <p className="mt-3 text-small text-muted">{t.label}</p>
      <div className="mt-6 overflow-x-auto">
        <table className="num w-full min-w-[22rem] text-left text-[0.9375rem]">
          <caption className="sr-only">Tabela de medidas de {productName}</caption>
          <thead>
            <tr className="border-b border-line-strong">
              {t.columns.map((c) => (
                <th key={c} scope="col" className="eyebrow py-3 pr-4 font-normal text-muted">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {t.rows.map((r) => (
              <tr key={String(r[0])} className="border-b border-line">
                {r.map((c, i) =>
                  i === 0 ? (
                    <th key={i} scope="row" className="py-3 pr-4 font-semibold">
                      {c}
                    </th>
                  ) : (
                    <td key={i} className="py-3 pr-4">
                      {c}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-8 grid gap-4 border-t border-line pt-6 text-small text-muted sm:grid-cols-2">
        <p>
          <strong className="eyebrow mb-1 block text-fg">Como medir</strong>
          Estique sua peça favorita na mesa e meça de axila a axila (largura) e do ombro até a barra (comprimento). Compare com a tabela.
        </p>
        <p>
          <strong className="eyebrow mb-1 block text-fg">Na dúvida</strong>
          A modelagem já é larga. Entre dois tamanhos, fique com o menor. A primeira troca é por nossa conta.
        </p>
      </div>
    </Modal>
  );
}
