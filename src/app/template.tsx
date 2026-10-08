/** Transição entre páginas: cada navegação remonta este wrapper e a página entra subindo de leve. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
