export const NAV = [
  { label: "Loja", href: "/shop" },
  { label: "Drops", href: "/drops" },
  { label: "Sobre", href: "/about" },
] as const;

/** páginas que começam com hero escuro: o header fica transparente sobre ele no topo */
export const isOverlayPage = (path: string) => path === "/" || path === "/drops" || path.startsWith("/drops/") || path === "/about";
export const isActive = (path: string, href: string) => path === href || path.startsWith(href + "/");
