/** Substitui next/link no arquivo único: mesmo uso, navegação por hash. */
import { forwardRef, type AnchorHTMLAttributes, type MouseEvent } from "react";
import { navigate, toHashHref } from "./router";

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string | { pathname?: string; search?: string };
  prefetch?: unknown;
  scroll?: unknown;
  replace?: unknown;
};

const Link = forwardRef<HTMLAnchorElement, Props>(function Link({ href, prefetch, scroll, replace, onClick, ...rest }, ref) {
  void prefetch; void scroll; void replace;
  const h = typeof href === "string" ? href : `${href.pathname ?? "/"}${href.search ?? ""}`;
  const click = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0 || !h.startsWith("/")) return;
    e.preventDefault();
    navigate(h);
  };
  return <a ref={ref} href={toHashHref(h)} onClick={click} {...rest} />;
});

export default Link;
