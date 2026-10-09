import type { Metadata } from "next";
import LoadoutView from "@/components/views/LoadoutView";
import JsonLd from "@/components/JsonLd";
import { breadcrumbLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Build your loadout: monte o seu look",
  description: "Monte o seu look na GEEK SWIM: escolha camiseta, calça, boné e acessório, veja o total na hora e leve tudo de uma vez.",
  alternates: { canonical: "/loadout" },
  openGraph: { title: "Build your loadout · GEEK SWIM", url: "/loadout", type: "website" },
};

export default function Page() {
  return (
    <>
      <LoadoutView />
      <JsonLd data={breadcrumbLd([["Início", "/"], ["Loadout", "/loadout"]])} />
    </>
  );
}
