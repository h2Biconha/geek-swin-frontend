"use client";

import { motion } from "framer-motion";
import ProductCard from "./ProductCard";
import { gridStagger } from "@/lib/motion";
import type { Product } from "@/lib/products";

export default function ProductGrid({ products }: { products: Product[] }) {
  return (
    <motion.div
      variants={gridStagger}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
      className="grid grid-cols-2 gap-x-4 gap-y-12 lg:grid-cols-4"
    >
      {products.map((p, i) => (
        <ProductCard key={p.slug} product={p} priority={i < 2} />
      ))}
    </motion.div>
  );
}
