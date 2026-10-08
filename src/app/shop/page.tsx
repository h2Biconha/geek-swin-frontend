import type { Metadata } from "next";
import { Suspense } from "react";
import ShopView from "@/components/views/ShopView";
import JsonLd from "@/components/JsonLd";
import { breadcrumbLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Shop",
  description: "Todas as peças: Drop 001 numerado e a linha Core. Filtre por categoria, tamanho, preço e disponibilidade.",
  alternates: { canonical: "/shop" },
};

export default function Page() {
  return (
    <>
      <Suspense>
        <ShopView />
      </Suspense>
      <JsonLd data={breadcrumbLd([["Início", "/"], ["Shop", "/shop"]])} />
    </>
  );
}
