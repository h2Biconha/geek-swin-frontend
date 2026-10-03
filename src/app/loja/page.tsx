import type { Metadata } from "next";
import ShopClient from "@/components/ShopClient";
import { Breadcrumb, Perks, SectionHead } from "@/components/ui";

export const metadata: Metadata = {
  title: "Loja",
  description: "Todas as peças da GEEK SWIN: moletons, camisetas, calças, acessórios e kits.",
};

export default function LojaPage() {
  return (
    <>
      <section className="px-gutter pb-20 pt-12 md:pt-16">
        <Breadcrumb trail={[["Início", "/"], ["Loja"]]} />
        <SectionHead as="h1" title="Loja" sub="Drop Genesis e linha permanente. Tudo com o mesmo padrão de tecido." />
        <ShopClient />
      </section>
      <Perks />
    </>
  );
}
