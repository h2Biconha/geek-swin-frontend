import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductView from "@/components/views/ProductView";
import JsonLd from "@/components/JsonLd";
import { brl, categoryName, getDrop, getProduct, PRODUCTS } from "@/lib/catalog";
import { breadcrumbLd, productLd } from "@/lib/seo";

export const generateStaticParams = () => PRODUCTS.map((p) => ({ slug: p.slug }));
export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const p = getProduct((await params).slug);
  if (!p) return {};
  const title = `${p.name}${p.drop ? ` · Drop ${p.drop}` : ""}`;
  const description = `${p.description} ${brl(p.price)} em até 6x sem juros.`;
  return {
    title,
    description,
    alternates: { canonical: `/product/${p.slug}` },
    openGraph: { title, description, url: `/product/${p.slug}`, type: "website" },
  };
}

export default async function Page({ params }: PageProps<"/product/[slug]">) {
  const p = getProduct((await params).slug);
  if (!p) notFound();
  return (
    <>
      <ProductView product={p} />
      <JsonLd data={productLd(p, p.drop ? getDrop(p.drop) : undefined)} />
      <JsonLd data={breadcrumbLd([["Início", "/"], ["Shop", "/shop"], [categoryName(p.category), `/shop?categoria=${p.category}`], [p.name, `/product/${p.slug}`]])} />
    </>
  );
}
