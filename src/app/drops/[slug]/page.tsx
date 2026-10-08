import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DropView from "@/components/views/DropView";
import JsonLd from "@/components/JsonLd";
import { DROPS, dropTitle, editionTotal, getDrop } from "@/lib/catalog";
import { breadcrumbLd, dropLd } from "@/lib/seo";

export const generateStaticParams = () => DROPS.map((d) => ({ slug: d.slug }));
export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps<"/drops/[slug]">): Promise<Metadata> {
  const d = getDrop((await params).slug);
  if (!d) return {};
  const title = `Drop ${d.number} · ${dropTitle(d)}`;
  const total = editionTotal(d);
  const description = `${d.tagline} ${d.concept}${total ? ` ${total} peças numeradas.` : ""}`;
  return { title, description, alternates: { canonical: `/drops/${d.slug}` }, openGraph: { title, description, url: `/drops/${d.slug}` } };
}

export default async function Page({ params }: PageProps<"/drops/[slug]">) {
  const d = getDrop((await params).slug);
  if (!d) notFound();
  return (
    <>
      <DropView drop={d} />
      <JsonLd data={dropLd(d)} />
      <JsonLd data={breadcrumbLd([["Início", "/"], ["Drops", "/drops"], [`Drop ${d.number}`, `/drops/${d.slug}`]])} />
    </>
  );
}
