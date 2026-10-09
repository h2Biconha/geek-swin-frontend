/**
 * Ponto de entrada do arquivo único. Usa as MESMAS views do site Next;
 * só o roteamento e o <head> mudam. Gerado por scripts/build-standalone.mjs.
 */
import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import AppShell from "@/components/layout/AppShell";
import Footer from "@/components/layout/Footer";
import AboutView from "@/components/views/AboutView";
import AccountView from "@/components/views/AccountView";
import CategoryView from "@/components/views/CategoryView";
import CheckoutView from "@/components/views/CheckoutView";
import DropView from "@/components/views/DropView";
import DropsView from "@/components/views/DropsView";
import HelpView from "@/components/views/HelpView";
import HomeView from "@/components/views/HomeView";
import LoadoutView from "@/components/views/LoadoutView";
import LegalView from "@/components/views/LegalView";
import NotFoundView from "@/components/views/NotFoundView";
import ProductView from "@/components/views/ProductView";
import ShopView from "@/components/views/ShopView";
import WishlistView from "@/components/views/WishlistView";
import { BRAND } from "@/lib/brand";
import { dropTitle, getDrop, getProduct } from "@/lib/catalog";
import { getListing } from "@/lib/merch/listings";
import { takeFragment, usePath } from "./router";

type Route = { page: React.ReactNode; title: string };

function route(path: string): Route {
  const [, a, b] = path.split("/");
  if (!a) return { page: <HomeView />, title: `${BRAND.name} · Streetwear nascido da cultura gamer` };
  const simple: Record<string, { el: () => React.ReactNode; name: string }> = {
    shop: { el: () => <ShopView />, name: "Loja" },
    wishlist: { el: () => <WishlistView />, name: "Favoritos" },
    account: { el: () => <AccountView />, name: "Minha conta" },
    about: { el: () => <AboutView />, name: "Sobre" },
    privacy: { el: () => <LegalView doc="privacy" />, name: "Privacidade" },
    terms: { el: () => <LegalView doc="terms" />, name: "Termos de uso" },
    help: { el: () => <HelpView />, name: "Ajuda" },
    checkout: { el: () => <CheckoutView />, name: "Checkout" },
    loadout: { el: () => <LoadoutView />, name: "Monte o seu loadout" },
  };
  if (!b && simple[a]) return { page: simple[a].el(), title: `${simple[a].name} · ${BRAND.name}` };
  if (a === "shop" && b) {
    // mesmos atalhos do next.config (redirects)
    const l = getListing(({ camisas: "camisetas", bone: "bones" } as Record<string, string>)[b] ?? b);
    if (l) return { page: <CategoryView key={l.slug} listing={l} />, title: `${l.seoTitle} · ${BRAND.name}` };
  }
  if (a === "drops" && !b) return { page: <DropsView />, title: `Drops · ${BRAND.name}` };
  if (a === "drops" && b) {
    const d = getDrop(b);
    if (d) return { page: <DropView drop={d} />, title: `Drop ${d.number} · ${dropTitle(d)} · ${BRAND.name}` };
  }
  if (a === "product" && b) {
    const p = getProduct(b);
    if (p) return { page: <ProductView product={p} />, title: `${p.name} · ${BRAND.name}` };
  }
  return { page: <NotFoundView />, title: `Página não encontrada · ${BRAND.name}` };
}

function App() {
  const path = usePath();
  const { page, title } = route(path);
  useEffect(() => {
    document.title = title;
    const frag = takeFragment();
    if (frag) requestAnimationFrame(() => document.getElementById(frag)?.scrollIntoView());
    else window.scrollTo(0, 0);
  }, [path, title]);
  return (
    <AppShell footer={<Footer />}>
      <div key={path} className="page-enter">
        {page}
      </div>
    </AppShell>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
