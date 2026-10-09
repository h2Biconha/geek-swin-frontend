/** navegação principal. "Loja" abre o mega menu no desktop e um acordeão no celular. */
export const NAV = [
  { label: "Loja", href: "/shop", mega: true },
  { label: "Novidades", href: "/shop/novidades" },
  { label: "Drops", href: "/drops" },
  { label: "Loadout", href: "/loadout" },
] as const;

/** páginas que começam com hero escuro: o header fica transparente sobre ele no topo */
export const isOverlayPage = (path: string) => path === "/" || path === "/drops" || path.startsWith("/drops/") || path === "/about";
export const isActive = (path: string, href: string) => path === href || path.startsWith(href + "/");
