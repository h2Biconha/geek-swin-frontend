import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CategoryView from "@/components/views/CategoryView";
import JsonLd from "@/components/JsonLd";
import { getListing, listingLive, listingProducts, listingSlugs } from "@/lib/merch/listings";
import { breadcrumbLd, listingLd } from "@/lib/seo";

export const generateStaticParams = () => listingSlugs().map((slug) => ({ slug }));
export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps<"/shop/[slug]">): Promise<Metadata> {
  const l = getListing((await params).slug);
  if (!l) return {};
  const url = `/shop/${l.slug}`;
  const image = listingProducts(l)[0]?.media[0]?.src ?? l.art ?? undefined;
  return {
    title: l.seoTitle,
    description: l.description,
    alternates: { canonical: url },
    // categoria sem peça publicada não vai para o índice (página fina); volta sozinha quando a primeira peça entrar
    robots: listingLive(l) ? undefined : { index: false, follow: true },
    openGraph: { title: l.seoTitle, description: l.description, url, type: "website", images: image ? [{ url: image }] : undefined },
  };
}

export default async function Page({ params }: PageProps<"/shop/[slug]">) {
  const l = getListing((await params).slug);
  if (!l) notFound();
  return (
    <>
      <CategoryView listing={l} />
      <JsonLd data={breadcrumbLd([["Início", "/"], ["Loja", "/shop"], [l.name, `/shop/${l.slug}`]])} />
      {listingLive(l) && <JsonLd data={listingLd(l, listingProducts(l))} />}
    </>
  );
}
