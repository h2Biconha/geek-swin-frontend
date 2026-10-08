export const NAV = [
  { label: "Shop", href: "/shop" },
  { label: "Drops", href: "/drops" },
  { label: "About", href: "/about" },
  { label: "Members", href: "/members" },
] as const;

/** páginas que começam com hero escuro: o header fica transparente sobre ele no topo */
export const isOverlayPage = (path: string) => path === "/" || path === "/drops" || path.startsWith("/drops/") || path === "/about" || path === "/members";
export const isActive = (path: string, href: string) => path === href || path.startsWith(href + "/");
