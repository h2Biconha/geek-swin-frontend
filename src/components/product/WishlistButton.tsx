"use client";

import { toggleWishlist, useWishlist } from "@/lib/wishlist";
import Icon from "../ui/Icon";

export default function WishlistButton({ slug, name, className = "", withLabel }: { slug: string; name: string; className?: string; withLabel?: boolean }) {
  const on = useWishlist().includes(slug);
  return (
    <button
      type="button"
      onClick={() => toggleWishlist(slug)}
      aria-pressed={on}
      aria-label={on ? `Remover ${name} da wishlist` : `Salvar ${name} na wishlist`}
      className={`group/w inline-flex items-center gap-2 ${className}`}
    >
      <Icon name="heart" filled={on} className={`transition-colors ${on ? "animate-[heart_.45s_var(--ease-out)] text-accent-fg" : "group-hover/w:text-accent-fg"}`} />
      {withLabel && <span className="eyebrow">{on ? "Salvo" : "Wishlist"}</span>}
    </button>
  );
}
