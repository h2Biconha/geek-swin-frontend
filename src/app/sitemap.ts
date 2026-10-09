import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/brand";
import { DROPS, PRODUCTS } from "@/lib/catalog";
import { allListings, listingLive } from "@/lib/merch/listings";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const page = (path: string, priority: number, changeFrequency: "daily" | "weekly" | "monthly" | "yearly" = "weekly") => ({ url: `${SITE_URL}${path}`, lastModified: now, changeFrequency, priority });
  return [
    page("", 1, "daily"),
    page("/shop", 0.9, "daily"),
    // só listagens com peça publicada (categoria vazia é noindex)
    ...allListings().filter(listingLive).map((l) => page(`/shop/${l.slug}`, 0.85, "daily")),
    page("/loadout", 0.7, "weekly"),
    page("/drops", 0.9, "daily"),
    ...DROPS.map((d) => page(`/drops/${d.slug}`, 0.8, "daily")),
    ...PRODUCTS.map((p) => page(`/product/${p.slug}`, 0.8, "daily")),
    page("/about", 0.5, "monthly"),
    page("/privacy", 0.2, "yearly"),
    page("/terms", 0.2, "yearly"),
    page("/help", 0.3, "monthly"),
  ];
}
