/**
 * Lê/escreve a query da URL sem recarregar. Funciona no Next (/shop?x=1)
 * e no arquivo único, onde a rota mora no hash (#/shop?x=1).
 */
const hashMode = () => typeof window !== "undefined" && (window as { __GS_HASH?: boolean }).__GS_HASH === true;

export function readQuery(): URLSearchParams {
  if (typeof window === "undefined") return new URLSearchParams();
  if (hashMode()) return new URLSearchParams(location.hash.split("?")[1] ?? "");
  return new URLSearchParams(location.search);
}

export function writeQuery(q: URLSearchParams) {
  const s = q.toString();
  if (hashMode()) {
    const base = location.hash.split("?")[0] || "#/";
    history.replaceState(history.state, "", `${location.pathname}${base}${s ? `?${s}` : ""}`);
  } else {
    history.replaceState(history.state, "", `${location.pathname}${s ? `?${s}` : ""}${location.hash}`);
  }
}
