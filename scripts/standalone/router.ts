/**
 * Roteador do arquivo único (ABRIR-GEEK-SWIM.html). A rota mora no hash (#/shop?x=1)
 * porque um arquivo aberto com duplo clique (file://) não tem servidor para resolver /shop.
 */
import { useSyncExternalStore } from "react";

let last = "/";
let pendingFragment: string | null = null;

function read(): string {
  const h = location.hash;
  if (h.startsWith("#/")) last = h.slice(1).split("?")[0] || "/";
  return last;
}

function subscribe(cb: () => void) {
  const on = () => {
    const h = location.hash;
    // âncora comum (#conteudo, #trocas): rola até ela e devolve a rota atual ao hash
    if (h && !h.startsWith("#/")) {
      document.getElementById(decodeURIComponent(h.slice(1)))?.scrollIntoView();
      history.replaceState(history.state, "", `#${last}`);
      return;
    }
    cb();
  };
  window.addEventListener("hashchange", on);
  return () => window.removeEventListener("hashchange", on);
}

export const usePath = () => useSyncExternalStore(subscribe, read, () => "/");

export function takeFragment() {
  const f = pendingFragment;
  pendingFragment = null;
  return f;
}

/** Navega para um href do Next ("/help#trocas", "/shop?drop=core", "#aviso"). */
export function navigate(href: string) {
  const [path, frag] = href.split("#");
  if (!path) {
    if (frag) document.getElementById(frag)?.scrollIntoView({ behavior: "smooth" });
    return;
  }
  pendingFragment = frag ?? null;
  const target = `#${path}`;
  if (location.hash === target || (path === "/" && (location.hash === "" || location.hash === "#/"))) {
    if (frag) document.getElementById(frag)?.scrollIntoView({ behavior: "smooth" });
    else window.scrollTo(0, 0);
    pendingFragment = null;
    return;
  }
  location.hash = target;
}

export const toHashHref = (href: string) => (href.startsWith("/") ? `#${href.split("#")[0]}` : href);
