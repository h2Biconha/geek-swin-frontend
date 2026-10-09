import type { Metadata } from "next";
import DropsView from "@/components/views/DropsView";
import JsonLd from "@/components/JsonLd";
import { breadcrumbLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Drops · arquivo da marca",
  description: "Todos os drops: número, nome, tiragem e status. Peças esgotadas ficam no arquivo.",
  alternates: { canonical: "/drops" },
};

export default function Page() {
  return (
    <>
      <DropsView />
      <JsonLd data={breadcrumbLd([["Início", "/"], ["Drops", "/drops"]])} />
    </>
  );
}
