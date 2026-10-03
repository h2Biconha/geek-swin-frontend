import type { Config } from "tailwindcss";

/**
 * GEEK SWIN · tokens (site só no tema claro)
 * As cores apontam para variáveis CSS definidas no globals.css.
 * Para mudar a paleta, edite só o :root do globals.css.
 *
 * Regra do verde: `acid` (#39FF14) só como PREENCHIMENTO (selo, botão, barra).
 * Para TEXTO verde em fundo claro use `acid-ink` (#1B7A0A), senão some.
 */
const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: v("bg"),
        surface: v("surface"),
        card: v("card"),
        ink: v("ink"),
        muted: v("muted"),
        line: v("line"),
        acid: v("acid"),
        "acid-ink": v("acid-ink"),
        "on-acid": v("on-acid"),
        invert: v("invert"),
        "on-invert": v("on-invert"),
        danger: v("danger"),
      },
      fontFamily: {
        display: ["var(--font-syne)", "Arial Black", "sans-serif"],
        sans: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
      fontSize: {
        hero: ["clamp(2.5rem, 8vw, 9rem)", { lineHeight: "0.84", letterSpacing: "-0.045em" }],
        section: ["clamp(2rem, 4.6vw, 3.8rem)", { lineHeight: "0.95", letterSpacing: "-0.03em" }],
        hud: ["0.6875rem", { lineHeight: "1.6", letterSpacing: "0.2em" }],
        // escala pequena: nada abaixo de 11px (legibilidade no celular)
        micro: ["0.6875rem", { lineHeight: "1.5" }], // 11px: SKU, selos, rótulos mono
        label: ["0.75rem", { lineHeight: "1.5" }], // 12px: botões mono, preços riscados
        small: ["0.8125rem", { lineHeight: "1.5" }], // 13px: parcelamento, notas
      },
      spacing: {
        gutter: "clamp(1rem, 4.5vw, 4.5rem)",
      },
      borderRadius: {
        studio: "22px",
      },
      transitionTimingFunction: {
        lux: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        marquee: { to: { transform: "translateX(-50%)" } },
      },
      animation: {
        marquee: "marquee 38s linear infinite",
      },
    },
  },
};

export default config;
