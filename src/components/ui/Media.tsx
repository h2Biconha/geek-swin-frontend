import { asset, type Media as M } from "@/lib/catalog";

/**
 * Imagem/vídeo do catálogo.
 * - SVG (desenho técnico): <img> direto, leve.
 * - Foto real (jpg/png/webp/avif): troque por next/image no app (AVIF/WebP automático, ver next.config.ts).
 *   Mantivemos <img> com loading/decoding corretos para funcionar também no arquivo único.
 */
export default function Media({ media, alt, className = "", priority, sizes }: { media: M; alt: string; className?: string; priority?: boolean; sizes?: string }) {
  if (media.type === "video")
    return <video className={className} src={asset(media.src)} poster={media.poster ? asset(media.poster) : undefined} muted loop playsInline autoPlay preload="metadata" aria-label={alt} />;
  return (
    <img
      src={asset(media.src)}
      alt={alt}
      className={className}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : undefined}
      sizes={sizes}
      draggable={false}
    />
  );
}
