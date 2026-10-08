import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/brand";
import { DROPS, PRODUCTS } from "@/lib/catalog";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const page = (path: string, priority: number, changeFrequency: "daily" | "weekly" | "monthly" = "weekly") => ({ url: `${SITE_URL}${path}`, lastModified: now, changeFrequency, priority });
  return [
    page("", 1, "daily"),
    page("/shop", 0.9, "daily"),
    page("/drops", 0.9, "daily"),
    ...DROPS.map((d) => page(`/drops/${d.slug}`, 0.8, "daily")),
    ...PRODUCTS.map((p) => page(`/product/${p.slug}`, 0.8, "daily")),
    page("/about", 0.5, "monthly"),
    page("/members", 0.5, "monthly"),
    page("/help", 0.3, "monthly"),
  ];
}
