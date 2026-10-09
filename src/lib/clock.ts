/**
 * Hora do build (igual no servidor e no navegador durante a hidratação). Módulo sem "use client"
 * para poder ser lido por componentes de servidor. Ver src/lib/time.ts.
 */
export const BUILD_TIME = Number(process.env.NEXT_PUBLIC_BUILD_TIME ?? 0) || Date.parse("2026-10-08T00:00:00Z");
