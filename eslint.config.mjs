import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  {
    rules: {
      // As imagens hoje são SVG (desenho técnico) e o mesmo código gera o arquivo único offline,
      // onde next/image não existe. Fotos reais: use next/image (ver src/components/ui/Media.tsx).
      "@next/next/no-img-element": "off",
    },
  },
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // saída do arquivo único (gerada)
    "standalone-dist/**",
  ]),
]);

export default eslintConfig;
