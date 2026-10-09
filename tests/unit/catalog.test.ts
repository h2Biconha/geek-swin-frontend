import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import data from "@/lib/catalog.json";

/**
 * O catálogo é editado à mão (catalog.json). Este teste é o "painel de validação": um slug digitado errado,
 * um kit apontando para peça que não existe ou uma categoria sem página quebram o `npm test` antes do deploy.
 */
const slug = z.string().regex(/^[a-z0-9-]+$/);
const product = z.object({
  slug,
  number: z.string(),
  name: z.string().min(2),
  category: slug,
  categories: z.array(slug),
  price: z.number().positive(),
  compareAt: z.number().positive().nullable(),
  color: z.string(),
  drop: z.string().nullable(),
  edition: z.number().int().positive().nullable(),
  sizes: z.array(z.string()).min(1),
  addedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  rank: z.number(),
  media: z.array(z.object({ src: z.string() }).loose()).min(1),
  attrs: z.record(z.string(), z.string()),
  tags: z.array(z.string()),
  pairsWith: z.array(slug),
  status: z.enum(["published", "draft", "hidden"]),
  maker: z.object({ brand: z.string(), authored: z.boolean(), warranty: z.string().optional(), compatibility: z.array(z.string()).optional(), specs: z.array(z.tuple([z.string(), z.string()])).optional() }).optional(),
}).loose();
const category = z.object({
  slug,
  name: z.string(),
  seoTitle: z.string().min(10).max(70),
  role: z.enum(["top", "bottom", "head", "accessory", "setup", "pack"]),
  headline: z.string(),
  description: z.string().min(50).max(170),
  intro: z.string(),
  spotlight: z.enum(["looks", "silhouettes", "details", "types", "specs", "bundles"]),
  facets: z.array(z.enum(["tamanho", "cor", "colecao", "preco", "disp", "modelagem", "modelo", "tipo", "marca"])),
}).loose();
const bundle = z.object({
  slug,
  name: z.string(),
  slots: z.array(z.object({ label: z.string(), products: z.array(slug).optional(), categories: z.array(slug).optional(), qty: z.number().int().positive().optional() })).min(2),
  discount: z.object({ kind: z.enum(["percent", "fixed"]), value: z.number().positive() }).nullable(),
  active: z.boolean(),
}).loose();
const benefit = z.object({
  id: slug,
  kind: z.enum(["free_shipping", "discount"]),
  enabled: z.boolean(),
  threshold: z.number().positive(),
  regions: z.array(z.string()).nullable(),
  categories: z.array(slug).nullable(),
  excludeProducts: z.array(slug),
  stacksWithCoupon: z.boolean(),
  messages: z.object({ before: z.string(), after: z.string(), condition: z.string() }),
}).loose();

const slugs = new Set(data.products.map((p) => p.slug));
const cats = new Set(data.categories.map((c) => c.slug));

describe("catalog.json", () => {
  it("cada peça, categoria, kit e benefício tem o formato certo", () => {
    for (const p of data.products) expect(product.safeParse(p).error?.issues ?? [], p.slug).toEqual([]);
    for (const c of data.categories) expect(category.safeParse(c).error?.issues ?? [], c.slug).toEqual([]);
    for (const b of data.bundles) expect(bundle.safeParse(b).error?.issues ?? [], b.slug).toEqual([]);
    for (const b of data.commerce.benefits) expect(benefit.safeParse(b).error?.issues ?? [], b.id).toEqual([]);
  });

  it("slugs únicos e referências que existem", () => {
    expect(slugs.size).toBe(data.products.length);
    expect(cats.size).toBe(data.categories.length);
    for (const p of data.products) {
      expect(cats.has(p.category), `${p.slug}: categoria ${p.category}`).toBe(true);
      for (const c of p.categories) expect(cats.has(c), `${p.slug}: categoria ${c}`).toBe(true);
      for (const s of p.pairsWith) expect(slugs.has(s), `${p.slug}: pairsWith ${s}`).toBe(true);
      if (p.drop) expect(data.drops.some((d) => d.number === p.drop), `${p.slug}: drop ${p.drop}`).toBe(true);
    }
    for (const d of data.drops) for (const l of d.looks) for (const s of l.products) expect(slugs.has(s), `look ${d.number}-${l.n}: ${s}`).toBe(true);
    for (const b of data.bundles)
      for (const s of b.slots as { products?: string[]; categories?: string[] }[]) {
        for (const x of s.products ?? []) expect(slugs.has(x), `kit ${b.slug}: ${x}`).toBe(true);
        for (const x of s.categories ?? []) expect(cats.has(x), `kit ${b.slug}: categoria ${x}`).toBe(true);
      }
  });

  it("listagens não colidem com categorias e títulos de SEO são únicos", () => {
    for (const l of data.listings) expect(cats.has(l.slug), l.slug).toBe(false);
    const titles = [...data.categories, ...data.listings].map((x) => x.seoTitle);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("preço 'de' só acima do preço atual (nunca desconto falso)", () => {
    for (const p of data.products) if (p.compareAt != null) expect(p.compareAt, p.slug).toBeGreaterThan(p.price);
  });

  it("periférico de terceiros declara fabricante e não se passa por GEEK SWIM", () => {
    for (const p of data.products as { slug: string; category: string; maker?: { brand: string; authored: boolean } }[])
      if (p.category === "perifericos") {
        expect(p.maker, p.slug).toBeDefined();
        if (p.maker!.brand.toUpperCase() !== "GEEK SWIM") expect(p.maker!.authored, p.slug).toBe(false);
      }
  });

  it("toda imagem citada existe em public/", () => {
    const files = [...data.products.flatMap((p) => p.media.map((m) => m.src)), ...data.categories.map((c) => c.art).filter((x): x is string => !!x)];
    for (const f of files) expect(existsSync(join(process.cwd(), "public", f)), f).toBe(true);
  });
});
