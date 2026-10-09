import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/brand";

export const alt = `${BRAND.name} · streetwear nascido da cultura gamer`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Imagem de compartilhamento (WhatsApp, Instagram, X). Gerada no build. */
export default function OG() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: "#0b0b0c", color: "#eeece6", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 64, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, letterSpacing: 4, color: "#9a9aa0" }}>
          <span>[DROP 001]</span>
          <span>PRÉ-VENDA</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 150, fontWeight: 900, lineHeight: 0.85, letterSpacing: -4 }}>
          <span>INSERT</span>
          <span style={{ display: "flex" }}>
            COIN<span style={{ color: "#2e2eff" }}>_</span>
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 30 }}>
          <span>{BRAND.name}</span>
          <span style={{ color: "#a6a6ff" }}>Não é merch. É cultura.</span>
        </div>
      </div>
    ),
    size,
  );
}
