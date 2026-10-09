import type { Metadata } from "next";
import NotFoundView from "@/components/views/NotFoundView";

export const metadata: Metadata = { title: "Página não encontrada" };

export default function NotFound() {
  return <NotFoundView />;
}
