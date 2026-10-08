"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { closeOverlay } from "@/lib/ui";
import Reveal from "../ui/Reveal";
import Toaster from "../ui/Toaster";
import AnnouncementBar from "./AnnouncementBar";
import CartDrawer from "./CartDrawer";
import Cursor from "./Cursor";
import DropAlert from "./DropAlert";
import Header from "./Header";
import LoadingScreen from "./LoadingScreen";
import MobileMenu from "./MobileMenu";
import SearchOverlay from "./SearchOverlay";

/** Tudo que é global e interativo. O checkout usa um shell enxuto próprio (sem menu). */
export default function AppShell({ children, footer }: { children: React.ReactNode; footer: React.ReactNode }) {
  const path = usePathname();
  const checkout = path.startsWith("/checkout");
  // troca de página fecha qualquer gaveta e volta ao topo
  useEffect(() => closeOverlay(), [path]);

  return (
    <>
      <LoadingScreen />
      <a href="#conteudo" className="sr-only z-[300] focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:bg-accent focus:px-4 focus:py-3 focus:text-on-accent">
        Pular para o conteúdo
      </a>
      {!checkout && <AnnouncementBar />}
      {!checkout && <Header />}
      <main id="conteudo" tabIndex={-1} className="focus:outline-none">
        {children}
      </main>
      {!checkout && footer}
      <CartDrawer />
      <SearchOverlay />
      <MobileMenu />
      <Toaster />
      <Reveal />
      {!checkout && <DropAlert />}
      <Cursor />
    </>
  );
}
