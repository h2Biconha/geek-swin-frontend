import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // hora do build: o servidor e o navegador usam o mesmo "agora" na hidratação (ver src/lib/time.ts)
  env: { NEXT_PUBLIC_BUILD_TIME: String(Date.now()) },
  images: { formats: ["image/avif", "image/webp"] },
  // URLs da versão anterior continuam funcionando (links já compartilhados não quebram)
  async redirects() {
    return [
      { source: "/loja", destination: "/shop", permanent: true },
      { source: "/produto/:slug", destination: "/product/:slug", permanent: true },
      { source: "/sobre", destination: "/about", permanent: true },
      { source: "/lookbook", destination: "/drops/001-insert-coin", permanent: true },
      { source: "/carrinho", destination: "/checkout", permanent: true },
    ];
  },
};

export default nextConfig;
