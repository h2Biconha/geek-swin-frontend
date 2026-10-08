/** Substitui next/navigation no arquivo único. */
import { navigate, usePath } from "./router";

export const usePathname = usePath;
export const useRouter = () => ({ push: navigate, replace: navigate, back: () => history.back(), refresh: () => {}, prefetch: () => {} });
export const useSearchParams = () => new URLSearchParams(location.hash.split("?")[1] ?? "");
export function notFound(): never {
  throw new Error("notFound");
}
