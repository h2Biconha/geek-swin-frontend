import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

/**
 * Cabeçalhos de segurança em todas as respostas.
 * CSP: scripts só do próprio site e do Google Tag Manager / Meta Pixel (que carregam só depois do consentimento).
 * 'unsafe-inline' em script é necessário para o JSON-LD e os scripts de hidratação do Next em páginas estáticas;
 * para endurecer, troque por nonce (exige renderização dinâmica). Ver docs/03-RECONSTRUCAO.md > Segurança.
 */
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://connect.facebook.net" + (isProd ? "" : " 'unsafe-eval'"),
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://www.googletagmanager.com https://www.facebook.com https://*.google-analytics.com",
  "font-src 'self'",
  "connect-src 'self' https://viacep.com.br https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://connect.facebook.net https://www.facebook.com",
  "frame-src https://www.googletagmanager.com",
  "form-action 'self' https://*.mercadopago.com.br https://*.mercadopago.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  ...(isProd ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  ...(isProd ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }] : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // hora do build: o servidor e o navegador usam o mesmo "agora" na hidratação (ver src/lib/time.ts)
  env: { NEXT_PUBLIC_BUILD_TIME: String(Date.now()) },
  images: { formats: ["image/avif", "image/webp"] },
  // banco: drivers nativos/WASM ficam fora do bundle do servidor
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // páginas com dados pessoais não ficam em cache compartilhado
      { source: "/(order|account|admin|checkout)/:path*", headers: [{ key: "Cache-Control", value: "private, no-store" }] },
    ];
  },
  // URLs antigas continuam funcionando (links já compartilhados não quebram)
  async redirects() {
    return [
      { source: "/loja", destination: "/shop", permanent: true },
      { source: "/produto/:slug", destination: "/product/:slug", permanent: true },
      { source: "/sobre", destination: "/about", permanent: true },
      { source: "/lookbook", destination: "/drops/001-insert-coin", permanent: true },
      { source: "/carrinho", destination: "/checkout", permanent: true },
      { source: "/members", destination: "/#lista", permanent: true },
      { source: "/arquivo", destination: "/drops#arquivo", permanent: true },
    ];
  },
};

export default nextConfig;
