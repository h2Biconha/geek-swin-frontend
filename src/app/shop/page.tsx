import type { Metadata } from "next";
import ShopView from "@/components/views/ShopView";
import JsonLd from "@/components/JsonLd";
import { breadcrumbLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Loja",
  description: "Todas as peças: Drop 001 numerado e a linha Core. Filtre por categoria, tamanho, preço e disponibilidade.",
  alternates: { canonical: "/shop" },
};

export default function Page() {
  return (
    <>
      {/* sem <Suspense>: a view lê a URL só no navegador, e um boundary grande faz o React adiar o conteúdo (salto de layout) */}
      <ShopView />
      <JsonLd data={breadcrumbLd([["Início", "/"], ["Loja", "/shop"]])} />
    </>
  );
}
